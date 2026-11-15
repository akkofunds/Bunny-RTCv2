import crypto from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.server-DeuIDaqU.js
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
var SALT = "bunny-rtc/admin-root/v1/27bf3e8b3bc4f5d2ae1f9e65e3a4b817";
var ROOT_SIGN_PUB = {
	x: "m5IIhq8deLXOstjziUhiiS_7yE_mLpxW1qWOqC1xzl0",
	y: "bHBZbeKGcV8EIe6kPuHYtxQt3DFzqEdhrZsTdQFBs8Q"
};
var SECOND_TAG = "-F4SyE1Te8PKptO1VbKzVCH3n_Dn7L4Noo_LISRrYrk";
function pointOf(d) {
	const ecdh = crypto.createECDH("prime256v1");
	ecdh.setPrivateKey(d);
	const p = ecdh.getPublicKey();
	return {
		x: p.subarray(1, 33).toString("base64url"),
		y: p.subarray(33).toString("base64url")
	};
}
function safeEqual(a, b) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
function derive(passphrase) {
	if (typeof passphrase !== "string" || passphrase.length < 4 || passphrase.length > 128) return null;
	const master = crypto.scryptSync(passphrase, SALT, 32, {
		N: 2 ** 16,
		r: 8,
		p: 1,
		maxmem: 268435456
	});
	const h = (label) => crypto.createHmac("sha256", master).update(label).digest();
	const signD = h("bunny-rtc:root:sign");
	const signPub = pointOf(signD);
	if (!safeEqual(signPub.x + signPub.y, ROOT_SIGN_PUB.x + ROOT_SIGN_PUB.y)) return null;
	const sign = crypto.createPrivateKey({
		format: "jwk",
		key: {
			kty: "EC",
			crv: "P-256",
			d: signD.toString("base64url"),
			...signPub
		}
	});
	const boxD = h("bunny-rtc:root:box");
	return {
		sign,
		boxJwk: {
			d: boxD.toString("base64url"),
			...pointOf(boxD)
		},
		master
	};
}
function secondOk(root, answer) {
	if (typeof answer !== "string") return false;
	return safeEqual(crypto.createHmac("sha256", root.master).update("bunny-rtc:root:second:" + answer.trim().toLowerCase()).digest("base64url"), SECOND_TAG);
}
/** Uniform pacing so responses don't leak which step failed. */
async function pace(start) {
	const wait = 650 - (Date.now() - start);
	if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}
async function checkPassphrase(passphrase) {
	const start = Date.now();
	const ok = !!derive(passphrase);
	await pace(start);
	return ok;
}
async function checkSecond(passphrase, answer) {
	const start = Date.now();
	const root = derive(passphrase);
	const ok = !!root && secondOk(root, answer);
	await pace(start);
	return ok;
}
var B64 = /^[A-Za-z0-9_-]{40,48}$/;
var isPoint = (p) => !!p && typeof p === "object" && B64.test(p.x) && B64.test(p.y);
async function issueAdmin(input) {
	const start = Date.now();
	const root = derive(input.passphrase);
	if (!root || !secondOk(root, input.answer)) {
		await pace(start);
		return {
			ok: false,
			error: "Verification failed"
		};
	}
	if (!/^[a-z0-9]{8,40}$/.test(input.id) || !isPoint(input.sign) || !isPoint(input.box)) {
		await pace(start);
		return {
			ok: false,
			error: "That token is not valid"
		};
	}
	try {
		crypto.createPublicKey({
			format: "jwk",
			key: {
				kty: "EC",
				crv: "P-256",
				...input.sign
			}
		});
		crypto.createPublicKey({
			format: "jwk",
			key: {
				kty: "EC",
				crv: "P-256",
				...input.box
			}
		});
	} catch {
		return {
			ok: false,
			error: "That token is not valid"
		};
	}
	const payload = JSON.stringify({
		v: 1,
		kind: "admin",
		id: input.id,
		name: String(input.name || "").slice(0, 24),
		sign: {
			x: input.sign.x,
			y: input.sign.y
		},
		box: {
			x: input.box.x,
			y: input.box.y
		},
		iat: Date.now()
	});
	const sig = crypto.sign("sha256", Buffer.from(payload), {
		key: root.sign,
		dsaEncoding: "ieee-p1363"
	}).toString("base64url");
	await pace(start);
	return {
		ok: true,
		cert: {
			p: payload,
			s: sig
		},
		escrow: root.boxJwk
	};
}
//#endregion
export { checkPassphrase, checkSecond, issueAdmin };
