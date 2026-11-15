/**
 * Admin root of trust. Server-only — never imported by browser code.
 *
 * The admin passphrase and second-factor answer are NOT stored anywhere in this
 * repository, encoded or otherwise. Only values derived from them through a
 * slow memory-hard KDF (scrypt) live here:
 *
 *   master   = scrypt(passphrase, SALT)
 *   rootSign = P-256 key from HMAC(master, "…sign")   → public half below
 *   rootBox  = P-256 key from HMAC(master, "…box")    → public half below
 *   second   = HMAC(master, "…second:" + answer)       → tag below
 *
 * A submitted passphrase is checked by re-deriving rootSign and comparing its
 * public key. The second factor can only be checked by someone who already has
 * the passphrase. Nothing here can be reversed back into either secret.
 */
import crypto from "node:crypto";

const SALT = "bunny-rtc/admin-root/v1/27bf3e8b3bc4f5d2ae1f9e65e3a4b817";
const ROOT_SIGN_PUB = {
  x: "m5IIhq8deLXOstjziUhiiS_7yE_mLpxW1qWOqC1xzl0",
  y: "bHBZbeKGcV8EIe6kPuHYtxQt3DFzqEdhrZsTdQFBs8Q",
};
const SECOND_TAG = "-F4SyE1Te8PKptO1VbKzVCH3n_Dn7L4Noo_LISRrYrk";

type Root = { sign: crypto.KeyObject; boxJwk: { x: string; y: string; d: string }; master: Buffer };

function pointOf(d: Buffer) {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(d);
  const p = ecdh.getPublicKey();
  return { x: p.subarray(1, 33).toString("base64url"), y: p.subarray(33).toString("base64url") };
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function derive(passphrase: string): Root | null {
  if (typeof passphrase !== "string" || passphrase.length < 4 || passphrase.length > 128) return null;
  const master = crypto.scryptSync(passphrase, SALT, 32, {
    N: 2 ** 16,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });
  const h = (label: string) => crypto.createHmac("sha256", master).update(label).digest();
  const signD = h("bunny-rtc:root:sign");
  const signPub = pointOf(signD);
  if (!safeEqual(signPub.x + signPub.y, ROOT_SIGN_PUB.x + ROOT_SIGN_PUB.y)) return null;
  const sign = crypto.createPrivateKey({
    format: "jwk",
    key: { kty: "EC", crv: "P-256", d: signD.toString("base64url"), ...signPub },
  });
  const boxD = h("bunny-rtc:root:box");
  const boxJwk = { d: boxD.toString("base64url"), ...pointOf(boxD) };
  return { sign, boxJwk, master };
}

function secondOk(root: Root, answer: string) {
  if (typeof answer !== "string") return false;
  const tag = crypto
    .createHmac("sha256", root.master)
    .update("bunny-rtc:root:second:" + answer.trim().toLowerCase())
    .digest("base64url");
  return safeEqual(tag, SECOND_TAG);
}

/** Uniform pacing so responses don't leak which step failed. */
async function pace(start: number) {
  const wait = 650 - (Date.now() - start);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

export async function checkPassphrase(passphrase: string) {
  const start = Date.now();
  const ok = !!derive(passphrase);
  await pace(start);
  return ok;
}

export async function checkSecond(passphrase: string, answer: string) {
  const start = Date.now();
  const root = derive(passphrase);
  const ok = !!root && secondOk(root, answer);
  await pace(start);
  return ok;
}

type Point = { x: string; y: string };
const B64 = /^[A-Za-z0-9_-]{40,48}$/;
const isPoint = (p: unknown): p is Point =>
  !!p && typeof p === "object" && B64.test((p as Point).x) && B64.test((p as Point).y);

export async function issueAdmin(input: {
  passphrase: string;
  answer: string;
  id: string;
  name: string;
  sign: Point;
  box: Point;
}) {
  const start = Date.now();
  const root = derive(input.passphrase);
  if (!root || !secondOk(root, input.answer)) {
    await pace(start);
    return { ok: false as const, error: "Verification failed" };
  }
  if (!/^[a-z0-9]{8,40}$/.test(input.id) || !isPoint(input.sign) || !isPoint(input.box)) {
    await pace(start);
    return { ok: false as const, error: "That token is not valid" };
  }
  // Ensure the public keys are real curve points before vouching for them.
  try {
    crypto.createPublicKey({ format: "jwk", key: { kty: "EC", crv: "P-256", ...input.sign } });
    crypto.createPublicKey({ format: "jwk", key: { kty: "EC", crv: "P-256", ...input.box } });
  } catch {
    return { ok: false as const, error: "That token is not valid" };
  }
  const payload = JSON.stringify({
    v: 1,
    kind: "admin",
    id: input.id,
    name: String(input.name || "").slice(0, 24),
    sign: { x: input.sign.x, y: input.sign.y },
    box: { x: input.box.x, y: input.box.y },
    iat: Date.now(),
  });
  const sig = crypto
    .sign("sha256", Buffer.from(payload), { key: root.sign, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  await pace(start);
  return { ok: true as const, cert: { p: payload, s: sig }, escrow: root.boxJwk };
}
