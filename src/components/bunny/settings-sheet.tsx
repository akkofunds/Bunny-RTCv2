import { useState } from "react";
import {
  Bell,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Palette,
  Shield,
  ShieldAlert,
  TriangleAlert,
  User,
  UserX,
  X,
} from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import { ACCENTS, COLORS, type Settings } from "@/lib/bunny/types";
import { Choices, Face, Toggle, shrinkImage } from "./ui";

type Section = "profile" | "notifications" | "appearance" | "privacy" | "account";

const NAV: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "My profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy & safety", icon: Shield },
  { id: "account", label: "Account & token", icon: KeyRound },
];

function Opt({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="opt">
      <div className="txt">
        <strong>{title}</strong>
        {hint ? <span>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsSheet({ bunny, onClose, initial = "profile" }: { bunny: Bunny; onClose: () => void; initial?: Section }) {
  const [section, setSection] = useState<Section>(initial);
  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="sheet lg" role="dialog" aria-label="Settings" onMouseDown={(e) => e.stopPropagation()}>
        <nav className="sheet-nav">
          <h2>Settings</h2>
          {NAV.map((n) => (
            <button key={n.id} type="button" className={`nav-item ${section === n.id ? "active" : ""}`} onClick={() => setSection(n.id)}>
              <n.icon size={17} />
              {n.label}
            </button>
          ))}
          <div className="nav-spacer" />
          {bunny.session && !bunny.adminMode ? (
            <a className="nav-item" href="/admin">
              <ShieldAlert size={17} style={{ color: "#ffcf5c" }} /> Admin panel
            </a>
          ) : null}
        </nav>
        <div className="sheet-body">
          <button className="gbtn icon sm sheet-close" type="button" aria-label="Close settings" onClick={onClose}>
            <X size={16} />
          </button>
          {section === "profile" ? <ProfileSection bunny={bunny} /> : null}
          {section === "notifications" ? <NotificationSection bunny={bunny} /> : null}
          {section === "appearance" ? <AppearanceSection bunny={bunny} /> : null}
          {section === "privacy" ? <PrivacySection bunny={bunny} /> : null}
          {section === "account" ? <AccountSection bunny={bunny} /> : null}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ bunny }: { bunny: Bunny }) {
  const [name, setName] = useState(bunny.profile.name);
  const [bio, setBio] = useState(bunny.profile.bio);
  const [avatar, setAvatar] = useState(bunny.profile.avatar);
  const [color, setColor] = useState(bunny.profile.color);
  const dirty = name !== bunny.profile.name || bio !== bunny.profile.bio || avatar !== bunny.profile.avatar || color !== bunny.profile.color;
  const valid = name.trim().length >= 2;
  const set = (patch: Partial<Settings>) => bunny.updateSettings(patch);
  return (
    <>
      <h3>My profile</h3>
      <p className="sub">How you show up in the room and in direct messages.</p>
      <div className="group">
        <div className="profile-card">
          <Face avatar={avatar} color={color} label="Preview" status={bunny.settings.status} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ fontSize: "1.05rem", display: "block" }}>{name || "Your name"}</strong>
            <span style={{ fontSize: "0.8rem", color: "var(--color-faint)" }}>{bio || "No status yet"}</span>
            <div className="row" style={{ marginTop: "0.6rem" }}>
              <label className="gbtn sm file">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const data = await shrinkImage(file);
                    if (data) setAvatar(data);
                    else bunny.say("That image couldn't be read");
                  }}
                />
              </label>
              {avatar ? (
                <button className="gbtn sm" type="button" onClick={() => setAvatar(undefined)}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="group">
        <div className="opt stack">
          <label className="label" htmlFor="set-name">
            Display name
          </label>
          <input id="set-name" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="opt stack">
          <label className="label" htmlFor="set-bio">
            Status message
          </label>
          <input id="set-bio" className="input" value={bio} maxLength={80} placeholder="What are you up to?" onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="opt stack">
          <span className="label">Bunny color</span>
          <div className="swatches">
            {COLORS.map((c) => (
              <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginBottom: "1.2rem" }}>
        {dirty ? (
          <button
            className="gbtn"
            type="button"
            onClick={() => {
              setName(bunny.profile.name);
              setBio(bunny.profile.bio);
              setAvatar(bunny.profile.avatar);
              setColor(bunny.profile.color);
            }}
          >
            Reset
          </button>
        ) : null}
        <button
          className="gbtn primary"
          type="button"
          disabled={!dirty || !valid}
          onClick={() => {
            if (bunny.saveProfile({ name, bio, avatar, color })) bunny.say("Profile saved");
          }}
        >
          Save changes
        </button>
      </div>
      <div className="group-title">Presence</div>
      <div className="group">
        <Opt title="Status" hint="Do not disturb silences every sound and notification.">
          <Choices
            label="Status"
            value={bunny.settings.status}
            onChange={(v) => set({ status: v })}
            options={[
              { value: "online", label: "Online" },
              { value: "idle", label: "Idle" },
              { value: "dnd", label: "DND" },
            ]}
          />
        </Opt>
      </div>
    </>
  );
}

function NotificationSection({ bunny }: { bunny: Bunny }) {
  const s = bunny.settings;
  const set = (patch: Partial<Settings>) => bunny.updateSettings(patch);
  const supported = typeof Notification !== "undefined";
  const [perm, setPerm] = useState(supported ? Notification.permission : "denied");
  return (
    <>
      <h3>Notifications</h3>
      <p className="sub">Choose what pings you. Everything here is optional.</p>
      <div className="group">
        <Opt
          title="Desktop notifications"
          hint={
            !supported
              ? "This browser doesn't support notifications."
              : perm === "denied"
                ? "Blocked by your browser. Allow notifications for this site to turn them on."
                : "Pop-up alerts when Bunny RTC is in the background."
          }
        >
          <Toggle
            label="Desktop notifications"
            on={s.desktop && perm === "granted"}
            onChange={async (v) => {
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
            }}
          />
        </Opt>
        <Opt title="Message sounds" hint="A soft chime when something new arrives.">
          <Toggle label="Message sounds" on={s.sounds} onChange={(v) => set({ sounds: v })} />
        </Opt>
        <Opt title="Server messages" hint="Which messages in #lounge notify you.">
          <Choices
            label="Server notifications"
            value={s.notifyOn}
            onChange={(v) => set({ notifyOn: v })}
            options={[
              { value: "all", label: "All" },
              { value: "mentions", label: "@Mentions" },
              { value: "none", label: "Off" },
            ]}
          />
        </Opt>
        <Opt title="Direct messages & requests" hint="Notify me about DMs and friend requests.">
          <Toggle label="Direct message notifications" on={s.dmNotify} onChange={(v) => set({ dmNotify: v })} />
        </Opt>
      </div>
      <button
        className="gbtn"
        type="button"
        onClick={() => {
          if (supported && Notification.permission === "granted" && s.desktop) {
            new Notification("Bunny RTC", { body: "Notifications are working 🐰", icon: "/favicon.svg" });
          } else bunny.say("Turn on desktop notifications first");
        }}
      >
        <Bell size={15} /> Send a test notification
      </button>
    </>
  );
}

function AppearanceSection({ bunny }: { bunny: Bunny }) {
  const s = bunny.settings;
  const set = (patch: Partial<Settings>) => bunny.updateSettings(patch);
  return (
    <>
      <h3>Appearance</h3>
      <p className="sub">Tune the glass. These choices only change your view.</p>
      <div className="group">
        <div className="opt stack">
          <span className="label">Accent</span>
          <div className="swatches">
            {Object.entries(ACCENTS).map(([key, a]) => (
              <button key={key} type="button" className="swatch" title={a.label} style={{ background: a.color }} aria-label={a.label} aria-pressed={s.accent === key} onClick={() => set({ accent: key })} />
            ))}
          </div>
        </div>
        <Opt title="Glass" hint="Clear shows more wallpaper; tinted is easiest to read.">
          <Choices
            label="Glass style"
            value={s.glass}
            onChange={(v) => set({ glass: v })}
            options={[
              { value: "clear", label: "Clear" },
              { value: "frosted", label: "Frosted" },
              { value: "tinted", label: "Tinted" },
            ]}
          />
        </Opt>
        <Opt title="Text size">
          <Choices
            label="Text size"
            value={s.textSize}
            onChange={(v) => set({ textSize: v })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Default" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Opt>
        <div className="opt stack">
          <span className="label">Wallpaper dimming · {s.dim}%</span>
          <input type="range" min={0} max={70} value={s.dim} onChange={(e) => set({ dim: Number(e.target.value) })} aria-label="Wallpaper dimming" />
        </div>
      </div>
      <div className="group">
        <Opt title="Compact messages" hint="Smaller avatars, tighter rows.">
          <Toggle label="Compact messages" on={s.compact} onChange={(v) => set({ compact: v })} />
        </Opt>
        <Opt title="24-hour clock">
          <Toggle label="24-hour clock" on={s.clock24} onChange={(v) => set({ clock24: v })} />
        </Opt>
        <Opt title="Reduce motion" hint="Turn off animations and springy transitions.">
          <Toggle label="Reduce motion" on={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
        </Opt>
      </div>
    </>
  );
}

function PrivacySection({ bunny }: { bunny: Bunny }) {
  const s = bunny.settings;
  const set = (patch: Partial<Settings>) => bunny.updateSettings(patch);
  const friends = Object.values(bunny.friends);
  return (
    <>
      <h3>Privacy & safety</h3>
      <p className="sub">Control who can reach you.</p>
      <div className="group">
        <Opt title="Allow direct messages from" hint="Messages from anyone else are dropped silently.">
          <Choices
            label="Allow DMs from"
            value={s.dmsFrom}
            onChange={(v) => set({ dmsFrom: v })}
            options={[
              { value: "everyone", label: "Everyone" },
              { value: "friends", label: "Friends" },
            ]}
          />
        </Opt>
        <Opt title="Show when I'm typing">
          <Toggle label="Show typing indicator" on={s.sendTyping} onChange={(v) => set({ sendTyping: v })} />
        </Opt>
      </div>
      <div className="group-title">Friends · {friends.length}</div>
      <div className="group">
        {friends.length === 0 ? <div className="empty">No friends yet. Add people from the member list.</div> : null}
        {friends.map((f) => (
          <div className="opt" key={f.id}>
            <Face color={f.color} label={f.name} avatar={bunny.lookup(f.id).avatar} size="2rem" />
            <div className="txt">
              <strong>{f.name}</strong>
              <span>Friends since {new Date(f.since).toLocaleDateString()}</span>
            </div>
            <button className="gbtn sm" type="button" onClick={() => bunny.removeFriend(f.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="group-title">Blocked · {bunny.blocked.length}</div>
      <div className="group">
        {bunny.blocked.length === 0 ? <div className="empty">You haven't blocked anyone.</div> : null}
        {bunny.blocked.map((id) => {
          const p = bunny.lookup(id);
          return (
            <div className="opt" key={id}>
              <UserX size={18} style={{ color: "var(--color-faint)" }} />
              <div className="txt">
                <strong>{p.name}</strong>
                <span>Hidden from chat and DMs</span>
              </div>
              <button className="gbtn sm" type="button" onClick={() => bunny.toggleBlock(id)}>
                Unblock
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AccountSection({ bunny }: { bunny: Bunny }) {
  const [reveal, setReveal] = useState(false);
  const [restore, setRestore] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <h3>Account & token</h3>
      <p className="sub">Your account lives in this browser. Your token is the only key to it.</p>
      <div className="callout red">
        <TriangleAlert size={18} />
        <div>
          <b>Never share this token.</b> Anyone who has it can log in as you, read your DMs and post under your name. No one from Bunny RTC will ever ask you for it.
          Don't paste it into websites, bots or messages from people you don't know.
        </div>
      </div>
      <div className="group">
        <div className="opt stack">
          <span className="label">Your secret token</span>
          <div className={`token ${reveal ? "" : "masked"}`} aria-label="Secret token">
            {reveal ? bunny.token : bunny.token.replace(/[^_]/g, "•")}
          </div>
          <div className="row">
            <button className="gbtn sm" type="button" onClick={() => setReveal((v) => !v)}>
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />} {reveal ? "Hide" : "Reveal"}
            </button>
            <button
              className="gbtn sm"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(bunny.token);
                  bunny.say("Token copied. Keep it private");
                } catch {
                  bunny.say("Could not copy");
                }
              }}
            >
              <Copy size={14} /> Copy token
            </button>
            <span style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginLeft: "auto" }}>{bunny.token.length} characters</span>
          </div>
        </div>
        <Opt title="User ID" hint={bunny.identity?.id}>
          <button
            className="gbtn sm"
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(bunny.identity?.id || "");
                bunny.say("User ID copied");
              } catch {
                bunny.say("Could not copy");
              }
            }}
          >
            <Copy size={14} /> Copy
          </button>
        </Opt>
      </div>
      <div className="group-title">Use your account on this device</div>
      <div className="group">
        <div className="opt stack">
          <span style={{ fontSize: "0.8rem", color: "var(--color-faint)" }}>Paste a token from your other device to sign in here. This replaces the account on this browser.</span>
          <textarea
            className="input"
            value={restore}
            placeholder="bunny_…"
            spellCheck={false}
            onChange={(e) => {
              setRestore(e.target.value);
              setRestoreError("");
            }}
          />
          {restoreError ? <span className="err">{restoreError}</span> : null}
          <div className="row">
            <button
              className="gbtn sm primary"
              type="button"
              disabled={!restore.trim()}
              onClick={() => {
                if (!bunny.restoreFromToken(restore)) setRestoreError("That doesn't look like a valid Bunny RTC token.");
              }}
            >
              <LogIn size={14} /> Sign in with token
            </button>
          </div>
        </div>
      </div>
      <div className="group-title">Danger zone</div>
      <div className="group">
        <Opt title="Reset this device" hint="Erase your account, friends and messages from this browser. Copy your token first if you want to come back.">
          {confirmReset ? (
            <div className="row">
              <button className="gbtn sm" type="button" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                className="gbtn sm danger"
                type="button"
                onClick={() => {
                  for (const key of Object.keys(localStorage)) if (key.startsWith("bunny_")) localStorage.removeItem(key);
                  window.location.reload();
                }}
              >
                Erase
              </button>
            </div>
          ) : (
            <button className="gbtn sm danger" type="button" onClick={() => setConfirmReset(true)}>
              Reset
            </button>
          )}
        </Opt>
      </div>
    </>
  );
}
