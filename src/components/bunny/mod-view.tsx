import { useMemo, useState } from "react";
import { ArrowLeft, Ban, Image as ImageIcon, Megaphone, MessagesSquare, RotateCcw, ScrollText, Search, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import { PRESETS, threadKey } from "@/lib/bunny/types";
import { AdminTag, Face, ago, shrinkWallpaper, timeLabel } from "./ui";
import type { MenuTarget } from "./user-menu";

type ModTab = "overview" | "members" | "logs" | "dms" | "server";

export function ModView({ bunny, openMenu }: { bunny: Bunny; openMenu: (t: MenuTarget) => void }) {
  const [tab, setTab] = useState<ModTab>("overview");
  const logs = useMemo(() => Object.values(bunny.logs).sort((a, b) => b.at - a.at), [bunny.logs]);
  const activeBans = Object.values(bunny.bans).filter((b) => b.kind === "ban" && !bunny.admins[b.target]);
  const warns = Object.values(bunny.warnsIssued).sort((a, b) => b.at - a.at);
  const dmCount = Object.keys(bunny.allDms).length;

  const tabs: { id: ModTab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: ShieldCheck },
    { id: "members", label: "Members", icon: Users },
    { id: "logs", label: "Deleted & edits", icon: ScrollText },
    { id: "dms", label: "Direct messages", icon: MessagesSquare },
    { id: "server", label: "Wallpaper & notice", icon: ImageIcon },
  ];

  return (
    <section className="panel lg-panel" aria-label="Admin panel">
      <div className="panel-head">
        <span className="hash" style={{ color: "#ffcf5c" }}>
          <ShieldCheck size={18} />
        </span>
        <div className="grow">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            Moderation <AdminTag />
          </h2>
          <p>Signed actions. Everyone's app checks them against the admin key.</p>
        </div>
      </div>
      <div className="mod-tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={`seg ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} style={{ flex: "none" }}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="mod-body">
        {tab === "overview" ? (
          <>
            <div className="stats">
              <div className="stat">
                <b>{bunny.people.length}</b>
                <span>Online now</span>
              </div>
              <div className="stat">
                <b>{bunny.messages.length}</b>
                <span>Messages in #lounge</span>
              </div>
              <div className="stat">
                <b>{activeBans.length}</b>
                <span>Active bans</span>
              </div>
              <div className="stat">
                <b>{warns.length}</b>
                <span>Warnings issued</span>
              </div>
              <div className="stat">
                <b>{logs.length}</b>
                <span>Logged deletes & edits</span>
              </div>
              <div className="stat">
                <b>{dmCount}</b>
                <span>Direct messages seen</span>
              </div>
            </div>
            <div className="group-title">Recent activity</div>
            <div className="group">
              {logs.slice(0, 5).map((l) => (
                <LogRow key={l.key} bunny={bunny} log={l} />
              ))}
              {logs.length === 0 ? <div className="empty">Deleted and edited messages will appear here.</div> : null}
            </div>
          </>
        ) : null}
        {tab === "members" ? <Members bunny={bunny} openMenu={openMenu} /> : null}
        {tab === "logs" ? <Logs bunny={bunny} /> : null}
        {tab === "dms" ? <Dms bunny={bunny} /> : null}
        {tab === "server" ? <ServerLook bunny={bunny} /> : null}
      </div>
    </section>
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
            <div className="opt" key={p.id}>
              <Face avatar={p.avatar} color={p.color} label={p.name} status={p.online ? p.status : undefined} size="2.2rem" />
              <div className="txt">
                <strong style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                  {p.name}
                  {bunny.admins[p.id] ? <AdminTag /> : null}
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
                    className="gbtn sm"
                    type="button"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      openMenu({ id: p.id, x: r.right - 264, y: r.bottom + 6 });
                    }}
                  >
                    <TriangleAlert size={13} /> Actions
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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(bunny.announce?.text || "");
  const wp = bunny.wallpaper;
  const current = !wp || wp.mode === "default" ? "default" : wp.mode === "preset" ? wp.value : "image";
  return (
    <>
      <div className="group-title">Wallpaper for everyone</div>
      <div className="group">
        <div className="wall-grid">
          <button type="button" className="wall" style={{ backgroundImage: "url(/home.jpg)" }} aria-pressed={current === "default"} onClick={() => void bunny.setGlobalWallpaper("default")}>
            Fjord (default)
          </button>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} type="button" className="wall" style={{ background: p.css }} aria-pressed={current === key} onClick={() => void bunny.setGlobalWallpaper("preset", key)}>
              {p.label}
            </button>
          ))}
          {wp?.mode === "image" && wp.value ? (
            <button type="button" className="wall" style={{ backgroundImage: `url("${wp.value}")` }} aria-pressed>
              Custom
            </button>
          ) : null}
        </div>
        <div className="opt stack">
          <span className="label">Use any image</span>
          <div className="row">
            <input className="input" style={{ flex: 1, minWidth: "12rem" }} value={url} placeholder="https://…/photo.jpg" onChange={(e) => setUrl(e.target.value)} />
            <button
              className="gbtn primary"
              type="button"
              disabled={!url.trim()}
              onClick={() => {
                void bunny.setGlobalWallpaper("image", url.trim());
                setUrl("");
              }}
            >
              Apply link
            </button>
            <label className="gbtn file">
              {busy ? "Preparing…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  const data = await shrinkWallpaper(file);
                  setBusy(false);
                  if (data) void bunny.setGlobalWallpaper("image", data);
                  else bunny.say("That image is too large to share");
                }}
              />
            </label>
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
          <span style={{ fontSize: "0.8rem", color: "var(--color-faint)" }}>Pinned under the top bar for everyone.</span>
          <textarea className="input" maxLength={240} value={notice} placeholder="Welcome! Be kind." onChange={(e) => setNotice(e.target.value)} />
          <div className="row">
            <button className="gbtn primary" type="button" disabled={!notice.trim()} onClick={() => void bunny.setAnnouncement(notice)}>
              <Megaphone size={15} /> Post announcement
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
