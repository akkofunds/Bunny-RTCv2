import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Ban, Eraser, Image as ImageIcon, LayoutGrid, Megaphone, MessagesSquare, MoreHorizontal, RotateCcw, ScrollText, Search, ShieldCheck, TriangleAlert, Upload, UploadCloud, Users, Zap } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import { PRESETS, threadKey } from "@/lib/bunny/types";
import { Face, RoleBadge, Toggle, ago, timeLabel } from "./ui";
import { COMMANDS } from "./commands";
import { ACCEPT } from "./media-view";
import { prepareFile } from "@/lib/bunny/media";
import type { MenuTarget } from "./user-menu";

type ModTab = "overview" | "members" | "logs" | "dms" | "server";

export function ModView({ bunny, openMenu }: { bunny: Bunny; openMenu: (t: MenuTarget) => void }) {
  const [tab, setTab] = useState<ModTab>("overview");
  const tabs: { id: ModTab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "members", label: "Members", icon: Users },
    { id: "logs", label: "Deleted & edits", icon: ScrollText },
    { id: "dms", label: "DMs", icon: MessagesSquare },
    { id: "server", label: "Look", icon: ImageIcon },
  ];

  return (
    <section className="panel lg-panel" aria-label="Admin panel">
      <div className="panel-head">
        <span className="hash gold">
          <ShieldCheck size={18} />
        </span>
        <div className="grow">
          <h2>Admin panel</h2>
          <p>Signed in as admin · actions are verified on every device</p>
        </div>
      </div>
      <div className="tabbar" role="tablist" aria-label="Admin sections">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-label={t.label} aria-selected={tab === t.id} className="tab" onClick={() => setTab(t.id)}>
            <t.icon size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="mod-body">
        {tab === "overview" ? <Overview bunny={bunny} /> : null}
        {tab === "members" ? <Members bunny={bunny} openMenu={openMenu} /> : null}
        {tab === "logs" ? <Logs bunny={bunny} /> : null}
        {tab === "dms" ? <Dms bunny={bunny} /> : null}
        {tab === "server" ? <ServerLook bunny={bunny} /> : null}
      </div>
    </section>
  );
}

