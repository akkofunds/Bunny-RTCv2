import { createServerFn } from "@tanstack/react-start";

type Point = { x: string; y: string };

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const point = (v: unknown): Point => {
  const p = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { x: str(p.x, 64), y: str(p.y, 64) };
};

export const verifyAdminCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ({ code: str((data as { code?: unknown })?.code, 128) }))
  .handler(async ({ data }) => {
    const { checkPassphrase } = await import("./admin.server");
    return { ok: await checkPassphrase(data.code) };
  });

export const verifyAdminSecond = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data || {}) as Record<string, unknown>;
    return { code: str(d.code, 128), answer: str(d.answer, 64) };
  })
  .handler(async ({ data }) => {
    const { checkSecond } = await import("./admin.server");
    return { ok: await checkSecond(data.code, data.answer) };
  });

export const grantAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data || {}) as Record<string, unknown>;
    return {
      code: str(d.code, 128),
      answer: str(d.answer, 64),
      id: str(d.id, 40),
      name: str(d.name, 24),
      sign: point(d.sign),
      box: point(d.box),
    };
  })
  .handler(async ({ data }) => {
    const { issueAdmin } = await import("./admin.server");
    return issueAdmin({
      passphrase: data.code,
      answer: data.answer,
      id: data.id,
      name: data.name,
      sign: data.sign,
      box: data.box,
    });
  });
