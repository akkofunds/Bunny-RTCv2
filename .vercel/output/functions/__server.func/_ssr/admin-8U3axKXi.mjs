import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { F as LoaderCircle, L as KeyRound, P as LockKeyhole, T as PawPrint, _ as ShieldCheck, tt as ArrowRight } from "../_libs/lucide-react.mjs";
import { a as tokenToIdentity, i as saveIdentity, n as loadIdentity, o as verifyCert, r as ls, t as Room } from "./room-KohEkRyx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-8U3axKXi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var str = (v, max = 200) => typeof v === "string" ? v.slice(0, max) : "";
var point = (v) => {
	const p = v && typeof v === "object" ? v : {};
	return {
		x: str(p.x, 64),
		y: str(p.y, 64)
	};
};
var verifyAdminCode = createServerFn({ method: "POST" }).inputValidator((data) => ({ code: str(data?.code, 128) })).handler(createSsrRpc("85423b703bc6a7bf84190b2db48f48b53024450ce5867420088294e651ac4262"));
var verifyAdminSecond = createServerFn({ method: "POST" }).inputValidator((data) => {
	const d = data || {};
	return {
		code: str(d.code, 128),
		answer: str(d.answer, 64)
	};
}).handler(createSsrRpc("95ace26351240a04cc8b01cc4e3451b2939c876334e633271482fcae3fe4bf6b"));
var grantAdmin = createServerFn({ method: "POST" }).inputValidator((data) => {
	const d = data || {};
	return {
		code: str(d.code, 128),
		answer: str(d.answer, 64),
		id: str(d.id, 40),
		name: str(d.name, 24),
		sign: point(d.sign),
		box: point(d.box)
	};
}).handler(createSsrRpc("2319e38765900e93268750d50c533605351d0b71133572f2191bfe8f128662d3"));
function AdminGate() {
	const [step, setStep] = (0, import_react.useState)("checking");
	const [code, setCode] = (0, import_react.useState)("");
	const [answer, setAnswer] = (0, import_react.useState)("");
	const [token, setToken] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [fails, setFails] = (0, import_react.useState)(0);
	const [lockedUntil, setLockedUntil] = (0, import_react.useState)(0);
	const [now, setNow] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		(async () => {
			const me = await loadIdentity();
			const sess = ls.get("bunny_admin_v1", null);
			if (sess && sess.id === me.id) {
				const claim = await verifyCert(sess.cert);
				if (claim && claim.id === me.id && claim.sign.x === me.sign.x) {
					setStep("ready");
					return;
				}
			}
			setStep("code");
		})();
	}, []);
	(0, import_react.useEffect)(() => {
		if (lockedUntil <= Date.now()) return;
		const t = window.setInterval(() => setNow(Date.now()), 500);
		return () => window.clearInterval(t);
	}, [lockedUntil]);
	const locked = lockedUntil > (now || Date.now());
	const fail = (msg) => {
		setError(msg);
		const n = fails + 1;
		setFails(n);
		if (n % 5 === 0) setLockedUntil(Date.now() + 3e4);
	};
	if (step === "ready") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Room, { mode: "admin" });
	const stepIndex = step === "code" ? 0 : step === "second" ? 1 : 2;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stage",
		style: {
			"--accent": "#ffc35c",
			"--accent-ink": "#2e1d02"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wallpaper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "gate",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "gate-card lg",
				onSubmit: async (e) => {
					e.preventDefault();
					if (busy || locked) return;
					setError("");
					setBusy(true);
					try {
						if (step === "code") {
							if ((await verifyAdminCode({ data: { code } })).ok) setStep("second");
							else fail("That access code isn't right.");
						} else if (step === "second") {
							if ((await verifyAdminSecond({ data: {
								code,
								answer
							} })).ok) setStep("token");
							else fail("That answer isn't right.");
						} else if (step === "token") {
							const identity = tokenToIdentity(token);
							if (!identity) {
								setError("That doesn't look like a Bunny RTC token. Copy it from Settings → Account & token.");
								return;
							}
							const stored = await loadIdentity();
							const name = stored.id === identity.id ? localStorage.getItem("bunny_name") || "" : "";
							const res = await grantAdmin({ data: {
								code,
								answer,
								id: identity.id,
								name,
								sign: {
									x: identity.sign.x,
									y: identity.sign.y
								},
								box: {
									x: identity.box.x,
									y: identity.box.y
								}
							} });
							if (!res.ok) {
								setError(res.error);
								return;
							}
							if (stored.id !== identity.id) saveIdentity(identity);
							ls.set("bunny_admin_v1", {
								id: identity.id,
								cert: res.cert,
								escrow: res.escrow
							});
							setCode("");
							setAnswer("");
							setToken("");
							setStep("ready");
						}
					} catch {
						setError("Couldn't reach the server. Try again.");
					} finally {
						setBusy(false);
					}
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "steps",
						"aria-hidden": true,
						children: [
							0,
							1,
							2
						].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: i <= stepIndex && step !== "checking" ? "done" : "" }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "gate-icon",
						children: step === "second" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { size: 26 }) : step === "token" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 26 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { size: 26 })
					}),
					step === "checking" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Admin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Checking this device…" })] }) : null,
					step === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Admin access" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Enter the admin access code to continue." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							type: "password",
							autoComplete: "off",
							autoFocus: true,
							value: code,
							maxLength: 128,
							placeholder: "Access code",
							"aria-label": "Access code",
							onChange: (e) => setCode(e.target.value)
						})
					] }) : null,
					step === "second" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Two-step check" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Security question: what is your dog's name?" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							type: "password",
							autoComplete: "off",
							autoFocus: true,
							value: answer,
							maxLength: 64,
							placeholder: "Answer",
							"aria-label": "Security answer",
							onChange: (e) => setAnswer(e.target.value)
						})
					] }) : null,
					step === "token" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Link your account" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Paste your token from Settings → Account & token. That account becomes an admin and this device stays signed in." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "input",
							autoFocus: true,
							spellCheck: false,
							value: token,
							placeholder: "bunny_…",
							"aria-label": "Account token",
							onChange: (e) => setToken(e.target.value),
							style: {
								fontFamily: "ui-monospace, monospace",
								fontSize: "0.75rem"
							}
						})
					] }) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "err",
						children: error
					}) : null,
					locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "err",
						children: [
							"Too many tries. Wait ",
							Math.ceil((lockedUntil - (now || Date.now())) / 1e3),
							"s."
						]
					}) : null,
					step !== "checking" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row",
						style: {
							justifyContent: "space-between",
							marginTop: "1rem"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "gbtn",
							href: "/",
							children: "Back to chat"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "gbtn primary",
							type: "submit",
							disabled: busy || locked || (step === "code" ? !code : step === "second" ? !answer : !token.trim()),
							children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 16,
								className: "animate-spin"
							}) : step === "token" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 16 }), step === "token" ? "Grant admin" : "Continue"]
						})]
					}) : null
				]
			})
		})]
	});
}
var SplitComponent = AdminGate;
//#endregion
export { SplitComponent as component };
