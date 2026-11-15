/**
 * Browser crypto for Bunny RTC (WebCrypto, P-256 everywhere).
 * - Identity: an ECDSA key (signing) + an ECDH key (sealed boxes).
 * - Admin certs: root-signed statements binding a user id to its keys.
 * - Sealed envelopes: AES-GCM content, key wrapped per recipient via ECDH.
 */

export type Point = { x: string; y: string };
export type PrivJwk = Point & { d: string };
export type Cert = { p: string; s: string };
export type AdminClaim = {
  v: 1;
  kind: "admin";
  id: string;
  name: string;
  sign: Point;
  box: Point;
  iat: number;
};

/** Public halves of the admin root keys. Safe to ship: they verify, they can't sign. */
export const ROOT_SIGN_PUB: Point = {
  x: "m5IIhq8deLXOstjziUhiiS_7yE_mLpxW1qWOqC1xzl0",
  y: "bHBZbeKGcV8EIe6kPuHYtxQt3DFzqEdhrZsTdQFBs8Q",
};
export const ESCROW_BOX_PUB: Point = {
  x: "AvuaH8W2dXykk02PWtWs3qKpzmKn6Y_2FnnUxV2MzCg",
  y: "oJLMn3KgCqzxWny6IR3qLN-z0RoQjhB2jWOI1UyfvOA",
};

const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;

