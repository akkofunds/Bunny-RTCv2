import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Copy, CornerUpLeft, Hash, Lock, Paperclip, Pencil, Search, Send, Smile, SmilePlus, Terminal, Timer, Trash2, X } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import type { Msg } from "@/lib/bunny/types";
import { RichText, mentions } from "./rich-text";
import { AdminTag, Face, Floating, dayLabel, timeLabel } from "./ui";
import type { MenuTarget } from "./user-menu";
import { ACCEPT, AttachTray, MediaGrid, useAttachments } from "./media-view";
import { matchCommands, runCommand } from "./commands";

const QUICK = ["🔥", "😂", "❤️", "👍", "👀", "⭐"];
const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳","😅","😉","🙂","😇","🥰","😋",
  "😜","🤪","🤗","🤔","😐","😴","🤤","😷","🤒","🤯","😱","😭","😤","😡","🤬","💀",
  "👻","👽","🤖","💩","👋","👍","👎","👏","🙌","🙏","💪","✌️","🤞","🤟","👌","🔥",
  "✨","⭐","💯","💥","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","🌟","🌙","☀️",
  "🌈","⚡","❄️","🌊","🍀","🌸","🎉","🎊","🎁","🏆","🎵","💬","👀","💤","🚀","💎",
];

export function TypingLine({ names }: { names: string[] }) {
  if (!names.length) return <div className="typing" />;
  const label = names.length === 1 ? `${names[0]} is typing` : names.length === 2 ? `${names[0]} and ${names[1]} are typing` : "Several people are typing";
  return (
    <div className="typing" aria-live="polite">
      <i>
        <b />
        <b />
        <b />
      </i>
      {label}
    </div>
  );
}

