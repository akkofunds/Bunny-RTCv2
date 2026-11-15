import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Inbox, Lock, MessageCircle, MoreHorizontal, Send, Trash2, UserPlus, X } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import { RichText } from "./rich-text";
import { AdminTag, Face, ago, dayLabel, timeLabel } from "./ui";
import type { MenuTarget } from "./user-menu";

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

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, peer]);

  useEffect(() => {
    if (peer) inputRef.current?.focus();
  }, [peer]);

  const blocked = !!peer && bunny.blocked.includes(peer);
  const banned = bunny.isBanned(me);

  async function send() {
    if (!peer || !draft.trim()) return;
    if (await bunny.sendDirect(peer, draft)) setDraft("");
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
                <Face avatar={p.avatar} color={p.color} label={p.name} status={p.online ? p.status : undefined} />
                <span className="meta">
                  <strong>
                    {p.name}
                    {friend ? <span className="tag friend">Friend</span> : null}
                  </strong>
                  <span className="convo-last">
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.last ? `${c.last.from === me ? "You: " : ""}${c.last.text}` : p.online ? "Online · say hi" : "Offline"}
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
              <Face avatar={info.avatar} color={info.color} label={info.name} status={info.online ? info.status : undefined} size="2.2rem" />
              <div className="grow">
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {info.name}
                  {bunny.admins[peer] ? <AdminTag /> : null}
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
                    <div className={`bubble ${mine ? "mine" : ""}`}>
                      <RichText text={d.text} selfName={bunny.profile.name} />
                      <time>{timeLabel(d.at, bunny.settings.clock24)}</time>
                      {mine ? (
                        <button className="tiny unsend" type="button" aria-label="Unsend message" onClick={() => bunny.unsendDirect(d)} style={{ color: "var(--color-ink)" }}>
                          <Trash2 size={13} />
                        </button>
                      ) : null}
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
              <form
                className="composer lg"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <input
                  ref={inputRef}
                  value={draft}
                  maxLength={2000}
                  style={{ paddingLeft: "0.8rem" }}
                  disabled={blocked || banned || !bunny.online}
                  placeholder={blocked ? "You blocked this person" : banned ? "You're banned" : `Message ${info.name}`}
                  aria-label={`Message ${info.name}`}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="send" type="submit" disabled={!draft.trim() || blocked || banned || !bunny.online} aria-label="Send">
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