function Overview({ bunny }: { bunny: Bunny }) {
  const [text, setText] = useState("");
  const [clearN, setClearN] = useState("10");
  const [confirmClear, setConfirmClear] = useState(false);
  const logs = Object.values(bunny.logs);
  const activeBans = Object.values(bunny.bans).filter((b) => b.kind === "ban" && !bunny.admins[b.target]);
  const slow = bunny.room?.slowmode || 0;
  return (
    <>
      <div className="stats">
        <div className="stat">
          <b>{bunny.people.length}</b>
          <span>Online</span>
        </div>
        <div className="stat">
          <b>{bunny.messages.length}</b>
          <span>Messages</span>
        </div>
        <div className="stat">
          <b>{activeBans.length}</b>
          <span>Bans</span>
        </div>
        <div className="stat">
          <b>{Object.keys(bunny.warnsIssued).length}</b>
          <span>Warnings</span>
        </div>
        <div className="stat">
          <b>{logs.length}</b>
          <span>Logged changes</span>
        </div>
      </div>

      <MyTag bunny={bunny} />

      <div className="group-title">Broadcast</div>
      <div className="group">
        <form
          className="opt stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await bunny.flashAll(text, "m")) {
              bunny.say("Message flashed to everyone");
              setText("");
            }
          }}
        >
          <span className="hint">Flash pops up in the middle of everyone's screen for 3 seconds. Hint slides in at the top.</span>
          <input className="input" value={text} maxLength={200} placeholder="Server restarting in 5 minutes!" onChange={(e) => setText(e.target.value)} aria-label="Broadcast text" />
          <div className="row">
            <button className="gbtn primary" type="submit" disabled={!text.trim()}>
              <Zap size={15} /> Flash · /m
            </button>
            <button
              className="gbtn"
              type="button"
              disabled={!text.trim()}
              onClick={async () => {
                if (await bunny.flashAll(text, "h")) {
                  bunny.say("Hint sent");
                  setText("");
                }
              }}
            >
              <Megaphone size={15} /> Hint · /h
            </button>
          </div>
        </form>
      </div>

      <div className="group-title">Room controls</div>
      <div className="group">
        <div className="opt">
          <div className="txt">
            <strong>Lock chat</strong>
            <span>Only admins can send in #lounge.</span>
          </div>
          <Toggle label="Lock chat" on={!!bunny.room?.locked} onChange={(v) => void bunny.setRoomControls({ locked: v })} />
        </div>
        <div className="opt">
          <div className="txt">
            <strong>Slowmode</strong>
            <span>Time between messages for each person.</span>
          </div>
          <div className="choices" role="group" aria-label="Slowmode">
            {[0, 5, 15, 30, 60].map((n) => (
              <button key={n} type="button" aria-pressed={slow === n} onClick={() => void bunny.setRoomControls({ slowmode: n })}>
                {n ? `${n}s` : "Off"}
              </button>
            ))}
          </div>
        </div>
        <div className="opt">
          <div className="txt">
            <strong>Clear chat</strong>
            <span>Delete the newest messages. They still show up in the logs.</span>
          </div>
          {confirmClear ? (
            <div className="row">
              <button className="gbtn sm" type="button" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
              <button
                className="gbtn sm danger"
                type="button"
                onClick={() => {
                  bunny.clearRecent(Number(clearN));
                  setConfirmClear(false);
                }}
              >
                Delete {clearN}
              </button>
            </div>
          ) : (
            <div className="row">
              <div className="choices" role="group" aria-label="How many">
                {["10", "25", "50"].map((n) => (
                  <button key={n} type="button" aria-pressed={clearN === n} onClick={() => setClearN(n)}>
                    {n}
                  </button>
                ))}
              </div>
              <button className="gbtn sm danger" type="button" onClick={() => setConfirmClear(true)}>
                <Eraser size={14} /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="group-title">Recent admin actions</div>
      <div className="group">
        {bunny.modHistory.slice(0, 8).map((h) => (
          <div className="opt" key={h.key}>
            <div className="txt">
              <strong>
                {h.byName} {h.text}
              </strong>
            </div>
            <span className="muted">{ago(h.at)}</span>
          </div>
        ))}
        {bunny.modHistory.length === 0 ? <div className="empty">Actions you and other admins take will show up here.</div> : null}
      </div>

      <div className="group-title">Chat commands</div>
      <div className="group cmd-sheet">
        {COMMANDS.map((c) => (
          <div className="cmd-line" key={c.name}>
            <code>
              /{c.name}
              {c.args ? <i> {c.args}</i> : null}
            </code>
            <span>{c.help}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function LogRow({ bunny, log }: { bunny: Bunny; log: Bunny["logs"][string] }) {
  const h24 = bunny.settings.clock24;
  return (
    <div className="log">
      <div className="log-head">
        <span className={`pill-kind ${log.kind === "delete" ? "del" : "edit"}`}>{log.kind === "delete" ? "Deleted" : "Edited"}</span>
        <span className="pill-kind">{log.scope === "direct" ? "DM" : "#lounge"}</span>
        <b>{log.authorName}</b>
        {log.actorId && log.actorId !== log.authorId ? <span style={{ color: "var(--color-faint)" }}>by {log.actorName}</span> : null}
        <time>
          {new Date(log.at).toLocaleDateString()} · {timeLabel(log.at, h24)}
        </time>
      </div>
      {log.kind === "edit" ? (
        <div className="diff">
          <div className="before">
            <small>Before</small>
            {log.before}
          </div>
          <div className="after">
            <small>After</small>
            {log.after}
          </div>
        </div>
      ) : (
        <div className="diff one">
          <div className="before">
            <small>Deleted message</small>
            {log.before}
          </div>
        </div>
      )}
    </div>
  );
}

function Logs({ bunny }: { bunny: Bunny }) {
  const [filter, setFilter] = useState<"all" | "delete" | "edit">("all");
  const [q, setQ] = useState("");
  const logs = useMemo(
    () =>
      Object.values(bunny.logs)
        .filter((l) => filter === "all" || l.kind === filter)
        .filter((l) => !q || `${l.authorName} ${l.before} ${l.after || ""}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.at - a.at),
    [bunny.logs, filter, q],
  );
  return (
    <>
      <div className="row" style={{ marginBottom: "0.8rem" }}>
        <div className="choices">
          {(["all", "delete", "edit"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "delete" ? "Deleted" : "Edited"}
            </button>
          ))}
        </div>
        <label className="search" style={{ margin: 0, flex: 1, minWidth: "10rem" }}>
          <Search size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs" aria-label="Search logs" />
        </label>
      </div>
      <div className="group">
        {logs.map((l) => (
          <LogRow key={l.key} bunny={bunny} log={l} />
        ))}
        {logs.length === 0 ? <div className="empty">Nothing logged yet.</div> : null}
      </div>
    </>
  );
}

function Members({ bunny, openMenu }: { bunny: Bunny; openMenu: (t: MenuTarget) => void }) {
  const [q, setQ] = useState("");
  const onlineIds = new Set(bunny.people.map((p) => p.id));
  const all = useMemo(() => {
    const ids = new Set([...Object.keys(bunny.directory), ...bunny.people.map((p) => p.id), ...Object.keys(bunny.bans)]);
    return [...ids]
      .map((id) => bunny.lookup(id))
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q.toLowerCase()))
      .sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id)) || a.name.localeCompare(b.name));
  }, [bunny, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const warnCount = (id: string) => Object.values(bunny.warnsIssued).filter((w) => w.target === id).length;
  return (
    <>
      <label className="search" style={{ margin: "0 0 0.8rem" }}>
        <Search size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find by name or ID" aria-label="Find member" />
      </label>
      <div className="group">
        {all.map((p) => {
          const banned = bunny.isBanned(p.id);
          const w = warnCount(p.id);
          const ban = bunny.bans[p.id];
          return (
            <div className="opt keep" key={p.id}>
              <Face avatar={p.avatar} anim={p.anim} color={p.color} label={p.name} status={p.online ? p.status : undefined} size="2.2rem" />
              <div className="txt">
                <strong style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                  {p.name}
                  <RoleBadge role={p.role} admin={!!bunny.admins[p.id]} />
                  {bunny.perks[p.id]?.animated && !bunny.admins[p.id] ? <span className="pill-kind">Animated PFP</span> : null}
                  {banned ? <span className="tag ban">Banned</span> : null}
                  {w ? (
                    <span className="pill-kind" style={{ color: "#ffd98a" }}>
                      {w} warning{w > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </strong>
                <span>
                  {p.online ? "Online" : "Offline"} · {p.id}
                  {banned && ban?.reason ? ` · “${ban.reason}”` : ""}
                </span>
              </div>
              {p.id !== bunny.identity?.id && !bunny.admins[p.id] ? (
                banned ? (
                  <button className="gbtn sm" type="button" onClick={() => void bunny.ban(p.id, p.name, "", "unban")}>
                    Unban
                  </button>
                ) : (
                  <button
                    className="gbtn sm icon"
                    type="button"
                    aria-label={`Manage ${p.name}`}
                    title="Warn, kick or ban"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      openMenu({ id: p.id, x: r.right - 264, y: r.bottom + 6 });
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )
              ) : null}
            </div>
          );
        })}
        {all.length === 0 ? <div className="empty">No members found.</div> : null}
      </div>
      {Object.values(bunny.warnsIssued).length ? (
        <>
          <div className="group-title">Warnings</div>
          <div className="group">
            {Object.values(bunny.warnsIssued)
              .sort((a, b) => b.at - a.at)
              .map((w) => (
                <div className="opt" key={w.id}>
                  <TriangleAlert size={17} style={{ color: "#ffcf5c" }} />
                  <div className="txt">
                    <strong>{w.targetName}</strong>
                    <span>
                      “{w.reason}” · by {w.byName} · {ago(w.at)} ago
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : null}
    </>
  );
}

function Dms({ bunny }: { bunny: Bunny }) {
  const [open, setOpen] = useState<string | null>(null);
  const threads = useMemo(() => {
    const map = new Map<string, { key: string; a: string; b: string; msgs: Bunny["allDms"][string][] }>();
    for (const dm of Object.values(bunny.allDms)) {
      const key = threadKey(dm.from, dm.to);
      const t = map.get(key) || { key, a: dm.from < dm.to ? dm.from : dm.to, b: dm.from < dm.to ? dm.to : dm.from, msgs: [] };
      t.msgs.push(dm);
      map.set(key, t);
    }
    for (const t of map.values()) t.msgs.sort((x, y) => x.at - y.at);
    return [...map.values()].sort((x, y) => y.msgs[y.msgs.length - 1].at - x.msgs[x.msgs.length - 1].at);
  }, [bunny.allDms]);
  const current = threads.find((t) => t.key === open);
  const nameOf = (id: string, fallback?: string) => {
    const n = bunny.lookup(id).name;
    return n === "Guest" && fallback ? fallback : n;
  };

  if (current) {
    const a = bunny.lookup(current.a);
    return (
      <>
        <div className="row" style={{ marginBottom: "0.8rem" }}>
          <button className="gbtn sm" type="button" onClick={() => setOpen(null)}>
            <ArrowLeft size={14} /> All conversations
          </button>
          <b style={{ fontSize: "0.9rem" }}>
            {nameOf(current.a, current.msgs.find((m) => m.from === current.a)?.name)} ↔ {nameOf(current.b, current.msgs.find((m) => m.from === current.b)?.name)}
          </b>
        </div>
        <div className="group" style={{ padding: "0.8rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {current.msgs.map((m) => (
            <div key={m.id} className={`bubble ${m.from === a.id ? "" : "mine"}`}>
              <b style={{ fontSize: "0.72rem", display: "block", opacity: 0.8 }}>{m.name}</b>
              {m.text}
              <time>
                {new Date(m.at).toLocaleDateString()} · {timeLabel(m.at, bunny.settings.clock24)}
              </time>
            </div>
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <div className="callout info">
        <MessagesSquare size={17} />
        <div>Every direct message is sealed for the two people in it plus the admin key. Only admins can open them here.</div>
      </div>
      <div className="group">
        {threads.map((t) => {
          const last = t.msgs[t.msgs.length - 1];
          const a = bunny.lookup(t.a);
          const b = bunny.lookup(t.b);
          return (
            <button key={t.key} type="button" className="opt" style={{ width: "100%", textAlign: "left" }} onClick={() => setOpen(t.key)}>
              <span style={{ display: "flex" }}>
                <Face avatar={a.avatar} color={a.color} label={a.name} size="2rem" />
                <span style={{ marginLeft: "-0.6rem" }}>
                  <Face avatar={b.avatar} color={b.color} label={b.name} size="2rem" />
                </span>
              </span>
              <span className="txt">
                <strong>
                  {nameOf(t.a, t.msgs.find((m) => m.from === t.a)?.name)} ↔ {nameOf(t.b, t.msgs.find((m) => m.from === t.b)?.name)}
                </strong>
                <span>
                  {t.msgs.length} message{t.msgs.length > 1 ? "s" : ""} · {last.name}: {last.text.slice(0, 60)}
                </span>
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-faint)" }}>{ago(last.at)}</span>
            </button>
          );
        })}
        {threads.length === 0 ? <div className="empty">No direct messages yet.</div> : null}
      </div>
    </>
  );
}

function ServerLook({ bunny }: { bunny: Bunny }) {
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const [notice, setNotice] = useState(bunny.announce?.text || "");
  const fileRef = useRef<HTMLInputElement>(null);
  const wp = bunny.wallpaper;
  const current = !wp || wp.mode === "default" ? "default" : wp.mode === "preset" ? wp.value : "custom";

  async function applyFile(file?: File | null) {
    if (!file || progress !== null) return;
    try {
      const prepared = await prepareFile(file);
      setProgress(0);
      const [ref] = await bunny.uploadMedia([prepared], false, (d, t) => setProgress(d / t));
      await bunny.setGlobalWallpaper("media", undefined, ref);
    } catch (e) {
      bunny.say(e instanceof Error ? e.message : "That file can't be used");
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      <div className="group-title">Wallpaper for everyone</div>
      <div className="group">
        <div
          className={`dropzone ${drag ? "over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void applyFile(e.dataTransfer.files[0]);
          }}
        >
          <UploadCloud size={26} />
          <strong>{progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Drop an image or video here"}</strong>
          <span>PNG, JPG, GIF, WebP or MP4 / WebM up to 8 MB. Videos loop silently.</span>
          {progress !== null ? (
            <div className="tray-progress" style={{ width: "100%", maxWidth: "18rem" }}>
              <i style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          ) : (
            <button className="gbtn primary" type="button" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> Choose file
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              void applyFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="wall-grid">
          <button type="button" className="wall" style={{ backgroundImage: "url(/home.jpg)" }} aria-pressed={current === "default"} onClick={() => void bunny.setGlobalWallpaper("default")}>
            Fjord
          </button>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} type="button" className="wall" style={{ background: p.css }} aria-pressed={current === key} onClick={() => void bunny.setGlobalWallpaper("preset", key)}>
              {p.label}
            </button>
          ))}
          {current === "custom" ? (
            <div className="wall custom" aria-pressed>
              <ImageIcon size={16} /> Custom
            </div>
          ) : null}
        </div>
        <div className="opt stack">
          <span className="label">Or use an image link</span>
          <div className="row">
            <input className="input" style={{ flex: 1, minWidth: "12rem" }} value={url} placeholder="https://…/photo.jpg" onChange={(e) => setUrl(e.target.value)} />
            <button
              className="gbtn"
              type="button"
              disabled={!url.trim()}
              onClick={() => {
                void bunny.setGlobalWallpaper("image", url.trim());
                setUrl("");
              }}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="opt">
          <div className="txt">
            <strong>Reset wallpaper</strong>
            <span>{wp && wp.mode !== "default" ? `Changed by ${wp.byName} ${ago(wp.at)} ago` : "Everyone is on the default wallpaper."}</span>
          </div>
          <button className="gbtn danger" type="button" disabled={!wp || wp.mode === "default"} onClick={() => void bunny.setGlobalWallpaper("default")}>
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>
      <div className="group-title">Server announcement</div>
      <div className="group">
        <div className="opt stack">
          <span className="hint">Pinned under the top bar for everyone.</span>
          <textarea className="input" maxLength={240} value={notice} placeholder="Welcome! Be kind." onChange={(e) => setNotice(e.target.value)} />
          <div className="row">
            <button className="gbtn primary" type="button" disabled={!notice.trim()} onClick={() => void bunny.setAnnouncement(notice)}>
              <Megaphone size={15} /> Post
            </button>
            {bunny.announce?.text ? (
              <button
                className="gbtn"
                type="button"
                onClick={() => {
                  setNotice("");
                  void bunny.setAnnouncement("");
                }}
              >
                <Ban size={15} /> Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function MyTag({ bunny }: { bunny: Bunny }) {
  const me = bunny.identity?.id || "";
  const mine = bunny.perks[me]?.role;
  const [text, setText] = useState(mine?.text || "Admin");
  const [color, setColor] = useState(mine?.color || "#ffc35c");
  return (
    <>
      <div className="group-title">Your tag</div>
      <div className="group">
        <div className="opt">
          <div className="txt">
            <strong>Shown next to your name</strong>
            <span>Any text and any color. Everyone sees it.</span>
          </div>
          <RoleBadge role={text.trim() ? { text: text.trim(), color } : null} admin />
        </div>
        <div className="opt">
          <input className="input" style={{ flex: 1, minWidth: "8rem" }} value={text} maxLength={18} placeholder="Owner" onChange={(e) => setText(e.target.value)} aria-label="Tag text" />
          <label className="color-pick" title="Tag color">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Tag color" />
            <span style={{ background: color }} />
          </label>
          <button className="gbtn primary" type="button" disabled={!text.trim()} onClick={() => void bunny.setPerk(me, bunny.profile.name, true, { text, color })}>
            Save
          </button>
          {mine ? (
            <button
              className="gbtn"
              type="button"
              onClick={() => {
                setText("Admin");
                setColor("#ffc35c");
                void bunny.setPerk(me, bunny.profile.name, true, null);
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
