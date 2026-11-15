import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Shield } from "lucide-react";
import type { Status } from "@/lib/bunny/types";

export function BunnyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 10c0-4 1.2-7 2.2-7 .6 2.2.4 4.2-.2 6" />
      <path d="M16 10c0-4-1.2-7-2.2-7-.6 2.2-.4 4.2.2 6" />
      <path d="M7 13.5a5 5 0 0 0 10 0c0-2.2-1.4-3.5-5-3.5s-5 1.3-5 3.5z" />
      <circle cx="10" cy="13" r=".7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r=".7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Face({
  avatar,
  color,
  label,
  status,
  size,
}: {
  avatar?: string;
  color: string;
  label: string;
  status?: Status;
  size?: string;
}) {
  return (
    <span
      className="avatar"
      style={{ background: `radial-gradient(circle at 32% 25%, color-mix(in srgb, ${color} 70%, white), ${color} 70%)`, ...(size ? { width: size, height: size } : {}) }}
      role="img"
      aria-label={label}
    >
      {avatar ? <img src={avatar} alt="" /> : <BunnyMark />}
      {status ? <i className={`dot ${status}`} aria-hidden /> : null}
    </span>
  );
}

export function AdminTag() {
  return (
    <span className="tag" title="Verified Bunny RTC admin">
      <Shield size={10} strokeWidth={2.6} />
      Admin
    </span>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="toggle" onClick={() => onChange(!on)} />;
}

export function Choices<V extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div className="choices" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A floating glass menu anchored at a point, kept inside the viewport. */
export function Floating({ x, y, onClose, children }: { x: number; y: number; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pad = 10;
    setPos({
      left: Math.max(pad, Math.min(x, window.innerWidth - el.offsetWidth - pad)),
      top: Math.max(pad, Math.min(y, window.innerHeight - el.offsetHeight - pad)),
    });
  }, [x, y, children]);
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
  return (
    <div ref={ref} className="menu lg" style={pos} role="menu">
      {children}
    </div>
  );
}

export async function shrinkImage(file: File, size = 128) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("bad image"));
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
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Downscale a wallpaper to something the relay can carry (~<450 KB). */
export async function shrinkWallpaper(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("bad image"));
      el.src = url;
    });
    for (const [max, q] of [
      [1920, 0.72],
      [1600, 0.66],
      [1280, 0.62],
      [1024, 0.58],
    ] as const) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", q);
      if (data.length < 450_000) return data;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function timeLabel(ts: number, h24: boolean) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12: !h24 }).format(ts);
}

export function dayLabel(ts: number) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(ts);
}

export function ago(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
