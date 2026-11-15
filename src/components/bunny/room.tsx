import { useCallback, useEffect, useRef, useState } from "react";
import { AtSign, Ban, Hash, Megaphone, Search, Settings as SettingsIcon, ShieldCheck, TriangleAlert, Users, X } from "lucide-react";
import { useBunny } from "@/lib/bunny/use-bunny";
import { ACCENTS, PRESETS, safeWallpaperUrl } from "@/lib/bunny/types";
import { AdminTag, Face, StarMark } from "./ui";
import { ServerView } from "./server-view";
import { DirectView } from "./direct-view";
import { ModView } from "./mod-view";
import { SettingsSheet } from "./settings-sheet";
import { UserMenu, type MenuTarget } from "./user-menu";

function LensFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="lg-lens" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="38" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

export function Room({ mode = "user" }: { mode?: "user" | "admin" }) {
  const bunny = useBunny(mode);
  const [membersOpen, setMembersOpen] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const [refract, setRefract] = useState(false);
  const composerRef = useRef<HTMLInputElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const s = bunny.settings;
  const me = bunny.identity?.id || "";
  const isAdmin = !!bunny.session;
  const banned = bunny.isBanned(me);

  useEffect(() => {
    const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
    setRefract(!!brands?.some((b) => b.brand === "Chromium"));
    if (window.innerWidth < 860) setMembersOpen(false);
  }, []);

  useEffect(() => {
    const unread = bunny.serverUnread + bunny.directUnread;
    document.title = `${unread ? `(${unread}) ` : ""}${mode === "admin" ? "Admin · " : ""}Bunny RTC`;
  }, [bunny.serverUnread, bunny.directUnread, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        bunny.setView({ tab: "server", peer: null });
        setShowSearch(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bunny]);

  const accent = ACCENTS[s.accent] || ACCENTS.teal;
  const wp = bunny.wallpaper;
  let wallStyle: React.CSSProperties | undefined;
  if (wp?.mode === "preset" && wp.value && PRESETS[wp.value]) wallStyle = { background: PRESETS[wp.value].css };
  else if (wp?.mode === "image" && safeWallpaperUrl(wp.value)) wallStyle = { backgroundImage: `url("${wp.value}")` };

  const people = bunny.people.filter((p) => !bunny.blocked.includes(p.id) && (bunny.adminMode || !bunny.isBanned(p.id)));
  const tab = bunny.view.tab;
  const mention = (name: string) => {
    bunny.setView({ tab: "server", peer: null });
    window.setTimeout(() => {
      const el = composerRef.current;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(el, `${el.value}${el.value && !el.value.endsWith(" ") ? " " : ""}@${name.split(/\s+/)[0]} `);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    }, 30);
  };

  return (
    <div
      className={`stage ${refract ? "refract" : ""}`}
      data-glass={s.glass}
      data-size={s.textSize}
      data-motion={s.reduceMotion ? "reduce" : undefined}
      style={{ "--accent": accent.color, "--accent-ink": accent.ink, "--dim": String(s.dim / 100), "--color-accent": accent.color } as React.CSSProperties}
    >
      <LensFilter />
      <div className="wallpaper" style={wallStyle} />
      <div className="shell">
        <header className="topbar">
          <div className="brand lg">
            <div className="mark">
              <StarMark className="size-5" />
            </div>
            <div>
              <h1>Bunny RTC{mode === "admin" ? " · Admin" : ""}</h1>
              <p>
                <i className={`live-dot ${bunny.online ? "on" : ""}`} />
                {bunny.online ? `${bunny.people.length} online` : bunny.status}
              </p>
            </div>
          </div>

          <nav className="dockbar lg lg-lens" aria-label="Sections">
            <button type="button" className={`seg ${tab === "server" ? "active" : ""}`} aria-current={tab === "server"} onClick={() => bunny.setView({ tab: "server", peer: null })}>
              <Hash size={16} />
              <span className="seg-label">Server</span>
              {bunny.serverUnread && tab !== "server" ? <span className="badge">{bunny.serverUnread > 99 ? "99+" : bunny.serverUnread}</span> : null}
            </button>
            <button type="button" className={`seg ${tab === "direct" ? "active" : ""}`} aria-current={tab === "direct"} onClick={() => bunny.setView({ tab: "direct", peer: tab === "direct" ? null : bunny.view.peer })}>
              <AtSign size={16} />
              <span className="seg-label">Direct</span>
              {bunny.directUnread ? <span className="badge">{bunny.directUnread}</span> : null}
            </button>
            {bunny.adminMode && isAdmin ? (
              <button type="button" className={`seg mod ${tab === "mod" ? "active" : ""}`} aria-current={tab === "mod"} onClick={() => bunny.setView({ tab: "mod", peer: null })}>
                <ShieldCheck size={16} />
                <span className="seg-label">Admin</span>
              </button>
            ) : null}
          </nav>

          <div className="tools lg">
            {tab === "server" ? (
              <>
                <button className={`gbtn icon ${showSearch ? "on" : ""}`} type="button" aria-label="Search messages" aria-pressed={showSearch} onClick={() => setShowSearch((v) => !v)}>
                  <Search size={18} />
                </button>
                <button className={`gbtn icon ${membersOpen ? "on" : ""}`} type="button" aria-label="Members" aria-pressed={membersOpen} onClick={() => setMembersOpen((v) => !v)}>
                  <Users size={18} />
                </button>
              </>
            ) : null}
            <button className="gbtn icon" type="button" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon size={18} />
            </button>
            <button className="gbtn icon" type="button" aria-label="Your profile" onClick={(e) => setMenu({ id: me, x: e.clientX - 240, y: e.clientY + 16 })} style={{ padding: 0 }}>
              <Face avatar={bunny.profile.avatar} color={bunny.profile.color} label={bunny.profile.name || "You"} status={s.status} size="2.1rem" />
            </button>
          </div>
        </header>

        {bunny.announce?.text ? (
          <div className="announce lg-soft" role="status">
            <Megaphone size={16} />
            <span>{bunny.announce.text}</span>
            <small>{bunny.announce.byName}</small>
          </div>
        ) : null}

        <main className="body">
          {tab === "server" ? (
            <>
              <ServerView bunny={bunny} showSearch={showSearch} openMenu={setMenu} composerRef={composerRef} />
              {membersOpen ? (
                <aside className="side floating lg-panel" aria-label="Members">
                  <div className="side-head">
                    <h2>Online · {people.length}</h2>
                    <button className="gbtn sm icon" type="button" aria-label="Close members" onClick={() => setMembersOpen(false)} style={{ background: "transparent", boxShadow: "none" }}>
                      <X size={15} />
                    </button>
                  </div>
                  <div className="people">
                    {people.map((p) => {
                      const admin = bunny.isAdminPerson(p.id);
                      return (
                        <button
                          type="button"
                          className="person"
                          key={p.id}
                          onClick={(e) => setMenu({ id: p.id, x: e.clientX - 20, y: e.clientY + 8 })}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setMenu({ id: p.id, x: e.clientX, y: e.clientY });
                          }}
                        >
                          <Face avatar={p.avatar} color={p.color} label={p.name} status={p.status || "online"} />
                          <span className="meta">
                            <strong style={{ color: admin ? "#ffe08a" : undefined }}>
                              {p.name}
                              {admin ? <AdminTag /> : null}
                            </strong>
                            <span>{p.id === me ? "You" : p.bio || (bunny.friends[p.id] ? "Friend" : p.status === "dnd" ? "Do not disturb" : p.status === "idle" ? "Idle" : "Online")}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>
              ) : null}
            </>
          ) : null}
          {tab === "direct" ? <DirectView bunny={bunny} openMenu={setMenu} /> : null}
          {tab === "mod" && bunny.adminMode && isAdmin ? <ModView bunny={bunny} openMenu={setMenu} /> : null}
        </main>
      </div>

      {menu ? <UserMenu bunny={bunny} target={menu} onClose={closeMenu} onMention={mention} /> : null}
      {settingsOpen ? <SettingsSheet bunny={bunny} onClose={() => setSettingsOpen(false)} /> : null}
      {bunny.toast ? <div className="toast lg">{bunny.toast}</div> : null}

      {bunny.warnings[0] ? (
        <div className="backdrop">
          <div className="modal lg" role="alertdialog" aria-labelledby="warn-title">
            <div className="gate-icon">
              <TriangleAlert size={24} />
            </div>
            <h2 id="warn-title">You've received a warning</h2>
            <p style={{ margin: "0.5rem 0 0.8rem" }}>An admin flagged something you did in Bunny RTC.</p>
            <div className="callout">
              <TriangleAlert size={16} />
              <div>“{bunny.warnings[0].reason}”</div>
            </div>
            <p style={{ fontSize: "0.78rem" }}>Repeated problems can lead to a ban.</p>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: "0.9rem" }}>
              <button className="gbtn primary" type="button" onClick={() => bunny.ackWarning(bunny.warnings[0].id)}>
                I understand
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {banned && !bunny.adminMode ? (
        <div className="backdrop" style={{ background: "rgba(2,6,10,0.55)" }}>
          <div className="modal lg" role="alertdialog" aria-labelledby="ban-title">
            <div className="gate-icon" style={{ color: "#ff8b8b" }}>
              <Ban size={24} />
            </div>
            <h2 id="ban-title">You've been banned</h2>
            <p style={{ margin: "0.5rem 0 0.8rem" }}>An admin removed you from this server. You can't send messages or DMs.</p>
            {bunny.bans[me]?.reason ? (
              <div className="callout red">
                <Ban size={16} />
                <div>Reason: “{bunny.bans[me].reason}”</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
