import type { Bunny } from "@/lib/bunny/use-bunny";
import { PRESETS } from "@/lib/bunny/types";

export type Command = { name: string; args: string; help: string };

export const COMMANDS: Command[] = [
  { name: "m", args: "<message>", help: "Flash a message on everyone's screen for 3 seconds" },
  { name: "h", args: "<message>", help: "Show a hint banner at the top for everyone" },
  { name: "announce", args: "<text>", help: "Pin an announcement under the top bar" },
  { name: "unannounce", args: "", help: "Remove the pinned announcement" },
  { name: "warn", args: "<name> <reason>", help: "Send someone a warning they must acknowledge" },
  { name: "kick", args: "<name> [reason]", help: "Disconnect someone from the room" },
  { name: "ban", args: "<name> [reason]", help: "Ban someone from the server" },
  { name: "unban", args: "<name>", help: "Lift a ban" },
  { name: "slowmode", args: "<seconds | off>", help: "Limit how often people can send" },
  { name: "lock", args: "", help: "Only admins can send messages" },
  { name: "unlock", args: "", help: "Let everyone send again" },
  { name: "clear", args: "[count]", help: "Delete the newest messages (default 10)" },
  { name: "wallpaper", args: "<preset | url | reset>", help: `Change everyone's wallpaper (${Object.keys(PRESETS).join(", ")})` },
];

export function matchCommands(draft: string) {
  if (!draft.startsWith("/")) return [];
  const head = draft.slice(1).split(/\s/)[0].toLowerCase();
  const typedSpace = /\s/.test(draft.slice(1));
  if (typedSpace) return COMMANDS.filter((c) => c.name === head);
  return COMMANDS.filter((c) => c.name.startsWith(head));
}

/** Resolve "<name> rest…" against known people; names may contain spaces. */
function resolveUser(bunny: Bunny, args: string) {
  const known = new Map<string, { id: string; name: string }>();
  for (const k of Object.values(bunny.directory)) known.set(k.id, { id: k.id, name: k.name });
  for (const p of bunny.people) known.set(p.id, { id: p.id, name: p.name });
  const me = bunny.identity?.id;
  const people = [...known.values()].filter((p) => p.id !== me);
  const words = args.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { error: "Say who: /command <name>" };
  // Longest exact name match wins ("/ban Alex Moon spamming").
  for (let n = words.length; n >= 1; n--) {
    const guess = words.slice(0, n).join(" ").toLowerCase();
    const hits = people.filter((p) => p.name.toLowerCase() === guess || p.id === guess);
    if (hits.length === 1) return { user: hits[0], rest: words.slice(n).join(" ") };
    if (hits.length > 1) return { error: `More than one person is called “${words.slice(0, n).join(" ")}”. Use their user ID.` };
  }
  const first = words[0].toLowerCase();
  const partial = people.filter((p) => p.name.toLowerCase().startsWith(first));
  if (partial.length === 1) return { user: partial[0], rest: words.slice(1).join(" ") };
  if (partial.length > 1) return { error: `“${words[0]}” matches ${partial.length} people. Type more of the name.` };
  return { error: `No one called “${words[0]}” here` };
}

/** Runs an admin slash command. Returns a message for the admin. */
export async function runCommand(bunny: Bunny, input: string): Promise<{ ok: boolean; message: string }> {
  const body = input.trim().slice(1);
  const name = body.split(/\s/)[0].toLowerCase();
  const args = body.slice(name.length).trim();
  const need = (v: string, usage: string) => (v ? null : { ok: false, message: `Usage: ${usage}` });
  switch (name) {
    case "m":
    case "h": {
      const miss = need(args, `/${name} <message>`);
      if (miss) return miss;
      await bunny.flashAll(args, name);
      return { ok: true, message: name === "m" ? "Message flashed to everyone" : "Hint sent" };
    }
    case "announce": {
      const miss = need(args, "/announce <text>");
      if (miss) return miss;
      await bunny.setAnnouncement(args);
      return { ok: true, message: "Announcement posted" };
    }
    case "unannounce":
      await bunny.setAnnouncement("");
      return { ok: true, message: "Announcement cleared" };
    case "warn":
    case "kick":
    case "ban":
    case "unban": {
      const r = resolveUser(bunny, args);
      if ("error" in r) return { ok: false, message: r.error ?? "Who?" };
      if (bunny.admins[r.user.id]) return { ok: false, message: "You can't do that to another admin" };
      if (name === "warn") {
        if (!r.rest) return { ok: false, message: "Usage: /warn <name> <reason>" };
        await bunny.warn(r.user.id, r.user.name, r.rest);
      } else if (name === "kick") await bunny.kick(r.user.id, r.user.name, r.rest);
      else if (name === "ban") await bunny.ban(r.user.id, r.user.name, r.rest || "Broke the server rules");
      else await bunny.ban(r.user.id, r.user.name, "", "unban");
      return { ok: true, message: `${name[0].toUpperCase()}${name.slice(1)}: ${r.user.name}` };
    }
    case "slowmode": {
      const v = args.toLowerCase();
      const secs = v === "off" || v === "0" ? 0 : Math.round(Number(v.replace(/s$/, "")));
      if (!Number.isFinite(secs) || secs < 0 || secs > 3600 || !v) return { ok: false, message: "Usage: /slowmode <seconds | off>" };
      await bunny.setRoomControls({ slowmode: secs });
      return { ok: true, message: secs ? `Slowmode ${secs}s` : "Slowmode off" };
    }
    case "lock":
    case "unlock":
      await bunny.setRoomControls({ locked: name === "lock" });
      return { ok: true, message: name === "lock" ? "Chat locked" : "Chat unlocked" };
    case "clear": {
      const n = args ? Math.round(Number(args)) : 10;
      if (!Number.isFinite(n) || n < 1) return { ok: false, message: "Usage: /clear [count]" };
      const done = bunny.clearRecent(Math.min(n, 100));
      return { ok: true, message: `Cleared ${done} messages` };
    }
    case "wallpaper": {
      const v = args.trim();
      if (!v) return { ok: false, message: "Usage: /wallpaper <preset | url | reset>" };
      if (v === "reset" || v === "default") await bunny.setGlobalWallpaper("default");
      else if (PRESETS[v.toLowerCase()]) await bunny.setGlobalWallpaper("preset", v.toLowerCase());
      else if (/^https:\/\//.test(v)) await bunny.setGlobalWallpaper("image", v);
      else return { ok: false, message: `Pick a preset (${Object.keys(PRESETS).join(", ")}), an https:// link, or reset` };
      return { ok: true, message: "Wallpaper updated" };
    }
    default:
      return { ok: false, message: `Unknown command /${name}. Type / to see them all.` };
  }
}