export function ServerView({
  bunny,
  showSearch,
  openMenu,
  composerRef,
}: {
  bunny: Bunny;
  showSearch: boolean;
  openMenu: (t: MenuTarget) => void;
  composerRef: React.RefObject<HTMLInputElement | null>;
}) {
  const me = bunny.identity?.id || "";
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [reactFor, setReactFor] = useState<{ msg: Msg; x: number; y: number } | null>(null);
  const [moreEmoji, setMoreEmoji] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const banned = bunny.isBanned(me);
  const h24 = bunny.settings.clock24;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bunny.messages.filter((m) => {
      if (bunny.blocked.includes(m.authorId)) return false;
      if (!bunny.adminMode && bunny.isBanned(m.authorId)) return false;
      if (q && !(m.text.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [bunny, query]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [visible]);

  useEffect(() => {
    if (!picker) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".picker") || target?.closest("[data-emoji-toggle]")) return;
      setPicker(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [picker]);

  const canCommand = bunny.adminMode && !!bunny.session;
  const suggestions = canCommand ? matchCommands(draft) : [];
  const showCommands = suggestions.length > 0 && !draft.includes("\n");
  const staff = !!bunny.session;
  const locked = !!bunny.room?.locked && !staff;
  const slow = staff ? 0 : bunny.room?.slowmode || 0;
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [cooldownUntil]);
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const attach = useAttachments(bunny.say);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cmdIndex, setCmdIndex] = useState(0);

  async function send() {
    if (banned || progress !== null) return;
    if (canCommand && draft.trim().startsWith("/") && !attach.items.length) {
      const res = await runCommand(bunny, draft);
      bunny.say(res.message);
      if (res.ok) setDraft("");
      return;
    }
    if (!draft.trim() && !attach.items.length) return;
    let media;
    if (attach.items.length) {
      try {
        setProgress(0);
        media = await bunny.uploadMedia(attach.items, false, (d, t) => setProgress(d / t));
      } catch (e) {
        bunny.say(e instanceof Error ? e.message : "Upload failed");
        setProgress(null);
        return;
      }
    }
    const ok = await bunny.sendMessage(draft, replyTo || undefined, media);
    setProgress(null);
    if (ok) {
      setDraft("");
      setReplyTo(null);
      attach.clear();
      stickRef.current = true;
      if (slow) {
        setCooldownUntil(Date.now() + slow * 1000);
        setNow(Date.now());
      }
    }
  }

  const typingNames = Object.entries(bunny.typing)
    .filter(([id]) => !bunny.blocked.includes(id))
    .map(([, t]) => t.name);
  const count = bunny.people.length;

  return (
    <section
      className={`panel lg-panel ${dragging ? "dropping" : ""}`}
      aria-label="Server chat"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files") || banned || locked) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!banned && !locked) void attach.add(e.dataTransfer.files);
      }}
    >
      <div className="panel-head">
        <span className="hash">
          <Hash size={18} />
        </span>
        <div className="grow">
          <h2>lounge</h2>
          <p>{bunny.online ? `${count} online · everyone shares this room` : bunny.status}</p>
        </div>
        {bunny.room?.locked ? (
          <span className="chip warn">
            <Lock size={12} /> Locked
          </span>
        ) : null}
        {bunny.room?.slowmode ? (
          <span className="chip">
            <Timer size={12} /> {bunny.room.slowmode}s
          </span>
        ) : null}
      </div>
      {showSearch ? (
        <label className="search">
          <Search size={15} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages and people" aria-label="Search messages" />
          {query ? (
            <button className="tiny" type="button" aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          ) : null}
        </label>
      ) : null}
      <div
        className={`thread ${bunny.settings.compact ? "compact" : ""}`}
        ref={threadRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          stickRef.current = bottom;
          if (bottom !== atBottom) setAtBottom(bottom);
        }}
      >
        <div className="welcome">
          <h2>Welcome to Bunny RTC</h2>
          <p>Everyone here shares one live room. Click anyone to add them as a friend or send a direct message.</p>
        </div>
        {visible.map((msg, index) => {
          const prev = visible[index - 1];
          const cont = !!prev && prev.authorId === msg.authorId && msg.at - prev.at < 5 * 60 * 1000 && dayLabel(prev.at) === dayLabel(msg.at) && !msg.replyTo;
          const showDay = !prev || dayLabel(prev.at) !== dayLabel(msg.at);
          const mine = msg.authorId === me;
          const info = bunny.lookup(msg.authorId);
          const adminMsg = bunny.isAdminMsg(msg);
          const isBanned = bunny.isBanned(msg.authorId);
          const mentioned = !mine && (mentions(msg.text, bunny.profile.name) || (!!msg.replyTo && bunny.messages.find((m) => m.id === msg.replyTo!.id)?.authorId === me));
          const canDelete = mine || (bunny.adminMode && !!bunny.session);
          const open = (e: React.MouseEvent) => openMenu({ id: msg.authorId, x: e.clientX, y: e.clientY });
          return (
            <div key={msg.id}>
              {showDay ? <div className="day">{dayLabel(msg.at)}</div> : null}
              <article
                className={`msg ${cont ? "cont" : ""} ${mentioned ? "mention" : ""} ${isBanned ? "banned" : ""} ${selected === msg.id ? "selected" : ""}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button, a, textarea, input")) return;
                  setSelected((cur) => (cur === msg.id ? null : msg.id));
                }}
              >
                <button type="button" className="face-btn" onClick={open} aria-label={`Open ${msg.name}`}>
                  <Face avatar={info.avatar} color={info.color} label={msg.name} />
                </button>
                <div style={{ minWidth: 0 }}>
                  {msg.replyTo ? (
                    <div className="reply-ref">
                      <CornerUpLeft size={12} />
                      <b>{msg.replyTo.name}</b>
                      <span>{msg.replyTo.text}</span>
                    </div>
                  ) : null}
                  <div className="who">
                    <button type="button" className="name" style={{ color: `color-mix(in srgb, ${info.color} 45%, white)` }} onClick={open}>
                      {msg.name}
                    </button>
                    {adminMsg ? <AdminTag /> : null}
                    {isBanned ? <span className="tag ban">Banned</span> : null}
                    <span className="stamp">{timeLabel(msg.at, h24)}</span>
                  </div>
                  {editing === msg.id ? (
                    <div className="editbox">
                      <textarea
                        value={editText}
                        maxLength={2000}
                        autoFocus
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditing(null);
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void bunny.editMessage(msg, editText);
                            setEditing(null);
                          }
                        }}
                        aria-label="Edit message"
                      />
                      <div className="row">
                        <button
                          className="gbtn sm primary"
                          type="button"
                          onClick={() => {
                            void bunny.editMessage(msg, editText);
                            setEditing(null);
                          }}
                        >
                          Save
                        </button>
                        <button className="gbtn sm" type="button" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text">
                      {msg.text ? <RichText text={msg.text} selfName={bunny.profile.name} /> : null}
                      {msg.editedAt ? <span className="edited"> (edited)</span> : null}
                    </p>
                  )}
                  {msg.media ? <MediaGrid media={msg.media} load={bunny.loadMedia} /> : null}
                  {confirmDelete === msg.id ? (
                    <div className="row" style={{ marginTop: "0.4rem" }}>
                      <button
                        className="gbtn sm danger"
                        type="button"
                        onClick={() => {
                          bunny.deleteMessage(msg);
                          setConfirmDelete(null);
                        }}
                      >
                        Delete
                      </button>
                      <button className="gbtn sm" type="button" onClick={() => setConfirmDelete(null)}>
                        Keep
                      </button>
                    </div>
                  ) : null}
                  {msg.reactions && Object.keys(msg.reactions).length ? (
                    <div className="reacts">
                      {Object.entries(msg.reactions).map(([emoji, ids]) => {
                        if (!Array.isArray(ids) || !ids.length || emoji.length > 8) return null;
                        return (
                          <button key={emoji} type="button" className={ids.includes(me) ? "react mine" : "react"} onClick={() => bunny.react(msg, emoji)}>
                            {emoji} {ids.length}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="msg-slot">
                  <div className="msg-actions lg-soft" role="toolbar" aria-label="Message actions">
                    <button
                      className="tiny"
                      type="button"
                      aria-label="Add reaction"
                      title="React"
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setReactFor({ msg, x: r.right - 288, y: r.bottom + 6 });
                      }}
                    >
                      <SmilePlus size={15} />
                    </button>
                    <button
                      className="tiny"
                      type="button"
                      aria-label="Reply"
                      title="Reply"
                      onClick={() => {
                        setReplyTo(msg);
                        setSelected(null);
                        composerRef.current?.focus();
                      }}
                    >
                      <CornerUpLeft size={15} />
                    </button>
                    {mine ? (
                      <button
                        className="tiny"
                        type="button"
                        aria-label="Edit message"
                        title="Edit"
                        onClick={() => {
                          setEditing(msg.id);
                          setEditText(msg.text);
                          setConfirmDelete(null);
                          setSelected(null);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                    ) : (
                      <button
                        className="tiny"
                        type="button"
                        aria-label="Copy message"
                        title="Copy text"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(msg.text);
                            bunny.say("Copied");
                          } catch {
                            bunny.say("Could not copy");
                          }
                        }}
                      >
                        <Copy size={15} />
                      </button>
                    )}
                    {canDelete ? (
                      <button className="tiny danger" type="button" aria-label="Delete message" title="Delete" onClick={() => setConfirmDelete(msg.id)}>
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            </div>
          );
        })}
        {query && visible.length === 0 ? <p className="empty">Nothing matches that.</p> : null}
      </div>
      {!atBottom ? (
        <button
          className="gbtn sm lg"
          type="button"
          style={{ position: "absolute", right: "1.2rem", bottom: "5.6rem", zIndex: 3 }}
          onClick={() => {
            const el = threadRef.current;
            if (el) el.scrollTop = el.scrollHeight;
            stickRef.current = true;
            setAtBottom(true);
          }}
        >
          <ArrowDown size={14} /> Latest
        </button>
      ) : null}
      {reactFor ? (
        <Floating
          x={reactFor.x}
          y={reactFor.y}
          className="menu lg react-pop"
          onClose={() => {
            setReactFor(null);
            setMoreEmoji(false);
          }}
        >
          <div className="quick-row">
            {QUICK.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`React ${emoji}`}
                onClick={() => {
                  bunny.react(reactFor.msg, emoji);
                  setReactFor(null);
                  setMoreEmoji(false);
                }}
              >
                {emoji}
              </button>
            ))}
            <button type="button" className="more" aria-label="More emoji" aria-expanded={moreEmoji} onClick={() => setMoreEmoji((v) => !v)}>
              <SmilePlus size={17} />
            </button>
          </div>
          {moreEmoji ? (
            <div className="grid" style={{ marginTop: "0.35rem" }}>
              {EMOJIS.map((emoji, i) => (
                <button
                  key={emoji + i}
                  type="button"
                  onClick={() => {
                    bunny.react(reactFor.msg, emoji);
                    setReactFor(null);
                    setMoreEmoji(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </Floating>
      ) : null}
      <TypingLine names={typingNames} />
      <div className="composer-wrap">
        {picker ? (
          <div className="picker lg">
            <h3>Emoji</h3>
            <div className="grid">
              {EMOJIS.map((emoji, i) => (
                <button key={emoji + i} type="button" onClick={() => setDraft((d) => (d + emoji).slice(0, 2000))}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {showCommands ? (
          <div className="cmds lg" role="listbox" aria-label="Admin commands">
            <h3>
              <Terminal size={12} /> Admin commands
            </h3>
            {suggestions.slice(0, 8).map((c, i) => (
              <button
                key={c.name}
                type="button"
                role="option"
                aria-selected={i === Math.min(cmdIndex, suggestions.length - 1)}
                className="cmd"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setDraft(`/${c.name} `);
                  composerRef.current?.focus();
                }}
              >
                <code>
                  /{c.name}
                  {c.args ? <i> {c.args}</i> : null}
                </code>
                <span>{c.help}</span>
              </button>
            ))}
          </div>
        ) : null}
        <AttachTray items={attach.items} onRemove={attach.remove} progress={progress} />
        {replyTo ? (
          <div className="replying">
            <CornerUpLeft size={13} />
            <span>
              Replying to <b>{replyTo.name}</b>: {replyTo.text}
            </span>
            <button className="tiny" type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}>
              <X size={13} />
            </button>
          </div>
        ) : null}
        <form
          className="composer lg"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <button className="gbtn icon" type="button" data-emoji-toggle aria-label="Emoji" aria-expanded={picker} onClick={() => setPicker((v) => !v)} style={{ background: "transparent", boxShadow: "none" }}>
            <Smile size={20} />
          </button>
          <button
            className="gbtn icon"
            type="button"
            aria-label="Attach images or video"
            title="Attach images or video"
            disabled={!bunny.online || banned || locked || progress !== null}
            onClick={() => fileRef.current?.click()}
            style={{ background: "transparent", boxShadow: "none" }}
          >
            <Paperclip size={19} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              void attach.add(e.target.files);
              e.target.value = "";
            }}
          />
          {canCommand ? (
            <button
              className="gbtn icon cmd-btn"
              type="button"
              aria-label="Admin commands"
              title="Admin commands"
              onClick={() => {
                setDraft("/");
                composerRef.current?.focus();
              }}
              style={{ background: "transparent", boxShadow: "none" }}
            >
              <Terminal size={18} />
            </button>
          ) : null}
          <input
            ref={composerRef}
            value={draft}
            maxLength={2000}
            disabled={!bunny.online || banned || locked || cooldown > 0}
            placeholder={
              banned
                ? "You're banned from this server"
                : locked
                  ? "Chat is locked by an admin"
                  : cooldown > 0
                    ? `Slowmode: wait ${cooldown}s`
                    : !bunny.online
                      ? "Waiting for the room…"
                      : canCommand
                        ? "Message #lounge, or type / for commands"
                        : "Message #lounge"
            }
            aria-label="Message"
            onChange={(e) => {
              setDraft(e.target.value);
              setCmdIndex(0);
              if (e.target.value && !e.target.value.startsWith("/")) bunny.pingTyping();
            }}
            onPaste={(e) => {
              const files = [...e.clipboardData.files];
              if (files.length) {
                e.preventDefault();
                void attach.add(files);
              }
            }}
            onKeyDown={(e) => {
              if (showCommands && !/\s/.test(draft.slice(1))) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const n = Math.min(suggestions.length, 8);
                  setCmdIndex((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
                  return;
                }
                if (e.key === "Tab" || (e.key === "Enter" && suggestions.length && draft.length > 1 && suggestions[0].name !== draft.slice(1).toLowerCase())) {
                  e.preventDefault();
                  const pick = suggestions[Math.min(cmdIndex, suggestions.length - 1)];
                  if (pick) setDraft(`/${pick.name} `);
                  return;
                }
              }
              if (e.key === "Escape") {
                setPicker(false);
                setReplyTo(null);
                if (draft.startsWith("/")) setDraft("");
              }
              if (e.key === "ArrowUp" && !draft) {
                const last = [...bunny.messages].reverse().find((m) => m.authorId === me);
                if (last) {
                  e.preventDefault();
                  setEditing(last.id);
                  setEditText(last.text);
                }
              }
            }}
          />
          <button className="send" type="submit" disabled={!bunny.online || (!draft.trim() && !attach.items.length) || banned || locked || cooldown > 0 || progress !== null} aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
}
