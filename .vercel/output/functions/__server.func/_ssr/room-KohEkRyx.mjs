import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, n as require_react_dom, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Ban, A as Megaphone, B as ImageOff, C as RotateCcw, D as Palette, E as Paperclip, F as LoaderCircle, G as Ellipsis, H as Eye, I as LayoutGrid, J as Copy, K as Download, L as KeyRound, M as LogIn, N as Lock, O as MessagesSquare, Q as Bell, R as Inbox, S as ScrollText, U as EyeOff, V as Hash, W as Eraser, X as Clock, Y as CloudUpload, Z as Check, _ as ShieldCheck, a as UserX, b as Send, c as Upload, d as Timer, et as AtSign, f as Terminal, g as Shield, h as SmilePlus, i as User, j as LogOut, k as MessageCircle, l as TriangleAlert, m as Smile, n as X, nt as ArrowLeft, o as UserPlus, p as Sparkles, q as CornerUpLeft, r as Users, rt as ArrowDown, s as UserMinus, t as Zap, u as Trash2, v as ShieldAlert, w as Pencil, x as Search, y as Settings, z as Image$1 } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/room-KohEkRyx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = require_react_dom();
/** Public halves of the admin root keys. Safe to ship: they verify, they can't sign. */
var ROOT_SIGN_PUB = {
	x: "m5IIhq8deLXOstjziUhiiS_7yE_mLpxW1qWOqC1xzl0",
	y: "bHBZbeKGcV8EIe6kPuHYtxQt3DFzqEdhrZsTdQFBs8Q"
};
var ESCROW_BOX_PUB = {
	x: "AvuaH8W2dXykk02PWtWs3qKpzmKn6Y_2FnnUxV2MzCg",
	y: "oJLMn3KgCqzxWny6IR3qLN-z0RoQjhB2jWOI1UyfvOA"
};
var enc = new TextEncoder();
var dec = new TextDecoder();
var subtle = () => globalThis.crypto.subtle;
function b64u(bytes) {
	const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let s = "";
	for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
	return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function unb64u(value) {
	const norm = value.replaceAll("-", "+").replaceAll("_", "/");
	const s = atob(norm + "===".slice((norm.length + 3) % 4));
	const out = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
	return out;
}
function randomId(bytes = 8) {
	return b64u(crypto.getRandomValues(new Uint8Array(bytes))).replace(/[-_]/g, "x").toLowerCase();
}
var isPoint = (p) => !!p && typeof p === "object" && typeof p.x === "string" && typeof p.y === "string" && /^[A-Za-z0-9_-]{40,48}$/.test(p.x) && /^[A-Za-z0-9_-]{40,48}$/.test(p.y);
var keyCache = /* @__PURE__ */ new Map();
function cached(key, make) {
	let hit = keyCache.get(key);
	if (!hit) {
		hit = make();
		hit.catch(() => keyCache.delete(key));
		keyCache.set(key, hit);
	}
	return hit;
}
var SIGN_ALG = {
	name: "ECDSA",
	namedCurve: "P-256"
};
var BOX_ALG = {
	name: "ECDH",
	namedCurve: "P-256"
};
function signPublic(p) {
	return cached(`sp:${p.x}${p.y}`, () => subtle().importKey("jwk", {
		kty: "EC",
		crv: "P-256",
		x: p.x,
		y: p.y,
		ext: true
	}, SIGN_ALG, false, ["verify"]));
}
function signPrivate(k) {
	return cached(`sk:${k.d}`, () => subtle().importKey("jwk", {
		kty: "EC",
		crv: "P-256",
		x: k.x,
		y: k.y,
		d: k.d,
		ext: true
	}, SIGN_ALG, false, ["sign"]));
}
function boxPublic(p) {
	return cached(`bp:${p.x}${p.y}`, () => subtle().importKey("jwk", {
		kty: "EC",
		crv: "P-256",
		x: p.x,
		y: p.y,
		ext: true
	}, BOX_ALG, false, []));
}
function boxPrivate(k) {
	return cached(`bk:${k.d}`, () => subtle().importKey("jwk", {
		kty: "EC",
		crv: "P-256",
		x: k.x,
		y: k.y,
		d: k.d,
		ext: true
	}, BOX_ALG, false, ["deriveKey"]));
}
async function generatePair(kind) {
	const pair = await subtle().generateKey(kind === "sign" ? SIGN_ALG : BOX_ALG, true, kind === "sign" ? ["sign", "verify"] : ["deriveKey"]);
	const jwk = await subtle().exportKey("jwk", pair.privateKey);
	return {
		x: jwk.x,
		y: jwk.y,
		d: jwk.d
	};
}
async function signText(key, text) {
	return b64u(await subtle().sign({
		name: "ECDSA",
		hash: "SHA-256"
	}, await signPrivate(key), enc.encode(text)));
}
async function verifyText(pub, text, sig) {
	try {
		return await subtle().verify({
			name: "ECDSA",
			hash: "SHA-256"
		}, await signPublic(pub), unb64u(sig), enc.encode(text));
	} catch {
		return false;
	}
}
/** Verify an admin certificate against the root key. Returns the claim or null. */
var certCache = /* @__PURE__ */ new Map();
function verifyCert(cert) {
	const c = cert;
	if (!c || typeof c.p !== "string" || typeof c.s !== "string" || c.p.length > 2e3) return Promise.resolve(null);
	const k = c.p + "." + c.s;
	let hit = certCache.get(k);
	if (!hit) {
		hit = (async () => {
			if (!await verifyText(ROOT_SIGN_PUB, c.p, c.s)) return null;
			try {
				const claim = JSON.parse(c.p);
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
async function signRecord(key, cert, payload) {
	const p = JSON.stringify(payload);
	return {
		p,
		s: await signText(key, p),
		c: cert
	};
}
async function verifyRecord(rec) {
	const r = rec;
	if (!r || typeof r.p !== "string" || typeof r.s !== "string") return null;
	const claim = await verifyCert(r.c);
	if (!claim) return null;
	if (!await verifyText(claim.sign, r.p, r.s)) return null;
	try {
		const body = JSON.parse(r.p);
		if (body.by !== claim.id) return null;
		return body;
	} catch {
		return null;
	}
}
async function wrapKeyFor(eph, pub) {
	return subtle().deriveKey({
		name: "ECDH",
		public: await boxPublic(pub)
	}, eph, {
		name: "AES-GCM",
		length: 256
	}, false, ["encrypt", "decrypt"]);
}
async function seal(readers, data) {
	const eph = await subtle().generateKey(BOX_ALG, true, ["deriveKey"]);
	const ephJwk = await subtle().exportKey("jwk", eph.publicKey);
	const raw = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32));
	const cek = await subtle().importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
	const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
	const ct = await subtle().encrypt({
		name: "AES-GCM",
		iv
	}, cek, enc.encode(JSON.stringify(data)));
	const k = {};
	for (const [rid, pub] of Object.entries(readers)) {
		const wk = await wrapKeyFor(eph.privateKey, pub);
		const wiv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
		k[rid] = {
			iv: b64u(wiv),
			w: b64u(await subtle().encrypt({
				name: "AES-GCM",
				iv: wiv
			}, wk, raw))
		};
	}
	return {
		e: {
			x: ephJwk.x,
			y: ephJwk.y
		},
		iv: b64u(iv),
		ct: b64u(ct),
		k
	};
}
async function open(sealed, readerId, key) {
	try {
		const slot = sealed?.k?.[readerId];
		if (!slot || !isPoint(sealed.e)) return null;
		const wk = await subtle().deriveKey({
			name: "ECDH",
			public: await boxPublic(sealed.e)
		}, await boxPrivate(key), {
			name: "AES-GCM",
			length: 256
		}, false, ["decrypt"]);
		const raw = await subtle().decrypt({
			name: "AES-GCM",
			iv: unb64u(slot.iv)
		}, wk, unb64u(slot.w));
		const cek = await subtle().importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
		const pt = await subtle().decrypt({
			name: "AES-GCM",
			iv: unb64u(sealed.iv)
		}, cek, unb64u(sealed.ct));
		return JSON.parse(dec.decode(pt));
	} catch {
		return null;
	}
}
var KEY = "bunny_identity_v1";
var TOKEN_PREFIX = "bunny_";
function validId(id) {
	return typeof id === "string" && /^[a-z0-9]{8,40}$/.test(id);
}
function validPriv(k) {
	return isPoint(k) && typeof k.d === "string" && /^[A-Za-z0-9_-]{40,48}$/.test(k.d);
}
async function loadIdentity() {
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (validId(parsed.id) && validPriv(parsed.sign) && validPriv(parsed.box) && typeof parsed.nonce === "string") return parsed;
		}
	} catch {}
	const legacy = localStorage.getItem("bunny_id");
	const identity = {
		id: validId(legacy) ? legacy : crypto.randomUUID().replaceAll("-", "").slice(0, 16),
		sign: await generatePair("sign"),
		box: await generatePair("box"),
		nonce: b64u(crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(48)))
	};
	saveIdentity(identity);
	return identity;
}
function saveIdentity(identity) {
	localStorage.setItem(KEY, JSON.stringify(identity));
	localStorage.setItem("bunny_id", identity.id);
}
function identityToToken(identity) {
	const body = JSON.stringify({
		v: 1,
		i: identity.id,
		s: [
			identity.sign.x,
			identity.sign.y,
			identity.sign.d
		],
		b: [
			identity.box.x,
			identity.box.y,
			identity.box.d
		],
		n: identity.nonce
	});
	return TOKEN_PREFIX + b64u(new TextEncoder().encode(body));
}
function tokenToIdentity(token) {
	try {
		const clean = token.trim().replace(/\s+/g, "");
		if (!clean.startsWith(TOKEN_PREFIX)) return null;
		const body = JSON.parse(new TextDecoder().decode(unb64u(clean.slice(6))));
		const sign = {
			x: body.s?.[0],
			y: body.s?.[1],
			d: body.s?.[2]
		};
		const box = {
			x: body.b?.[0],
			y: body.b?.[1],
			d: body.b?.[2]
		};
		if (body.v !== 1 || !validId(body.i) || !validPriv(sign) || !validPriv(box) || typeof body.n !== "string") return null;
		return {
			id: body.i,
			sign,
			box,
			nonce: body.n
		};
	} catch {
		return null;
	}
}
var LIVE_BROKER = "wss://broker.emqx.io:8084/mqtt";
/** Dev builds only: allow a local broker for testing. Production always uses the live relay. */
var BROKER = (() => {
	try {
		return LIVE_BROKER;
	} catch {
		return LIVE_BROKER;
	}
})();
/** Dev builds can be pointed at a scratch namespace so testing never touches the live room. */
function namespace() {
	try {
		return "bunny-rtc";
	} catch {
		return "bunny-rtc";
	}
}
var NS = namespace();
var T = {
	CHAT: `${NS}/public/chat`,
	HISTORY: `${NS}/public/history/`,
	PRESENCE: `${NS}/public/presence/`,
	TYPING: `${NS}/public/typing`,
	ADMINS: `${NS}/public/admins/`,
	MOD: `${NS}/public/mod/`,
	INBOX: `${NS}/v2/inbox/`,
	MODLOG: `${NS}/v2/modlog/`,
	MEDIA: `${NS}/v2/media/`
};
var DEFAULT_SETTINGS = {
	sounds: true,
	desktop: false,
	notifyOn: "mentions",
	dmNotify: true,
	status: "online",
	accent: "teal",
	glass: "clear",
	textSize: "md",
	compact: false,
	clock24: false,
	dim: 18,
	reduceMotion: false,
	dmsFrom: "everyone",
	sendTyping: true,
	enterToSend: true
};
var ACCENTS = {
	teal: {
		label: "Lagoon",
		color: "#2ee6c7",
		ink: "#05231d"
	},
	sky: {
		label: "Sky",
		color: "#5ec8ff",
		ink: "#04202f"
	},
	violet: {
		label: "Iris",
		color: "#a78bfa",
		ink: "#1a0f3a"
	},
	pink: {
		label: "Bloom",
		color: "#ff7ab6",
		ink: "#3a0a22"
	},
	amber: {
		label: "Amber",
		color: "#ffc35c",
		ink: "#2e1d02"
	},
	lime: {
		label: "Lime",
		color: "#a3e635",
		ink: "#1a2604"
	}
};
var COLORS = [
	"#149c86",
	"#0ea5e9",
	"#d97706",
	"#e11d48",
	"#65a30d",
	"#ea580c",
	"#0891b2",
	"#8b5cf6",
	"#db2777",
	"#4f46e5",
	"#ca8a04",
	"#059669"
];
var randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
var PRESETS = {
	aurora: {
		label: "Aurora",
		css: "radial-gradient(80% 60% at 20% 10%, #1fd1a5 0%, transparent 60%), radial-gradient(70% 60% at 85% 20%, #6d5dfc 0%, transparent 60%), radial-gradient(90% 70% at 50% 100%, #0b3d5c 0%, transparent 70%), #07121a"
	},
	dusk: {
		label: "Dusk",
		css: "radial-gradient(70% 60% at 80% 15%, #ff8a5c 0%, transparent 60%), radial-gradient(80% 70% at 15% 80%, #6a3df0 0%, transparent 65%), linear-gradient(180deg, #2b1745, #0f0b1e)"
	},
	ocean: {
		label: "Deep sea",
		css: "radial-gradient(90% 70% at 50% 0%, #2aa7ff 0%, transparent 60%), radial-gradient(80% 60% at 0% 100%, #00c2a8 0%, transparent 60%), linear-gradient(180deg, #03203a, #020c16)"
	},
	bloom: {
		label: "Bloom",
		css: "radial-gradient(60% 60% at 30% 30%, #ff9ec7 0%, transparent 60%), radial-gradient(70% 70% at 75% 70%, #79a8ff 0%, transparent 60%), linear-gradient(135deg, #3b2a5a, #12243f)"
	},
	graphite: {
		label: "Graphite",
		css: "radial-gradient(70% 60% at 30% 20%, #4b5563 0%, transparent 60%), radial-gradient(80% 60% at 80% 90%, #1f2937 0%, transparent 60%), #0b0d10"
	}
};
function cleanName(value) {
	return String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 24);
}
function colorFor(id) {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = hash * 33 + id.charCodeAt(i) | 0;
	return COLORS[Math.abs(hash) % COLORS.length];
}
function safeColor(value, id) {
	return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : colorFor(id);
}
function safeAvatar(value) {
	return typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 6e4 ? value : void 0;
}
function safeWallpaperUrl(value) {
	if (typeof value !== "string" || value.length > 9e5) return null;
	if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
	if (/^https:\/\/[^\s"'()\\<>]+$/.test(value) && value.length < 2e3) return value;
	return null;
}
/** Readable text color (dark or white) for any background hex. */
function inkFor(hex) {
	const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!m) return "#05231d";
	const [r, g, b] = [
		m[1],
		m[2],
		m[3]
	].map((h) => {
		const c = parseInt(h, 16) / 255;
		return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
	});
	return .2126 * r + .7152 * g + .0722 * b > .4 ? "#0b1014" : "#ffffff";
}
function cleanRole(value) {
	const r = value;
	if (!r || typeof r.text !== "string" || typeof r.color !== "string") return null;
	const text = r.text.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 18);
	if (!text || !/^#[0-9a-fA-F]{6}$/.test(r.color)) return null;
	return {
		text,
		color: r.color
	};
}
function threadKey(a, b) {
	return a < b ? `${a}:${b}` : `${b}:${a}`;
}
var ls = {
	get(key, fallback) {
		try {
			const raw = localStorage.getItem(key);
			return raw == null ? fallback : JSON.parse(raw);
		} catch {
			return fallback;
		}
	},
	set(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {}
	}
};
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function encodeLength(length) {
	const bytes = [];
	do {
		let digit = length % 128;
		length = Math.floor(length / 128);
		if (length > 0) digit |= 128;
		bytes.push(digit);
	} while (length > 0);
	return bytes;
}
function utf8(value) {
	const bytes = [...encoder.encode(value)];
	return [
		bytes.length >> 8,
		bytes.length & 255,
		...bytes
	];
}
function frame(header, body) {
	return new Uint8Array([
		header,
		...encodeLength(body.length),
		...body
	]);
}
function readString(bytes, offset) {
	if (offset + 2 > bytes.length) return null;
	const length = bytes[offset] << 8 | bytes[offset + 1];
	const start = offset + 2;
	if (start + length > bytes.length) return null;
	return {
		value: decoder.decode(bytes.subarray(start, start + length)),
		next: start + length
	};
}
function nextPacket(bytes, offset) {
	if (offset + 2 > bytes.length) return null;
	const header = bytes[offset];
	let multiplier = 1;
	let remaining = 0;
	let index = offset + 1;
	let digit = 0;
	do {
		if (index >= bytes.length) return null;
		digit = bytes[index++];
		remaining += (digit & 127) * multiplier;
		multiplier *= 128;
		if (multiplier > 268435456) return null;
	} while (digit & 128);
	if (index + remaining > bytes.length) return null;
	return {
		header,
		body: bytes.subarray(index, index + remaining),
		next: index + remaining
	};
}
var BunnySocket = class {
	url;
	clientId;
	willTopic;
	topics;
	onReady;
	onPublish;
	onDown;
	ws = null;
	seq = 1;
	ping = null;
	stopped = false;
	buffer = /* @__PURE__ */ new Uint8Array(0);
	dynamic = /* @__PURE__ */ new Set();
	constructor(url, clientId, willTopic, topics, onReady, onPublish, onDown) {
		this.url = url;
		this.clientId = clientId;
		this.willTopic = willTopic;
		this.topics = topics;
		this.onReady = onReady;
		this.onPublish = onPublish;
		this.onDown = onDown;
	}
	start() {
		this.stopped = false;
		this.open();
	}
	stop() {
		this.stopped = true;
		this.clearPing();
		try {
			this.send(224, []);
		} catch {}
		this.ws?.close();
		this.ws = null;
	}
	publish(topic, value, retained = false) {
		const data = [...encoder.encode(value)];
		this.send(retained ? 49 : 48, [...utf8(topic), ...data]);
	}
	open() {
		if (this.stopped) return;
		const ws = new WebSocket(this.url, "mqtt");
		ws.binaryType = "arraybuffer";
		this.ws = ws;
		ws.onopen = () => {
			const body = [
				...utf8("MQTT"),
				4,
				38,
				0,
				30,
				...utf8(this.clientId),
				...utf8(this.willTopic),
				...utf8("")
			];
			ws.send(frame(16, body));
		};
		ws.onmessage = (event) => {
			const chunk = new Uint8Array(event.data);
			const merged = new Uint8Array(this.buffer.length + chunk.length);
			merged.set(this.buffer);
			merged.set(chunk, this.buffer.length);
			this.buffer = merged;
			let offset = 0;
			while (offset < this.buffer.length) {
				const parsed = nextPacket(this.buffer, offset);
				if (!parsed) break;
				this.onPacket(parsed.header, parsed.body);
				offset = parsed.next;
			}
			this.buffer = this.buffer.slice(offset);
		};
		ws.onerror = () => this.onDown("Could not reach the room");
		ws.onclose = () => {
			this.clearPing();
			if (!this.stopped) this.onDown("Disconnected");
		};
	}
	onPacket(header, body) {
		const kind = header >> 4;
		if (kind === 2) {
			if (body.length < 2 || body[1] !== 0) {
				this.onDown("The room refused the connection");
				this.ws?.close();
				return;
			}
			for (const topic of this.topics) this.subscribe(topic);
			for (const topic of this.dynamic) this.subscribe(topic);
			this.clearPing();
			this.ping = setInterval(() => this.send(192, []), 15e3);
			this.onReady();
			return;
		}
		if (kind === 13) return;
		if (kind !== 3) return;
		const qos = header >> 1 & 3;
		const topicField = readString(body, 0);
		if (!topicField) return;
		let cursor = topicField.next;
		if (qos > 0 && cursor + 2 <= body.length) {
			const id = body[cursor] << 8 | body[cursor + 1];
			if (qos === 1) this.send(64, [id >> 8, id & 255]);
			cursor += 2;
		}
		this.onPublish(topicField.value, decoder.decode(body.subarray(cursor)));
	}
	/** Subscribe after connect (kept across reconnects until unwatched). */
	watch(topic) {
		this.dynamic.add(topic);
		this.subscribe(topic);
	}
	unwatch(topic) {
		if (!this.dynamic.delete(topic)) return;
		const id = this.seq++ & 65535;
		this.send(162, [
			id >> 8,
			id & 255,
			...utf8(topic)
		]);
	}
	get connected() {
		return this.ws?.readyState === WebSocket.OPEN;
	}
	subscribe(topic) {
		const id = this.seq++ & 65535;
		this.send(130, [
			id >> 8,
			id & 255,
			...utf8(topic),
			0
		]);
	}
	send(header, body) {
		if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame(header, body));
	}
	clearPing() {
		if (this.ping) clearInterval(this.ping);
		this.ping = null;
	}
};
/** Tiny, safe formatter: links, `code`, **bold**, *italic*, ~~strike~~, @mentions. */
var TOKEN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])|(`[^`\n]{1,200}`)|(\*\*[^*\n]{1,200}\*\*)|(~~[^~\n]{1,200}~~)|(\*[^*\n]{1,200}\*)|(@[\p{L}\p{N}_.-]{1,24})/gu;
function RichText({ text, selfName }) {
	const out = [];
	let last = 0;
	let i = 0;
	const me = selfName?.toLowerCase();
	for (const m of text.matchAll(TOKEN)) {
		const at = m.index ?? 0;
		if (at > last) out.push(text.slice(last, at));
		const raw = m[0];
		const key = i++;
		if (m[1]) out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: raw,
			target: "_blank",
			rel: "noopener noreferrer nofollow",
			className: "rt-link",
			children: raw
		}, key));
		else if (m[2]) out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rt-code",
			children: raw.slice(1, -1)
		}, key));
		else if (m[3]) out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: raw.slice(2, -2) }, key));
		else if (m[4]) out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("s", { children: raw.slice(2, -2) }, key));
		else if (m[5]) out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: raw.slice(1, -1) }, key));
		else if (m[6]) {
			const tag = raw.slice(1).toLowerCase();
			const self = !!me && (tag === me.replace(/\s+/g, "") || tag === me.split(/\s+/)[0] || tag === "everyone");
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: self ? "rt-mention self" : "rt-mention",
				children: raw
			}, key));
		}
		last = at + raw.length;
	}
	if (last < text.length) out.push(text.slice(last));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: out });
}
function mentions(text, name) {
	if (!name) return false;
	const lower = text.toLowerCase();
	const first = name.toLowerCase().split(/\s+/)[0];
	return lower.includes("@" + name.toLowerCase()) || first.length > 1 && new RegExp(`@${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`).test(lower) || lower.includes("@everyone");
}
var CHUNK_BYTES = 196608;
var IMAGE_MIMES = /* @__PURE__ */ new Set([
	"image/webp",
	"image/jpeg",
	"image/png",
	"image/gif"
]);
var VIDEO_MIMES = /* @__PURE__ */ new Set([
	"video/mp4",
	"video/webm",
	"video/quicktime"
]);
function canvasBlob(canvas, type, q) {
	return new Promise((resolve) => canvas.toBlob(resolve, type, q));
}
async function decodeImage(file) {
	const url = URL.createObjectURL(file);
	try {
		return await new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(/* @__PURE__ */ new Error("unreadable"));
			img.src = url;
		});
	} finally {
		URL.revokeObjectURL(url);
	}
}
/** Turn any image into a web-friendly WebP/JPEG; keep short videos as they are. */
async function prepareFile(file) {
	const name = file.name.slice(0, 80);
	if (file.type.startsWith("video/")) {
		if (!VIDEO_MIMES.has(file.type)) throw new Error("Videos must be MP4, WebM or MOV");
		if (file.size > 8388608) throw new Error("Videos can be up to 8 MB");
		const bytes = new Uint8Array(await file.arrayBuffer());
		const preview = URL.createObjectURL(file);
		const dims = await new Promise((resolve) => {
			const v = document.createElement("video");
			v.preload = "metadata";
			v.onloadedmetadata = () => resolve({
				w: v.videoWidth || void 0,
				h: v.videoHeight || void 0
			});
			v.onerror = () => resolve({});
			v.src = preview;
		});
		return {
			bytes,
			mime: file.type === "video/quicktime" ? "video/mp4" : file.type,
			kind: "video",
			...dims,
			name,
			preview
		};
	}
	if (!file.type.startsWith("image/") && !/\.(png|jpe?g|gif|webp|bmp|avif|heic)$/i.test(file.name)) throw new Error("Only images and videos can be shared");
	if (file.type === "image/gif" && file.size <= 3145728) {
		const img = await decodeImage(file);
		return {
			bytes: new Uint8Array(await file.arrayBuffer()),
			mime: "image/gif",
			kind: "image",
			w: img.naturalWidth,
			h: img.naturalHeight,
			name,
			preview: URL.createObjectURL(file)
		};
	}
	const img = await decodeImage(file);
	for (const [max, q] of [
		[1920, .84],
		[1600, .78],
		[1280, .72],
		[1024, .68]
	]) {
		const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
		canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
		const ctx = canvas.getContext("2d");
		if (!ctx) break;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		let blob = await canvasBlob(canvas, "image/webp", q);
		if (!blob || blob.type !== "image/webp") blob = await canvasBlob(canvas, "image/jpeg", q);
		if (blob && blob.size <= 921600) return {
			bytes: new Uint8Array(await blob.arrayBuffer()),
			mime: blob.type,
			kind: "image",
			w: canvas.width,
			h: canvas.height,
			name,
			preview: URL.createObjectURL(blob)
		};
	}
	throw new Error("That image couldn't be processed");
}
async function packMedia(p, encrypt) {
	let bytes = p.bytes;
	const ref = {
		id: randomId(10),
		kind: p.kind,
		mime: p.mime,
		size: p.bytes.length,
		n: 0,
		w: p.w,
		h: p.h,
		name: p.name
	};
	if (encrypt) {
		const raw = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32));
		const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
		const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
		bytes = new Uint8Array(await crypto.subtle.encrypt({
			name: "AES-GCM",
			iv
		}, key, bytes));
		ref.k = b64u(raw);
		ref.iv = b64u(iv);
	}
	const chunks = [];
	for (let i = 0; i < bytes.length; i += CHUNK_BYTES) chunks.push(b64u(bytes.subarray(i, i + CHUNK_BYTES)));
	ref.n = chunks.length;
	return {
		ref,
		chunks
	};
}
async function unpackMedia(ref, chunks) {
	const parts = chunks.map((c) => unb64u(c));
	const total = parts.reduce((n, p) => n + p.length, 0);
	let bytes = new Uint8Array(total);
	let o = 0;
	for (const p of parts) {
		bytes.set(p, o);
		o += p.length;
	}
	if (ref.k && ref.iv) {
		const key = await crypto.subtle.importKey("raw", unb64u(ref.k), "AES-GCM", false, ["decrypt"]);
		bytes = new Uint8Array(await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv: unb64u(ref.iv)
		}, key, bytes));
	}
	return URL.createObjectURL(new Blob([bytes], { type: ref.mime }));
}
/** Validate refs that arrive from other people. */
function cleanMedia(value) {
	if (!Array.isArray(value)) return void 0;
	const out = [];
	for (const r of value.slice(0, 4)) {
		if (!r || typeof r.id !== "string" || !/^[a-z0-9]{6,24}$/.test(r.id)) continue;
		const kind = r.kind === "video" ? "video" : r.kind === "image" ? "image" : null;
		if (!kind) continue;
		if (!(kind === "image" ? IMAGE_MIMES : VIDEO_MIMES).has(r.mime)) continue;
		const n = Number(r.n);
		if (!Number.isInteger(n) || n < 1 || n > 64) continue;
		const dim = (v) => typeof v === "number" && v > 0 && v < 2e4 ? Math.round(v) : void 0;
		out.push({
			id: r.id,
			kind,
			mime: r.mime,
			size: Math.min(Number(r.size) || 0, 67108864),
			n,
			w: dim(r.w),
			h: dim(r.h),
			name: typeof r.name === "string" ? r.name.slice(0, 80) : void 0,
			k: typeof r.k === "string" && /^[A-Za-z0-9_-]{43}$/.test(r.k) ? r.k : void 0,
			iv: typeof r.iv === "string" && /^[A-Za-z0-9_-]{16}$/.test(r.iv) ? r.iv : void 0
		});
	}
	return out.length ? out : void 0;
}
/** Animated avatars are kept exactly as uploaded (GIF, animated WebP, short MP4/WebM). */
async function prepareAnimated(file) {
	if (![
		"image/gif",
		"image/webp",
		"video/mp4",
		"video/webm"
	].includes(file.type)) throw new Error("Use a GIF, WebP, MP4 or WebM");
	if (file.size > 2097152) throw new Error("Animated pictures can be up to 2 MB");
	return {
		bytes: new Uint8Array(await file.arrayBuffer()),
		mime: file.type,
		kind: file.type.startsWith("video/") ? "video" : "image",
		name: file.name.slice(0, 80),
		preview: URL.createObjectURL(file)
	};
}
var ID_RE = /^[a-z0-9]{4,40}$/;
var USER_RE = /^[a-z0-9]{8,40}$/;
var STATUSES = /* @__PURE__ */ new Set([
	"online",
	"idle",
	"dnd"
]);
var audio = null;
function chime(freq) {
	try {
		audio ??= new AudioContext();
		const ctx = audio;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.value = freq;
		gain.gain.value = .035;
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + .16);
		osc.stop(ctx.currentTime + .17);
	} catch {}
}
var msgSigText = (m) => `${m.id}\n${m.authorId}\n${m.at}\n${m.text}\n${(m.media || []).map((x) => x.id).join(",")}`;
function parse(payload) {
	try {
		return JSON.parse(payload);
	} catch {
		return null;
	}
}
function useBunny(mode) {
	const adminMode = mode === "admin";
	const [identity, setIdentity] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)({
		name: "",
		bio: "",
		color: "#149c86"
	});
	const [settings, setSettings] = (0, import_react.useState)(DEFAULT_SETTINGS);
	const [session, setSession] = (0, import_react.useState)(null);
	const [online, setOnline] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("Connecting…");
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [people, setPeople] = (0, import_react.useState)([]);
	const [admins, setAdmins] = (0, import_react.useState)({});
	const [verified, setVerified] = (0, import_react.useState)({});
	const [bans, setBans] = (0, import_react.useState)({});
	const [wallpaper, setWallpaper] = (0, import_react.useState)(null);
	const [announce, setAnnounce] = (0, import_react.useState)(null);
	const [typing, setTyping] = (0, import_react.useState)({});
	const [friends, setFriends] = (0, import_react.useState)({});
	const [contacts, setContacts] = (0, import_react.useState)({});
	const [requests, setRequests] = (0, import_react.useState)({});
	const [outgoing, setOutgoing] = (0, import_react.useState)({});
	const [blocked, setBlocked] = (0, import_react.useState)([]);
	const [dms, setDms] = (0, import_react.useState)({});
	const [lastRead, setLastRead] = (0, import_react.useState)({});
	const [warnings, setWarnings] = (0, import_react.useState)([]);
	const [allDms, setAllDms] = (0, import_react.useState)({});
	const [logs, setLogs] = (0, import_react.useState)({});
	const [warnsIssued, setWarnsIssued] = (0, import_react.useState)({});
	const [directory, setDirectory] = (0, import_react.useState)({});
	const [view, setViewState] = (0, import_react.useState)({
		tab: "server",
		peer: null
	});
	const [serverUnread, setServerUnread] = (0, import_react.useState)(0);
	const [toast, setToast] = (0, import_react.useState)("");
	const [room, setRoom] = (0, import_react.useState)(null);
	const [perks, setPerks] = (0, import_react.useState)({});
	const [pending, setPending] = (0, import_react.useState)({});
	const [flash, setFlash] = (0, import_react.useState)(null);
	const [kicked, setKicked] = (0, import_react.useState)(null);
	const [modHistory, setModHistory] = (0, import_react.useState)([]);
	const lastSendRef = (0, import_react.useRef)(0);
	const roomRef = (0, import_react.useRef)(null);
	roomRef.current = room;
	const mediaWaitRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	const socketRef = (0, import_react.useRef)(null);
	const idRef = (0, import_react.useRef)(null);
	const profileRef = (0, import_react.useRef)(profile);
	const settingsRef = (0, import_react.useRef)(settings);
	const sessionRef = (0, import_react.useRef)(null);
	const friendsRef = (0, import_react.useRef)(friends);
	const contactsRef = (0, import_react.useRef)(contacts);
	const outgoingRef = (0, import_react.useRef)(outgoing);
	const blockedRef = (0, import_react.useRef)(blocked);
	const bansRef = (0, import_react.useRef)(bans);
	const adminsRef = (0, import_react.useRef)(admins);
	const viewRef = (0, import_react.useRef)(view);
	const peopleRef = (0, import_react.useRef)([]);
	const msgMapRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const connectedAtRef = (0, import_react.useRef)(0);
	const acksRef = (0, import_react.useRef)([]);
	const lastTypingRef = (0, import_react.useRef)(0);
	const seenDmRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const allDmsRef = (0, import_react.useRef)({});
	profileRef.current = profile;
	settingsRef.current = settings;
	sessionRef.current = session;
	friendsRef.current = friends;
	contactsRef.current = contacts;
	outgoingRef.current = outgoing;
	blockedRef.current = blocked;
	bansRef.current = bans;
	adminsRef.current = admins;
	viewRef.current = view;
	allDmsRef.current = allDms;
	const say = (0, import_react.useCallback)((text) => setToast(text), []);
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			const me = await loadIdentity();
			const name = cleanName(localStorage.getItem("bunny_name") || "") || `Guest-${me.id.slice(0, 4)}`;
			const avatar = safeAvatar(localStorage.getItem("bunny_avatar") || void 0);
			const bio = (localStorage.getItem("bunny_bio") || "").slice(0, 80);
			const storedColor = localStorage.getItem("bunny_color");
			const color = storedColor && /^#[0-9a-fA-F]{6}$/.test(storedColor) ? storedColor : randomColor();
			localStorage.setItem("bunny_color", color);
			const stored = ls.get("bunny_settings", {});
			const legacySound = localStorage.getItem("bunny_sound");
			const nextSettings = {
				...DEFAULT_SETTINGS,
				...legacySound === "0" ? { sounds: false } : {},
				...stored
			};
			let verifiedSession = null;
			const sess = ls.get("bunny_admin_v1", null);
			if (sess && sess.id === me.id) {
				const claim = await verifyCert(sess.cert);
				if (claim && claim.id === me.id && claim.sign.x === me.sign.x && claim.sign.y === me.sign.y) verifiedSession = sess;
			}
			if (!alive) return;
			const k = (s) => `bunny_${s}_${me.id}`;
			idRef.current = me;
			setIdentity(me);
			const anim = cleanMedia([ls.get("bunny_anim", null)].filter(Boolean))?.[0];
			setProfile({
				name,
				avatar,
				bio,
				color,
				anim
			});
			setSettings(nextSettings);
			setSession(verifiedSession);
			setFriends(ls.get(k("friends"), {}));
			setContacts(ls.get(k("contacts"), {}));
			setOutgoing(ls.get(k("outgoing"), {}));
			setBlocked(ls.get(k("blocked"), []));
			const storedDms = ls.get(k("dms"), {});
			seenDmRef.current = new Set(Object.keys(storedDms));
			setDms(storedDms);
			setLastRead(ls.get(k("lastread"), {}));
			acksRef.current = ls.get(k("acks"), []);
			if (adminMode && verifiedSession) setLogs(ls.get(k("modlogs"), {}));
			setLoaded(true);
		})();
		return () => {
			alive = false;
		};
	}, [adminMode]);
	const persistKey = (s) => identity ? `bunny_${s}_${identity.id}` : "";
	(0, import_react.useEffect)(() => void (loaded && ls.set(persistKey("friends"), friends)), [friends, loaded]);
	(0, import_react.useEffect)(() => void (loaded && ls.set(persistKey("contacts"), contacts)), [contacts, loaded]);
	(0, import_react.useEffect)(() => void (loaded && ls.set(persistKey("outgoing"), outgoing)), [outgoing, loaded]);
	(0, import_react.useEffect)(() => void (loaded && ls.set(persistKey("blocked"), blocked)), [blocked, loaded]);
	(0, import_react.useEffect)(() => void (loaded && ls.set(persistKey("lastread"), lastRead)), [lastRead, loaded]);
	(0, import_react.useEffect)(() => {
		if (!loaded) return;
		const list = Object.values(dms).sort((a, b) => b.at - a.at).slice(0, 800);
		ls.set(persistKey("dms"), Object.fromEntries(list.map((d) => [d.id, d])));
	}, [dms, loaded]);
	(0, import_react.useEffect)(() => {
		if (!loaded || !adminMode) return;
		const list = Object.values(logs).sort((a, b) => b.at - a.at).slice(0, 600);
		ls.set(persistKey("modlogs"), Object.fromEntries(list.map((l) => [l.key, l])));
	}, [logs, loaded]);
	(0, import_react.useEffect)(() => {
		if (loaded) ls.set("bunny_settings", settings);
	}, [settings, loaded]);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const t = window.setTimeout(() => setToast(""), 2200);
		return () => window.clearTimeout(t);
	}, [toast]);
	(0, import_react.useEffect)(() => {
		const t = window.setInterval(() => {
			setTyping((prev) => {
				const cutoff = Date.now() - 4500;
				const next = Object.fromEntries(Object.entries(prev).filter(([, v]) => v.at > cutoff));
				return Object.keys(next).length === Object.keys(prev).length ? prev : next;
			});
		}, 1500);
		return () => window.clearInterval(t);
	}, []);
	const notify = (0, import_react.useCallback)((kind, title, body, mentioned) => {
		const s = settingsRef.current;
		if (s.status === "dnd") return;
		if (kind === "server") {
			if (s.notifyOn === "none") return;
			if (s.notifyOn === "mentions" && !mentioned) return;
		} else if (!s.dmNotify) return;
		if (s.sounds) chime(kind === "dm" ? 880 : mentioned ? 988 : 740);
		if (s.desktop && typeof Notification !== "undefined" && Notification.permission === "granted" && (document.hidden || !document.hasFocus())) try {
			new Notification(title, {
				body: body.slice(0, 140),
				icon: "/favicon.svg",
				tag: kind
			});
		} catch {}
	}, []);
	const addLog = (0, import_react.useCallback)((entry) => {
		setLogs((prev) => {
			const old = prev[entry.key];
			if (old && old.actorId && !entry.actorId) return prev;
			return {
				...prev,
				[entry.key]: {
					...old,
					...entry
				}
			};
		});
	}, []);
	const myId = identity?.id;
	const escrowReady = adminMode && !!session;
	(0, import_react.useEffect)(() => {
		const me = idRef.current;
		if (!loaded || !me || !myId) return;
		let retry = 0;
		let timer = 0;
		let beat = 0;
		let guardTimer = 0;
		const peopleMap = /* @__PURE__ */ new Map();
		const msgMap = msgMapRef.current;
		msgMap.clear();
		const guardCache = ls.get("bunny_guard", {});
		const guardLatest = /* @__PURE__ */ new Map();
		const sess = sessionRef.current;
		const topics = [
			T.CHAT,
			T.HISTORY + "+",
			T.PRESENCE + "+",
			T.TYPING,
			T.ADMINS + "+",
			T.MOD + "+",
			escrowReady ? T.INBOX + "+/+" : T.INBOX + me.id + "/+",
			...escrowReady ? [T.MODLOG + "+"] : []
		];
		const sockSend = (topic, payload, retained) => socketRef.current?.publish(topic, payload, retained);
		const publishPresence = async () => {
			const p = profileRef.current;
			const ts = Date.now();
			const body = {
				id: me.id,
				name: p.name,
				color: p.color,
				avatar: p.avatar,
				anim: p.anim,
				bio: p.bio || void 0,
				status: settingsRef.current.status,
				box: {
					x: me.box.x,
					y: me.box.y
				},
				ts,
				at: ts
			};
			if (sessionRef.current) body.sig = await signText(me.sign, `${me.id}\n${ts}`);
			sockSend(T.PRESENCE + me.id, JSON.stringify(body), true);
		};
		const flushPeople = () => {
			const cutoff = Date.now() - 4e4;
			const list = [...peopleMap.values()].filter((p) => p.at >= cutoff);
			if (!list.some((p) => p.id === me.id)) {
				const p = profileRef.current;
				list.push({
					id: me.id,
					name: p.name,
					color: p.color,
					avatar: p.avatar,
					bio: p.bio,
					status: settingsRef.current.status,
					at: Date.now()
				});
			}
			list.sort((a, b) => a.name.localeCompare(b.name));
			peopleRef.current = list;
			setPeople(list);
		};
		const flushMsgs = () => setMessages([...msgMap.values()].sort((a, b) => a.at - b.at).slice(-300));
		const know = (id, name, color, avatar) => {
			setDirectory((prev) => {
				const old = prev[id];
				if (old && old.name === name && (!avatar || old.avatar === avatar) && Date.now() - old.lastSeen < 6e4) return prev;
				return {
					...prev,
					[id]: {
						id,
						name,
						color: color || old?.color || colorFor(id),
						avatar: avatar || old?.avatar,
						lastSeen: Date.now()
					}
				};
			});
		};
		const guardRemember = (topic, payload) => {
			guardLatest.set(topic, payload);
			if (guardCache[topic] === payload) return;
			guardCache[topic] = payload;
			ls.set("bunny_guard", guardCache);
		};
		const guardEmpty = (topic) => {
			guardLatest.set(topic, "");
			const cached = guardCache[topic];
			if (!cached) return;
			window.setTimeout(() => {
				if (guardLatest.get(topic) === "") sockSend(topic, cached, true);
			}, 1500 + Math.random() * 4e3);
		};
		const handleHistory = (topic, payload) => {
			const keyId = topic.startsWith(T.HISTORY) ? topic.slice(T.HISTORY.length) : "";
			if (!payload) {
				const old = keyId ? msgMap.get(keyId) : void 0;
				if (old) {
					msgMap.delete(keyId);
					flushMsgs();
					if (escrowReady) addLog({
						key: `del:${old.id}`,
						kind: "delete",
						scope: "server",
						msgId: old.id,
						authorId: old.authorId,
						authorName: old.name,
						before: old.text,
						at: Date.now()
					});
				}
				return;
			}
			const raw = parse(payload);
			if (!raw || typeof raw.id !== "string" || !ID_RE.test(raw.id) || typeof raw.text !== "string" || typeof raw.authorId !== "string") return;
			if (keyId && keyId !== raw.id) return;
			const msg = {
				id: raw.id,
				authorId: raw.authorId.slice(0, 40),
				name: cleanName(raw.name) || "Guest",
				text: raw.text.slice(0, 2e3),
				at: Number(raw.at) || Date.now(),
				editedAt: raw.editedAt ? Number(raw.editedAt) : void 0,
				reactions: raw.reactions && typeof raw.reactions === "object" ? raw.reactions : void 0,
				replyTo: raw.replyTo && typeof raw.replyTo.id === "string" ? {
					id: raw.replyTo.id.slice(0, 40),
					name: cleanName(raw.replyTo.name),
					text: String(raw.replyTo.text || "").slice(0, 120)
				} : void 0,
				media: cleanMedia(raw.media),
				sig: typeof raw.sig === "string" ? raw.sig.slice(0, 200) : void 0
			};
			if (!msg.text.trim() && !msg.media) return;
			const prev = msgMap.get(msg.id);
			if (msg.authorId === me.id) setPending((cur) => cur[msg.id] ? Object.fromEntries(Object.entries(cur).filter(([k]) => k !== msg.id)) : cur);
			if (escrowReady && prev && msg.editedAt && prev.text !== msg.text) addLog({
				key: `edit:${msg.id}:${msg.editedAt}`,
				kind: "edit",
				scope: "server",
				msgId: msg.id,
				authorId: msg.authorId,
				authorName: msg.name,
				before: prev.text,
				after: msg.text,
				at: msg.editedAt
			});
			msgMap.set(msg.id, msg);
			flushMsgs();
			know(msg.authorId, msg.name);
			if (!prev && msg.authorId !== me.id && msg.at > connectedAtRef.current - 3e3) {
				if (blockedRef.current.includes(msg.authorId) || bansRef.current[msg.authorId]?.kind === "ban" && !adminsRef.current[msg.authorId]) return;
				if (viewRef.current.tab !== "server" || document.hidden) setServerUnread((n) => n + 1);
				const mentioned = mentions(msg.text, profileRef.current.name) || !!msg.replyTo && msgMap.get(msg.replyTo.id)?.authorId === me.id;
				notify("server", `${msg.name} in Bunny RTC`, msg.text, mentioned);
			}
		};
		const handlePresence = (id, payload) => {
			if (!payload) peopleMap.delete(id);
			else {
				const raw = parse(payload);
				if (!raw || raw.id !== id) return;
				const person = {
					id,
					name: cleanName(raw.name) || "Guest",
					color: safeColor(raw.color, id),
					avatar: safeAvatar(raw.avatar),
					bio: typeof raw.bio === "string" ? raw.bio.slice(0, 80) : void 0,
					status: STATUSES.has(raw.status) ? raw.status : "online",
					box: isPoint(raw.box) ? raw.box : void 0,
					anim: cleanMedia(raw.anim ? [raw.anim] : void 0)?.[0],
					ts: Number(raw.ts) || void 0,
					sig: typeof raw.sig === "string" ? raw.sig.slice(0, 200) : void 0,
					at: Date.now()
				};
				peopleMap.set(id, person);
				know(id, person.name, person.color, person.avatar);
			}
			flushPeople();
		};
		const handleInbox = async (uid, item, payload) => {
			const mine = uid === me.id;
			if (!payload) {
				if (item.startsWith("dm-")) {
					const id = item.slice(3);
					if (mine) setDms((prev) => prev[id] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id)) : prev);
					const old = escrowReady ? allDmsRef.current[id] : void 0;
					if (old) {
						addLog({
							key: `dmdel:${id}`,
							kind: "delete",
							scope: "direct",
							msgId: id,
							authorId: old.from,
							authorName: old.name,
							before: old.text,
							at: Date.now()
						});
						setAllDms((prev) => {
							const next = { ...prev };
							delete next[id];
							return next;
						});
					}
				}
				if (mine && item.startsWith("fr-")) {
					const from = item.slice(3);
					setRequests((prev) => {
						if (!prev[from]) return prev;
						const next = { ...prev };
						delete next[from];
						return next;
					});
				}
				return;
			}
			if (item.startsWith("dm-")) {
				const env = parse(payload);
				if (!env || env.t !== "dm" || !ID_RE.test(env.id) || !USER_RE.test(env.from) || !USER_RE.test(env.to)) return;
				if (uid !== env.from && uid !== env.to) return;
				if (mine) {
					const body = await open(env.env, me.id, me.box);
					if (body && typeof body.text === "string") {
						const peer = env.from === me.id ? env.to : env.from;
						const incoming = env.from !== me.id;
						if (incoming) {
							if (blockedRef.current.includes(env.from)) return;
							if (settingsRef.current.dmsFrom === "friends" && !friendsRef.current[env.from]) return;
						}
						const dm = {
							id: env.id,
							from: env.from,
							to: env.to,
							at: Number(env.at) || Date.now(),
							text: body.text.slice(0, 2e3),
							name: cleanName(body.name) || "Guest",
							color: safeColor(body.color, env.from),
							media: cleanMedia(body.media),
							editedAt: Number(body.editedAt) || void 0
						};
						const fresh = !seenDmRef.current.has(dm.id);
						seenDmRef.current.add(dm.id);
						setDms((prev) => {
							const old = prev[dm.id];
							if (old && (old.editedAt || 0) >= (dm.editedAt || 0)) return prev;
							return {
								...prev,
								[dm.id]: dm
							};
						});
						if (incoming && isPoint(env.fb)) setContacts((prev) => {
							const old = prev[peer];
							if (old && old.box.x === env.fb.x && old.name === dm.name) return prev;
							return {
								...prev,
								[peer]: {
									id: peer,
									name: dm.name,
									color: dm.color || colorFor(peer),
									box: env.fb,
									since: old?.since || Date.now()
								}
							};
						});
						if (fresh && incoming && dm.at > connectedAtRef.current - 3e3) {
							const v = viewRef.current;
							if (!(v.tab === "direct" && v.peer === peer && !document.hidden)) notify("dm", `${dm.name} sent you a message`, dm.text, true);
						}
					}
				}
				if (escrowReady && sessionRef.current) {
					const body = await open(env.env, "mod", sessionRef.current.escrow);
					if (body && typeof body.text === "string") {
						const dm = {
							id: env.id,
							from: env.from,
							to: env.to,
							at: Number(env.at) || Date.now(),
							text: body.text.slice(0, 2e3),
							name: cleanName(body.name) || "Guest",
							color: safeColor(body.color, env.from),
							media: cleanMedia(body.media),
							editedAt: Number(body.editedAt) || void 0
						};
						const before = allDmsRef.current[dm.id];
						if (before && dm.editedAt && (before.editedAt || 0) < dm.editedAt && before.text !== dm.text) addLog({
							key: `dmedit:${dm.id}:${dm.editedAt}`,
							kind: "edit",
							scope: "direct",
							msgId: dm.id,
							authorId: dm.from,
							authorName: dm.name,
							before: before.text,
							after: dm.text,
							at: dm.editedAt
						});
						setAllDms((prev) => {
							const old = prev[dm.id];
							if (old && (old.editedAt || 0) >= (dm.editedAt || 0)) return prev;
							return {
								...prev,
								[dm.id]: dm
							};
						});
						know(env.from, dm.name, dm.color);
					}
				}
				return;
			}
			if (!mine && !item.startsWith("warn-")) return;
			if (item.startsWith("fr-") || item.startsWith("fa-")) {
				const req = parse(payload);
				if (!req || !USER_RE.test(req.from) || !isPoint(req.box) || item.slice(3) !== req.from) return;
				const info = {
					id: req.from,
					name: cleanName(req.name) || "Guest",
					color: safeColor(req.color, req.from),
					box: req.box,
					since: Date.now()
				};
				if (blockedRef.current.includes(req.from)) return;
				if (req.t === "fa") {
					if (outgoingRef.current[req.from] || friendsRef.current[req.from]) {
						setFriends((prev) => ({
							...prev,
							[req.from]: {
								...info,
								since: prev[req.from]?.since || Date.now()
							}
						}));
						setOutgoing((prev) => {
							const next = { ...prev };
							delete next[req.from];
							return next;
						});
						if (!friendsRef.current[req.from]) setToast(`${info.name} accepted your friend request`);
					}
					sockSend(T.INBOX + me.id + "/" + item, "", true);
					return;
				}
				if (req.t === "fr") {
					if (friendsRef.current[req.from] || outgoingRef.current[req.from]) {
						setFriends((prev) => ({
							...prev,
							[req.from]: {
								...info,
								since: prev[req.from]?.since || Date.now()
							}
						}));
						setOutgoing((prev) => {
							const next = { ...prev };
							delete next[req.from];
							return next;
						});
						const p = profileRef.current;
						sockSend(T.INBOX + req.from + "/fa-" + me.id, JSON.stringify({
							t: "fa",
							from: me.id,
							name: p.name,
							color: p.color,
							box: {
								x: me.box.x,
								y: me.box.y
							},
							at: Date.now()
						}), true);
						sockSend(T.INBOX + me.id + "/" + item, "", true);
						return;
					}
					setRequests((prev) => ({
						...prev,
						[req.from]: {
							from: req.from,
							name: info.name,
							color: info.color,
							box: req.box,
							at: Number(req.at) || Date.now()
						}
					}));
					if (Number(req.at) > connectedAtRef.current - 3e3) notify("dm", "New friend request", `${info.name} wants to be friends`, true);
				}
				return;
			}
			if (item.startsWith("warn-")) {
				const rec = await verifyRecord(parse(payload));
				if (!rec || rec.kind !== "warn" || rec.target !== uid || `warn-${rec.id}` !== item) return;
				if (escrowReady) setWarnsIssued((prev) => ({
					...prev,
					[rec.id]: rec
				}));
				if (mine && !acksRef.current.includes(rec.id)) setWarnings((prev) => prev.some((w) => w.id === rec.id) ? prev : [...prev, rec]);
			}
		};
		const handleMod = async (topic, key, payload) => {
			if (!payload) return guardEmpty(topic);
			const rec = await verifyRecord(parse(payload));
			if (!rec) return;
			if (escrowReady) {
				const line = rec.kind === "ban" ? `banned ${rec.targetName}` : rec.kind === "unban" ? `unbanned ${rec.targetName}` : rec.kind === "kick" ? `kicked ${rec.targetName}` : rec.kind === "flash" ? `${rec.style === "m" ? "/m" : "/h"} “${rec.text}”` : rec.kind === "room" ? rec.locked ? "locked chat" : rec.slowmode ? `slowmode ${rec.slowmode}s` : "room controls reset" : rec.kind === "wallpaper" ? rec.mode === "default" ? "reset the wallpaper" : "changed the wallpaper" : rec.text ? "posted an announcement" : "cleared the announcement";
				const hkey = `${rec.kind}:${rec.at}:${rec.by}`;
				setModHistory((prev) => prev.some((h) => h.key === hkey) ? prev : [{
					key: hkey,
					text: line,
					at: rec.at,
					byName: rec.byName
				}, ...prev].slice(0, 80));
			}
			if (rec.kind === "perk") {
				const perk = rec;
				if (key !== `perk-${perk.target}`) return;
				const clean = {
					...perk,
					animated: !!perk.animated,
					role: cleanRole(perk.role)
				};
				setPerks((prev) => prev[perk.target] && prev[perk.target].at >= perk.at ? prev : {
					...prev,
					[perk.target]: clean
				});
				know(perk.target, perk.targetName);
				guardRemember(topic, payload);
				return;
			}
			if (rec.kind === "flash" && key === "flash") {
				if (Date.now() - rec.at < 2e4 && typeof rec.text === "string") setFlash({
					...rec,
					text: rec.text.slice(0, 200)
				});
				return;
			}
			if (rec.kind === "kick" && key === "kick") {
				if (rec.target === me.id && Date.now() - rec.at < 2e4 && !adminsRef.current[me.id]) {
					setKicked(rec);
					socketRef.current?.stop();
					setOnline(false);
					setStatus("Kicked");
				}
				return;
			}
			if (rec.kind === "room" && key === "room") {
				setRoom((prev) => prev && prev.at >= rec.at ? prev : {
					...rec,
					slowmode: Math.max(0, Math.min(3600, Number(rec.slowmode) || 0)),
					locked: !!rec.locked
				});
				guardRemember(topic, payload);
				return;
			}
			if ((rec.kind === "ban" || rec.kind === "unban") && key === `ban-${rec.target}`) {
				setBans((prev) => prev[rec.target] && prev[rec.target].at >= rec.at ? prev : {
					...prev,
					[rec.target]: rec
				});
				know(rec.target, rec.targetName);
			} else if (rec.kind === "wallpaper" && key === "wallpaper") {
				if (rec.mode === "image" && !safeWallpaperUrl(rec.value)) return;
				if (rec.mode === "preset" && !(typeof rec.value === "string" && PRESETS[rec.value])) return;
				if (![
					"default",
					"preset",
					"image",
					"media"
				].includes(rec.mode)) return;
				if (rec.mode === "media") {
					const media = cleanMedia(rec.media ? [rec.media] : void 0)?.[0];
					if (!media || media.k) return;
					rec.media = media;
				}
				setWallpaper((prev) => prev && prev.at >= rec.at ? prev : rec);
			} else if (rec.kind === "announce" && key === "announce") setAnnounce((prev) => prev && prev.at >= rec.at ? prev : rec);
			else return;
			guardRemember(topic, payload);
		};
		const handleAdmins = async (topic, id, payload) => {
			if (!payload) return guardEmpty(topic);
			const claim = await verifyCert(parse(payload));
			if (!claim || claim.id !== id) return;
			setAdmins((prev) => prev[id]?.iat === claim.iat ? prev : {
				...prev,
				[id]: claim
			});
			guardRemember(topic, payload);
		};
		const onPublish = (topic, payload) => {
			if (topic === T.CHAT || topic.startsWith(T.HISTORY)) return handleHistory(topic, payload);
			if (topic.startsWith(T.PRESENCE)) return handlePresence(topic.slice(T.PRESENCE.length), payload);
			if (topic === T.TYPING) {
				const t = parse(payload);
				if (!t || typeof t.id !== "string" || t.id === me.id) return;
				setTyping((prev) => ({
					...prev,
					[t.id]: {
						name: cleanName(t.name) || "Someone",
						at: Date.now()
					}
				}));
				return;
			}
			if (topic.startsWith(T.ADMINS)) return void handleAdmins(topic, topic.slice(T.ADMINS.length), payload);
			if (topic.startsWith(T.MOD)) return void handleMod(topic, topic.slice(T.MOD.length), payload);
			if (topic.startsWith(T.INBOX)) {
				const [uid, item] = topic.slice(T.INBOX.length).split("/");
				if (!uid || !item) return;
				handleInbox(uid, item, payload);
				return;
			}
			if (topic.startsWith(T.MEDIA)) {
				const [mid, idx] = topic.slice(T.MEDIA.length).split("/");
				const wait = mediaWaitRef.current.get(mid);
				const i = Number(idx);
				if (!wait || !payload || !Number.isInteger(i) || i < 0 || i >= wait.chunks.length || wait.chunks[i]) return;
				wait.chunks[i] = payload;
				wait.got += 1;
				if (wait.got === wait.chunks.length) wait.done(true);
				return;
			}
			if (topic.startsWith(T.MODLOG) && escrowReady && payload && sessionRef.current) {
				const sealed = parse(payload);
				if (!sealed) return;
				open(sealed, "mod", sessionRef.current.escrow).then((entry) => {
					if (entry && typeof entry.key === "string" && typeof entry.before === "string") addLog(entry);
				});
			}
		};
		const connect = () => {
			window.clearTimeout(timer);
			setStatus("Connecting…");
			setOnline(false);
			const sock = new BunnySocket(BROKER, `bunny-${me.id}-${Math.random().toString(36).slice(2, 6)}`, T.PRESENCE + me.id, topics, () => {
				retry = 0;
				connectedAtRef.current = Date.now();
				setOnline(true);
				setStatus("Live");
				publishPresence();
				if (sess) sock.publish(T.ADMINS + me.id, JSON.stringify(sess.cert), true);
				window.clearInterval(beat);
				beat = window.setInterval(() => {
					publishPresence();
					flushPeople();
				}, 12e3);
				window.clearTimeout(guardTimer);
				guardTimer = window.setTimeout(() => {
					for (const [topic, cached] of Object.entries(guardCache)) if (!guardLatest.has(topic)) sock.publish(topic, cached, true);
				}, 6e3 + Math.random() * 3e3);
			}, onPublish, (reason) => {
				setOnline(false);
				setStatus(reason);
				window.clearInterval(beat);
				if (socketRef.current === sock) {
					timer = window.setTimeout(connect, Math.min(8e3, 1200 + retry * 800));
					retry += 1;
				}
			});
			socketRef.current = sock;
			sock.start();
		};
		connect();
		const onVisible = () => {
			if (!document.hidden && viewRef.current.tab === "server") setServerUnread(0);
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			window.clearTimeout(timer);
			window.clearTimeout(guardTimer);
			window.clearInterval(beat);
			document.removeEventListener("visibilitychange", onVisible);
			const sock = socketRef.current;
			socketRef.current = null;
			sock?.publish(T.PRESENCE + me.id, "", true);
			sock?.stop();
		};
	}, [
		loaded,
		myId,
		escrowReady,
		addLog,
		notify
	]);
	(0, import_react.useEffect)(() => {
		const me = idRef.current;
		const sock = socketRef.current;
		if (!me || !sock || !online) return;
		const ts = Date.now();
		(async () => {
			const body = {
				id: me.id,
				name: profile.name,
				color: profile.color,
				avatar: profile.avatar,
				anim: profile.anim,
				bio: profile.bio || void 0,
				status: settings.status,
				box: {
					x: me.box.x,
					y: me.box.y
				},
				ts,
				at: ts
			};
			if (sessionRef.current) body.sig = await signText(me.sign, `${me.id}\n${ts}`);
			sock.publish(T.PRESENCE + me.id, JSON.stringify(body), true);
		})();
	}, [
		profile,
		settings.status,
		online
	]);
	const verifyCache = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			const next = {};
			const check = async (k, claim, text, sig) => {
				let ok = verifyCache.current.get(k);
				if (ok === void 0) {
					ok = await verifyText(claim.sign, text, sig);
					verifyCache.current.set(k, ok);
				}
				if (ok) next[k] = true;
			};
			for (const m of messages) {
				const claim = admins[m.authorId];
				if (claim && m.sig) await check(`m:${m.id}:${m.sig}`, claim, msgSigText(m), m.sig);
			}
			for (const p of people) {
				const claim = admins[p.id];
				if (claim && p.sig && p.ts) await check(`p:${p.id}:${p.sig}`, claim, `${p.id}\n${p.ts}`, p.sig);
			}
			if (alive) setVerified(next);
		})();
		return () => {
			alive = false;
		};
	}, [
		messages,
		people,
		admins
	]);
	const isAdminMsg = (0, import_react.useCallback)((m) => !!m.sig && !!verified[`m:${m.id}:${m.sig}`], [verified]);
	const isAdminPerson = (0, import_react.useCallback)((id) => {
		const p = people.find((x) => x.id === id);
		return !!p?.sig && !!verified[`p:${p.id}:${p.sig}`];
	}, [people, verified]);
	const isBanned = (0, import_react.useCallback)((id) => bans[id]?.kind === "ban" && !admins[id], [bans, admins]);
	const setView = (0, import_react.useCallback)((next) => {
		setViewState(next);
		if (next.tab === "server") setServerUnread(0);
		if (next.tab === "direct" && next.peer) setLastRead((prev) => ({
			...prev,
			[next.peer]: Date.now()
		}));
	}, []);
	(0, import_react.useEffect)(() => {
		if (view.tab === "direct" && view.peer) {
			const peer = view.peer;
			if (Object.values(dms).reduce((max, d) => d.from === peer && d.at > max ? d.at : max, 0) > (lastRead[peer] || 0)) setLastRead((prev) => ({
				...prev,
				[peer]: Date.now()
			}));
		}
	}, [
		dms,
		view,
		lastRead
	]);
	const lookup = (0, import_react.useCallback)((id) => {
		const p = people.find((x) => x.id === id);
		const f = friends[id] || contacts[id];
		const d = directory[id];
		return {
			id,
			name: p?.name || f?.name || d?.name || "Guest",
			color: p?.color || f?.color || d?.color || colorFor(id),
			avatar: p?.avatar || f?.avatar || d?.avatar,
			bio: p?.bio,
			status: p ? p.status || "online" : void 0,
			online: !!p,
			box: p?.box || f?.box,
			anim: p?.anim && (admins[id] || perks[id]?.animated) ? p.anim : void 0,
			role: perks[id]?.role || null
		};
	}, [
		people,
		friends,
		contacts,
		directory,
		admins,
		perks
	]);
	const publish = (topic, payload, retained) => socketRef.current?.publish(topic, payload, retained);
	const sealLog = async (entry) => {
		const sealed = await seal({ mod: ESCROW_BOX_PUB }, entry);
		publish(T.MODLOG + randomId(10), JSON.stringify(sealed), true);
	};
	const sendMessage = (0, import_react.useCallback)(async (text, replyTo, media) => {
		const me = idRef.current;
		const clean = text.trim().slice(0, 2e3);
		if (!me || !clean && !media?.length || !socketRef.current) return false;
		const r = roomRef.current;
		const staff = !!sessionRef.current;
		if (r?.locked && !staff) {
			setToast("Chat is locked by an admin");
			return false;
		}
		if (r?.slowmode && !staff) {
			const wait = lastSendRef.current + r.slowmode * 1e3 - Date.now();
			if (wait > 0) {
				setToast(`Slowmode is on. Wait ${Math.ceil(wait / 1e3)}s`);
				return false;
			}
		}
		lastSendRef.current = Date.now();
		const msg = {
			id: `${Date.now().toString(36)}${randomId(3)}`.slice(0, 24),
			authorId: me.id,
			name: profileRef.current.name,
			text: clean,
			at: Date.now(),
			replyTo: replyTo ? {
				id: replyTo.id,
				name: replyTo.name,
				text: replyTo.text.slice(0, 120) || "Attachment"
			} : void 0,
			media: media?.length ? media : void 0
		};
		if (sessionRef.current) msg.sig = await signText(me.sign, msgSigText(msg));
		const body = JSON.stringify(msg);
		setPending((cur) => ({
			...cur,
			[msg.id]: msg
		}));
		window.setTimeout(() => {
			setPending((cur) => {
				if (!cur[msg.id]) return cur;
				setToast("A message didn't send. Check your connection");
				const next = { ...cur };
				delete next[msg.id];
				return next;
			});
		}, 15e3);
		publish(T.HISTORY + msg.id, body, true);
		publish(T.CHAT, body, false);
		return true;
	}, []);
	const editMessage = (0, import_react.useCallback)(async (msg, text) => {
		const me = idRef.current;
		const clean = text.trim().slice(0, 2e3);
		if (!me || !clean || clean === msg.text) return;
		const next = {
			...msg,
			text: clean,
			name: msg.authorId === me.id ? profileRef.current.name : msg.name,
			editedAt: Date.now()
		};
		if (msg.authorId === me.id) {
			if (sessionRef.current) next.sig = await signText(me.sign, msgSigText(next));
			else delete next.sig;
		}
		publish(T.HISTORY + msg.id, JSON.stringify(next), true);
		sealLog({
			key: `edit:${msg.id}:${next.editedAt}`,
			kind: "edit",
			scope: "server",
			msgId: msg.id,
			authorId: msg.authorId,
			authorName: msg.name,
			before: msg.text,
			after: clean,
			actorId: me.id,
			actorName: profileRef.current.name,
			at: next.editedAt
		});
	}, []);
	const deleteMessage = (0, import_react.useCallback)((msg) => {
		const me = idRef.current;
		if (!me) return;
		publish(T.HISTORY + msg.id, "", true);
		for (const m of msg.media || []) for (let i = 0; i < m.n; i++) publish(T.MEDIA + m.id + "/" + i, "", true);
		sealLog({
			key: `del:${msg.id}`,
			kind: "delete",
			scope: "server",
			msgId: msg.id,
			authorId: msg.authorId,
			authorName: msg.name,
			before: msg.text || (msg.media?.length ? `[${msg.media.length} attachment${msg.media.length > 1 ? "s" : ""}]` : ""),
			actorId: me.id,
			actorName: profileRef.current.name,
			at: Date.now()
		});
		setToast("Message deleted");
	}, []);
	const react = (0, import_react.useCallback)((msg, emoji) => {
		const me = idRef.current;
		if (!me) return;
		const current = { ...msg.reactions || {} };
		const ids = new Set(current[emoji] || []);
		if (ids.has(me.id)) ids.delete(me.id);
		else ids.add(me.id);
		if (ids.size) current[emoji] = [...ids];
		else delete current[emoji];
		publish(T.HISTORY + msg.id, JSON.stringify({
			...msg,
			reactions: current
		}), true);
	}, []);
	const pingTyping = (0, import_react.useCallback)(() => {
		const me = idRef.current;
		if (!me || !settingsRef.current.sendTyping) return;
		const now = Date.now();
		if (now - lastTypingRef.current < 2500) return;
		lastTypingRef.current = now;
		publish(T.TYPING, JSON.stringify({
			id: me.id,
			name: profileRef.current.name,
			at: now
		}), false);
	}, []);
	const saveProfile = (0, import_react.useCallback)((next) => {
		const name = cleanName(next.name);
		if (name.length < 2) return false;
		const p = {
			name,
			avatar: next.avatar,
			anim: next.anim,
			bio: next.bio.slice(0, 80),
			color: safeColor(next.color, idRef.current?.id || "x")
		};
		if (p.anim) ls.set("bunny_anim", p.anim);
		else localStorage.removeItem("bunny_anim");
		localStorage.setItem("bunny_name", p.name);
		if (p.avatar) localStorage.setItem("bunny_avatar", p.avatar);
		else localStorage.removeItem("bunny_avatar");
		localStorage.setItem("bunny_bio", p.bio);
		localStorage.setItem("bunny_color", p.color);
		setProfile(p);
		return true;
	}, []);
	const updateSettings = (0, import_react.useCallback)((patch) => setSettings((s) => ({
		...s,
		...patch
	})), []);
	const requestFriend = (0, import_react.useCallback)((id) => {
		const me = idRef.current;
		if (!me || id === me.id) return;
		const p = profileRef.current;
		setOutgoing((prev) => ({
			...prev,
			[id]: Date.now()
		}));
		publish(T.INBOX + id + "/fr-" + me.id, JSON.stringify({
			t: "fr",
			from: me.id,
			name: p.name,
			color: p.color,
			box: {
				x: me.box.x,
				y: me.box.y
			},
			at: Date.now()
		}), true);
		setToast("Friend request sent");
	}, []);
	const acceptFriend = (0, import_react.useCallback)((req) => {
		const me = idRef.current;
		if (!me) return;
		setFriends((prev) => ({
			...prev,
			[req.from]: {
				id: req.from,
				name: req.name,
				color: req.color,
				box: req.box,
				since: Date.now()
			}
		}));
		setRequests((prev) => {
			const next = { ...prev };
			delete next[req.from];
			return next;
		});
		const p = profileRef.current;
		publish(T.INBOX + req.from + "/fa-" + me.id, JSON.stringify({
			t: "fa",
			from: me.id,
			name: p.name,
			color: p.color,
			box: {
				x: me.box.x,
				y: me.box.y
			},
			at: Date.now()
		}), true);
		publish(T.INBOX + me.id + "/fr-" + req.from, "", true);
		setToast(`You and ${req.name} are now friends`);
	}, []);
	const declineFriend = (0, import_react.useCallback)((req) => {
		const me = idRef.current;
		if (!me) return;
		setRequests((prev) => {
			const next = { ...prev };
			delete next[req.from];
			return next;
		});
		publish(T.INBOX + me.id + "/fr-" + req.from, "", true);
	}, []);
	const removeFriend = (0, import_react.useCallback)((id) => {
		setFriends((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setOutgoing((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	}, []);
	const toggleBlock = (0, import_react.useCallback)((id) => {
		setBlocked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	}, []);
	/** Remember someone as a DM contact so they show up in Direct. */
	const openDirect = (0, import_react.useCallback)((id) => {
		const info = lookup(id);
		if (info.box && !friends[id] && !contacts[id]) setContacts((prev) => ({
			...prev,
			[id]: {
				id,
				name: info.name,
				color: info.color,
				avatar: info.avatar,
				box: info.box,
				since: Date.now()
			}
		}));
		setView({
			tab: "direct",
			peer: id
		});
	}, [
		lookup,
		friends,
		contacts,
		setView
	]);
	const sendDirect = (0, import_react.useCallback)(async (peer, text, media) => {
		const me = idRef.current;
		const clean = text.trim().slice(0, 2e3);
		if (!me || !clean && !media?.length) return false;
		const info = lookup(peer);
		if (!info.box) {
			setToast("They need to come online once before you can message them");
			return false;
		}
		const at = Date.now();
		const id = `${at.toString(36)}${randomId(4)}`.slice(0, 24);
		const p = profileRef.current;
		const env = await seal({
			[me.id]: {
				x: me.box.x,
				y: me.box.y
			},
			[peer]: info.box,
			mod: ESCROW_BOX_PUB
		}, {
			text: clean,
			name: p.name,
			color: p.color,
			media
		});
		const body = JSON.stringify({
			t: "dm",
			id,
			from: me.id,
			to: peer,
			at,
			fb: {
				x: me.box.x,
				y: me.box.y
			},
			env
		});
		publish(T.INBOX + peer + "/dm-" + id, body, true);
		publish(T.INBOX + me.id + "/dm-" + id, body, true);
		seenDmRef.current.add(id);
		setDms((prev) => ({
			...prev,
			[id]: {
				id,
				from: me.id,
				to: peer,
				at,
				text: clean,
				name: p.name,
				color: p.color,
				media
			}
		}));
		if (!friends[peer] && !contacts[peer]) setContacts((prev) => ({
			...prev,
			[peer]: {
				id: peer,
				name: info.name,
				color: info.color,
				avatar: info.avatar,
				box: info.box,
				since: at
			}
		}));
		return true;
	}, [
		lookup,
		friends,
		contacts
	]);
	const editDirect = (0, import_react.useCallback)(async (dm, text) => {
		const me = idRef.current;
		const clean = text.trim().slice(0, 2e3);
		if (!me || dm.from !== me.id || clean === dm.text || !clean && !dm.media?.length) return false;
		const info = lookup(dm.to);
		if (!info.box) {
			setToast("Can't edit until they've been online again");
			return false;
		}
		const editedAt = Date.now();
		const p = profileRef.current;
		const env = await seal({
			[me.id]: {
				x: me.box.x,
				y: me.box.y
			},
			[dm.to]: info.box,
			mod: ESCROW_BOX_PUB
		}, {
			text: clean,
			name: p.name,
			color: p.color,
			media: dm.media,
			editedAt
		});
		const body = JSON.stringify({
			t: "dm",
			id: dm.id,
			from: me.id,
			to: dm.to,
			at: dm.at,
			fb: {
				x: me.box.x,
				y: me.box.y
			},
			env
		});
		publish(T.INBOX + dm.to + "/dm-" + dm.id, body, true);
		publish(T.INBOX + me.id + "/dm-" + dm.id, body, true);
		setDms((prev) => ({
			...prev,
			[dm.id]: {
				...dm,
				text: clean,
				editedAt
			}
		}));
		sealLog({
			key: `dmedit:${dm.id}:${editedAt}`,
			kind: "edit",
			scope: "direct",
			msgId: dm.id,
			authorId: dm.from,
			authorName: dm.name,
			before: dm.text,
			after: clean,
			actorId: me.id,
			actorName: p.name,
			at: editedAt
		});
		return true;
	}, [lookup]);
	const unsendDirect = (0, import_react.useCallback)((dm) => {
		const me = idRef.current;
		if (!me || dm.from !== me.id) return;
		publish(T.INBOX + dm.to + "/dm-" + dm.id, "", true);
		publish(T.INBOX + dm.from + "/dm-" + dm.id, "", true);
		for (const m of dm.media || []) for (let i = 0; i < m.n; i++) publish(T.MEDIA + m.id + "/" + i, "", true);
		setDms((prev) => {
			const next = { ...prev };
			delete next[dm.id];
			return next;
		});
		sealLog({
			key: `dmdel:${dm.id}`,
			kind: "delete",
			scope: "direct",
			msgId: dm.id,
			authorId: dm.from,
			authorName: dm.name,
			before: dm.text || (dm.media?.length ? "[attachment]" : ""),
			actorId: me.id,
			actorName: profileRef.current.name,
			at: Date.now()
		});
	}, []);
	const ackWarning = (0, import_react.useCallback)((id) => {
		acksRef.current = [...acksRef.current, id].slice(-200);
		if (idRef.current) ls.set(`bunny_acks_${idRef.current.id}`, acksRef.current);
		setWarnings((prev) => prev.filter((w) => w.id !== id));
	}, []);
	const token = (0, import_react.useMemo)(() => identity ? identityToToken(identity) : "", [identity]);
	const restoreFromToken = (0, import_react.useCallback)((value) => {
		const next = tokenToIdentity(value);
		if (!next) return false;
		saveIdentity(next);
		window.location.reload();
		return true;
	}, []);
	const modPublish = (0, import_react.useCallback)(async (topic, payload, retained = true) => {
		const me = idRef.current;
		const sess = sessionRef.current;
		if (!me || !sess) return false;
		const rec = await signRecord(me.sign, sess.cert, payload);
		publish(topic, JSON.stringify(rec), retained);
		return true;
	}, []);
	const flashAll = (0, import_react.useCallback)(async (text, style = "m") => {
		const me = idRef.current;
		const clean = text.trim().slice(0, 200);
		if (!me || !clean) return false;
		const rec = {
			kind: "flash",
			id: randomId(6),
			style,
			text: clean,
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		return modPublish(T.MOD + "flash", rec, false);
	}, [modPublish]);
	const kick = (0, import_react.useCallback)(async (target, targetName, reason) => {
		const me = idRef.current;
		if (!me || target === me.id) return;
		const rec = {
			kind: "kick",
			target,
			targetName,
			reason: reason.slice(0, 200),
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.MOD + "kick", rec, false)) setToast(`${targetName} was kicked`);
	}, [modPublish]);
	const setRoomControls = (0, import_react.useCallback)(async (patch) => {
		const me = idRef.current;
		if (!me) return;
		const cur = roomRef.current;
		const rec = {
			kind: "room",
			slowmode: patch.slowmode ?? cur?.slowmode ?? 0,
			locked: patch.locked ?? cur?.locked ?? false,
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.MOD + "room", rec)) setToast(patch.locked !== void 0 ? rec.locked ? "Chat locked" : "Chat unlocked" : rec.slowmode ? `Slowmode set to ${rec.slowmode}s` : "Slowmode off");
	}, [modPublish]);
	/** Admin: delete the newest n server messages (logged like any delete). */
	const clearRecent = (0, import_react.useCallback)((n) => {
		const me = idRef.current;
		if (!me) return 0;
		const list = [...msgMapRef.current.values()].sort((a, b) => b.at - a.at).slice(0, Math.max(1, Math.min(100, n)));
		for (const msg of list) {
			publish(T.HISTORY + msg.id, "", true);
			for (const m of msg.media || []) for (let i = 0; i < m.n; i++) publish(T.MEDIA + m.id + "/" + i, "", true);
			sealLog({
				key: `del:${msg.id}`,
				kind: "delete",
				scope: "server",
				msgId: msg.id,
				authorId: msg.authorId,
				authorName: msg.name,
				before: msg.text || "[attachment]",
				actorId: me.id,
				actorName: profileRef.current.name,
				at: Date.now()
			});
		}
		setToast(`Cleared ${list.length} message${list.length === 1 ? "" : "s"}`);
		return list.length;
	}, []);
	const uploadMedia = (0, import_react.useCallback)(async (items, encrypt, onProgress) => {
		const packed = await Promise.all(items.map((p) => packMedia(p, encrypt)));
		const total = packed.reduce((n, p) => n + p.chunks.length, 0);
		let done = 0;
		for (const { ref, chunks } of packed) for (let i = 0; i < chunks.length; i++) {
			if (!socketRef.current?.connected) throw new Error("Lost connection while uploading");
			publish(T.MEDIA + ref.id + "/" + i, chunks[i], true);
			done += 1;
			onProgress?.(done, total);
			await new Promise((r) => setTimeout(r, 25));
		}
		return packed.map((p) => p.ref);
	}, []);
	const mediaCache = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const loadMedia = (0, import_react.useCallback)((ref) => {
		const hit = mediaCache.current.get(ref.id);
		if (hit) return hit;
		const job = new Promise((resolve, reject) => {
			const topic = T.MEDIA + ref.id + "/+";
			const wait = {
				chunks: new Array(ref.n).fill(void 0),
				got: 0,
				done: (ok) => {
					window.clearTimeout(timer);
					mediaWaitRef.current.delete(ref.id);
					socketRef.current?.unwatch(topic);
					if (!ok) return reject(/* @__PURE__ */ new Error("Attachment unavailable"));
					unpackMedia(ref, wait.chunks).then(resolve, reject);
				}
			};
			const timer = window.setTimeout(() => wait.done(false), 3e4);
			mediaWaitRef.current.set(ref.id, wait);
			const start = () => {
				if (socketRef.current?.connected) socketRef.current.watch(topic);
				else window.setTimeout(start, 500);
			};
			start();
		});
		job.catch(() => mediaCache.current.delete(ref.id));
		mediaCache.current.set(ref.id, job);
		return job;
	}, []);
	const ban = (0, import_react.useCallback)(async (target, targetName, reason, kind = "ban") => {
		const me = idRef.current;
		if (!me || target === me.id) return;
		const rec = {
			kind,
			target,
			targetName,
			reason: reason.slice(0, 200),
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.MOD + "ban-" + target, rec)) setToast(kind === "ban" ? `${targetName} was banned` : `${targetName} was unbanned`);
	}, [modPublish]);
	const warn = (0, import_react.useCallback)(async (target, targetName, reason) => {
		const me = idRef.current;
		if (!me) return;
		const id = randomId(6);
		const rec = {
			kind: "warn",
			id,
			target,
			targetName,
			reason: reason.slice(0, 300),
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.INBOX + target + "/warn-" + id, rec)) setToast(`Warning sent to ${targetName}`);
	}, [modPublish]);
	const setGlobalWallpaper = (0, import_react.useCallback)(async (modeName, value, media) => {
		const me = idRef.current;
		if (!me) return;
		if (modeName === "image" && !safeWallpaperUrl(value)) {
			setToast("That image link won't work. Use an https:// image");
			return;
		}
		const rec = {
			kind: "wallpaper",
			mode: modeName,
			value,
			media,
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.MOD + "wallpaper", rec)) setToast(modeName === "default" ? "Wallpaper reset for everyone" : "Wallpaper updated for everyone");
	}, [modPublish]);
	const setAnnouncement = (0, import_react.useCallback)(async (text) => {
		const me = idRef.current;
		if (!me) return;
		const rec = {
			kind: "announce",
			text: text.trim().slice(0, 240),
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.MOD + "announce", rec)) setToast(rec.text ? "Announcement posted" : "Announcement cleared");
	}, [modPublish]);
	const setPerk = (0, import_react.useCallback)(async (target, targetName, animated, role) => {
		const me = idRef.current;
		if (!me) return;
		const rec = {
			kind: "perk",
			target,
			targetName,
			animated,
			role: cleanRole(role),
			at: Date.now(),
			by: me.id,
			byName: profileRef.current.name
		};
		if (await modPublish(T.MOD + "perk-" + target, rec)) setToast(target === me.id ? "Your tag was updated" : `Updated perks for ${targetName}`);
	}, [modPublish]);
	/** Admins always get animated avatars; others need a perk from an admin. */
	const canAnimate = (0, import_react.useCallback)((id) => !!admins[id] || !!perks[id]?.animated, [admins, perks]);
	const roleOf = (0, import_react.useCallback)((id) => perks[id]?.role || null, [perks]);
	const allMessages = (0, import_react.useMemo)(() => {
		const extra = Object.values(pending).filter((m) => !messages.some((x) => x.id === m.id));
		if (!extra.length) return messages;
		return [...messages, ...extra.map((m) => ({
			...m,
			pending: true
		}))].sort((a, b) => a.at - b.at);
	}, [messages, pending]);
	const conversations = (0, import_react.useMemo)(() => {
		if (!identity) return [];
		const map = /* @__PURE__ */ new Map();
		for (const id of [...Object.keys(friends), ...Object.keys(contacts)]) map.set(id, {
			peer: id,
			unread: 0
		});
		for (const dm of Object.values(dms)) {
			const peer = dm.from === identity.id ? dm.to : dm.from;
			if (blocked.includes(peer)) continue;
			const entry = map.get(peer) || {
				peer,
				unread: 0
			};
			if (!entry.last || dm.at > entry.last.at) entry.last = dm;
			if (dm.from === peer && dm.at > (lastRead[peer] || 0) && !(view.tab === "direct" && view.peer === peer)) entry.unread += 1;
			map.set(peer, entry);
		}
		return [...map.values()].filter((c) => !blocked.includes(c.peer)).sort((a, b) => (b.last?.at || 0) - (a.last?.at || 0) || lookup(a.peer).name.localeCompare(lookup(b.peer).name));
	}, [
		identity,
		friends,
		contacts,
		dms,
		lastRead,
		view,
		blocked,
		lookup
	]);
	return {
		adminMode,
		loaded,
		identity,
		token,
		profile,
		settings,
		session,
		online,
		status,
		messages: allMessages,
		people,
		admins,
		bans,
		wallpaper,
		announce,
		typing,
		friends,
		contacts,
		requests,
		outgoing,
		blocked,
		dms,
		warnings,
		allDms,
		logs,
		warnsIssued,
		directory,
		view,
		serverUnread,
		directUnread: conversations.reduce((n, c) => n + c.unread, 0) + Object.keys(requests).length,
		conversations,
		toast,
		say,
		setView,
		lookup,
		isAdminMsg,
		isAdminPerson,
		isBanned,
		sendMessage,
		editMessage,
		deleteMessage,
		react,
		pingTyping,
		saveProfile,
		updateSettings,
		requestFriend,
		acceptFriend,
		declineFriend,
		removeFriend,
		toggleBlock,
		openDirect,
		sendDirect,
		unsendDirect,
		editDirect,
		ackWarning,
		restoreFromToken,
		ban,
		warn,
		setGlobalWallpaper,
		setAnnouncement,
		room,
		perks,
		setPerk,
		canAnimate,
		roleOf,
		flash,
		clearFlash: () => setFlash(null),
		kicked,
		modHistory,
		flashAll,
		kick,
		setRoomControls,
		clearRecent,
		uploadMedia,
		loadMedia
	};
}
/** The platform mark: a rounded five-point star. */
function StarMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className,
		fill: "currentColor",
		stroke: "currentColor",
		strokeWidth: "1.2",
		strokeLinejoin: "round",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.86 6.5 19.75l1.05-6.12L3.1 9.3l6.15-.9z" })
	});
}
/** Lets avatars fetch animated pictures without threading the loader everywhere. */
var MediaLoader = (0, import_react.createContext)(null);
function useMediaUrl(ref) {
	const load = (0, import_react.useContext)(MediaLoader);
	const [url, setUrl] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setUrl(null);
		if (!ref || !load) return;
		let alive = true;
		load(ref).then((u) => alive && setUrl(u), () => void 0);
		return () => {
			alive = false;
		};
	}, [ref?.id, load]);
	return url;
}
function Face({ avatar, anim, color, label, status, size }) {
	const animUrl = useMediaUrl(anim);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `avatar ${animUrl ? "animated" : ""}`,
		style: {
			background: `radial-gradient(circle at 32% 25%, color-mix(in srgb, ${color} 70%, white), ${color} 70%)`,
			...size ? {
				width: size,
				height: size
			} : {}
		},
		role: "img",
		"aria-label": label,
		children: [animUrl && anim?.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src: animUrl,
			autoPlay: true,
			muted: true,
			loop: true,
			playsInline: true
		}) : animUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: animUrl,
			alt: ""
		}) : avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: avatar,
			alt: ""
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarMark, {}), status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
			className: `dot ${status}`,
			"aria-hidden": true
		}) : null]
	});
}
/** Admin tag (default gold) or a custom role tag chosen by an admin. */
function RoleBadge({ role, admin }) {
	if (!role && !admin) return null;
	if (!role) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminTag, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `tag custom ${admin ? "admin" : ""}`,
		style: {
			background: role.color,
			color: inkFor(role.color)
		},
		title: admin ? "Verified admin" : "Role",
		children: role.text
	});
}
function AdminTag() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "tag",
		title: "Verified Bunny RTC admin",
		children: "Admin"
	});
}
function Toggle({ on, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "switch",
		"aria-checked": on,
		"aria-label": label,
		className: "toggle",
		onClick: () => onChange(!on)
	});
}
function Choices({ value, options, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "choices",
		role: "group",
		"aria-label": label,
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-pressed": value === o.value,
			onClick: () => onChange(o.value),
			children: o.label
		}, o.value))
	});
}
/** A floating glass menu anchored at a point, kept inside the viewport. */
function Floating({ x, y, onClose, children, className = "menu lg" }) {
	const ref = (0, import_react.useRef)(null);
	const [pos, setPos] = (0, import_react.useState)({
		left: x,
		top: y
	});
	(0, import_react.useLayoutEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const pad = 10;
		setPos({
			left: Math.max(pad, Math.min(x, window.innerWidth - el.offsetWidth - pad)),
			top: Math.max(pad, Math.min(y, window.innerHeight - el.offsetHeight - pad))
		});
	}, [
		x,
		y,
		children
	]);
	(0, import_react.useEffect)(() => {
		const onDown = (e) => {
			if (ref.current && !ref.current.contains(e.target)) onClose();
		};
		const onKey = (e) => e.key === "Escape" && onClose();
		const t = window.setTimeout(() => {
			document.addEventListener("mousedown", onDown);
			document.addEventListener("touchstart", onDown);
		}, 0);
		document.addEventListener("keydown", onKey);
		return () => {
			window.clearTimeout(t);
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("touchstart", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [onClose]);
	const node = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className,
		style: pos,
		role: "menu",
		children
	});
	const host = typeof document !== "undefined" ? document.querySelector(".stage") : null;
	return host ? (0, import_react_dom.createPortal)(node, host) : node;
}
async function shrinkImage(file, size = 128) {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(/* @__PURE__ */ new Error("bad image"));
			el.src = url;
		});
		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		const scale = Math.max(size / img.width, size / img.height);
		const w = img.width * scale;
		const h = img.height * scale;
		ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
		return canvas.toDataURL("image/jpeg", .78);
	} finally {
		URL.revokeObjectURL(url);
	}
}
/** Downscale a wallpaper to something the relay can carry (~<450 KB). */
async function shrinkWallpaper(file) {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(/* @__PURE__ */ new Error("bad image"));
			el.src = url;
		});
		for (const [max, q] of [
			[1920, .72],
			[1600, .66],
			[1280, .62],
			[1024, .58]
		]) {
			const scale = Math.min(1, max / Math.max(img.width, img.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(img.width * scale);
			canvas.height = Math.round(img.height * scale);
			const ctx = canvas.getContext("2d");
			if (!ctx) return null;
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const data = canvas.toDataURL("image/jpeg", q);
			if (data.length < 45e4) return data;
		}
		return null;
	} finally {
		URL.revokeObjectURL(url);
	}
}
function timeLabel(ts, h24) {
	return new Intl.DateTimeFormat(void 0, {
		hour: "numeric",
		minute: "2-digit",
		hour12: !h24
	}).format(ts);
}
function dayLabel(ts) {
	return new Intl.DateTimeFormat(void 0, {
		weekday: "long",
		month: "long",
		day: "numeric"
	}).format(ts);
}
function ago(ts) {
	const s = Math.max(1, Math.round((Date.now() - ts) / 1e3));
	if (s < 60) return "now";
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	if (s < 86400) return `${Math.floor(s / 3600)}h`;
	return `${Math.floor(s / 86400)}d`;
}
function MediaItem({ media, load, single, onOpen }) {
	const [url, setUrl] = (0, import_react.useState)(null);
	const [failed, setFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let alive = true;
		load(media).then((u) => alive && setUrl(u), () => alive && setFailed(true));
		return () => {
			alive = false;
		};
	}, [media, load]);
	const ratio = media.w && media.h ? `${media.w} / ${media.h}` : "16 / 10";
	const style = single ? {
		aspectRatio: ratio,
		maxWidth: media.w && media.h && media.h > media.w ? "16rem" : "26rem"
	} : {};
	if (failed) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "media-cell media-missing",
		style,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageOff, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Attachment unavailable" })]
	});
	if (!url) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "media-cell media-loading",
		style,
		"aria-label": "Loading attachment",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			size: 20,
			className: "animate-spin"
		})
	});
	if (media.kind === "video") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "media-cell",
		style,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src: url,
			controls: true,
			playsInline: true,
			preload: "metadata"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "media-cell",
		style,
		onClick: () => onOpen(url),
		"aria-label": `Open ${media.name || "image"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: media.name || "Shared image",
			loading: "lazy"
		})
	});
}
function MediaGrid({ media, load }) {
	const [open, setOpen] = (0, import_react.useState)(null);
	const single = media.length === 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `media-grid ${single ? "one" : ""}`,
		children: media.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaItem, {
			media: m,
			load,
			single,
			onOpen: setOpen
		}, m.id))
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbox, {
		url: open,
		onClose: () => setOpen(null)
	}) : null] });
}
function Lightbox({ url, onClose }) {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);
	const node = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lightbox",
		onClick: onClose,
		role: "dialog",
		"aria-label": "Image viewer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: "",
			onClick: (e) => e.stopPropagation()
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "lightbox-bar",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "gbtn",
				href: url,
				download: "bunny-image",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }), " Save"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "gbtn icon",
				type: "button",
				"aria-label": "Close viewer",
				onClick: onClose,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
			})]
		})]
	});
	const host = document.querySelector(".stage");
	return host ? (0, import_react_dom.createPortal)(node, host) : node;
}
function useAttachments(say) {
	const [items, setItems] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const countRef = (0, import_react.useRef)(0);
	countRef.current = items.length;
	return {
		items,
		busy,
		add: (0, import_react.useCallback)(async (files) => {
			const list = [...files || []];
			if (!list.length) return;
			setBusy(true);
			for (const file of list) {
				if (countRef.current >= 4) {
					say(`Up to 4 attachments per message`);
					break;
				}
				try {
					const p = await prepareFile(file);
					countRef.current += 1;
					setItems((prev) => prev.length >= 4 ? prev : [...prev, {
						...p,
						key: Math.random().toString(36).slice(2)
					}]);
				} catch (e) {
					say(e instanceof Error ? e.message : "That file can't be shared");
				}
			}
			setBusy(false);
		}, [say]),
		remove: (0, import_react.useCallback)((key) => {
			setItems((prev) => {
				const hit = prev.find((p) => p.key === key);
				if (hit) URL.revokeObjectURL(hit.preview);
				return prev.filter((p) => p.key !== key);
			});
		}, []),
		clear: (0, import_react.useCallback)(() => setItems([]), [])
	};
}
function AttachTray({ items, onRemove, progress }) {
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "tray",
		children: [items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "tray-item",
			children: [
				p.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: p.preview,
					muted: true,
					playsInline: true
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: p.preview,
					alt: ""
				}),
				p.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tray-kind",
					children: "Video"
				}) : null,
				progress === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "tray-x",
					type: "button",
					"aria-label": `Remove ${p.name}`,
					onClick: () => onRemove(p.key),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12 })
				}) : null
			]
		}, p.key)), progress !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "tray-progress",
			"aria-live": "polite",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${Math.round(progress * 100)}%` } }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
				"Uploading ",
				Math.round(progress * 100),
				"%"
			] })]
		}) : null]
	});
}
var ACCEPT = "image/*,video/mp4,video/webm,video/quicktime";
var COMMANDS = [
	{
		name: "m",
		args: "<message>",
		help: "Flash a message on everyone's screen for 3 seconds"
	},
	{
		name: "h",
		args: "<message>",
		help: "Show a hint banner at the top for everyone"
	},
	{
		name: "announce",
		args: "<text>",
		help: "Pin an announcement under the top bar"
	},
	{
		name: "unannounce",
		args: "",
		help: "Remove the pinned announcement"
	},
	{
		name: "warn",
		args: "<name> <reason>",
		help: "Send someone a warning they must acknowledge"
	},
	{
		name: "kick",
		args: "<name> [reason]",
		help: "Disconnect someone from the room"
	},
	{
		name: "ban",
		args: "<name> [reason]",
		help: "Ban someone from the server"
	},
	{
		name: "unban",
		args: "<name>",
		help: "Lift a ban"
	},
	{
		name: "slowmode",
		args: "<seconds | off>",
		help: "Limit how often people can send"
	},
	{
		name: "lock",
		args: "",
		help: "Only admins can send messages"
	},
	{
		name: "unlock",
		args: "",
		help: "Let everyone send again"
	},
	{
		name: "clear",
		args: "[count]",
		help: "Delete the newest messages (default 10)"
	},
	{
		name: "wallpaper",
		args: "<preset | url | reset>",
		help: `Change everyone's wallpaper (${Object.keys(PRESETS).join(", ")})`
	}
];
function matchCommands(draft) {
	if (!draft.startsWith("/")) return [];
	const head = draft.slice(1).split(/\s/)[0].toLowerCase();
	if (/\s/.test(draft.slice(1))) return COMMANDS.filter((c) => c.name === head);
	return COMMANDS.filter((c) => c.name.startsWith(head));
}
/** Resolve "<name> rest…" against known people; names may contain spaces. */
function resolveUser(bunny, args) {
	const known = /* @__PURE__ */ new Map();
	for (const k of Object.values(bunny.directory)) known.set(k.id, {
		id: k.id,
		name: k.name
	});
	for (const p of bunny.people) known.set(p.id, {
		id: p.id,
		name: p.name
	});
	const me = bunny.identity?.id;
	const people = [...known.values()].filter((p) => p.id !== me);
	const words = args.trim().split(/\s+/).filter(Boolean);
	if (!words.length) return { error: "Say who: /command <name>" };
	for (let n = words.length; n >= 1; n--) {
		const guess = words.slice(0, n).join(" ").toLowerCase();
		const hits = people.filter((p) => p.name.toLowerCase() === guess || p.id === guess);
		if (hits.length === 1) return {
			user: hits[0],
			rest: words.slice(n).join(" ")
		};
		if (hits.length > 1) return { error: `More than one person is called “${words.slice(0, n).join(" ")}”. Use their user ID.` };
	}
	const first = words[0].toLowerCase();
	const partial = people.filter((p) => p.name.toLowerCase().startsWith(first));
	if (partial.length === 1) return {
		user: partial[0],
		rest: words.slice(1).join(" ")
	};
	if (partial.length > 1) return { error: `“${words[0]}” matches ${partial.length} people. Type more of the name.` };
	return { error: `No one called “${words[0]}” here` };
}
/** Runs an admin slash command. Returns a message for the admin. */
async function runCommand(bunny, input) {
	const body = input.trim().slice(1);
	const name = body.split(/\s/)[0].toLowerCase();
	const args = body.slice(name.length).trim();
	const need = (v, usage) => v ? null : {
		ok: false,
		message: `Usage: ${usage}`
	};
	switch (name) {
		case "m":
		case "h": {
			const miss = need(args, `/${name} <message>`);
			if (miss) return miss;
			await bunny.flashAll(args, name);
			return {
				ok: true,
				message: name === "m" ? "Message flashed to everyone" : "Hint sent"
			};
		}
		case "announce": {
			const miss = need(args, "/announce <text>");
			if (miss) return miss;
			await bunny.setAnnouncement(args);
			return {
				ok: true,
				message: "Announcement posted"
			};
		}
		case "unannounce":
			await bunny.setAnnouncement("");
			return {
				ok: true,
				message: "Announcement cleared"
			};
		case "warn":
		case "kick":
		case "ban":
		case "unban": {
			const r = resolveUser(bunny, args);
			if ("error" in r) return {
				ok: false,
				message: r.error ?? "Who?"
			};
			if (bunny.admins[r.user.id]) return {
				ok: false,
				message: "You can't do that to another admin"
			};
			if (name === "warn") {
				if (!r.rest) return {
					ok: false,
					message: "Usage: /warn <name> <reason>"
				};
				await bunny.warn(r.user.id, r.user.name, r.rest);
			} else if (name === "kick") await bunny.kick(r.user.id, r.user.name, r.rest);
			else if (name === "ban") await bunny.ban(r.user.id, r.user.name, r.rest || "Broke the server rules");
			else await bunny.ban(r.user.id, r.user.name, "", "unban");
			return {
				ok: true,
				message: `${name[0].toUpperCase()}${name.slice(1)}: ${r.user.name}`
			};
		}
		case "slowmode": {
			const v = args.toLowerCase();
			const secs = v === "off" || v === "0" ? 0 : Math.round(Number(v.replace(/s$/, "")));
			if (!Number.isFinite(secs) || secs < 0 || secs > 3600 || !v) return {
				ok: false,
				message: "Usage: /slowmode <seconds | off>"
			};
			await bunny.setRoomControls({ slowmode: secs });
			return {
				ok: true,
				message: secs ? `Slowmode ${secs}s` : "Slowmode off"
			};
		}
		case "lock":
		case "unlock":
			await bunny.setRoomControls({ locked: name === "lock" });
			return {
				ok: true,
				message: name === "lock" ? "Chat locked" : "Chat unlocked"
			};
		case "clear": {
			const n = args ? Math.round(Number(args)) : 10;
			if (!Number.isFinite(n) || n < 1) return {
				ok: false,
				message: "Usage: /clear [count]"
			};
			return {
				ok: true,
				message: `Cleared ${bunny.clearRecent(Math.min(n, 100))} messages`
			};
		}
		case "wallpaper": {
			const v = args.trim();
			if (!v) return {
				ok: false,
				message: "Usage: /wallpaper <preset | url | reset>"
			};
			if (v === "reset" || v === "default") await bunny.setGlobalWallpaper("default");
			else if (PRESETS[v.toLowerCase()]) await bunny.setGlobalWallpaper("preset", v.toLowerCase());
			else if (/^https:\/\//.test(v)) await bunny.setGlobalWallpaper("image", v);
			else return {
				ok: false,
				message: `Pick a preset (${Object.keys(PRESETS).join(", ")}), an https:// link, or reset`
			};
			return {
				ok: true,
				message: "Wallpaper updated"
			};
		}
		default: return {
			ok: false,
			message: `Unknown command /${name}. Type / to see them all.`
		};
	}
}
var QUICK = [
	"🔥",
	"😂",
	"❤️",
	"👍",
	"👀",
	"⭐"
];
var EMOJIS = [
	"😀",
	"😁",
	"😂",
	"🤣",
	"😊",
	"😍",
	"😘",
	"😎",
	"🤩",
	"🥳",
	"😅",
	"😉",
	"🙂",
	"😇",
	"🥰",
	"😋",
	"😜",
	"🤪",
	"🤗",
	"🤔",
	"😐",
	"😴",
	"🤤",
	"😷",
	"🤒",
	"🤯",
	"😱",
	"😭",
	"😤",
	"😡",
	"🤬",
	"💀",
	"👻",
	"👽",
	"🤖",
	"💩",
	"👋",
	"👍",
	"👎",
	"👏",
	"🙌",
	"🙏",
	"💪",
	"✌️",
	"🤞",
	"🤟",
	"👌",
	"🔥",
	"✨",
	"⭐",
	"💯",
	"💥",
	"❤️",
	"🧡",
	"💛",
	"💚",
	"💙",
	"💜",
	"🖤",
	"🤍",
	"💔",
	"🌟",
	"🌙",
	"☀️",
	"🌈",
	"⚡",
	"❄️",
	"🌊",
	"🍀",
	"🌸",
	"🎉",
	"🎊",
	"🎁",
	"🏆",
	"🎵",
	"💬",
	"👀",
	"💤",
	"🚀",
	"💎"
];
function TypingLine({ names }) {
	if (!names.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "typing" });
	const label = names.length === 1 ? `${names[0]} is typing` : names.length === 2 ? `${names[0]} and ${names[1]} are typing` : "Several people are typing";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "typing",
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("i", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {})
		] }), label]
	});
}
function ServerView({ bunny, showSearch, openMenu, composerRef }) {
	const me = bunny.identity?.id || "";
	const [draft, setDraft] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [picker, setPicker] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [editText, setEditText] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	const [replyTo, setReplyTo] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [reactFor, setReactFor] = (0, import_react.useState)(null);
	const [moreEmoji, setMoreEmoji] = (0, import_react.useState)(false);
	const [atBottom, setAtBottom] = (0, import_react.useState)(true);
	const threadRef = (0, import_react.useRef)(null);
	const stickRef = (0, import_react.useRef)(true);
	const banned = bunny.isBanned(me);
	const h24 = bunny.settings.clock24;
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return bunny.messages.filter((m) => {
			if (bunny.blocked.includes(m.authorId)) return false;
			if (!bunny.adminMode && bunny.isBanned(m.authorId)) return false;
			if (q && !(m.text.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))) return false;
			return true;
		});
	}, [bunny, query]);
	const mountedAt = (0, import_react.useRef)(Date.now());
	const firstScroll = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		const el = threadRef.current;
		if (!el || !stickRef.current) return;
		if (firstScroll.current || bunny.settings.reduceMotion) {
			el.scrollTop = el.scrollHeight;
			if (visible.length) firstScroll.current = false;
		} else el.scrollTo({
			top: el.scrollHeight,
			behavior: "smooth"
		});
	}, [visible, bunny.settings.reduceMotion]);
	(0, import_react.useEffect)(() => {
		if (!picker) return;
		const onDown = (event) => {
			const target = event.target;
			if (target?.closest(".picker") || target?.closest("[data-emoji-toggle]")) return;
			setPicker(false);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [picker]);
	const canCommand = bunny.adminMode && !!bunny.session;
	const suggestions = canCommand ? matchCommands(draft) : [];
	const showCommands = suggestions.length > 0 && !draft.includes("\n");
	const staff = !!bunny.session;
	const locked = !!bunny.room?.locked && !staff;
	const slow = staff ? 0 : bunny.room?.slowmode || 0;
	const [cooldownUntil, setCooldownUntil] = (0, import_react.useState)(0);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	(0, import_react.useEffect)(() => {
		if (cooldownUntil <= Date.now()) return;
		const t = window.setInterval(() => setNow(Date.now()), 250);
		return () => window.clearInterval(t);
	}, [cooldownUntil]);
	const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1e3));
	const attach = useAttachments(bunny.say);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [cmdIndex, setCmdIndex] = (0, import_react.useState)(0);
	async function send() {
		if (banned || progress !== null) return;
		if (canCommand && draft.trim().startsWith("/") && !attach.items.length) {
			const res = await runCommand(bunny, draft);
			bunny.say(res.message);
			if (res.ok) setDraft("");
			return;
		}
		if (!draft.trim() && !attach.items.length) return;
		let media;
		if (attach.items.length) try {
			setProgress(0);
			media = await bunny.uploadMedia(attach.items, false, (d, t) => setProgress(d / t));
		} catch (e) {
			bunny.say(e instanceof Error ? e.message : "Upload failed");
			setProgress(null);
			return;
		}
		const ok = await bunny.sendMessage(draft, replyTo || void 0, media);
		setProgress(null);
		if (ok) {
			setDraft("");
			setReplyTo(null);
			attach.clear();
			stickRef.current = true;
			if (slow) {
				setCooldownUntil(Date.now() + slow * 1e3);
				setNow(Date.now());
			}
		}
	}
	const typingNames = Object.entries(bunny.typing).filter(([id]) => !bunny.blocked.includes(id)).map(([, t]) => t.name);
	const count = bunny.people.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `panel lg-panel ${dragging ? "dropping" : ""}`,
		"aria-label": "Server chat",
		onDragOver: (e) => {
			if (!e.dataTransfer.types.includes("Files") || banned || locked) return;
			e.preventDefault();
			setDragging(true);
		},
		onDragLeave: (e) => {
			if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
		},
		onDrop: (e) => {
			e.preventDefault();
			setDragging(false);
			if (!banned && !locked) attach.add(e.dataTransfer.files);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hash",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { size: 18 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grow",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "lounge" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: bunny.online ? `${count} online · everyone shares this room` : bunny.status })]
					}),
					bunny.room?.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "chip warn",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }), " Locked"]
					}) : null,
					bunny.room?.slowmode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "chip",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { size: 12 }),
							" ",
							bunny.room.slowmode,
							"s"
						]
					}) : null
				]
			}),
			showSearch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "search",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 15 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search messages and people",
						"aria-label": "Search messages"
					}),
					query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "tiny",
						type: "button",
						"aria-label": "Clear search",
						onClick: () => setQuery(""),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `thread ${bunny.settings.compact ? "compact" : ""}`,
				ref: threadRef,
				onScroll: (e) => {
					const el = e.currentTarget;
					const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
					stickRef.current = bottom;
					if (bottom !== atBottom) setAtBottom(bottom);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "welcome",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Welcome to Bunny RTC" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Everyone here shares one live room. Click anyone to add them as a friend or send a direct message." })]
					}),
					visible.map((msg, index) => {
						const prev = visible[index - 1];
						const cont = !!prev && prev.authorId === msg.authorId && msg.at - prev.at < 3e5 && dayLabel(prev.at) === dayLabel(msg.at) && !msg.replyTo;
						const showDay = !prev || dayLabel(prev.at) !== dayLabel(msg.at);
						const mine = msg.authorId === me;
						const info = bunny.lookup(msg.authorId);
						const adminMsg = bunny.isAdminMsg(msg);
						const isBanned = bunny.isBanned(msg.authorId);
						const mentioned = !mine && (mentions(msg.text, bunny.profile.name) || !!msg.replyTo && bunny.messages.find((m) => m.id === msg.replyTo.id)?.authorId === me);
						const canDelete = mine || bunny.adminMode && !!bunny.session;
						const open = (e) => openMenu({
							id: msg.authorId,
							x: e.clientX,
							y: e.clientY
						});
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [showDay ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "day",
							children: dayLabel(msg.at)
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: `msg ${cont ? "cont" : ""} ${mentioned ? "mention" : ""} ${isBanned ? "banned" : ""} ${selected === msg.id ? "selected" : ""} ${msg.at > mountedAt.current - 1500 ? mine ? "enter mine-enter" : "enter" : ""} ${msg.pending ? "pending" : ""}`,
							onClick: (e) => {
								if (e.target.closest("button, a, textarea, input")) return;
								setSelected((cur) => cur === msg.id ? null : msg.id);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "face-btn",
									onClick: open,
									"aria-label": `Open ${msg.name}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
										avatar: info.avatar,
										anim: info.anim,
										color: info.color,
										label: msg.name
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: { minWidth: 0 },
									children: [
										msg.replyTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "reply-ref",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerUpLeft, { size: 12 }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: msg.replyTo.name }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: msg.replyTo.text })
											]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "who",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "name",
													style: { color: `color-mix(in srgb, ${info.color} 45%, white)` },
													onClick: open,
													children: msg.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
													role: adminMsg || !bunny.admins[msg.authorId] ? info.role : null,
													admin: adminMsg
												}),
												isBanned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "tag ban",
													children: "Banned"
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "stamp",
													children: timeLabel(msg.at, h24)
												})
											]
										}),
										editing === msg.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "editbox",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
												value: editText,
												maxLength: 2e3,
												autoFocus: true,
												onChange: (e) => setEditText(e.target.value),
												onKeyDown: (e) => {
													if (e.key === "Escape") setEditing(null);
													if (e.key === "Enter" && !e.shiftKey) {
														e.preventDefault();
														bunny.editMessage(msg, editText);
														setEditing(null);
													}
												},
												"aria-label": "Edit message"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "row",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "gbtn sm primary",
													type: "button",
													onClick: () => {
														bunny.editMessage(msg, editText);
														setEditing(null);
													},
													children: "Save"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "gbtn sm",
													type: "button",
													onClick: () => setEditing(null),
													children: "Cancel"
												})]
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text",
											children: [msg.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, {
												text: msg.text,
												selfName: bunny.profile.name
											}) : null, msg.editedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "edited",
												children: " (edited)"
											}) : null]
										}),
										msg.media ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
											media: msg.media,
											load: bunny.loadMedia
										}) : null,
										confirmDelete === msg.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "row",
											style: { marginTop: "0.4rem" },
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "gbtn sm danger",
												type: "button",
												onClick: () => {
													bunny.deleteMessage(msg);
													setConfirmDelete(null);
												},
												children: "Delete"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "gbtn sm",
												type: "button",
												onClick: () => setConfirmDelete(null),
												children: "Keep"
											})]
										}) : null,
										msg.reactions && Object.keys(msg.reactions).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "reacts",
											children: Object.entries(msg.reactions).map(([emoji, ids]) => {
												if (!Array.isArray(ids) || !ids.length || emoji.length > 8) return null;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													className: ids.includes(me) ? "react mine" : "react",
													onClick: () => bunny.react(msg, emoji),
													children: [
														emoji,
														" ",
														ids.length
													]
												}, emoji);
											})
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "msg-slot",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "msg-actions lg-soft",
										role: "toolbar",
										"aria-label": "Message actions",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny",
												type: "button",
												"aria-label": "Add reaction",
												title: "React",
												onClick: (e) => {
													const r = e.currentTarget.getBoundingClientRect();
													setReactFor({
														msg,
														x: r.right - 288,
														y: r.bottom + 6
													});
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmilePlus, { size: 15 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny",
												type: "button",
												"aria-label": "Reply",
												title: "Reply",
												onClick: () => {
													setReplyTo(msg);
													setSelected(null);
													composerRef.current?.focus();
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerUpLeft, { size: 15 })
											}),
											mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny",
												type: "button",
												"aria-label": "Edit message",
												title: "Edit",
												onClick: () => {
													setEditing(msg.id);
													setEditText(msg.text);
													setConfirmDelete(null);
													setSelected(null);
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 15 })
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny",
												type: "button",
												"aria-label": "Copy message",
												title: "Copy text",
												onClick: async () => {
													try {
														await navigator.clipboard.writeText(msg.text);
														bunny.say("Copied");
													} catch {
														bunny.say("Could not copy");
													}
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 15 })
											}),
											canDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny danger",
												type: "button",
												"aria-label": "Delete message",
												title: "Delete",
												onClick: () => setConfirmDelete(msg.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 })
											}) : null
										]
									})
								})
							]
						})] }, msg.id);
					}),
					query && visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "empty",
						children: "Nothing matches that."
					}) : null
				]
			}),
			!atBottom ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "gbtn sm lg",
				type: "button",
				style: {
					position: "absolute",
					right: "1.2rem",
					bottom: "5.6rem",
					zIndex: 3
				},
				onClick: () => {
					const el = threadRef.current;
					if (el) el.scrollTop = el.scrollHeight;
					stickRef.current = true;
					setAtBottom(true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { size: 14 }), " Latest"]
			}) : null,
			reactFor ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Floating, {
				x: reactFor.x,
				y: reactFor.y,
				className: "menu lg react-pop",
				onClose: () => {
					setReactFor(null);
					setMoreEmoji(false);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "quick-row",
					children: [QUICK.map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": `React ${emoji}`,
						onClick: () => {
							bunny.react(reactFor.msg, emoji);
							setReactFor(null);
							setMoreEmoji(false);
						},
						children: emoji
					}, emoji)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "more",
						"aria-label": "More emoji",
						"aria-expanded": moreEmoji,
						onClick: () => setMoreEmoji((v) => !v),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmilePlus, { size: 17 })
					})]
				}), moreEmoji ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid",
					style: { marginTop: "0.35rem" },
					children: EMOJIS.map((emoji, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							bunny.react(reactFor.msg, emoji);
							setReactFor(null);
							setMoreEmoji(false);
						},
						children: emoji
					}, emoji + i))
				}) : null]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingLine, { names: typingNames }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "composer-wrap",
				children: [
					picker ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "picker lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Emoji" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid",
							children: EMOJIS.map((emoji, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setDraft((d) => (d + emoji).slice(0, 2e3)),
								children: emoji
							}, emoji + i))
						})]
					}) : null,
					showCommands ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "cmds lg",
						role: "listbox",
						"aria-label": "Admin commands",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { size: 12 }), " Admin commands"] }), suggestions.slice(0, 8).map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "option",
							"aria-selected": i === Math.min(cmdIndex, suggestions.length - 1),
							className: "cmd",
							onMouseDown: (e) => e.preventDefault(),
							onClick: () => {
								setDraft(`/${c.name} `);
								composerRef.current?.focus();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", { children: [
								"/",
								c.name,
								c.args ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("i", { children: [" ", c.args] }) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.help })]
						}, c.name))]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttachTray, {
						items: attach.items,
						onRemove: attach.remove,
						progress
					}),
					replyTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "replying",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerUpLeft, { size: 13 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Replying to ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: replyTo.name }),
								": ",
								replyTo.text
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "tiny",
								type: "button",
								"aria-label": "Cancel reply",
								onClick: () => setReplyTo(null),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "composer lg",
						onSubmit: (e) => {
							e.preventDefault();
							send();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "gbtn icon",
								type: "button",
								"data-emoji-toggle": true,
								"aria-label": "Emoji",
								"aria-expanded": picker,
								onClick: () => setPicker((v) => !v),
								style: {
									background: "transparent",
									boxShadow: "none"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { size: 20 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "gbtn icon",
								type: "button",
								"aria-label": "Attach images or video",
								title: "Attach images or video",
								disabled: !bunny.online || banned || locked || progress !== null,
								onClick: () => fileRef.current?.click(),
								style: {
									background: "transparent",
									boxShadow: "none"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { size: 19 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: ACCEPT,
								multiple: true,
								hidden: true,
								onChange: (e) => {
									attach.add(e.target.files);
									e.target.value = "";
								}
							}),
							canCommand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "gbtn icon cmd-btn",
								type: "button",
								"aria-label": "Admin commands",
								title: "Admin commands",
								onClick: () => {
									setDraft("/");
									composerRef.current?.focus();
								},
								style: {
									background: "transparent",
									boxShadow: "none"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { size: 18 })
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: composerRef,
								value: draft,
								maxLength: 2e3,
								disabled: !bunny.online || banned || locked || cooldown > 0,
								placeholder: banned ? "You're banned from this server" : locked ? "Chat is locked by an admin" : cooldown > 0 ? `Slowmode: wait ${cooldown}s` : !bunny.online ? "Waiting for the room…" : canCommand ? "Message #lounge, or type / for commands" : "Message #lounge",
								"aria-label": "Message",
								onChange: (e) => {
									setDraft(e.target.value);
									setCmdIndex(0);
									if (e.target.value && !e.target.value.startsWith("/")) bunny.pingTyping();
								},
								onPaste: (e) => {
									const files = [...e.clipboardData.files];
									if (files.length) {
										e.preventDefault();
										attach.add(files);
									}
								},
								onKeyDown: (e) => {
									if (showCommands && !/\s/.test(draft.slice(1))) {
										if (e.key === "ArrowDown" || e.key === "ArrowUp") {
											e.preventDefault();
											const n = Math.min(suggestions.length, 8);
											setCmdIndex((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
											return;
										}
										if (e.key === "Tab" || e.key === "Enter" && suggestions.length && draft.length > 1 && suggestions[0].name !== draft.slice(1).toLowerCase()) {
											e.preventDefault();
											const pick = suggestions[Math.min(cmdIndex, suggestions.length - 1)];
											if (pick) setDraft(`/${pick.name} `);
											return;
										}
									}
									if (e.key === "Escape") {
										setPicker(false);
										setReplyTo(null);
										if (draft.startsWith("/")) setDraft("");
									}
									if (e.key === "ArrowUp" && !draft) {
										const last = [...bunny.messages].reverse().find((m) => m.authorId === me);
										if (last) {
											e.preventDefault();
											setEditing(last.id);
											setEditText(last.text);
										}
									}
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "send",
								type: "submit",
								disabled: !bunny.online || !draft.trim() && !attach.items.length || banned || locked || cooldown > 0 || progress !== null,
								"aria-label": "Send",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
							})
						]
					})
				]
			})
		]
	});
}
function DirectView({ bunny, openMenu }) {
	const me = bunny.identity?.id || "";
	const peer = bunny.view.peer;
	const [draft, setDraft] = (0, import_react.useState)("");
	const listRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const requests = Object.values(bunny.requests);
	const info = peer ? bunny.lookup(peer) : null;
	const thread = (0, import_react.useMemo)(() => {
		if (!peer) return [];
		return Object.values(bunny.dms).filter((d) => d.from === me && d.to === peer || d.from === peer && d.to === me).sort((a, b) => a.at - b.at);
	}, [
		bunny.dms,
		peer,
		me
	]);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [editText, setEditText] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	async function saveEdit(d) {
		if (!editText.trim() && !d.media?.length) return;
		if (editText.trim() === d.text) return setEditing(null);
		if (await bunny.editDirect(d, editText)) setEditing(null);
	}
	const mountedAt = (0, import_react.useRef)(Date.now());
	const lastPeer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = listRef.current;
		if (!el) return;
		if (lastPeer.current !== peer || bunny.settings.reduceMotion) {
			el.scrollTop = el.scrollHeight;
			lastPeer.current = peer;
		} else el.scrollTo({
			top: el.scrollHeight,
			behavior: "smooth"
		});
	}, [
		thread.length,
		peer,
		bunny.settings.reduceMotion
	]);
	(0, import_react.useEffect)(() => {
		if (peer) inputRef.current?.focus();
	}, [peer]);
	const blocked = !!peer && bunny.blocked.includes(peer);
	const banned = bunny.isBanned(me);
	const attach = useAttachments(bunny.say);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	async function send() {
		if (!peer || !draft.trim() && !attach.items.length || progress !== null) return;
		let media;
		if (attach.items.length) try {
			setProgress(0);
			media = await bunny.uploadMedia(attach.items, true, (d, t) => setProgress(d / t));
		} catch (e) {
			bunny.say(e instanceof Error ? e.message : "Upload failed");
			setProgress(null);
			return;
		}
		const ok = await bunny.sendDirect(peer, draft, media);
		setProgress(null);
		if (ok) {
			setDraft("");
			attach.clear();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `direct ${peer ? "has-peer" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "side convos lg-panel",
			"aria-label": "Conversations",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "side-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Direct messages" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "people",
				children: [
					requests.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { marginBottom: "0.6rem" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "group-title",
							style: { margin: "0.2rem 0.5rem 0.45rem" },
							children: ["Friend requests · ", requests.length]
						}), requests.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "req",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
									color: r.color,
									label: r.name,
									avatar: bunny.lookup(r.from).avatar,
									size: "2rem"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "meta",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: r.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["wants to be friends · ", ago(r.at)] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "gbtn sm icon primary",
									type: "button",
									"aria-label": `Accept ${r.name}`,
									onClick: () => bunny.acceptFriend(r),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 15 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "gbtn sm icon",
									type: "button",
									"aria-label": `Decline ${r.name}`,
									onClick: () => bunny.declineFriend(r),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 })
								})
							]
						}, r.from))]
					}) : null,
					bunny.conversations.length === 0 && !requests.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "empty",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { size: 26 }),
							"No conversations yet.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"Tap someone in the Server member list, then choose ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Message" }),
							" or ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Add friend" }),
							"."
						]
					}) : null,
					bunny.conversations.map((c) => {
						const p = bunny.lookup(c.peer);
						const friend = !!bunny.friends[c.peer];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `person ${peer === c.peer ? "active" : ""}`,
							onClick: () => bunny.setView({
								tab: "direct",
								peer: c.peer
							}),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
									avatar: p.avatar,
									anim: p.anim,
									color: p.color,
									label: p.name,
									status: p.online ? p.status : void 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "meta",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [p.name, friend ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tag friend",
										children: "Friend"
									}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "convo-last",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: {
												overflow: "hidden",
												textOverflow: "ellipsis"
											},
											children: c.last ? `${c.last.from === me ? "You: " : ""}${c.last.text || (c.last.media?.[0]?.kind === "video" ? "Sent a video" : "Sent a photo")}` : p.online ? "Online · say hi" : "Offline"
										}), c.last ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: ago(c.last.at) }) : null]
									})]
								}),
								c.unread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "badge",
									children: c.unread
								}) : null
							]
						}, c.peer);
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "panel lg-panel chat",
			"aria-label": "Conversation",
			children: peer && info ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm icon only-mobile",
							type: "button",
							"aria-label": "Back to conversations",
							onClick: () => bunny.setView({
								tab: "direct",
								peer: null
							}),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
							avatar: info.avatar,
							anim: info.anim,
							color: info.color,
							label: info.name,
							status: info.online ? info.status : void 0,
							size: "2.2rem"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grow",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "0.4rem"
								},
								children: [info.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
									role: info.role,
									admin: !!bunny.admins[peer]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: info.online ? info.status === "dnd" ? "Do not disturb" : info.status === "idle" ? "Idle" : "Online" : "Offline · they'll get it next time" })]
						}),
						!bunny.friends[peer] && !bunny.outgoing[peer] && !bunny.requests[peer] ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn sm",
							type: "button",
							onClick: () => bunny.requestFriend(peer),
							disabled: !info.box,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 14 }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "seg-label",
									children: "Add friend"
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm icon",
							type: "button",
							"aria-label": "More",
							onClick: (e) => {
								const r = e.currentTarget.getBoundingClientRect();
								openMenu({
									id: peer,
									x: r.right - 260,
									y: r.bottom + 6
								});
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 16 })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bubbles",
					ref: listRef,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "privacy-note",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }), " Encrypted in transit. Server moderators can review direct messages for safety."]
						}),
						thread.map((d, i) => {
							const prev = thread[i - 1];
							const mine = d.from === me;
							const gap = prev && (prev.from !== d.from || d.at - prev.at > 6e5);
							const newDay = !prev || dayLabel(prev.at) !== dayLabel(d.at);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: { display: "contents" },
								children: [newDay ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "day",
									children: dayLabel(d.at)
								}) : gap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bubble-gap" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `bubble-row ${mine ? "mine" : ""} ${selected === d.id ? "selected" : ""} ${editing === d.id ? "editing" : ""}`,
									onClick: (e) => {
										if (e.target.closest("button, a, textarea, video")) return;
										setSelected((cur) => cur === d.id ? null : d.id);
									},
									children: editing === d.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bubble-edit lg-soft",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											className: "input",
											autoFocus: true,
											value: editText,
											maxLength: 2e3,
											"aria-label": "Edit message",
											onChange: (e) => setEditText(e.target.value),
											onKeyDown: (e) => {
												if (e.key === "Escape") setEditing(null);
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													saveEdit(d);
												}
											}
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "row",
											style: { justifyContent: "flex-end" },
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "hint",
													style: { marginRight: "auto" },
													children: "Enter to save · Esc to cancel"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "gbtn sm",
													type: "button",
													onClick: () => setEditing(null),
													children: "Cancel"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "gbtn sm primary",
													type: "button",
													onClick: () => void saveEdit(d),
													children: "Save"
												})
											]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `bubble ${mine ? "mine" : ""} ${d.media && !d.text ? "media-only" : ""} ${d.at > mountedAt.current - 1500 ? "enter" : ""}`,
										children: [
											d.media ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {
												media: d.media,
												load: bunny.loadMedia
											}) : null,
											d.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, {
												text: d.text,
												selfName: bunny.profile.name
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", { children: [timeLabel(d.at, bunny.settings.clock24), d.editedAt ? " · edited" : ""] })
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "bubble-actions lg-soft",
										role: "toolbar",
										"aria-label": "Message actions",
										children: confirmDelete === d.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "gbtn sm danger",
											type: "button",
											onClick: () => {
												bunny.unsendDirect(d);
												setConfirmDelete(null);
											},
											children: "Delete"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "gbtn sm",
											type: "button",
											onClick: () => setConfirmDelete(null),
											children: "Keep"
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											mine && d.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny",
												type: "button",
												"aria-label": "Edit message",
												title: "Edit",
												onClick: () => {
													setEditing(d.id);
													setEditText(d.text);
													setSelected(null);
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 15 })
											}) : null,
											d.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny",
												type: "button",
												"aria-label": "Copy message",
												title: "Copy",
												onClick: async () => {
													try {
														await navigator.clipboard.writeText(d.text);
														bunny.say("Copied");
													} catch {
														bunny.say("Could not copy");
													}
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 15 })
											}) : null,
											mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "tiny danger",
												type: "button",
												"aria-label": "Delete message",
												title: "Delete",
												onClick: () => setConfirmDelete(d.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 })
											}) : null
										] })
									})] })
								})]
							}, d.id);
						}),
						thread.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "empty",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 26 }),
								"This is the start of your conversation with ",
								info.name,
								"."
							]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "composer-wrap",
					style: { paddingTop: "0.5rem" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttachTray, {
						items: attach.items,
						onRemove: attach.remove,
						progress
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "composer lg",
						onSubmit: (e) => {
							e.preventDefault();
							send();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "gbtn icon",
								type: "button",
								"aria-label": "Attach images or video",
								title: "Attach images or video",
								disabled: blocked || banned || !bunny.online || progress !== null,
								onClick: () => fileRef.current?.click(),
								style: {
									background: "transparent",
									boxShadow: "none"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { size: 19 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: ACCEPT,
								multiple: true,
								hidden: true,
								onChange: (e) => {
									attach.add(e.target.files);
									e.target.value = "";
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								onPaste: (e) => {
									const files = [...e.clipboardData.files];
									if (files.length) {
										e.preventDefault();
										attach.add(files);
									}
								},
								value: draft,
								maxLength: 2e3,
								style: { paddingLeft: "0.2rem" },
								disabled: blocked || banned || !bunny.online,
								placeholder: blocked ? "You blocked this person" : banned ? "You're banned" : `Message ${info.name}`,
								"aria-label": `Message ${info.name}`,
								onChange: (e) => setDraft(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "send",
								type: "submit",
								disabled: !draft.trim() && !attach.items.length || blocked || banned || !bunny.online || progress !== null,
								"aria-label": "Send",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
							})
						]
					})]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "empty",
				style: { margin: "auto" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 30 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						style: {
							display: "block",
							color: "var(--color-ink)",
							fontSize: "1rem",
							marginBottom: "0.2rem"
						},
						children: "Your direct messages"
					}),
					"Pick a conversation, or find someone in Server and choose Message."
				]
			})
		})]
	});
}
function ModView({ bunny, openMenu }) {
	const [tab, setTab] = (0, import_react.useState)("overview");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "panel lg-panel",
		"aria-label": "Admin panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hash gold",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 18 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grow",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Admin panel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Signed in as admin · actions are verified on every device" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tabbar",
				role: "tablist",
				"aria-label": "Admin sections",
				children: [
					{
						id: "overview",
						label: "Overview",
						icon: LayoutGrid
					},
					{
						id: "members",
						label: "Members",
						icon: Users
					},
					{
						id: "logs",
						label: "Deleted & edits",
						icon: ScrollText
					},
					{
						id: "dms",
						label: "DMs",
						icon: MessagesSquare
					},
					{
						id: "server",
						label: "Look",
						icon: Image$1
					}
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "tab",
					"aria-label": t.label,
					"aria-selected": tab === t.id,
					className: "tab",
					onClick: () => setTab(t.id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(t.icon, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.label })]
				}, t.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mod-body",
				children: [
					tab === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, { bunny }) : null,
					tab === "members" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Members, {
						bunny,
						openMenu
					}) : null,
					tab === "logs" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logs, { bunny }) : null,
					tab === "dms" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dms, { bunny }) : null,
					tab === "server" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerLook, { bunny }) : null
				]
			})
		]
	});
}
function Overview({ bunny }) {
	const [text, setText] = (0, import_react.useState)("");
	const [clearN, setClearN] = (0, import_react.useState)("10");
	const [confirmClear, setConfirmClear] = (0, import_react.useState)(false);
	const logs = Object.values(bunny.logs);
	const activeBans = Object.values(bunny.bans).filter((b) => b.kind === "ban" && !bunny.admins[b.target]);
	const slow = bunny.room?.slowmode || 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stats",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stat",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: bunny.people.length }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Online" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stat",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: bunny.messages.length }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Messages" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stat",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: activeBans.length }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bans" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stat",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: Object.keys(bunny.warnsIssued).length }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Warnings" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stat",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: logs.length }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Logged changes" })]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MyTag, { bunny }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Broadcast"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "opt stack",
				onSubmit: async (e) => {
					e.preventDefault();
					if (await bunny.flashAll(text, "m")) {
						bunny.say("Message flashed to everyone");
						setText("");
					}
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hint",
						children: "Flash pops up in the middle of everyone's screen for 3 seconds. Hint slides in at the top."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						value: text,
						maxLength: 200,
						placeholder: "Server restarting in 5 minutes!",
						onChange: (e) => setText(e.target.value),
						"aria-label": "Broadcast text"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn primary",
							type: "submit",
							disabled: !text.trim(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 15 }), " Flash · /m"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn",
							type: "button",
							disabled: !text.trim(),
							onClick: async () => {
								if (await bunny.flashAll(text, "h")) {
									bunny.say("Hint sent");
									setText("");
								}
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { size: 15 }), " Hint · /h"]
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Room controls"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Lock chat" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Only admins can send in #lounge." })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Lock chat",
						on: !!bunny.room?.locked,
						onChange: (v) => void bunny.setRoomControls({ locked: v })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Slowmode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Time between messages for each person." })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "choices",
						role: "group",
						"aria-label": "Slowmode",
						children: [
							0,
							5,
							15,
							30,
							60
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": slow === n,
							onClick: () => void bunny.setRoomControls({ slowmode: n }),
							children: n ? `${n}s` : "Off"
						}, n))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Clear chat" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delete the newest messages. They still show up in the logs." })]
					}), confirmClear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm",
							type: "button",
							onClick: () => setConfirmClear(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn sm danger",
							type: "button",
							onClick: () => {
								bunny.clearRecent(Number(clearN));
								setConfirmClear(false);
							},
							children: ["Delete ", clearN]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "choices",
							role: "group",
							"aria-label": "How many",
							children: [
								"10",
								"25",
								"50"
							].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": clearN === n,
								onClick: () => setClearN(n),
								children: n
							}, n))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn sm danger",
							type: "button",
							onClick: () => setConfirmClear(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { size: 14 }), " Clear"]
						})]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Recent admin actions"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [bunny.modHistory.slice(0, 8).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "txt",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
						h.byName,
						" ",
						h.text
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "muted",
					children: ago(h.at)
				})]
			}, h.key)), bunny.modHistory.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty",
				children: "Actions you and other admins take will show up here."
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Chat commands"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group cmd-sheet",
			children: COMMANDS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cmd-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", { children: [
					"/",
					c.name,
					c.args ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("i", { children: [" ", c.args] }) : null
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.help })]
			}, c.name))
		})
	] });
}
function LogRow({ bunny, log }) {
	const h24 = bunny.settings.clock24;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "log",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "log-head",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `pill-kind ${log.kind === "delete" ? "del" : "edit"}`,
					children: log.kind === "delete" ? "Deleted" : "Edited"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pill-kind",
					children: log.scope === "direct" ? "DM" : "#lounge"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: log.authorName }),
				log.actorId && log.actorId !== log.authorId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					style: { color: "var(--color-faint)" },
					children: ["by ", log.actorName]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", { children: [
					new Date(log.at).toLocaleDateString(),
					" · ",
					timeLabel(log.at, h24)
				] })
			]
		}), log.kind === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "diff",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "before",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Before" }), log.before]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "after",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "After" }), log.after]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "diff one",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "before",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Deleted message" }), log.before]
			})
		})]
	});
}
function Logs({ bunny }) {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const logs = (0, import_react.useMemo)(() => Object.values(bunny.logs).filter((l) => filter === "all" || l.kind === filter).filter((l) => !q || `${l.authorName} ${l.before} ${l.after || ""}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.at - a.at), [
		bunny.logs,
		filter,
		q
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "row",
		style: { marginBottom: "0.8rem" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "choices",
			children: [
				"all",
				"delete",
				"edit"
			].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-pressed": filter === f,
				onClick: () => setFilter(f),
				children: f === "all" ? "All" : f === "delete" ? "Deleted" : "Edited"
			}, f))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "search",
			style: {
				margin: 0,
				flex: 1,
				minWidth: "10rem"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 14 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "Search logs",
				"aria-label": "Search logs"
			})]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group",
		children: [logs.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogRow, {
			bunny,
			log: l
		}, l.key)), logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "empty",
			children: "Nothing logged yet."
		}) : null]
	})] });
}
function Members({ bunny, openMenu }) {
	const [q, setQ] = (0, import_react.useState)("");
	const onlineIds = new Set(bunny.people.map((p) => p.id));
	const all = (0, import_react.useMemo)(() => {
		return [.../* @__PURE__ */ new Set([
			...Object.keys(bunny.directory),
			...bunny.people.map((p) => p.id),
			...Object.keys(bunny.bans)
		])].map((id) => bunny.lookup(id)).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q.toLowerCase())).sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id)) || a.name.localeCompare(b.name));
	}, [bunny, q]);
	const warnCount = (id) => Object.values(bunny.warnsIssued).filter((w) => w.target === id).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "search",
			style: { margin: "0 0 0.8rem" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 14 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "Find by name or ID",
				"aria-label": "Find member"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [all.map((p) => {
				const banned = bunny.isBanned(p.id);
				const w = warnCount(p.id);
				const ban = bunny.bans[p.id];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt keep",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
							avatar: p.avatar,
							anim: p.anim,
							color: p.color,
							label: p.name,
							status: p.online ? p.status : void 0,
							size: "2.2rem"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "txt",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "0.35rem",
									flexWrap: "wrap"
								},
								children: [
									p.name,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
										role: p.role,
										admin: !!bunny.admins[p.id]
									}),
									bunny.perks[p.id]?.animated && !bunny.admins[p.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pill-kind",
										children: "Animated PFP"
									}) : null,
									banned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tag ban",
										children: "Banned"
									}) : null,
									w ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "pill-kind",
										style: { color: "#ffd98a" },
										children: [
											w,
											" warning",
											w > 1 ? "s" : ""
										]
									}) : null
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								p.online ? "Online" : "Offline",
								" · ",
								p.id,
								banned && ban?.reason ? ` · “${ban.reason}”` : ""
							] })]
						}),
						p.id !== bunny.identity?.id && !bunny.admins[p.id] ? banned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm",
							type: "button",
							onClick: () => void bunny.ban(p.id, p.name, "", "unban"),
							children: "Unban"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm icon",
							type: "button",
							"aria-label": `Manage ${p.name}`,
							title: "Warn, kick or ban",
							onClick: (e) => {
								const r = e.currentTarget.getBoundingClientRect();
								openMenu({
									id: p.id,
									x: r.right - 264,
									y: r.bottom + 6
								});
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 16 })
						}) : null
					]
				}, p.id);
			}), all.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty",
				children: "No members found."
			}) : null]
		}),
		Object.values(bunny.warnsIssued).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Warnings"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: Object.values(bunny.warnsIssued).sort((a, b) => b.at - a.at).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					size: 17,
					style: { color: "#ffcf5c" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "txt",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: w.targetName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"“",
						w.reason,
						"” · by ",
						w.byName,
						" · ",
						ago(w.at),
						" ago"
					] })]
				})]
			}, w.id))
		})] }) : null
	] });
}
function Dms({ bunny }) {
	const [open, setOpen] = (0, import_react.useState)(null);
	const threads = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const dm of Object.values(bunny.allDms)) {
			const key = threadKey(dm.from, dm.to);
			const t = map.get(key) || {
				key,
				a: dm.from < dm.to ? dm.from : dm.to,
				b: dm.from < dm.to ? dm.to : dm.from,
				msgs: []
			};
			t.msgs.push(dm);
			map.set(key, t);
		}
		for (const t of map.values()) t.msgs.sort((x, y) => x.at - y.at);
		return [...map.values()].sort((x, y) => y.msgs[y.msgs.length - 1].at - x.msgs[x.msgs.length - 1].at);
	}, [bunny.allDms]);
	const current = threads.find((t) => t.key === open);
	const nameOf = (id, fallback) => {
		const n = bunny.lookup(id).name;
		return n === "Guest" && fallback ? fallback : n;
	};
	if (current) {
		const a = bunny.lookup(current.a);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			style: { marginBottom: "0.8rem" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "gbtn sm",
				type: "button",
				onClick: () => setOpen(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 14 }), " All conversations"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
				style: { fontSize: "0.9rem" },
				children: [
					nameOf(current.a, current.msgs.find((m) => m.from === current.a)?.name),
					" ↔ ",
					nameOf(current.b, current.msgs.find((m) => m.from === current.b)?.name)
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			style: {
				padding: "0.8rem",
				display: "flex",
				flexDirection: "column",
				gap: "0.3rem"
			},
			children: current.msgs.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `bubble ${m.from === a.id ? "" : "mine"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						style: {
							fontSize: "0.72rem",
							display: "block",
							opacity: .8
						},
						children: m.name
					}),
					m.text,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", { children: [
						new Date(m.at).toLocaleDateString(),
						" · ",
						timeLabel(m.at, bunny.settings.clock24)
					] })
				]
			}, m.id))
		})] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "callout info",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessagesSquare, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Every direct message is sealed for the two people in it plus the admin key. Only admins can open them here." })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group",
		children: [threads.map((t) => {
			const last = t.msgs[t.msgs.length - 1];
			const a = bunny.lookup(t.a);
			const b = bunny.lookup(t.b);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "opt",
				style: {
					width: "100%",
					textAlign: "left"
				},
				onClick: () => setOpen(t.key),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						style: { display: "flex" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
							avatar: a.avatar,
							color: a.color,
							label: a.name,
							size: "2rem"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: { marginLeft: "-0.6rem" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
								avatar: b.avatar,
								color: b.color,
								label: b.name,
								size: "2rem"
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
							nameOf(t.a, t.msgs.find((m) => m.from === t.a)?.name),
							" ↔ ",
							nameOf(t.b, t.msgs.find((m) => m.from === t.b)?.name)
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							t.msgs.length,
							" message",
							t.msgs.length > 1 ? "s" : "",
							" · ",
							last.name,
							": ",
							last.text.slice(0, 60)
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: "0.7rem",
							color: "var(--color-faint)"
						},
						children: ago(last.at)
					})
				]
			}, t.key);
		}), threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "empty",
			children: "No direct messages yet."
		}) : null]
	})] });
}
function ServerLook({ bunny }) {
	const [url, setUrl] = (0, import_react.useState)("");
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [drag, setDrag] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(bunny.announce?.text || "");
	const fileRef = (0, import_react.useRef)(null);
	const wp = bunny.wallpaper;
	const current = !wp || wp.mode === "default" ? "default" : wp.mode === "preset" ? wp.value : "custom";
	async function applyFile(file) {
		if (!file || progress !== null) return;
		try {
			const prepared = await prepareFile(file);
			setProgress(0);
			const [ref] = await bunny.uploadMedia([prepared], false, (d, t) => setProgress(d / t));
			await bunny.setGlobalWallpaper("media", void 0, ref);
		} catch (e) {
			bunny.say(e instanceof Error ? e.message : "That file can't be used");
		} finally {
			setProgress(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Wallpaper for everyone"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `dropzone ${drag ? "over" : ""}`,
					onDragOver: (e) => {
						e.preventDefault();
						setDrag(true);
					},
					onDragLeave: () => setDrag(false),
					onDrop: (e) => {
						e.preventDefault();
						setDrag(false);
						applyFile(e.dataTransfer.files[0]);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { size: 26 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Drop an image or video here" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "PNG, JPG, GIF, WebP or MP4 / WebM up to 8 MB. Videos loop silently." }),
						progress !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "tray-progress",
							style: {
								width: "100%",
								maxWidth: "18rem"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${Math.round(progress * 100)}%` } })
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn primary",
							type: "button",
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 15 }), " Choose file"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: ACCEPT,
							hidden: true,
							onChange: (e) => {
								applyFile(e.target.files?.[0]);
								e.target.value = "";
							}
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "wall-grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "wall",
							style: { backgroundImage: "url(/home.jpg)" },
							"aria-pressed": current === "default",
							onClick: () => void bunny.setGlobalWallpaper("default"),
							children: "Fjord"
						}),
						Object.entries(PRESETS).map(([key, p]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "wall",
							style: { background: p.css },
							"aria-pressed": current === key,
							onClick: () => void bunny.setGlobalWallpaper("preset", key),
							children: p.label
						}, key)),
						current === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "wall custom",
							"aria-pressed": true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 16 }), " Custom"]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt stack",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Or use an image link"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							style: {
								flex: 1,
								minWidth: "12rem"
							},
							value: url,
							placeholder: "https://…/photo.jpg",
							onChange: (e) => setUrl(e.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn",
							type: "button",
							disabled: !url.trim(),
							onClick: () => {
								bunny.setGlobalWallpaper("image", url.trim());
								setUrl("");
							},
							children: "Apply"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Reset wallpaper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: wp && wp.mode !== "default" ? `Changed by ${wp.byName} ${ago(wp.at)} ago` : "Everyone is on the default wallpaper." })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "gbtn danger",
						type: "button",
						disabled: !wp || wp.mode === "default",
						onClick: () => void bunny.setGlobalWallpaper("default"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 15 }), " Reset"]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Server announcement"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hint",
						children: "Pinned under the top bar for everyone."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "input",
						maxLength: 240,
						value: notice,
						placeholder: "Welcome! Be kind.",
						onChange: (e) => setNotice(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn primary",
							type: "button",
							disabled: !notice.trim(),
							onClick: () => void bunny.setAnnouncement(notice),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { size: 15 }), " Post"]
						}), bunny.announce?.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn",
							type: "button",
							onClick: () => {
								setNotice("");
								bunny.setAnnouncement("");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { size: 15 }), " Clear"]
						}) : null]
					})
				]
			})
		})
	] });
}
function MyTag({ bunny }) {
	const me = bunny.identity?.id || "";
	const mine = bunny.perks[me]?.role;
	const [text, setText] = (0, import_react.useState)(mine?.text || "Admin");
	const [color, setColor] = (0, import_react.useState)(mine?.color || "#ffc35c");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "group-title",
		children: "Your tag"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "opt",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "txt",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Shown next to your name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Any text and any color. Everyone sees it." })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
				role: text.trim() ? {
					text: text.trim(),
					color
				} : null,
				admin: true
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "opt",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					style: {
						flex: 1,
						minWidth: "8rem"
					},
					value: text,
					maxLength: 18,
					placeholder: "Owner",
					onChange: (e) => setText(e.target.value),
					"aria-label": "Tag text"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "color-pick",
					title: "Tag color",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "color",
						value: color,
						onChange: (e) => setColor(e.target.value),
						"aria-label": "Tag color"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: color } })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "gbtn primary",
					type: "button",
					disabled: !text.trim(),
					onClick: () => void bunny.setPerk(me, bunny.profile.name, true, {
						text,
						color
					}),
					children: "Save"
				}),
				mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "gbtn",
					type: "button",
					onClick: () => {
						setText("Admin");
						setColor("#ffc35c");
						bunny.setPerk(me, bunny.profile.name, true, null);
					},
					children: "Reset"
				}) : null
			]
		})]
	})] });
}
var NAV = [
	{
		id: "profile",
		label: "My profile",
		icon: User
	},
	{
		id: "notifications",
		label: "Notifications",
		icon: Bell
	},
	{
		id: "appearance",
		label: "Appearance",
		icon: Palette
	},
	{
		id: "privacy",
		label: "Privacy & safety",
		icon: Shield
	},
	{
		id: "account",
		label: "Account & token",
		icon: KeyRound
	}
];
function Opt({ title, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "opt",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "txt",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: title }), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hint }) : null]
		}), children]
	});
}
function SettingsSheet({ bunny, onClose, initial = "profile" }) {
	const [section, setSection] = (0, import_react.useState)(initial);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "backdrop",
		onMouseDown: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet lg",
			role: "dialog",
			"aria-label": "Settings",
			onMouseDown: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "sheet-nav",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Settings" }),
					NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `nav-item ${section === n.id ? "active" : ""}`,
						onClick: () => setSection(n.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n.icon, { size: 17 }), n.label]
					}, n.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "nav-spacer" }),
					bunny.session && !bunny.adminMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						className: "nav-item",
						href: "/admin",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
							size: 17,
							style: { color: "#ffcf5c" }
						}), " Admin panel"]
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sheet-body",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "gbtn icon sm sheet-close",
						type: "button",
						"aria-label": "Close settings",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					}),
					section === "profile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileSection, { bunny }) : null,
					section === "notifications" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationSection, { bunny }) : null,
					section === "appearance" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppearanceSection, { bunny }) : null,
					section === "privacy" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrivacySection, { bunny }) : null,
					section === "account" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountSection, { bunny }) : null
				]
			})]
		})
	});
}
function ProfileSection({ bunny }) {
	const [name, setName] = (0, import_react.useState)(bunny.profile.name);
	const [bio, setBio] = (0, import_react.useState)(bunny.profile.bio);
	const [avatar, setAvatar] = (0, import_react.useState)(bunny.profile.avatar);
	const [color, setColor] = (0, import_react.useState)(bunny.profile.color);
	const me = bunny.identity?.id || "";
	const animAllowed = bunny.canAnimate(me) || !!bunny.session;
	const [animBusy, setAnimBusy] = (0, import_react.useState)(null);
	const dirty = name !== bunny.profile.name || bio !== bunny.profile.bio || avatar !== bunny.profile.avatar || color !== bunny.profile.color;
	const valid = name.trim().length >= 2;
	const set = (patch) => bunny.updateSettings(patch);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "My profile" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sub",
			children: "How you show up in the room and in direct messages."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "profile-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
					avatar,
					anim: animAllowed ? bunny.profile.anim : void 0,
					color,
					label: "Preview",
					status: bunny.settings.status
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						minWidth: 0,
						flex: 1
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							style: {
								fontSize: "1.05rem",
								display: "block"
							},
							children: name || "Your name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								fontSize: "0.8rem",
								color: "var(--color-faint)"
							},
							children: bio || "No status yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "row",
							style: { marginTop: "0.6rem" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "gbtn sm file",
								children: ["Upload photo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									onChange: async (e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										const data = await shrinkImage(file);
										if (data) setAvatar(data);
										else bunny.say("That image couldn't be read");
									}
								})]
							}), avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "gbtn sm",
								type: "button",
								onClick: () => setAvatar(void 0),
								children: "Remove"
							}) : null]
						})
					]
				})]
			})
		}),
		animAllowed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Animated profile picture ✨" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: bunny.profile.anim ? "Your animated picture is live." : "GIF, WebP, MP4 or WebM up to 2 MB. Shown instead of your photo." })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: `gbtn sm file ${animBusy !== null ? "busy" : ""}`,
						children: [animBusy !== null ? `${Math.round(animBusy * 100)}%` : bunny.profile.anim ? "Replace" : "Upload", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "image/gif,image/webp,video/mp4,video/webm",
							disabled: animBusy !== null,
							onChange: async (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (!file) return;
								try {
									const p = await prepareAnimated(file);
									setAnimBusy(0);
									const [ref] = await bunny.uploadMedia([p], false, (d, t) => setAnimBusy(d / t));
									bunny.saveProfile({
										...bunny.profile,
										anim: ref
									});
									bunny.say("Animated picture updated");
								} catch (err) {
									bunny.say(err instanceof Error ? err.message : "Upload failed");
								} finally {
									setAnimBusy(null);
								}
							}
						})]
					}),
					bunny.profile.anim ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "gbtn sm",
						type: "button",
						onClick: () => bunny.saveProfile({
							...bunny.profile,
							anim: void 0
						}),
						children: "Remove"
					}) : null
				]
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt stack",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "label",
						htmlFor: "set-name",
						children: "Display name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "set-name",
						className: "input",
						value: name,
						maxLength: 24,
						onChange: (e) => setName(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt stack",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "label",
						htmlFor: "set-bio",
						children: "Status message"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "set-bio",
						className: "input",
						value: bio,
						maxLength: 80,
						placeholder: "What are you up to?",
						onChange: (e) => setBio(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt stack",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Avatar color"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "swatches",
						children: COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "swatch",
							style: { background: c },
							"aria-label": `Color ${c}`,
							"aria-pressed": color === c,
							onClick: () => setColor(c)
						}, c))
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "row",
			style: {
				justifyContent: "flex-end",
				marginBottom: "1.2rem"
			},
			children: [dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "gbtn",
				type: "button",
				onClick: () => {
					setName(bunny.profile.name);
					setBio(bunny.profile.bio);
					setAvatar(bunny.profile.avatar);
					setColor(bunny.profile.color);
				},
				children: "Reset"
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "gbtn primary",
				type: "button",
				disabled: !dirty || !valid,
				onClick: () => {
					if (bunny.saveProfile({
						name,
						bio,
						avatar,
						color,
						anim: bunny.profile.anim
					})) bunny.say("Profile saved");
				},
				children: "Save changes"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Presence"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
				title: "Status",
				hint: "Do not disturb silences every sound and notification.",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choices, {
					label: "Status",
					value: bunny.settings.status,
					onChange: (v) => set({ status: v }),
					options: [
						{
							value: "online",
							label: "Online"
						},
						{
							value: "idle",
							label: "Idle"
						},
						{
							value: "dnd",
							label: "DND"
						}
					]
				})
			})
		})
	] });
}
function NotificationSection({ bunny }) {
	const s = bunny.settings;
	const set = (patch) => bunny.updateSettings(patch);
	const supported = typeof Notification !== "undefined";
	const [perm, setPerm] = (0, import_react.useState)(supported ? Notification.permission : "denied");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Notifications" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sub",
			children: "Choose what pings you. Everything here is optional."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Desktop notifications",
					hint: !supported ? "This browser doesn't support notifications." : perm === "denied" ? "Blocked by your browser. Allow notifications for this site to turn them on." : "Pop-up alerts when Bunny RTC is in the background.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Desktop notifications",
						on: s.desktop && perm === "granted",
						onChange: async (v) => {
							if (!supported) return;
							if (v && Notification.permission !== "granted") {
								const result = await Notification.requestPermission();
								setPerm(result);
								if (result !== "granted") {
									bunny.say("Notifications were not allowed");
									return;
								}
							}
							set({ desktop: v });
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Message sounds",
					hint: "A soft chime when something new arrives.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Message sounds",
						on: s.sounds,
						onChange: (v) => set({ sounds: v })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Server messages",
					hint: "Which messages in #lounge notify you.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choices, {
						label: "Server notifications",
						value: s.notifyOn,
						onChange: (v) => set({ notifyOn: v }),
						options: [
							{
								value: "all",
								label: "All"
							},
							{
								value: "mentions",
								label: "@Mentions"
							},
							{
								value: "none",
								label: "Off"
							}
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Direct messages & requests",
					hint: "Notify me about DMs and friend requests.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Direct message notifications",
						on: s.dmNotify,
						onChange: (v) => set({ dmNotify: v })
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: "gbtn",
			type: "button",
			onClick: () => {
				if (supported && Notification.permission === "granted" && s.desktop) new Notification("Bunny RTC", {
					body: "Notifications are working ⭐",
					icon: "/favicon.svg"
				});
				else bunny.say("Turn on desktop notifications first");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 15 }), " Send a test notification"]
		})
	] });
}
function AppearanceSection({ bunny }) {
	const s = bunny.settings;
	const set = (patch) => bunny.updateSettings(patch);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Appearance" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sub",
			children: "Tune the glass. These choices only change your view."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt stack",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Accent"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "swatches",
						children: [Object.entries(ACCENTS).map(([key, a]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "swatch",
							title: a.label,
							style: { background: a.color },
							"aria-label": a.label,
							"aria-pressed": s.accent === key,
							onClick: () => set({ accent: key })
						}, key)), bunny.session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "swatch custom-swatch",
							title: "Any color (admin)",
							"aria-pressed": s.accent.startsWith("#"),
							style: { background: s.accent.startsWith("#") ? s.accent : void 0 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "color",
								value: s.accent.startsWith("#") ? s.accent : "#ff6b9a",
								onChange: (e) => set({ accent: e.target.value }),
								"aria-label": "Custom accent color"
							}), s.accent.startsWith("#") ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "+" })]
						}) : null]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Glass",
					hint: "Clear shows more wallpaper; tinted is easiest to read.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choices, {
						label: "Glass style",
						value: s.glass,
						onChange: (v) => set({ glass: v }),
						options: [
							{
								value: "clear",
								label: "Clear"
							},
							{
								value: "frosted",
								label: "Frosted"
							},
							{
								value: "tinted",
								label: "Tinted"
							}
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Text size",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choices, {
						label: "Text size",
						value: s.textSize,
						onChange: (v) => set({ textSize: v }),
						options: [
							{
								value: "sm",
								label: "Small"
							},
							{
								value: "md",
								label: "Default"
							},
							{
								value: "lg",
								label: "Large"
							}
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MyWallpaper, { bunny }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt stack",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "label",
						children: [
							"Wallpaper dimming · ",
							s.dim,
							"%"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: 70,
						value: s.dim,
						onChange: (e) => set({ dim: Number(e.target.value) }),
						"aria-label": "Wallpaper dimming"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Compact messages",
					hint: "Smaller avatars, tighter rows.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Compact messages",
						on: s.compact,
						onChange: (v) => set({ compact: v })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "24-hour clock",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "24-hour clock",
						on: s.clock24,
						onChange: (v) => set({ clock24: v })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
					title: "Reduce motion",
					hint: "Turn off animations and springy transitions.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Reduce motion",
						on: s.reduceMotion,
						onChange: (v) => set({ reduceMotion: v })
					})
				})
			]
		})
	] });
}
function PrivacySection({ bunny }) {
	const s = bunny.settings;
	const set = (patch) => bunny.updateSettings(patch);
	const friends = Object.values(bunny.friends);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Privacy & safety" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sub",
			children: "Control who can reach you."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
				title: "Allow direct messages from",
				hint: "Messages from anyone else are dropped silently.",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choices, {
					label: "Allow DMs from",
					value: s.dmsFrom,
					onChange: (v) => set({ dmsFrom: v }),
					options: [{
						value: "everyone",
						label: "Everyone"
					}, {
						value: "friends",
						label: "Friends"
					}]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
				title: "Show when I'm typing",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					label: "Show typing indicator",
					on: s.sendTyping,
					onChange: (v) => set({ sendTyping: v })
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group-title",
			children: ["Friends · ", friends.length]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [friends.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty",
				children: "No friends yet. Add people from the member list."
			}) : null, friends.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
						color: f.color,
						label: f.name,
						avatar: bunny.lookup(f.id).avatar,
						size: "2rem"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "txt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: f.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Friends since ", new Date(f.since).toLocaleDateString()] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "gbtn sm",
						type: "button",
						onClick: () => bunny.removeFriend(f.id),
						children: "Remove"
					})
				]
			}, f.id))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group-title",
			children: ["Blocked · ", bunny.blocked.length]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [bunny.blocked.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty",
				children: "You haven't blocked anyone."
			}) : null, bunny.blocked.map((id) => {
				const p = bunny.lookup(id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "opt",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, {
							size: 18,
							style: { color: "var(--color-faint)" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "txt",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: p.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Hidden from chat and DMs" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm",
							type: "button",
							onClick: () => bunny.toggleBlock(id),
							children: "Unblock"
						})
					]
				}, id);
			})]
		})
	] });
}
function AccountSection({ bunny }) {
	const [reveal, setReveal] = (0, import_react.useState)(false);
	const [restore, setRestore] = (0, import_react.useState)("");
	const [restoreError, setRestoreError] = (0, import_react.useState)("");
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Account & token" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "sub",
			children: "Your account lives in this browser. Your token is the only key to it."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "callout red",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Never share this token." }), " Anyone who has it can log in as you, read your DMs and post under your name. No one from Bunny RTC will ever ask you for it. Don't paste it into websites, bots or messages from people you don't know."] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "group",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Your secret token"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `token ${reveal ? "" : "masked"}`,
						"aria-label": "Secret token",
						children: reveal ? bunny.token : bunny.token.replace(/[^_]/g, "•")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "gbtn sm",
								type: "button",
								onClick: () => setReveal((v) => !v),
								children: [
									reveal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 }),
									" ",
									reveal ? "Hide" : "Reveal"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "gbtn sm",
								type: "button",
								onClick: async () => {
									try {
										await navigator.clipboard.writeText(bunny.token);
										bunny.say("Token copied. Keep it private");
									} catch {
										bunny.say("Could not copy");
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 14 }), " Copy token"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								style: {
									fontSize: "0.72rem",
									color: "var(--color-faint)",
									marginLeft: "auto"
								},
								children: [bunny.token.length, " characters"]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
				title: "User ID",
				hint: bunny.identity?.id,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "gbtn sm",
					type: "button",
					onClick: async () => {
						try {
							await navigator.clipboard.writeText(bunny.identity?.id || "");
							bunny.say("User ID copied");
						} catch {
							bunny.say("Could not copy");
						}
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 14 }), " Copy"]
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Use your account on this device"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "opt stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: "0.8rem",
							color: "var(--color-faint)"
						},
						children: "Paste a token from your other device to sign in here. This replaces the account on this browser."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "input",
						value: restore,
						placeholder: "bunny_…",
						spellCheck: false,
						onChange: (e) => {
							setRestore(e.target.value);
							setRestoreError("");
						}
					}),
					restoreError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "err",
						children: restoreError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "row",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn sm primary",
							type: "button",
							disabled: !restore.trim(),
							onClick: () => {
								if (!bunny.restoreFromToken(restore)) setRestoreError("That doesn't look like a valid Bunny RTC token.");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { size: 14 }), " Sign in with token"]
						})
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group-title",
			children: "Danger zone"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "group",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opt, {
				title: "Reset this device",
				hint: "Erase your account, friends and messages from this browser. Copy your token first if you want to come back.",
				children: confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "gbtn sm",
						type: "button",
						onClick: () => setConfirmReset(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "gbtn sm danger",
						type: "button",
						onClick: () => {
							for (const key of Object.keys(localStorage)) if (key.startsWith("bunny_")) localStorage.removeItem(key);
							window.location.reload();
						},
						children: "Erase"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "gbtn sm danger",
					type: "button",
					onClick: () => setConfirmReset(true),
					children: "Reset"
				})
			})
		})
	] });
}
function MyWallpaper({ bunny }) {
	const [mine, setMine] = (0, import_react.useState)(() => {
		try {
			return localStorage.getItem("bunny_mywall");
		} catch {
			return null;
		}
	});
	const apply = (value) => {
		try {
			if (value) localStorage.setItem("bunny_mywall", value);
			else localStorage.removeItem("bunny_mywall");
		} catch {
			bunny.say("Your browser couldn't save that image");
			return;
		}
		setMine(value);
		window.dispatchEvent(new Event("bunny-mywall"));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "opt",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "txt",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "My wallpaper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mine ? "Only you see this. Admin wallpaper changes are hidden while it's on." : "Use your own picture instead of the server's wallpaper." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "gbtn sm file",
				children: [mine ? "Change" : "Upload", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					accept: "image/*",
					onChange: async (e) => {
						const file = e.target.files?.[0];
						e.target.value = "";
						if (!file) return;
						const data = await shrinkWallpaper(file);
						if (data) apply(data);
						else bunny.say("That image is too large");
					}
				})]
			}),
			mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "gbtn sm",
				type: "button",
				onClick: () => apply(null),
				children: "Use server's"
			}) : null
		]
	});
}
function UserMenu({ bunny, target, onClose, onMention }) {
	const [mode, setMode] = (0, import_react.useState)("main");
	const perk = bunny.perks[target.id];
	const [animated, setAnimated] = (0, import_react.useState)(!!perk?.animated);
	const [roleText, setRoleText] = (0, import_react.useState)(perk?.role?.text || "");
	const [roleColor, setRoleColor] = (0, import_react.useState)(perk?.role?.color || "#a78bfa");
	const [reason, setReason] = (0, import_react.useState)("");
	const info = bunny.lookup(target.id);
	const self = target.id === bunny.identity?.id;
	const friend = !!bunny.friends[target.id];
	const pending = !!bunny.outgoing[target.id];
	const incoming = bunny.requests[target.id];
	const blocked = bunny.blocked.includes(target.id);
	const isAdmin = bunny.isAdminPerson(target.id) || !!bunny.admins[target.id];
	const banned = bunny.isBanned(target.id);
	const canMod = bunny.adminMode && !!bunny.session && !self && !bunny.admins[target.id];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Floating, {
		x: target.x,
		y: target.y,
		onClose,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "menu-head",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
				avatar: info.avatar,
				anim: info.anim,
				color: info.color,
				label: info.name,
				status: info.online ? info.status : void 0
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { minWidth: 0 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
					info.name,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
						role: info.role,
						admin: isAdmin
					}),
					banned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tag ban",
						children: "Banned"
					}) : null
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: self ? "This is you" : info.bio || (info.online ? info.status === "dnd" ? "Do not disturb" : info.status === "idle" ? "Idle" : "Online" : "Offline") })]
			})]
		}), mode === "main" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			!self ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					disabled: !info.box || blocked,
					onClick: () => {
						bunny.openDirect(target.id);
						onClose();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 17 }),
						" ",
						info.box ? "Message" : "Message (needs them online)"
					]
				}),
				incoming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					onClick: () => {
						bunny.acceptFriend(incoming);
						onClose();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 17 }), " Accept friend request"]
				}) : friend ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					onClick: () => {
						bunny.removeFriend(target.id);
						bunny.say(`Removed ${info.name} from friends`);
						onClose();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserMinus, { size: 17 }), " Remove friend"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					disabled: pending || !info.box || blocked,
					onClick: () => {
						bunny.requestFriend(target.id);
						onClose();
					},
					children: [
						pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 17 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 17 }),
						" ",
						pending ? "Request sent" : "Add friend"
					]
				}),
				onMention ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					onClick: () => {
						onMention(info.name);
						onClose();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtSign, { size: 17 }), " Mention"]
				}) : null
			] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "menu-item",
				type: "button",
				onClick: async () => {
					try {
						await navigator.clipboard.writeText(target.id);
						bunny.say("User ID copied");
					} catch {
						bunny.say("Could not copy");
					}
					onClose();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 17 }), " Copy user ID"]
			}),
			!self ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "menu-sep" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "menu-item danger",
				type: "button",
				onClick: () => {
					bunny.toggleBlock(target.id);
					bunny.say(blocked ? `Unblocked ${info.name}` : `Blocked ${info.name}`);
					onClose();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { size: 17 }),
					" ",
					blocked ? "Unblock" : "Block"
				]
			})] }) : null,
			canMod ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "menu-sep" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					onClick: () => setMode("perks"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 17 }), " Perks & role"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item warn",
					type: "button",
					onClick: () => setMode("warn"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 17 }), " Warn user"]
				}),
				info.online ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item warn",
					type: "button",
					onClick: () => setMode("kick"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 17 }), " Kick from room"]
				}) : null,
				banned ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item",
					type: "button",
					onClick: () => {
						bunny.ban(target.id, info.name, "", "unban");
						onClose();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 17 }), " Unban"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "menu-item danger",
					type: "button",
					onClick: () => setMode("ban"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { size: 17 }), " Ban from server"]
				})
			] }) : null
		] }) : mode === "perks" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: (e) => {
				e.preventDefault();
				bunny.setPerk(target.id, info.name, animated, roleText.trim() ? {
					text: roleText.trim(),
					color: roleColor
				} : null);
				onClose();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "label",
					style: {
						display: "flex",
						alignItems: "center",
						gap: "0.35rem"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 }),
						" Perks for ",
						info.name
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "perk-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Animated profile picture" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Animated profile picture",
						on: animated,
						onChange: setAnimated
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "label",
					style: { marginTop: "0.2rem" },
					children: "Role tag"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "row",
					style: { flexWrap: "nowrap" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						value: roleText,
						maxLength: 18,
						placeholder: "VIP, Mod, Artist…",
						onChange: (e) => setRoleText(e.target.value),
						"aria-label": "Role tag text"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "color-pick",
						title: "Role color",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "color",
							value: roleColor,
							onChange: (e) => setRoleColor(e.target.value),
							"aria-label": "Role color"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: roleColor } })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "row",
					style: { justifyContent: "space-between" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
						role: roleText.trim() ? {
							text: roleText.trim(),
							color: roleColor
						} : null,
						admin: false
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm",
							type: "button",
							onClick: () => setMode("main"),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gbtn sm primary",
							type: "submit",
							children: "Save"
						})]
					})]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: (e) => {
				e.preventDefault();
				if (mode === "warn") {
					if (!reason.trim()) return;
					bunny.warn(target.id, info.name, reason);
				} else if (mode === "kick") bunny.kick(target.id, info.name, reason);
				else bunny.ban(target.id, info.name, reason || "Broke the server rules");
				onClose();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "label",
					style: {
						display: "flex",
						alignItems: "center",
						gap: "0.35rem"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { size: 13 }),
						" ",
						mode === "warn" ? `Warn ${info.name}` : mode === "kick" ? `Kick ${info.name}` : `Ban ${info.name}`
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "input",
					autoFocus: true,
					maxLength: 300,
					value: reason,
					placeholder: mode === "warn" ? "What should they know?" : "Reason (optional, shown to them)",
					onChange: (e) => setReason(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "row",
					style: { justifyContent: "flex-end" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "gbtn sm",
						type: "button",
						onClick: () => setMode("main"),
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: mode === "ban" ? "gbtn sm danger" : "gbtn sm primary",
						type: "submit",
						disabled: mode === "warn" && !reason.trim(),
						children: mode === "warn" ? "Send warning" : mode === "kick" ? "Kick" : "Ban"
					})]
				})
			]
		})]
	});
}
function LensFilter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: "0",
		height: "0",
		style: { position: "absolute" },
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("filter", {
			id: "lg-lens",
			x: "0%",
			y: "0%",
			width: "100%",
			height: "100%",
			colorInterpolationFilters: "sRGB",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("feTurbulence", {
					type: "fractalNoise",
					baseFrequency: "0.008 0.012",
					numOctaves: "2",
					seed: "7",
					result: "noise"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("feGaussianBlur", {
					in: "noise",
					stdDeviation: "2",
					result: "soft"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("feDisplacementMap", {
					in: "SourceGraphic",
					in2: "soft",
					scale: "38",
					xChannelSelector: "R",
					yChannelSelector: "G"
				})
			]
		})
	});
}
function Room({ mode = "user" }) {
	const bunny = useBunny(mode);
	const [membersOpen, setMembersOpen] = (0, import_react.useState)(true);
	const [showSearch, setShowSearch] = (0, import_react.useState)(false);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [menu, setMenu] = (0, import_react.useState)(null);
	const [refract, setRefract] = (0, import_react.useState)(false);
	const composerRef = (0, import_react.useRef)(null);
	const closeMenu = (0, import_react.useCallback)(() => setMenu(null), []);
	const s = bunny.settings;
	const me = bunny.identity?.id || "";
	const isAdmin = !!bunny.session;
	const banned = bunny.isBanned(me);
	(0, import_react.useEffect)(() => {
		const brands = navigator.userAgentData?.brands;
		setRefract(!!brands?.some((b) => b.brand === "Chromium"));
		if (window.innerWidth < 860) setMembersOpen(false);
	}, []);
	const flash = bunny.flash;
	const clearFlash = bunny.clearFlash;
	(0, import_react.useEffect)(() => {
		if (!flash) return;
		const t = window.setTimeout(clearFlash, flash.style === "m" ? 4100 : 5600);
		return () => window.clearTimeout(t);
	}, [flash, clearFlash]);
	(0, import_react.useEffect)(() => {
		const unread = bunny.serverUnread + bunny.directUnread;
		document.title = `${unread ? `(${unread}) ` : ""}${mode === "admin" ? "Admin · " : ""}Bunny RTC`;
	}, [
		bunny.serverUnread,
		bunny.directUnread,
		mode
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				bunny.setView({
					tab: "server",
					peer: null
				});
				setShowSearch(true);
			}
			if ((e.metaKey || e.ctrlKey) && e.key === ",") {
				e.preventDefault();
				setSettingsOpen(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [bunny]);
	const accent = /^#[0-9a-fA-F]{6}$/.test(s.accent) ? {
		color: s.accent,
		ink: inkFor(s.accent)
	} : ACCENTS[s.accent] || ACCENTS.teal;
	const wp = bunny.wallpaper;
	const [myWall, setMyWall] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const read = () => {
			try {
				setMyWall(localStorage.getItem("bunny_mywall"));
			} catch {
				setMyWall(null);
			}
		};
		read();
		window.addEventListener("bunny-mywall", read);
		return () => window.removeEventListener("bunny-mywall", read);
	}, []);
	const [wallMedia, setWallMedia] = (0, import_react.useState)(null);
	const wallRef = wp?.mode === "media" ? wp.media : void 0;
	(0, import_react.useEffect)(() => {
		setWallMedia(null);
		if (!wallRef) return;
		let alive = true;
		bunny.loadMedia(wallRef).then((url) => alive && setWallMedia({
			url,
			kind: wallRef.kind
		}), () => void 0);
		return () => {
			alive = false;
		};
	}, [wallRef, bunny.loadMedia]);
	let wallStyle;
	if (myWall && safeWallpaperUrl(myWall)) wallStyle = { backgroundImage: `url("${myWall}")` };
	else if (wp?.mode === "preset" && wp.value && PRESETS[wp.value]) wallStyle = { background: PRESETS[wp.value].css };
	else if (wp?.mode === "image" && safeWallpaperUrl(wp.value)) wallStyle = { backgroundImage: `url("${wp.value}")` };
	else if (wp?.mode === "media" && wallMedia?.kind === "image") wallStyle = { backgroundImage: `url("${wallMedia.url}")` };
	const wallVideo = !myWall && wp?.mode === "media" && wallMedia?.kind === "video" ? wallMedia.url : null;
	const wallKey = myWall ? "mine" : wp ? `${wp.mode}:${wp.at}:${wallMedia ? 1 : 0}` : "default";
	const dockRef = (0, import_react.useRef)(null);
	const [pill, setPill] = (0, import_react.useState)(null);
	(0, import_react.useLayoutEffect)(() => {
		const measure = () => {
			const el = dockRef.current?.querySelector(".seg.active");
			setPill(el ? {
				left: el.offsetLeft,
				width: el.offsetWidth
			} : null);
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [
		bunny.view.tab,
		bunny.adminMode,
		bunny.session
	]);
	const people = bunny.people.filter((p) => !bunny.blocked.includes(p.id) && (bunny.adminMode || !bunny.isBanned(p.id)));
	const tab = bunny.view.tab;
	const mention = (name) => {
		bunny.setView({
			tab: "server",
			peer: null
		});
		window.setTimeout(() => {
			const el = composerRef.current;
			if (!el) return;
			(Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set)?.call(el, `${el.value}${el.value && !el.value.endsWith(" ") ? " " : ""}@${name.split(/\s+/)[0]} `);
			el.dispatchEvent(new Event("input", { bubbles: true }));
			el.focus();
		}, 30);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `stage ${refract ? "refract" : ""}`,
		"data-glass": s.glass,
		"data-size": s.textSize,
		"data-motion": s.reduceMotion ? "reduce" : void 0,
		style: {
			"--accent": accent.color,
			"--accent-ink": accent.ink,
			"--dim": String(s.dim / 100),
			"--color-accent": accent.color
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LensFilter, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MediaLoader.Provider, {
			value: bunny.loadMedia,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "wallpaper",
					style: wallStyle,
					children: wallVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						className: "wallpaper-video",
						src: wallVideo,
						autoPlay: true,
						muted: true,
						loop: true,
						playsInline: true
					}) : null
				}, wallKey),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shell",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "topbar",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "brand lg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mark",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarMark, { className: "size-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: ["Bunny RTC", mode === "admin" ? " · Admin" : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: `live-dot ${bunny.online ? "on" : ""}` }), bunny.online ? `${bunny.people.length} online` : bunny.status] })] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
									className: "dockbar lg lg-lens",
									"aria-label": "Sections",
									ref: dockRef,
									children: [
										pill ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "seg-pill",
											style: {
												transform: `translateX(${pill.left}px)`,
												width: pill.width
											},
											"aria-hidden": true
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: `seg ${tab === "server" ? "active" : ""}`,
											"aria-current": tab === "server",
											onClick: () => bunny.setView({
												tab: "server",
												peer: null
											}),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { size: 16 }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "seg-label",
													children: "Server"
												}),
												bunny.serverUnread && tab !== "server" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "badge",
													children: bunny.serverUnread > 99 ? "99+" : bunny.serverUnread
												}) : null
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: `seg ${tab === "direct" ? "active" : ""}`,
											"aria-current": tab === "direct",
											onClick: () => bunny.setView({
												tab: "direct",
												peer: tab === "direct" ? null : bunny.view.peer
											}),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtSign, { size: 16 }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "seg-label",
													children: "Direct"
												}),
												bunny.directUnread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "badge",
													children: bunny.directUnread
												}) : null
											]
										}),
										bunny.adminMode && isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: `seg mod ${tab === "mod" ? "active" : ""}`,
											"aria-current": tab === "mod",
											onClick: () => bunny.setView({
												tab: "mod",
												peer: null
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "seg-label",
												children: "Admin"
											})]
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "tools lg",
									children: [
										tab === "server" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: `gbtn icon ${showSearch ? "on" : ""}`,
											type: "button",
											"aria-label": "Search messages",
											"aria-pressed": showSearch,
											onClick: () => setShowSearch((v) => !v),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 18 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: `gbtn icon ${membersOpen ? "on" : ""}`,
											type: "button",
											"aria-label": "Members",
											"aria-pressed": membersOpen,
											onClick: () => setMembersOpen((v) => !v),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 18 })
										})] }) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "gbtn icon",
											type: "button",
											"aria-label": "Settings",
											onClick: () => setSettingsOpen(true),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 18 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "gbtn icon",
											type: "button",
											"aria-label": "Your profile",
											onClick: (e) => setMenu({
												id: me,
												x: e.clientX - 240,
												y: e.clientY + 16
											}),
											style: { padding: 0 },
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
												avatar: bunny.profile.avatar,
												anim: bunny.canAnimate(me) ? bunny.profile.anim : void 0,
												color: bunny.profile.color,
												label: bunny.profile.name || "You",
												status: s.status,
												size: "2.1rem"
											})
										})
									]
								})
							]
						}),
						bunny.announce?.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "announce lg-soft",
							role: "status",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { size: 16 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: bunny.announce.text }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: bunny.announce.byName })
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
							className: "body view-enter",
							children: [
								tab === "server" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerView, {
									bunny,
									showSearch,
									openMenu: setMenu,
									composerRef
								}), membersOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
									className: "side floating lg-panel",
									"aria-label": "Members",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "side-head",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: ["Online · ", people.length] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "gbtn sm icon",
											type: "button",
											"aria-label": "Close members",
											onClick: () => setMembersOpen(false),
											style: {
												background: "transparent",
												boxShadow: "none"
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 })
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "people",
										children: people.map((p, idx) => {
											const admin = bunny.isAdminPerson(p.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "person",
												style: { "--i": Math.min(idx, 12) },
												onClick: (e) => setMenu({
													id: p.id,
													x: e.clientX - 20,
													y: e.clientY + 8
												}),
												onContextMenu: (e) => {
													e.preventDefault();
													setMenu({
														id: p.id,
														x: e.clientX,
														y: e.clientY
													});
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
													avatar: p.avatar,
													anim: bunny.lookup(p.id).anim,
													color: p.color,
													label: p.name,
													status: p.status || "online"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "meta",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [p.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadge, {
														role: admin || !bunny.admins[p.id] ? bunny.roleOf(p.id) : null,
														admin
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.id === me ? "You" : p.bio || (bunny.friends[p.id] ? "Friend" : p.status === "dnd" ? "Do not disturb" : p.status === "idle" ? "Idle" : "Online") })]
												})]
											}, p.id);
										})
									})]
								}) : null] }) : null,
								tab === "direct" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DirectView, {
									bunny,
									openMenu: setMenu
								}) : null,
								tab === "mod" && bunny.adminMode && isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModView, {
									bunny,
									openMenu: setMenu
								}) : null
							]
						}, tab)
					]
				}),
				menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserMenu, {
					bunny,
					target: menu,
					onClose: closeMenu,
					onMention: mention
				}) : null,
				settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSheet, {
					bunny,
					onClose: () => setSettingsOpen(false)
				}) : null,
				bunny.toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "toast lg",
					children: bunny.toast
				}) : null,
				flash?.style === "m" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flash-m",
					role: "alert",
					"aria-live": "assertive",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flash-card lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flash-from",
							children: ["Message from ", flash.byName]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: flash.text })]
					})
				}, flash.id) : null,
				flash?.style === "h" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flash-h lg",
					role: "status",
					"aria-live": "polite",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [flash.byName, ":"] }),
						" ",
						flash.text
					] })]
				}, flash.id) : null,
				bunny.kicked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "backdrop",
					style: {
						background: "rgba(2,6,10,0.55)",
						zIndex: 60
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal lg",
						role: "alertdialog",
						"aria-labelledby": "kick-title",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "gate-icon",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 24 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "kick-title",
								children: "You were kicked"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								style: { margin: "0.5rem 0 0.8rem" },
								children: [bunny.kicked.byName, " removed you from the room."]
							}),
							bunny.kicked.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "callout",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									"“",
									bunny.kicked.reason,
									"”"
								] })]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "row",
								style: {
									justifyContent: "flex-end",
									marginTop: "0.9rem"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "gbtn primary",
									type: "button",
									onClick: () => window.location.reload(),
									children: "Rejoin"
								})
							})
						]
					})
				}) : null,
				bunny.warnings[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "backdrop",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal lg",
						role: "alertdialog",
						"aria-labelledby": "warn-title",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "gate-icon",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 24 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "warn-title",
								children: "You've received a warning"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								style: { margin: "0.5rem 0 0.8rem" },
								children: "An admin flagged something you did in Bunny RTC."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "callout",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									"“",
									bunny.warnings[0].reason,
									"”"
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								style: { fontSize: "0.78rem" },
								children: "Repeated problems can lead to a ban."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "row",
								style: {
									justifyContent: "flex-end",
									marginTop: "0.9rem"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "gbtn primary",
									type: "button",
									onClick: () => bunny.ackWarning(bunny.warnings[0].id),
									children: "I understand"
								})
							})
						]
					})
				}) : null,
				banned && !bunny.adminMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "backdrop",
					style: { background: "rgba(2,6,10,0.55)" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal lg",
						role: "alertdialog",
						"aria-labelledby": "ban-title",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "gate-icon",
								style: { color: "#ff8b8b" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { size: 24 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "ban-title",
								children: "You've been banned"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								style: { margin: "0.5rem 0 0.8rem" },
								children: "An admin removed you from this server. You can't send messages or DMs."
							}),
							bunny.bans[me]?.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "callout red",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									"Reason: “",
									bunny.bans[me].reason,
									"”"
								] })]
							}) : null
						]
					})
				}) : null
			]
		})]
	});
}
//#endregion
export { tokenToIdentity as a, saveIdentity as i, loadIdentity as n, verifyCert as o, ls as r, Room as t };
