import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-fns-DDFwcqcA.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
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
var verifyAdminCode_createServerFn_handler = createServerRpc({
	id: "85423b703bc6a7bf84190b2db48f48b53024450ce5867420088294e651ac4262",
	name: "verifyAdminCode",
	filename: "src/lib/admin/admin-fns.ts"
}, (opts) => verifyAdminCode.__executeServer(opts));
var verifyAdminCode = createServerFn({ method: "POST" }).inputValidator((data) => ({ code: str(data?.code, 128) })).handler(verifyAdminCode_createServerFn_handler, async ({ data }) => {
	const { checkPassphrase } = await import("./admin.server-DeuIDaqU.mjs");
	return { ok: await checkPassphrase(data.code) };
});
var verifyAdminSecond_createServerFn_handler = createServerRpc({
	id: "95ace26351240a04cc8b01cc4e3451b2939c876334e633271482fcae3fe4bf6b",
	name: "verifyAdminSecond",
	filename: "src/lib/admin/admin-fns.ts"
}, (opts) => verifyAdminSecond.__executeServer(opts));
var verifyAdminSecond = createServerFn({ method: "POST" }).inputValidator((data) => {
	const d = data || {};
	return {
		code: str(d.code, 128),
		answer: str(d.answer, 64)
	};
}).handler(verifyAdminSecond_createServerFn_handler, async ({ data }) => {
	const { checkSecond } = await import("./admin.server-DeuIDaqU.mjs");
	return { ok: await checkSecond(data.code, data.answer) };
});
var grantAdmin_createServerFn_handler = createServerRpc({
	id: "2319e38765900e93268750d50c533605351d0b71133572f2191bfe8f128662d3",
	name: "grantAdmin",
	filename: "src/lib/admin/admin-fns.ts"
}, (opts) => grantAdmin.__executeServer(opts));
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
}).handler(grantAdmin_createServerFn_handler, async ({ data }) => {
	const { issueAdmin } = await import("./admin.server-DeuIDaqU.mjs");
	return issueAdmin({
		passphrase: data.code,
		answer: data.answer,
		id: data.id,
		name: data.name,
		sign: data.sign,
		box: data.box
	});
});
//#endregion
export { grantAdmin_createServerFn_handler, verifyAdminCode_createServerFn_handler, verifyAdminSecond_createServerFn_handler };
