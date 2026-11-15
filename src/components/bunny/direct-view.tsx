import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Inbox, Lock, MessageCircle, MoreHorizontal, Paperclip, Pencil, Send, Trash2, UserPlus, X } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import { RichText } from "./rich-text";
import { Face, RoleBadge, ago, dayLabel, timeLabel } from "./ui";
import type { MenuTarget } from "./user-menu";
import { ACCEPT, AttachTray, MediaGrid, useAttachments } from "./media-view";

export function DirectView({ bunny, openMenu }: { bunny: Bunny; openMenu: (t: MenuTarget) => void }) {
  const me = bunny.identity?.id || "";
  const peer = bunny.view.peer;
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requests = Object.values(bunny.requests);
  const info = peer ? bunny.lookup(peer) : null;

  const thread = useMemo(() => {
    if (!peer) return [];
    return Object.values(bunny.dms)
      .filter((d) => (d.from === me && d.to === peer) || (d.from === peer && d.to === me))
      .sort((a, b) => a.at - b.at);
  }, [bunny.dms, peer, me]);

  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  async function saveEdit(d: (typeof thread)[number]) {
    if (!editText.trim() && !d.media?.length) return;
    if (editText.trim() === d.text) return setEditing(null);
    if (await bunny.editDirect(d, editText)) setEditing(null);
  }
  const mountedAt = useRef(Date.now());
  const lastPeer = useRef<string | null>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (lastPeer.current !== peer || bunny.settings.reduceMotion) {
      el.scrollTop = el.scrollHeight;
      lastPeer.current = peer;
    } else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thread.length, peer, bunny.settings.reduceMotion]);

  useEffect(() => {
    if (peer) inputRef.current?.focus();
  }, [peer]);

  const blocked = !!peer && bunny.blocked.includes(peer);
  const banned = bunny.isBanned(me);

  const attach = useAttachments(bunny.say);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (!peer || (!draft.trim() && !attach.items.length) || progress !== null) return;
    let media;
    if (attach.items.length) {
      try {
        setProgress(0);
        media = await bunny.uploadMedia(attach.items, true, (d, t) => setProgress(d / t));
      } catch (e) {
        bunny.say(e instanceof Error ? e.message : "Upload failed");
        setProgress(null);
        return;
      }
    }
    const ok = await bunny.sendDirect(peer, draft, media);
    setProgress(null);
    if (ok) {
      setDraft("");
      attach.clear();
    }
  }

  return (
    <div className={`direct ${peer ? "has-peer" : ""}`}>
      <aside className="side convos lg-panel" aria-label="Conversations">
        <div className="side-head">
          <h2>Direct messages</h2>
        </div>
        <div className="people">
          {requests.length ? (
            <div style={{ marginBottom: "0.6rem" }}>
              <div className="group-title" style={{ margin: "0.2rem 0.5rem 0.45rem" }}>
                Friend requests · {requests.length}
              </div>
              {requests.map((r) => (
                <div className="req" key={r.from}>
                  <Face color={r.color} label={r.name} avatar={bunny.lookup(r.from).avatar} size="2rem" />
                  <div className="meta">
                    <strong>{r.name}</strong>
                    <span>wants to be friends · {ago(r.at)}</span>
                  </div>
                  <button className="gbtn sm icon primary" type="button" aria-label={`Accept ${r.name}`} onClick={() => bunny.acceptFriend(r)}>
                    <Check size={15} />
                  </button>
                  <button className="gbtn sm icon" type="button" aria-label={`Decline ${r.name}`} onClick={() => bunny.declineFriend(r)}>
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {bunny.conversations.length === 0 && !requests.length ? (
            <div className="empty">
              <Inbox size={26} />
              No conversations yet.
              <br />
              Tap someone in the Server member list, then choose <b>Message</b> or <b>Add friend</b>.
            </div>
          ) : null}
          {bunny.conversations.map((c) => {
            const p = bunny.lookup(c.peer);
            const friend = !!bunny.friends[c.peer];
            return (
              <button
                key={c.peer}
                type="button"
                className={`person ${peer === c.peer ? "active" : ""}`}
                onClick={() => bunny.setView({ tab: "direct", peer: c.peer })}
              >
                <Face avatar={p.avatar} anim={p.anim} color={p.color} label={p.name} status={p.online ? p.status : undefined} />
                <span className="meta">
                  <strong>
                    {p.name}
                    {friend ? <span className="tag friend">Friend</span> : null}
                  </strong>
                  <span className="convo-last">
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.last ? `${c.last.from === me ? "You: " : ""}${c.last.text || (c.last.media?.[0]?.kind === "video" ? "Sent a video" : "Sent a photo")}` : p.online ? "Online · say hi" : "Offline"}
                    </span>
                    {c.last ? <em>{ago(c.last.at)}</em> : null}
                  </span>
                </span>
                {c.unread ? <span className="badge">{c.unread}</span> : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="panel lg-panel chat" aria-label="Conversation">
        {peer && info ? (
          <>
            <div className="panel-head">
              <button className="gbtn sm icon only-mobile" type="button" aria-label="Back to conversations" onClick={() => bunny.setView({ tab: "direct", peer: null })}>
                <ArrowLeft size={16} />
              </button>
              <Face avatar={info.avatar} anim={info.anim} color={info.color} label={info.name} status={info.online ? info.status : undefined} size="2.2rem" />
              <div className="grow">
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {info.name}
                  <RoleBadge role={info.role} admin={!!bunny.admins[peer]} />
                </h2>
                <p>{info.online ? (info.status === "dnd" ? "Do not disturb" : info.status === "idle" ? "Idle" : "Online") : "Offline · they'll get it next time"}</p>
              </div>
              {!bunny.friends[peer] && !bunny.outgoing[peer] && !bunny.requests[peer] ? (
                <button className="gbtn sm" type="button" onClick={() => bunny.requestFriend(peer)} disabled={!info.box}>
                  <UserPlus size={14} /> <span className="seg-label">Add friend</span>
                </button>
              ) : null}
              <button
                className="gbtn sm icon"
                type="button"
                aria-label="More"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  openMenu({ id: peer, x: r.right - 260, y: r.bottom + 6 });
                }}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
            <div className="bubbles" ref={listRef}>
              <p className="privacy-note">
                <Lock size={12} /> Encrypted in transit. Server moderators can review direct messages for safety.
              </p>
              {thread.map((d, i) => {
                const prev = thread[i - 1];
                const mine = d.from === me;
                const gap = prev && (prev.from !== d.from || d.at - prev.at > 10 * 60 * 1000);
                const newDay = !prev || dayLabel(prev.at) !== dayLabel(d.at);
                return (
                  <div key={d.id} style={{ display: "contents" }}>
                    {newDay ? <div className="day">{dayLabel(d.at)}</div> : gap ? <div className="bubble-gap" /> : null}
                    <div
                      className={`bubble-row ${mine ? "mine" : ""} ${selected === d.id ? "selected" : ""} ${editing === d.id ? "editing" : ""}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button, a, textarea, video")) return;
                        setSelected((cur) => (cur === d.id ? null : d.id));
                      }}
                    >
                      {editing === d.id ? (
                        <div className="bubble-edit lg-soft">
                          <textarea
                            className="input"
                            autoFocus
                            value={editText}
                            maxLength={2000}
                            aria-label="Edit message"
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditing(null);
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void saveEdit(d);
                              }
                            }}
                          />
                          <div className="row" style={{ justifyContent: "flex-end" }}>
                            <span className="hint" style={{ marginRight: "auto" }}>
                              Enter to save · Esc to cancel
                            </span>
                            <button className="gbtn sm" type="button" onClick={() => setEditing(null)}>
                              Cancel
                            </button>
                            <button className="gbtn sm primary" type="button" onClick={() => void saveEdit(d)}>
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`bubble ${mine ? "mine" : ""} ${d.media && !d.text ? "media-only" : ""} ${d.at > mountedAt.current - 1500 ? "enter" : ""}`}>
                            {d.media ? <MediaGrid media={d.media} load={bunny.loadMedia} /> : null}
                            {d.text ? <RichText text={d.text} selfName={bunny.profile.name} /> : null}
                            <time>
                              {timeLabel(d.at, bunny.settings.clock24)}
                              {d.editedAt ? " · edited" : ""}
                            </time>
                          </div>
                          <div className="bubble-actions lg-soft" role="toolbar" aria-label="Message actions">
                            {confirmDelete === d.id ? (
                              <>
                                <button
                                  className="gbtn sm danger"
                                  type="button"
                                  onClick={() => {
                                    bunny.unsendDirect(d);
                                    setConfirmDelete(null);
                                  }}
                                >
                                  Delete
                                </button>
                                <button className="gbtn sm" type="button" onClick={() => setConfirmDelete(null)}>
                                  Keep
                                </button>
                              </>
                            ) : (
                              <>
                                {mine && d.text ? (
                                  <button
                                    className="tiny"
                                    type="button"
                                    aria-label="Edit message"
                                    title="Edit"
                                    onClick={() => {
                                      setEditing(d.id);
                                      setEditText(d.text);
                                      setSelected(null);
                                    }}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                ) : null}
                                {d.text ? (
                                  <button
                                    className="tiny"
                                    type="button"
                                    aria-label="Copy message"
                                    title="Copy"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(d.text);
                                        bunny.say("Copied");
                                      } catch {
                                        bunny.say("Could not copy");
                                      }
                                    }}
                                  >
                                    <Copy size={15} />
                                  </button>
                                ) : null}
                                {mine ? (
                                  <button className="tiny danger" type="button" aria-label="Delete message" title="Delete" onClick={() => setConfirmDelete(d.id)}>
                                    <Trash2 size={15} />
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {thread.length === 0 ? (
                <div className="empty">
                  <MessageCircle size={26} />
                  This is the start of your conversation with {info.name}.
                </div>
              ) : null}
            </div>
            <div className="composer-wrap" style={{ paddingTop: "0.5rem" }}>
              <AttachTray items={attach.items} onRemove={attach.remove} progress={progress} />
              <form
                className="composer lg"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <button
                  className="gbtn icon"
                  type="button"
                  aria-label="Attach images or video"
                  title="Attach images or video"
                  disabled={blocked || banned || !bunny.online || progress !== null}
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
                <input
                  ref={inputRef}
                  onPaste={(e) => {
                    const files = [...e.clipboardData.files];
                    if (files.length) {
                      e.preventDefault();
                      void attach.add(files);
                    }
                  }}
                  value={draft}
                  maxLength={2000}
                  style={{ paddingLeft: "0.2rem" }}
                  disabled={blocked || banned || !bunny.online}
                  placeholder={blocked ? "You blocked this person" : banned ? "You're banned" : `Message ${info.name}`}
                  aria-label={`Message ${info.name}`}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="send" type="submit" disabled={(!draft.trim() && !attach.items.length) || blocked || banned || !bunny.online || progress !== null} aria-label="Send">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="empty" style={{ margin: "auto" }}>
            <MessageCircle size={30} />
            <b style={{ display: "block", color: "var(--color-ink)", fontSize: "1rem", marginBottom: "0.2rem" }}>Your direct messages</b>
            Pick a conversation, or find someone in Server and choose Message.
          </div>
        )}
      </section>
    </div>
  );
}
