import type { Cert, Point, PrivJwk } from "./crypto";
import type { MediaRef } from "./media";

const LIVE_BROKER = "wss://broker.emqx.io:8084/mqtt";
/** Dev builds only: allow a local broker for testing. Production always uses the live relay. */
export const BROKER = (() => {
  try {
    const dev = typeof window !== "undefined" && import.meta.env.DEV ? localStorage.getItem("bunny_broker") : null;
    return dev && /^wss?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(dev) ? dev : LIVE_BROKER;
  } catch {
    return LIVE_BROKER;
  }
})();
/** Dev builds can be pointed at a scratch namespace so testing never touches the live room. */
function namespace() {
  try {
    const dev = typeof window !== "undefined" && import.meta.env.DEV ? localStorage.getItem("bunny_ns") : null;
    return dev && /^[a-z0-9-]{3,40}$/.test(dev) ? dev : "bunny-rtc";
  } catch {
    return "bunny-rtc";
  }
}
const NS = namespace();
export const T = {
  CHAT: `${NS}/public/chat`,
  HISTORY: `${NS}/public/history/`,
  PRESENCE: `${NS}/public/presence/`,
  TYPING: `${NS}/public/typing`,
  ADMINS: `${NS}/public/admins/`,
  MOD: `${NS}/public/mod/`,
  INBOX: `${NS}/v2/inbox/`,
  MODLOG: `${NS}/v2/modlog/`,
  MEDIA: `${NS}/v2/media/`,
} as const;

export type Status = "online" | "idle" | "dnd";

export type Msg = {
  id: string;
  authorId: string;
  name: string;
  text: string;
  at: number;
  editedAt?: number;
  reactions?: Record<string, string[]>;
  replyTo?: { id: string; name: string; text: string };
  media?: MediaRef[];
  sig?: string;
};

export type Person = {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  bio?: string;
  status?: Status;
  box?: Point;
  ts?: number;
  sig?: string;
  at: number;
};

export type DmMsg = {
  id: string;
  from: string;
  to: string;
  at: number;
  text: string;
  name: string;
  color?: string;
  media?: MediaRef[];
};

export type Friend = { id: string; name: string; color: string; avatar?: string; box: Point; since: number };
export type FriendReq = { from: string; name: string; color: string; box: Point; at: number };

export type ModLog = {
  key: string;
  kind: "delete" | "edit";
  scope: "server" | "direct";
  msgId: string;
  authorId: string;
  authorName: string;
  before: string;
  after?: string;
  actorId?: string;
  actorName?: string;
  at: number;
};

export type BanRec = { kind: "ban" | "unban"; target: string; targetName: string; reason: string; at: number; by: string; byName: string };
export type WarnRec = { kind: "warn"; id: string; target: string; targetName: string; reason: string; at: number; by: string; byName: string };
export type WallpaperRec = { kind: "wallpaper"; mode: "default" | "preset" | "image"; value?: string; at: number; by: string; byName: string };
export type RoomRec = { kind: "room"; slowmode: number; locked: boolean; at: number; by: string; byName: string };
export type FlashRec = { kind: "flash"; id: string; style: "m" | "h"; text: string; at: number; by: string; byName: string };
export type KickRec = { kind: "kick"; target: string; targetName: string; reason: string; at: number; by: string; byName: string };
export type AnnounceRec = { kind: "announce"; text: string; at: number; by: string; byName: string };

export type AdminSession = { id: string; cert: Cert; escrow: PrivJwk };

export type Profile = { name: string; avatar?: string; bio: string; color: string };

export type Settings = {
  sounds: boolean;
  desktop: boolean;
  notifyOn: "all" | "mentions" | "none";
  dmNotify: boolean;
  status: Status;
  accent: string;
  glass: "clear" | "frosted" | "tinted";
  textSize: "sm" | "md" | "lg";
  compact: boolean;
  clock24: boolean;
  dim: number;
  reduceMotion: boolean;
  dmsFrom: "everyone" | "friends";
  sendTyping: boolean;
  enterToSend: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
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
  enterToSend: true,
};

export const ACCENTS: Record<string, { label: string; color: string; ink: string }> = {
  teal: { label: "Lagoon", color: "#2ee6c7", ink: "#05231d" },
  sky: { label: "Sky", color: "#5ec8ff", ink: "#04202f" },
  violet: { label: "Iris", color: "#a78bfa", ink: "#1a0f3a" },
  pink: { label: "Bloom", color: "#ff7ab6", ink: "#3a0a22" },
  amber: { label: "Amber", color: "#ffc35c", ink: "#2e1d02" },
  lime: { label: "Lime", color: "#a3e635", ink: "#1a2604" },
};

export const COLORS = [
  "#149c86", "#0ea5e9", "#d97706", "#e11d48", "#65a30d", "#ea580c",
  "#0891b2", "#8b5cf6", "#db2777", "#4f46e5", "#ca8a04", "#059669",
];

export const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const PRESETS: Record<string, { label: string; css: string }> = {
  aurora: {
    label: "Aurora",
    css: "radial-gradient(80% 60% at 20% 10%, #1fd1a5 0%, transparent 60%), radial-gradient(70% 60% at 85% 20%, #6d5dfc 0%, transparent 60%), radial-gradient(90% 70% at 50% 100%, #0b3d5c 0%, transparent 70%), #07121a",
  },
  dusk: {
    label: "Dusk",
    css: "radial-gradient(70% 60% at 80% 15%, #ff8a5c 0%, transparent 60%), radial-gradient(80% 70% at 15% 80%, #6a3df0 0%, transparent 65%), linear-gradient(180deg, #2b1745, #0f0b1e)",
  },
  ocean: {
    label: "Deep sea",
    css: "radial-gradient(90% 70% at 50% 0%, #2aa7ff 0%, transparent 60%), radial-gradient(80% 60% at 0% 100%, #00c2a8 0%, transparent 60%), linear-gradient(180deg, #03203a, #020c16)",
  },
  bloom: {
    label: "Bloom",
    css: "radial-gradient(60% 60% at 30% 30%, #ff9ec7 0%, transparent 60%), radial-gradient(70% 70% at 75% 70%, #79a8ff 0%, transparent 60%), linear-gradient(135deg, #3b2a5a, #12243f)",
  },
  graphite: {
    label: "Graphite",
    css: "radial-gradient(70% 60% at 30% 20%, #4b5563 0%, transparent 60%), radial-gradient(80% 60% at 80% 90%, #1f2937 0%, transparent 60%), #0b0d10",
  },
};

export function cleanName(value: string) {
  return String(value || "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);
}

export function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 33 + id.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function safeColor(value: unknown, id: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : colorFor(id);
}

export function safeAvatar(value: unknown) {
  return typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 60000
    ? value
    : undefined;
}

export function safeWallpaperUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 900000) return null;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  if (/^https:\/\/[^\s"'()\\<>]+$/.test(value) && value.length < 2000) return value;
  return null;
}

export function threadKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export const ls = {
  get<V>(key: string, fallback: V): V {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : (JSON.parse(raw) as V);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked */
    }
  },
};

export type { Point, PrivJwk, Cert };
