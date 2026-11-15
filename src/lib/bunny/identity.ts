import { b64u, generatePair, isPoint, unb64u, type PrivJwk } from "./crypto";

/**
 * Who you are in Bunny RTC. Lives only in this browser. The secret token is
 * this whole identity serialised — anyone holding it can act as you.
 */
export type Identity = { id: string; sign: PrivJwk; box: PrivJwk; nonce: string };

const KEY = "bunny_identity_v1";
const TOKEN_PREFIX = "bunny_";

function validId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9]{8,40}$/.test(id);
}
function validPriv(k: unknown): k is PrivJwk {
  return isPoint(k) && typeof (k as PrivJwk).d === "string" && /^[A-Za-z0-9_-]{40,48}$/.test((k as PrivJwk).d);
}

export async function loadIdentity(): Promise<Identity> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Identity;
      if (validId(parsed.id) && validPriv(parsed.sign) && validPriv(parsed.box) && typeof parsed.nonce === "string") {
        return parsed;
      }
    }
  } catch {
    /* fall through to a fresh identity */
  }
  const legacy = localStorage.getItem("bunny_id");
  const id = validId(legacy) ? legacy : crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  const identity: Identity = {
    id,
    sign: await generatePair("sign"),
    box: await generatePair("box"),
    nonce: b64u(crypto.getRandomValues(new Uint8Array(48))),
  };
  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity: Identity) {
  localStorage.setItem(KEY, JSON.stringify(identity));
  localStorage.setItem("bunny_id", identity.id);
}

export function identityToToken(identity: Identity) {
  const body = JSON.stringify({
    v: 1,
    i: identity.id,
    s: [identity.sign.x, identity.sign.y, identity.sign.d],
    b: [identity.box.x, identity.box.y, identity.box.d],
    n: identity.nonce,
  });
  return TOKEN_PREFIX + b64u(new TextEncoder().encode(body));
}

export function tokenToIdentity(token: string): Identity | null {
  try {
    const clean = token.trim().replace(/\s+/g, "");
    if (!clean.startsWith(TOKEN_PREFIX)) return null;
    const body = JSON.parse(new TextDecoder().decode(unb64u(clean.slice(TOKEN_PREFIX.length)))) as {
      v: number;
      i: string;
      s: string[];
      b: string[];
      n: string;
    };
    const sign = { x: body.s?.[0], y: body.s?.[1], d: body.s?.[2] };
    const box = { x: body.b?.[0], y: body.b?.[1], d: body.b?.[2] };
    if (body.v !== 1 || !validId(body.i) || !validPriv(sign) || !validPriv(box) || typeof body.n !== "string") return null;
    return { id: body.i, sign, box, nonce: body.n };
  } catch {
    return null;
  }
}
