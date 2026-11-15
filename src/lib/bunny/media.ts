import { b64u, randomId, unb64u } from "./crypto";

/** A pointer to a file stored in chunks on the relay. */
export type MediaRef = {
  id: string;
  kind: "image" | "video";
  mime: string;
  size: number;
  n: number; // chunk count
  w?: number;
  h?: number;
  name?: string;
  k?: string; // AES-GCM key (DM media only)
  iv?: string;
};

export const CHUNK_BYTES = 192 * 1024;
export const MAX_VIDEO_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_ATTACHMENTS = 4;

const IMAGE_MIMES = new Set(["image/webp", "image/jpeg", "image/png", "image/gif"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type Prepared = { bytes: Uint8Array<ArrayBuffer>; mime: string; kind: "image" | "video"; w?: number; h?: number; name: string; preview: string };

function canvasBlob(canvas: HTMLCanvasElement, type: string, q: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
}

async function decodeImage(file: Blob) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("unreadable"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Turn any image into a web-friendly WebP/JPEG; keep short videos as they are. */
export async function prepareFile(file: File): Promise<Prepared> {
  const name = file.name.slice(0, 80);
  if (file.type.startsWith("video/")) {
    if (!VIDEO_MIMES.has(file.type)) throw new Error("Videos must be MP4, WebM or MOV");
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Videos can be up to 8 MB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const preview = URL.createObjectURL(file);
    const dims = await new Promise<{ w?: number; h?: number }>((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve({ w: v.videoWidth || undefined, h: v.videoHeight || undefined });
      v.onerror = () => resolve({});
      v.src = preview;
    });
    return { bytes, mime: file.type === "video/quicktime" ? "video/mp4" : file.type, kind: "video", ...dims, name, preview };
  }
  if (!file.type.startsWith("image/") && !/\.(png|jpe?g|gif|webp|bmp|avif|heic)$/i.test(file.name)) {
    throw new Error("Only images and videos can be shared");
  }
  // Animated GIFs stay animated when small enough.
  if (file.type === "image/gif" && file.size <= MAX_IMAGE_BYTES) {
    const img = await decodeImage(file);
    return { bytes: new Uint8Array(await file.arrayBuffer()), mime: "image/gif", kind: "image", w: img.naturalWidth, h: img.naturalHeight, name, preview: URL.createObjectURL(file) };
  }
  const img = await decodeImage(file);
  for (const [max, q] of [
    [1920, 0.84],
    [1600, 0.78],
    [1280, 0.72],
    [1024, 0.68],
  ] as const) {
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let blob = await canvasBlob(canvas, "image/webp", q);
    if (!blob || blob.type !== "image/webp") blob = await canvasBlob(canvas, "image/jpeg", q);
    if (blob && blob.size <= 900 * 1024) {
      return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: blob.type, kind: "image", w: canvas.width, h: canvas.height, name, preview: URL.createObjectURL(blob) };
    }
  }
  throw new Error("That image couldn't be processed");
}

export async function packMedia(p: Prepared, encrypt: boolean) {
  let bytes: Uint8Array<ArrayBuffer> = p.bytes;
  const ref: MediaRef = { id: randomId(10), kind: p.kind, mime: p.mime, size: p.bytes.length, n: 0, w: p.w, h: p.h, name: p.name };
  if (encrypt) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
    bytes = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
    ref.k = b64u(raw);
    ref.iv = b64u(iv);
  }
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_BYTES) chunks.push(b64u(bytes.subarray(i, i + CHUNK_BYTES)));
  ref.n = chunks.length;
  return { ref, chunks };
}

export async function unpackMedia(ref: MediaRef, chunks: string[]) {
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
    bytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(ref.iv) }, key, bytes));
  }
  return URL.createObjectURL(new Blob([bytes], { type: ref.mime }));
}

/** Validate refs that arrive from other people. */
export function cleanMedia(value: unknown): MediaRef[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: MediaRef[] = [];
  for (const r of value.slice(0, MAX_ATTACHMENTS) as MediaRef[]) {
    if (!r || typeof r.id !== "string" || !/^[a-z0-9]{6,24}$/.test(r.id)) continue;
    const kind = r.kind === "video" ? "video" : r.kind === "image" ? "image" : null;
    if (!kind) continue;
    if (!(kind === "image" ? IMAGE_MIMES : VIDEO_MIMES).has(r.mime)) continue;
    const n = Number(r.n);
    if (!Number.isInteger(n) || n < 1 || n > 64) continue;
    const dim = (v: unknown) => (typeof v === "number" && v > 0 && v < 20000 ? Math.round(v) : undefined);
    out.push({
      id: r.id,
      kind,
      mime: r.mime,
      size: Math.min(Number(r.size) || 0, 64 * 1024 * 1024),
      n,
      w: dim(r.w),
      h: dim(r.h),
      name: typeof r.name === "string" ? r.name.slice(0, 80) : undefined,
      k: typeof r.k === "string" && /^[A-Za-z0-9_-]{43}$/.test(r.k) ? r.k : undefined,
      iv: typeof r.iv === "string" && /^[A-Za-z0-9_-]{16}$/.test(r.iv) ? r.iv : undefined,
    });
  }
  return out.length ? out : undefined;
}

/** Animated avatars are kept exactly as uploaded (GIF, animated WebP, short MP4/WebM). */
export async function prepareAnimated(file: File): Promise<Prepared> {
  const ok = ["image/gif", "image/webp", "video/mp4", "video/webm"];
  if (!ok.includes(file.type)) throw new Error("Use a GIF, WebP, MP4 or WebM");
  if (file.size > 2 * 1024 * 1024) throw new Error("Animated pictures can be up to 2 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, mime: file.type, kind: file.type.startsWith("video/") ? "video" : "image", name: file.name.slice(0, 80), preview: URL.createObjectURL(file) };
}
