import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Copy, CornerUpLeft, Hash, Pencil, Search, Send, Smile, SmilePlus, Trash2, X } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import type { Msg } from "@/lib/bunny/types";
import { RichText, mentions } from "./rich-text";
import { AdminTag, Face, Floating, dayLabel, timeLabel } from "./ui";
import type { MenuTarget } from "./user-menu";

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

  async function send() {
    if (!draft.trim() || banned) return;
    const ok = await bunny.sendMessage(draft, replyTo || undefined);
    if (ok) {
      setDraft("");
      setReplyTo(null);
      stickRef.current = true;
    }
  }

  const typingNames = Object.entries(bunny.typing)
    .filter(([id]) => !bunny.blocked.includes(id))
    .map(([, t]) => t.name);
  const count = bunny.people.length;

  return (
    <section className="panel lg-panel" aria-label="Server chat">
      <div className="panel-head">
        <span className="hash">
          <Hash size={18} />
        </span>
        <div className="grow">
          <h2>lounge</h2>
          <p>{bunny.online ? `${count} online · everyone shares this room` : bunny.status}</p>
        </div>
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
                    {bunny.friends[msg.authorId] ? <span className="tag friend">Friend</span> : null}
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
                      <RichText text={msg.text} selfName={bunny.profile.name} />
                      {msg.editedAt ? <span className="edited"> (edited)</span> : null}
                    </p>
                  )}
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
          <input
            ref={composerRef}
            value={draft}
            maxLength={2000}
            disabled={!bunny.online || banned}
            placeholder={banned ? "You're banned from this server" : bunny.online ? "Message #lounge" : "Waiting for the room…"}
            aria-label="Message"
            onChange={(e) => {
              setDraft(e.target.value);
              if (e.target.value) bunny.pingTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setPicker(false);
                setReplyTo(null);
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
          <button className="send" type="submit" disabled={!bunny.online || !draft.trim() || banned} aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
}
