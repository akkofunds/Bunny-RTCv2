import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Smile, c as Pencil, d as Bell, f as BellOff, i as Trash2, l as Link2, n as Users, o as Send, s as Search, t as X, u as Check } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C2F7KYHw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
	onReady;
	onPublish;
	onDown;
	ws = null;
	seq = 1;
	ping = null;
	stopped = false;
	buffer = /* @__PURE__ */ new Uint8Array(0);
	constructor(url, clientId, willTopic, onReady, onPublish, onDown) {
		this.url = url;
		this.clientId = clientId;
		this.willTopic = willTopic;
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
			this.subscribe("bunny-rtc/public/chat");
			this.subscribe("bunny-rtc/public/history/+");
			this.subscribe("bunny-rtc/public/presence/+");
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
var HISTORY = "bunny-rtc/public/history/";
var PRESENCE = "bunny-rtc/public/presence/";
var CHAT = "bunny-rtc/public/chat";
var BROKER = "wss://broker.emqx.io:8084/mqtt";
var QUICK = [
	"🔥",
	"😂",
	"❤️",
	"👍",
	"👀",
	"🐰"
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
	"🐰",
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
var COLORS = [
	"#149c86",
	"#0ea5e9",
	"#d97706",
	"#e11d48",
	"#65a30d",
	"#ea580c",
	"#0891b2",
	"#ca8a04"
];
function cleanName(value) {
	return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 24);
}
function colorFor(id) {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = hash * 33 + id.charCodeAt(i) | 0;
	return COLORS[Math.abs(hash) % COLORS.length];
}
function dayLabel(ts) {
	return new Intl.DateTimeFormat(void 0, {
		weekday: "long",
		month: "long",
		day: "numeric"
	}).format(ts);
}
function timeLabel(ts) {
	return new Intl.DateTimeFormat(void 0, {
		hour: "numeric",
		minute: "2-digit"
	}).format(ts);
}
function BunnyMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className,
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 10c0-4 1.2-7 2.2-7 .6 2.2.4 4.2-.2 6" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 10c0-4-1.2-7-2.2-7-.6 2.2-.4 4.2.2 6" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7 13.5a5 5 0 0 0 10 0c0-2.2-1.4-3.5-5-3.5s-5 1.3-5 3.5z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "10",
				cy: "13",
				r: ".7",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "14",
				cy: "13",
				r: ".7",
				fill: "currentColor",
				stroke: "none"
			})
		]
	});
}
function Face({ avatar, color, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "avatar",
		style: { background: color },
		"aria-label": label,
		children: avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: avatar,
			alt: ""
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BunnyMark, {})
	});
}
async function shrinkImage(file) {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(/* @__PURE__ */ new Error("bad image"));
			el.src = url;
		});
		const size = 96;
		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		const scale = Math.max(size / img.width, size / img.height);
		const w = img.width * scale;
		const h = img.height * scale;
		ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
		return canvas.toDataURL("image/jpeg", .72);
	} finally {
		URL.revokeObjectURL(url);
	}
}
function chime() {
	const ctx = new AudioContext();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.frequency.value = 740;
	gain.gain.value = .03;
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start();
	gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + .12);
	osc.stop(ctx.currentTime + .13);
	osc.onended = () => void ctx.close();
}
function Room() {
	const [selfId, setSelfId] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [avatar, setAvatar] = (0, import_react.useState)();
	const [sound, setSound] = (0, import_react.useState)(true);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("Connecting…");
	const [online, setOnline] = (0, import_react.useState)(false);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [people, setPeople] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [showSearch, setShowSearch] = (0, import_react.useState)(false);
	const [picker, setPicker] = (0, import_react.useState)(false);
	const [membersOpen, setMembersOpen] = (0, import_react.useState)(false);
	const [profileOpen, setProfileOpen] = (0, import_react.useState)(false);
	const [draftName, setDraftName] = (0, import_react.useState)("");
	const [draftAvatar, setDraftAvatar] = (0, import_react.useState)();
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [editText, setEditText] = (0, import_react.useState)("");
	const [toast, setToast] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	const threadRef = (0, import_react.useRef)(null);
	const socketRef = (0, import_react.useRef)(null);
	const stickRef = (0, import_react.useRef)(true);
	const knownRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const selfRef = (0, import_react.useRef)({
		id: "",
		name: "",
		avatar: void 0,
		color: COLORS[0]
	});
	(0, import_react.useEffect)(() => {
		const id = localStorage.getItem("bunny_id") || crypto.randomUUID().replaceAll("-", "").slice(0, 16);
		localStorage.setItem("bunny_id", id);
		const storedName = cleanName(localStorage.getItem("bunny_name") || "") || `Guest-${id.slice(0, 4)}`;
		const storedAvatar = localStorage.getItem("bunny_avatar") || void 0;
		const storedSound = localStorage.getItem("bunny_sound") !== "0";
		setSelfId(id);
		setName(storedName);
		setAvatar(storedAvatar);
		setSound(storedSound);
		setReady(true);
		selfRef.current = {
			id,
			name: storedName,
			avatar: storedAvatar,
			color: colorFor(id)
		};
	}, []);
	(0, import_react.useEffect)(() => {
		selfRef.current = {
			id: selfId,
			name,
			avatar,
			color: colorFor(selfId || "x")
		};
	}, [
		selfId,
		name,
		avatar
	]);
	(0, import_react.useEffect)(() => {
		if (!ready || !selfId) return;
		let retry = 0;
		let timer = 0;
		let beat = 0;
		const peopleMap = /* @__PURE__ */ new Map();
		const msgMap = /* @__PURE__ */ new Map();
		const publishPresence = (sock) => {
			const me = selfRef.current;
			sock.publish(PRESENCE + me.id, JSON.stringify({
				id: me.id,
				name: me.name,
				color: me.color,
				avatar: me.avatar,
				at: Date.now()
			}), true);
		};
		const flushPeople = () => {
			const cutoff = Date.now() - 4e4;
			const list = [...peopleMap.values()].filter((p) => p.at >= cutoff);
			if (!list.some((p) => p.id === selfRef.current.id)) list.push({
				id: selfRef.current.id,
				name: selfRef.current.name,
				color: selfRef.current.color,
				avatar: selfRef.current.avatar,
				at: Date.now()
			});
			setPeople(list.sort((a, b) => a.name.localeCompare(b.name)));
		};
		const connect = () => {
			window.clearTimeout(timer);
			setStatus("Connecting…");
			setOnline(false);
			const sock = new BunnySocket(BROKER, `bunny-${selfId}-${Math.random().toString(36).slice(2, 6)}`, PRESENCE + selfId, () => {
				setOnline(true);
				setStatus("Live");
				publishPresence(sock);
				window.clearInterval(beat);
				beat = window.setInterval(() => {
					publishPresence(sock);
					flushPeople();
				}, 12e3);
			}, (topic, payload) => {
				if (topic.startsWith(HISTORY) || topic === CHAT) {
					const key = topic.startsWith(HISTORY) ? topic : "";
					if (!payload) {
						if (key) {
							msgMap.delete(key);
							setMessages([...msgMap.values()].sort((a, b) => a.at - b.at));
						}
						return;
					}
					try {
						const msg = JSON.parse(payload);
						if (!msg?.id || typeof msg.text !== "string" || typeof msg.authorId !== "string") return;
						const storeKey = `${HISTORY}${msg.id}`;
						const fresh = !knownRef.current.has(msg.id);
						knownRef.current.add(msg.id);
						msgMap.set(storeKey, {
							...msg,
							name: cleanName(msg.name) || "Guest",
							text: msg.text.slice(0, 500)
						});
						const next = [...msgMap.values()].sort((a, b) => a.at - b.at).slice(-160);
						setMessages(next);
						if (fresh && msg.authorId !== selfRef.current.id && localStorage.getItem("bunny_sound") !== "0") try {
							chime();
						} catch {}
					} catch {}
					return;
				}
				if (topic.startsWith(PRESENCE)) {
					const id = topic.slice(26);
					if (!payload) peopleMap.delete(id);
					else try {
						const person = JSON.parse(payload);
						if (person?.id === id) peopleMap.set(id, {
							...person,
							name: cleanName(person.name) || "Guest",
							at: Date.now()
						});
					} catch {}
					flushPeople();
				}
			}, (reason) => {
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
		return () => {
			window.clearTimeout(timer);
			window.clearInterval(beat);
			const sock = socketRef.current;
			socketRef.current = null;
			sock?.publish(PRESENCE + selfId, "", true);
			sock?.stop();
		};
	}, [ready, selfId]);
	(0, import_react.useEffect)(() => {
		const el = threadRef.current;
		if (!el || !stickRef.current) return;
		el.scrollTop = el.scrollHeight;
	}, [messages, query]);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const t = window.setTimeout(() => setToast(""), 1600);
		return () => window.clearTimeout(t);
	}, [toast]);
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
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return q ? messages.filter((m) => m.text.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) : messages;
	}, [messages, query]);
	function publishMessage(msg, announce = false) {
		const sock = socketRef.current;
		if (!sock) return;
		const body = JSON.stringify(msg);
		sock.publish(`${HISTORY}${msg.id}`, body, true);
		if (announce) sock.publish(CHAT, body, false);
	}
	function send() {
		const text = draft.trim().slice(0, 500);
		if (!text || !online || !selfId) return;
		const msg = {
			id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
			authorId: selfId,
			name,
			text,
			at: Date.now()
		};
		knownRef.current.add(msg.id);
		publishMessage(msg, true);
		setDraft("");
		stickRef.current = true;
	}
	function saveEdit(msg) {
		const text = editText.trim().slice(0, 500);
		if (!text) return;
		publishMessage({
			...msg,
			text,
			name,
			editedAt: Date.now()
		});
		setEditing(null);
	}
	function remove(msg) {
		socketRef.current?.publish(`${HISTORY}${msg.id}`, "", true);
		setConfirmDelete(null);
		setToast("Message deleted");
	}
	function react(msg, emoji) {
		const current = { ...msg.reactions || {} };
		const ids = new Set(current[emoji] || []);
		if (ids.has(selfId)) ids.delete(selfId);
		else ids.add(selfId);
		if (ids.size) current[emoji] = [...ids];
		else delete current[emoji];
		publishMessage({
			...msg,
			reactions: current
		});
	}
	function saveProfile() {
		const next = cleanName(draftName);
		if (next.length < 2) return;
		setName(next);
		setAvatar(draftAvatar);
		localStorage.setItem("bunny_name", next);
		if (draftAvatar) localStorage.setItem("bunny_avatar", draftAvatar);
		else localStorage.removeItem("bunny_avatar");
		localStorage.setItem("bunny_sound", sound ? "1" : "0");
		selfRef.current = {
			id: selfId,
			name: next,
			avatar: draftAvatar,
			color: colorFor(selfId)
		};
		if (socketRef.current) socketRef.current.publish(PRESENCE + selfId, JSON.stringify({
			id: selfId,
			name: next,
			color: colorFor(selfId),
			avatar: draftAvatar,
			at: Date.now()
		}), true);
		setProfileOpen(false);
		setToast("Profile saved");
	}
	const count = people.length || (online ? 1 : 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stage",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wallpaper" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "shell",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "topbar glass",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "brand",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mark",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BunnyMark, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Bunny RTC" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "One shared room" })] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "tools",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "pill",
									type: "button",
									onClick: () => setShowSearch((v) => !v),
									"aria-pressed": showSearch,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Find" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: `iconbtn ${sound ? "on" : ""}`,
									type: "button",
									"aria-label": sound ? "Mute sounds" : "Unmute sounds",
									onClick: () => {
										const next = !sound;
										setSound(next);
										localStorage.setItem("bunny_sound", next ? "1" : "0");
									},
									children: sound ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: `iconbtn ${membersOpen ? "on" : ""}`,
									type: "button",
									"aria-label": "People here",
									onClick: () => setMembersOpen((v) => !v),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "pill",
									type: "button",
									onClick: async () => {
										try {
											await navigator.clipboard.writeText(location.href);
											setToast("Invite link copied");
										} catch {
											setToast("Could not copy the link");
										}
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Invite" })]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "status",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: online ? `${count} here · ${status}` : status }), !online && ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => window.location.reload(),
							children: "Retry"
						}) : null]
					}),
					showSearch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "search",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Filter this room",
							"aria-label": "Filter messages"
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "body",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "thread",
							ref: threadRef,
							onScroll: (e) => {
								const el = e.currentTarget;
								stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "welcome",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Welcome to Bunny RTC" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Everyone on this page shares one room. The view stays clear. Glass only wraps the controls." })]
								}),
								visible.map((msg, index) => {
									const prev = visible[index - 1];
									const grouped = !!prev && prev.authorId === msg.authorId && msg.at - prev.at < 3e5 && dayLabel(prev.at) === dayLabel(msg.at);
									const showDay = !prev || dayLabel(prev.at) !== dayLabel(msg.at);
									const mine = msg.authorId === selfId;
									const person = people.find((p) => p.id === msg.authorId);
									const color = person?.color || colorFor(msg.authorId);
									const face = person?.avatar;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [showDay ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "day",
										children: dayLabel(msg.at)
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
										className: grouped ? "msg group" : "msg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
											avatar: face,
											color,
											label: msg.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "who",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: msg.name }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "stamp",
														children: timeLabel(msg.at)
													}),
													msg.editedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "edited",
														children: "edited"
													}) : null,
													mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "row-actions",
														children: [
															QUICK.map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																className: "tiny",
																type: "button",
																"aria-label": `React ${emoji}`,
																onClick: () => react(msg, emoji),
																children: emoji
															}, emoji)),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																className: "tiny",
																type: "button",
																"aria-label": "Edit message",
																onClick: () => {
																	setEditing(msg.id);
																	setEditText(msg.text);
																	setConfirmDelete(null);
																},
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 })
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																className: "tiny danger",
																type: "button",
																"aria-label": "Delete message",
																onClick: () => setConfirmDelete(msg.id),
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
															})
														]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "row-actions",
														children: [QUICK.map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: "tiny",
															type: "button",
															"aria-label": `React ${emoji}`,
															onClick: () => react(msg, emoji),
															children: emoji
														}, emoji)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: "tiny",
															type: "button",
															"aria-label": "Copy message",
															onClick: async () => {
																await navigator.clipboard.writeText(msg.text);
																setToast("Copied");
															},
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { size: 14 })
														})]
													})
												]
											}),
											editing === msg.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "editbox",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
													value: editText,
													maxLength: 500,
													onChange: (e) => setEditText(e.target.value),
													"aria-label": "Edit message"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "edit-actions",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: "btn primary",
														type: "button",
														onClick: () => saveEdit(msg),
														children: "Save"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: "btn quiet",
														type: "button",
														onClick: () => setEditing(null),
														children: "Cancel"
													})]
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text",
												children: msg.text
											}),
											confirmDelete === msg.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "edit-actions",
												style: { marginTop: "0.4rem" },
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn primary",
													type: "button",
													onClick: () => remove(msg),
													children: "Delete"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn quiet",
													type: "button",
													onClick: () => setConfirmDelete(null),
													children: "Keep"
												})]
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "reacts",
												children: QUICK.map((emoji) => {
													const n = msg.reactions?.[emoji]?.length || 0;
													if (!n) return null;
													const mineReact = !!msg.reactions?.[emoji]?.includes(selfId);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														className: mineReact ? "react mine" : "react",
														onClick: () => react(msg, emoji),
														children: [
															emoji,
															" ",
															n
														]
													}, emoji);
												})
											})
										] })]
									})] }, msg.id);
								}),
								query && visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "welcome",
									children: "Nothing matches that."
								}) : null
							]
						}), membersOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "side glass-soft",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: ["Here now · ", count] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "iconbtn",
								type: "button",
								"aria-label": "Close people",
								onClick: () => setMembersOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "people",
								children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "person",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
										avatar: person.avatar,
										color: person.color || colorFor(person.id),
										label: person.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [person.name, person.id === selfId ? " · you" : ""] })]
								}, person.id))
							})]
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "dock glass",
						style: { position: "relative" },
						children: [
							picker ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "picker glass-soft",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Emoji" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid",
									children: EMOJIS.map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											setDraft((d) => (d + emoji).slice(0, 500));
										},
										children: emoji
									}, emoji))
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "composer",
								onSubmit: (e) => {
									e.preventDefault();
									send();
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "iconbtn",
										type: "button",
										"data-emoji-toggle": true,
										"aria-label": "Emoji",
										"aria-expanded": picker,
										onClick: () => setPicker((v) => !v),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, { size: 20 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft,
										maxLength: 500,
										disabled: !online,
										placeholder: online ? "Message everyone" : "Waiting for the room",
										"aria-label": "Message",
										onChange: (e) => setDraft(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Escape") setPicker(false);
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "send",
										type: "submit",
										disabled: !online || !draft.trim(),
										"aria-label": "Send",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "me",
								type: "button",
								onClick: () => {
									setDraftName(name);
									setDraftAvatar(avatar);
									setProfileOpen(true);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
									avatar,
									color: colorFor(selfId || "me"),
									label: name || "You"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name || "You" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Profile" })] })]
							})
						]
					})
				]
			}),
			toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "toast glass",
				children: toast
			}) : null,
			profileOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "backdrop",
				onMouseDown: () => setProfileOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "modal glass-soft",
					role: "dialog",
					"aria-labelledby": "profile-title",
					onMouseDown: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "profile-title",
							children: "Profile"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "iconbtn",
							type: "button",
							"aria-label": "Close profile",
							onClick: () => setProfileOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "profile",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, {
								avatar: draftAvatar,
								color: colorFor(selfId || "me"),
								label: "Preview"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stack",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "btn quiet file",
									children: ["Upload photo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "image/*",
										onChange: async (e) => {
											const file = e.target.files?.[0];
											if (!file) return;
											const data = await shrinkImage(file);
											if (data) setDraftAvatar(data);
										}
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn quiet",
									type: "button",
									onClick: () => setDraftAvatar(void 0),
									children: "Use bunny color"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "display-name",
								children: "Display name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "display-name",
								value: draftName,
								maxLength: 24,
								onChange: (e) => setDraftName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "switch",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Message sounds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "iconbtn",
								type: "button",
								"aria-pressed": sound,
								onClick: () => setSound((v) => !v),
								children: sound ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "foot",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn quiet",
								type: "button",
								onClick: () => setProfileOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn primary",
								type: "button",
								onClick: saveProfile,
								children: "Save"
							})]
						})
					]
				})
			}) : null
		]
	});
}
var SplitComponent = Room;
//#endregion
export { SplitComponent as component };