export function b64u(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function unb64u(value: string) {
  const norm = value.replaceAll("-", "+").replaceAll("_", "/");
  const s = atob(norm + "===".slice((norm.length + 3) % 4));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function randomId(bytes = 8) {
  return b64u(crypto.getRandomValues(new Uint8Array(bytes))).replace(/[-_]/g, "x").toLowerCase();
}

const isPoint = (p: unknown): p is Point =>
  !!p &&
  typeof p === "object" &&
  typeof (p as Point).x === "string" &&
  typeof (p as Point).y === "string" &&
  /^[A-Za-z0-9_-]{40,48}$/.test((p as Point).x) &&
  /^[A-Za-z0-9_-]{40,48}$/.test((p as Point).y);
export { isPoint };

const keyCache = new Map<string, Promise<CryptoKey>>();
function cached(key: string, make: () => Promise<CryptoKey>) {
  let hit = keyCache.get(key);
  if (!hit) {
    hit = make();
    hit.catch(() => keyCache.delete(key));
    keyCache.set(key, hit);
  }
  return hit;
}

const SIGN_ALG = { name: "ECDSA", namedCurve: "P-256" } as const;
const BOX_ALG = { name: "ECDH", namedCurve: "P-256" } as const;

export function signPublic(p: Point) {
  return cached(`sp:${p.x}${p.y}`, () =>
    subtle().importKey("jwk", { kty: "EC", crv: "P-256", x: p.x, y: p.y, ext: true }, SIGN_ALG, false, ["verify"]),
  );
}
export function signPrivate(k: PrivJwk) {
  return cached(`sk:${k.d}`, () =>
    subtle().importKey("jwk", { kty: "EC", crv: "P-256", x: k.x, y: k.y, d: k.d, ext: true }, SIGN_ALG, false, ["sign"]),
  );
}
function boxPublic(p: Point) {
  return cached(`bp:${p.x}${p.y}`, () =>
    subtle().importKey("jwk", { kty: "EC", crv: "P-256", x: p.x, y: p.y, ext: true }, BOX_ALG, false, []),
  );
}
function boxPrivate(k: PrivJwk) {
  return cached(`bk:${k.d}`, () =>
    subtle().importKey("jwk", { kty: "EC", crv: "P-256", x: k.x, y: k.y, d: k.d, ext: true }, BOX_ALG, false, [
      "deriveKey",
    ]),
  );
}

export async function generatePair(kind: "sign" | "box"): Promise<PrivJwk> {
  const pair = (await subtle().generateKey(kind === "sign" ? SIGN_ALG : BOX_ALG, true, kind === "sign" ? ["sign", "verify"] : ["deriveKey"])) as CryptoKeyPair;
  const jwk = await subtle().exportKey("jwk", pair.privateKey);
  return { x: jwk.x!, y: jwk.y!, d: jwk.d! };
}

export async function signText(key: PrivJwk, text: string) {
  const sig = await subtle().sign({ name: "ECDSA", hash: "SHA-256" }, await signPrivate(key), enc.encode(text));
  return b64u(sig);
}

export async function verifyText(pub: Point, text: string, sig: string) {
  try {
    return await subtle().verify(
      { name: "ECDSA", hash: "SHA-256" },
      await signPublic(pub),
      unb64u(sig),
      enc.encode(text),
    );
  } catch {
    return false;
  }
}

/** Verify an admin certificate against the root key. Returns the claim or null. */
const certCache = new Map<string, Promise<AdminClaim | null>>();
export function verifyCert(cert: unknown): Promise<AdminClaim | null> {
  const c = cert as Cert;
  if (!c || typeof c.p !== "string" || typeof c.s !== "string" || c.p.length > 2000) return Promise.resolve(null);
  const k = c.p + "." + c.s;
  let hit = certCache.get(k);
  if (!hit) {
    hit = (async () => {
      if (!(await verifyText(ROOT_SIGN_PUB, c.p, c.s))) return null;
      try {
        const claim = JSON.parse(c.p) as AdminClaim;
        if (claim.kind !== "admin" || typeof claim.id !== "string" || !isPoint(claim.sign) || !isPoint(claim.box)) return null;
        return claim;
      } catch {
        return null;
      }
    })();
    certCache.set(k, hit);
  }
  return hit;
}

/** A moderation record signed by an admin (whose cert travels with it). */
export type SignedRecord = { p: string; s: string; c: Cert };

export async function signRecord(key: PrivJwk, cert: Cert, payload: object): Promise<SignedRecord> {
  const p = JSON.stringify(payload);
  return { p, s: await signText(key, p), c: cert };
}

export async function verifyRecord<T extends { by: string }>(rec: unknown): Promise<T | null> {
  const r = rec as SignedRecord;
  if (!r || typeof r.p !== "string" || typeof r.s !== "string") return null;
  const claim = await verifyCert(r.c);
  if (!claim) return null;
  if (!(await verifyText(claim.sign, r.p, r.s))) return null;
  try {
    const body = JSON.parse(r.p) as T;
    if (body.by !== claim.id) return null;
    return body;
  } catch {
    return null;
  }
}

/* ---------- sealed envelopes ---------- */

export type Sealed = {
  e: Point; // ephemeral public key
  iv: string;
  ct: string;
  k: Record<string, { iv: string; w: string }>; // wrapped content key per reader
};

async function wrapKeyFor(eph: CryptoKey, pub: Point) {
  return subtle().deriveKey({ name: "ECDH", public: await boxPublic(pub) }, eph, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function seal(readers: Record<string, Point>, data: unknown): Promise<Sealed> {
  const eph = (await subtle().generateKey(BOX_ALG, true, ["deriveKey"])) as CryptoKeyPair;
  const ephJwk = await subtle().exportKey("jwk", eph.publicKey);
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const cek = await subtle().importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt({ name: "AES-GCM", iv }, cek, enc.encode(JSON.stringify(data)));
  const k: Sealed["k"] = {};
  for (const [rid, pub] of Object.entries(readers)) {
    const wk = await wrapKeyFor(eph.privateKey, pub);
    const wiv = crypto.getRandomValues(new Uint8Array(12));
    k[rid] = { iv: b64u(wiv), w: b64u(await subtle().encrypt({ name: "AES-GCM", iv: wiv }, wk, raw)) };
  }
  return { e: { x: ephJwk.x!, y: ephJwk.y! }, iv: b64u(iv), ct: b64u(ct), k };
}

export async function open<T>(sealed: Sealed, readerId: string, key: PrivJwk): Promise<T | null> {
  try {
    const slot = sealed?.k?.[readerId];
    if (!slot || !isPoint(sealed.e)) return null;
    const wk = await subtle().deriveKey(
      { name: "ECDH", public: await boxPublic(sealed.e) },
      await boxPrivate(key),
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    const raw = await subtle().decrypt({ name: "AES-GCM", iv: unb64u(slot.iv) }, wk, unb64u(slot.w));
    const cek = await subtle().importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    const pt = await subtle().decrypt({ name: "AES-GCM", iv: unb64u(sealed.iv) }, cek, unb64u(sealed.ct));
    return JSON.parse(dec.decode(pt)) as T;
  } catch {
    return null;
  }
}
