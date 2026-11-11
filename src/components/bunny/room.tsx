import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  Link2,
  Pencil,
  Search,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { BunnySocket } from "@/lib/bunny-mqtt";

const HISTORY = "bunny-rtc/public/history/";
const PRESENCE = "bunny-rtc/public/presence/";
const CHAT = "bunny-rtc/public/chat";
const BROKER = "wss://broker.emqx.io:8084/mqtt";
const QUICK = ["🔥", "😂", "❤️", "👍", "👀", "🐰"];
const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳","😅","😉","🙂","😇","🥰","😋",
  "😜","🤪","🤗","🤔","😐","😴","🤤","😷","🤒","🤯","😱","😭","😤","😡","🤬","💀",
  "👻","👽","🤖","💩","👋","👍","👎","👏","🙌","🙏","💪","✌️","🤞","🤟","👌","🔥",
  "✨","⭐","💯","💥","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","🐰","🌙","☀️",
  "🌈","⚡","❄️","🌊","🍀","🌸","🎉","🎊","🎁","🏆","🎵","💬","👀","💤","🚀","💎",
];
const COLORS = ["#149c86", "#0ea5e9", "#d97706", "#e11d48", "#65a30d", "#ea580c", "#0891b2", "#ca8a04"];

type Msg = {
  id: string;
  authorId: string;
  name: string;
  text: string;
  at: number;
  editedAt?: number;
  reactions?: Record<string, string[]>;
};

type Person = { id: string; name: string; color: string; avatar?: string; at: number };

function cleanName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 24);
}

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 33 + id.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function dayLabel(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(ts);
}

function timeLabel(ts: number) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(ts);
}

function BunnyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 10c0-4 1.2-7 2.2-7 .6 2.2.4 4.2-.2 6" />
      <path d="M16 10c0-4-1.2-7-2.2-7-.6 2.2-.4 4.2.2 6" />
      <path d="M7 13.5a5 5 0 0 0 10 0c0-2.2-1.4-3.5-5-3.5s-5 1.3-5 3.5z" />
      <circle cx="10" cy="13" r=".7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r=".7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Face({ avatar, color, label }: { avatar?: string; color: string; label: string }) {
  return (
    <div className="avatar" style={{ background: color }} aria-label={label}>
      {avatar ? <img src={avatar} alt="" /> : <BunnyMark />}
    </div>
  );
}

async function shrinkImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("bad image"));
      el.src = url;
    });
    const size = 96;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function chime() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 740;
  gain.gain.value = 0.03;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  osc.stop(ctx.currentTime + 0.13);
  osc.onended = () => void ctx.close();
}

export function Room() {
  const [selfId, setSelfId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [sound, setSound] = useState(true);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const [online, setOnline] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [picker, setPicker] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<BunnySocket | null>(null);
  const stickRef = useRef(true);
  const knownRef = useRef(new Set<string>());
  const selfRef = useRef({ id: "", name: "", avatar: undefined as string | undefined, color: COLORS[0] });

  useEffect(() => {
    const id = localStorage.getItem("bunny_id") || crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    localStorage.setItem("bunny_id", id);
    const storedName = cleanName(localStorage.getItem("bunny_name") || "") || `Guest-${id.slice(0, 4)}`;
    const storedAvatar = localStorage.getItem("bunny_avatar") || undefined;
    const storedSound = localStorage.getItem("bunny_sound") !== "0";
    setSelfId(id);
    setName(storedName);
    setAvatar(storedAvatar);
    setSound(storedSound);
    setReady(true);
    selfRef.current = { id, name: storedName, avatar: storedAvatar, color: colorFor(id) };
  }, []);

  useEffect(() => {
    selfRef.current = { id: selfId, name, avatar, color: colorFor(selfId || "x") };
  }, [selfId, name, avatar]);

  useEffect(() => {
    if (!ready || !selfId) return;
    let retry = 0;
    let timer = 0;
    let beat = 0;
    const peopleMap = new Map<string, Person>();
    const msgMap = new Map<string, Msg>();

    const publishPresence = (sock: BunnySocket) => {
      const me = selfRef.current;
      sock.publish(
        PRESENCE + me.id,
        JSON.stringify({ id: me.id, name: me.name, color: me.color, avatar: me.avatar, at: Date.now() }),
        true,
      );
    };

    const flushPeople = () => {
      const cutoff = Date.now() - 40000;
      const list = [...peopleMap.values()].filter((p) => p.at >= cutoff);
      if (!list.some((p) => p.id === selfRef.current.id)) {
        list.push({
          id: selfRef.current.id,
          name: selfRef.current.name,
          color: selfRef.current.color,
          avatar: selfRef.current.avatar,
          at: Date.now(),
        });
      }
      setPeople(list.sort((a, b) => a.name.localeCompare(b.name)));
    };

    const connect = () => {
      window.clearTimeout(timer);
      setStatus("Connecting…");
      setOnline(false);
      const sock = new BunnySocket(
        BROKER,
        `bunny-${selfId}-${Math.random().toString(36).slice(2, 6)}`,
        PRESENCE + selfId,
        () => {
          setOnline(true);
          setStatus("Live");
          publishPresence(sock);
          window.clearInterval(beat);
          beat = window.setInterval(() => {
            publishPresence(sock);
            flushPeople();
          }, 12000);
        },
        (topic, payload) => {
          if (topic.startsWith(HISTORY) || topic === CHAT) {
            const key = topic.startsWith(HISTORY) ? topic : "";
            if (!payload) {
              if (key) {
                msgMap.delete(key);
                setMessages([...msgMap.values()].sort((a, b) => a.at - b.at));
              }
              return;
            }
            try {
              const msg = JSON.parse(payload) as Msg;
              if (!msg?.id || typeof msg.text !== "string" || typeof msg.authorId !== "string") return;
              const storeKey = `${HISTORY}${msg.id}`;
              const fresh = !knownRef.current.has(msg.id);
              knownRef.current.add(msg.id);
              msgMap.set(storeKey, {
                ...msg,
                name: cleanName(msg.name) || "Guest",
                text: msg.text.slice(0, 500),
              });
              const next = [...msgMap.values()].sort((a, b) => a.at - b.at).slice(-160);
              setMessages(next);
              if (fresh && msg.authorId !== selfRef.current.id && localStorage.getItem("bunny_sound") !== "0") {
                try {
                  chime();
                } catch {
                  /* autoplay can block */
                }
              }
            } catch {
              /* ignore junk */
            }
            return;
          }
          if (topic.startsWith(PRESENCE)) {
            const id = topic.slice(PRESENCE.length);
            if (!payload) peopleMap.delete(id);
            else {
              try {
                const person = JSON.parse(payload) as Person;
                if (person?.id === id) peopleMap.set(id, { ...person, name: cleanName(person.name) || "Guest", at: Date.now() });
              } catch {
                /* ignore */
              }
            }
            flushPeople();
          }
        },
        (reason) => {
          setOnline(false);
          setStatus(reason);
          window.clearInterval(beat);
          if (socketRef.current === sock) {
            timer = window.setTimeout(connect, Math.min(8000, 1200 + retry * 800));
            retry += 1;
          }
        },
      );
      socketRef.current = sock;
      sock.start();
    };

    connect();
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(beat);
      const sock = socketRef.current;
      socketRef.current = null;
      sock?.publish(PRESENCE + selfId, "", true);
      sock?.stop();
    };
  }, [ready, selfId]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, query]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 1600);
    return () => window.clearTimeout(t);
  }, [toast]);

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? messages.filter((m) => m.text.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) : messages;
  }, [messages, query]);

  function publishMessage(msg: Msg, announce = false) {
    const sock = socketRef.current;
    if (!sock) return;
    const body = JSON.stringify(msg);
    sock.publish(`${HISTORY}${msg.id}`, body, true);
    if (announce) sock.publish(CHAT, body, false);
  }

  function send() {
    const text = draft.trim().slice(0, 500);
    if (!text || !online || !selfId) return;
    const msg: Msg = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      authorId: selfId,
      name,
      text,
      at: Date.now(),
    };
    knownRef.current.add(msg.id);
    publishMessage(msg, true);
    setDraft("");
    stickRef.current = true;
  }

  function saveEdit(msg: Msg) {
    const text = editText.trim().slice(0, 500);
    if (!text) return;
    publishMessage({ ...msg, text, name, editedAt: Date.now() });
    setEditing(null);
  }

  function remove(msg: Msg) {
    socketRef.current?.publish(`${HISTORY}${msg.id}`, "", true);
    setConfirmDelete(null);
    setToast("Message deleted");
  }

  function react(msg: Msg, emoji: string) {
    const current = { ...(msg.reactions || {}) };
    const ids = new Set(current[emoji] || []);
    if (ids.has(selfId)) ids.delete(selfId);
    else ids.add(selfId);
    if (ids.size) current[emoji] = [...ids];
    else delete current[emoji];
    publishMessage({ ...msg, reactions: current });
  }

  function saveProfile() {
    const next = cleanName(draftName);
    if (next.length < 2) return;
    setName(next);
    setAvatar(draftAvatar);
    localStorage.setItem("bunny_name", next);
    if (draftAvatar) localStorage.setItem("bunny_avatar", draftAvatar);
    else localStorage.removeItem("bunny_avatar");
    localStorage.setItem("bunny_sound", sound ? "1" : "0");
    selfRef.current = { id: selfId, name: next, avatar: draftAvatar, color: colorFor(selfId) };
    if (socketRef.current) {
      socketRef.current.publish(
        PRESENCE + selfId,
        JSON.stringify({ id: selfId, name: next, color: colorFor(selfId), avatar: draftAvatar, at: Date.now() }),
        true,
      );
    }
    setProfileOpen(false);
    setToast("Profile saved");
  }

  const count = people.length || (online ? 1 : 0);

  return (
    <div className="stage">
      <div className="wallpaper" />
      <div className="shell">
        <header className="topbar glass">
          <div className="brand">
            <div className="mark">
              <BunnyMark className="size-5" />
            </div>
            <div>
              <h1>Bunny RTC</h1>
              <p>One shared room</p>
            </div>
          </div>
          <div className="tools">
            <button className="pill" type="button" onClick={() => setShowSearch((v) => !v)} aria-pressed={showSearch}>
              <Search size={16} />
              <span>Find</span>
            </button>
            <button className={`iconbtn ${sound ? "on" : ""}`} type="button" aria-label={sound ? "Mute sounds" : "Unmute sounds"} onClick={() => {
              const next = !sound;
              setSound(next);
              localStorage.setItem("bunny_sound", next ? "1" : "0");
            }}>
              {sound ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            <button className={`iconbtn ${membersOpen ? "on" : ""}`} type="button" aria-label="People here" onClick={() => setMembersOpen((v) => !v)}>
              <Users size={18} />
            </button>
            <button
              className="pill"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setToast("Invite link copied");
                } catch {
                  setToast("Could not copy the link");
                }
              }}
            >
              <Link2 size={16} />
              <span>Invite</span>
            </button>
          </div>
        </header>

        <p className="status">
          <span>{online ? `${count} here · ${status}` : status}</span>
          {!online && ready ? (
            <button type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          ) : null}
        </p>

        {showSearch ? (
          <div className="search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter this room" aria-label="Filter messages" />
          </div>
        ) : null}

        <div className="body">
          <div
            className="thread"
            ref={threadRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            <div className="welcome">
              <h2>Welcome to Bunny RTC</h2>
              <p>Everyone on this page shares one room. The view stays clear. Glass only wraps the controls.</p>
            </div>
            {visible.map((msg, index) => {
              const prev = visible[index - 1];
              const grouped = !!prev && prev.authorId === msg.authorId && msg.at - prev.at < 5 * 60 * 1000 && dayLabel(prev.at) === dayLabel(msg.at);
              const showDay = !prev || dayLabel(prev.at) !== dayLabel(msg.at);
              const mine = msg.authorId === selfId;
              const person = people.find((p) => p.id === msg.authorId);
              const color = person?.color || colorFor(msg.authorId);
              const face = person?.avatar;
              return (
                <div key={msg.id}>
                  {showDay ? <div className="day">{dayLabel(msg.at)}</div> : null}
                  <article className={grouped ? "msg group" : "msg"}>
                    <Face avatar={face} color={color} label={msg.name} />
                    <div>
                      <div className="who">
                        <strong>{msg.name}</strong>
                        <span className="stamp">{timeLabel(msg.at)}</span>
                        {msg.editedAt ? <span className="edited">edited</span> : null}
                        {mine ? (
                          <span className="row-actions">
                            {QUICK.map((emoji) => (
                              <button key={emoji} className="tiny" type="button" aria-label={`React ${emoji}`} onClick={() => react(msg, emoji)}>
                                {emoji}
                              </button>
                            ))}
                            <button
                              className="tiny"
                              type="button"
                              aria-label="Edit message"
                              onClick={() => {
                                setEditing(msg.id);
                                setEditText(msg.text);
                                setConfirmDelete(null);
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button className="tiny danger" type="button" aria-label="Delete message" onClick={() => setConfirmDelete(msg.id)}>
                              <Trash2 size={14} />
                            </button>
                          </span>
                        ) : (
                          <span className="row-actions">
                            {QUICK.map((emoji) => (
                              <button key={emoji} className="tiny" type="button" aria-label={`React ${emoji}`} onClick={() => react(msg, emoji)}>
                                {emoji}
                              </button>
                            ))}
                            <button
                              className="tiny"
                              type="button"
                              aria-label="Copy message"
                              onClick={async () => {
                                await navigator.clipboard.writeText(msg.text);
                                setToast("Copied");
                              }}
                            >
                              <Link2 size={14} />
                            </button>
                          </span>
                        )}
                      </div>
                      {editing === msg.id ? (
                        <div className="editbox">
                          <textarea value={editText} maxLength={500} onChange={(e) => setEditText(e.target.value)} aria-label="Edit message" />
                          <div className="edit-actions">
                            <button className="btn primary" type="button" onClick={() => saveEdit(msg)}>
                              Save
                            </button>
                            <button className="btn quiet" type="button" onClick={() => setEditing(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text">{msg.text}</p>
                      )}
                      {confirmDelete === msg.id ? (
                        <div className="edit-actions" style={{ marginTop: "0.4rem" }}>
                          <button className="btn primary" type="button" onClick={() => remove(msg)}>
                            Delete
                          </button>
                          <button className="btn quiet" type="button" onClick={() => setConfirmDelete(null)}>
                            Keep
                          </button>
                        </div>
                      ) : null}
                      <div className="reacts">
                        {QUICK.map((emoji) => {
                          const n = msg.reactions?.[emoji]?.length || 0;
                          if (!n) return null;
                          const mineReact = !!msg.reactions?.[emoji]?.includes(selfId);
                          return (
                            <button key={emoji} type="button" className={mineReact ? "react mine" : "react"} onClick={() => react(msg, emoji)}>
                              {emoji} {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
            {query && visible.length === 0 ? <p className="welcome">Nothing matches that.</p> : null}
          </div>

          {membersOpen ? (
            <aside className="side glass-soft">
              <header>
                <h2>Here now · {count}</h2>
                <button className="iconbtn" type="button" aria-label="Close people" onClick={() => setMembersOpen(false)}>
                  <X size={16} />
                </button>
              </header>
              <div className="people">
                {people.map((person) => (
                  <div className="person" key={person.id}>
                    <Face avatar={person.avatar} color={person.color || colorFor(person.id)} label={person.name} />
                    <span>
                      {person.name}
                      {person.id === selfId ? " · you" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}
        </div>

        <div className="dock glass" style={{ position: "relative" }}>
          {picker ? (
            <div className="picker glass-soft">
              <h3>Emoji</h3>
              <div className="grid">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setDraft((d) => (d + emoji).slice(0, 500));
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <button
              className="iconbtn"
              type="button"
              data-emoji-toggle
              aria-label="Emoji"
              aria-expanded={picker}
              onClick={() => setPicker((v) => !v)}
            >
              <Smile size={20} />
            </button>
            <input
              value={draft}
              maxLength={500}
              disabled={!online}
              placeholder={online ? "Message everyone" : "Waiting for the room"}
              aria-label="Message"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setPicker(false);
              }}
            />
            <button className="send" type="submit" disabled={!online || !draft.trim()} aria-label="Send">
              <Send size={18} />
            </button>
          </form>
          <button
            className="me"
            type="button"
            onClick={() => {
              setDraftName(name);
              setDraftAvatar(avatar);
              setProfileOpen(true);
            }}
          >
            <Face avatar={avatar} color={colorFor(selfId || "me")} label={name || "You"} />
            <span>
              <strong>{name || "You"}</strong>
              <em>Profile</em>
            </span>
          </button>
        </div>
      </div>

      {toast ? <div className="toast glass">{toast}</div> : null}

      {profileOpen ? (
        <div className="backdrop" onMouseDown={() => setProfileOpen(false)}>
          <div className="modal glass-soft" role="dialog" aria-labelledby="profile-title" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h2 id="profile-title">Profile</h2>
              <button className="iconbtn" type="button" aria-label="Close profile" onClick={() => setProfileOpen(false)}>
                <X size={16} />
              </button>
            </header>
            <div className="profile">
              <Face avatar={draftAvatar} color={colorFor(selfId || "me")} label="Preview" />
              <div className="stack">
                <label className="btn quiet file">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const data = await shrinkImage(file);
                      if (data) setDraftAvatar(data);
                    }}
                  />
                </label>
                <button className="btn quiet" type="button" onClick={() => setDraftAvatar(undefined)}>
                  Use bunny color
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="display-name">Display name</label>
              <input id="display-name" value={draftName} maxLength={24} onChange={(e) => setDraftName(e.target.value)} />
            </div>
            <div className="switch">
              <span>Message sounds</span>
              <button className="iconbtn" type="button" aria-pressed={sound} onClick={() => setSound((v) => !v)}>
                {sound ? <Check size={16} /> : <X size={16} />}
              </button>
            </div>
            <div className="foot">
              <button className="btn quiet" type="button" onClick={() => setProfileOpen(false)}>
                Cancel
              </button>
              <button className="btn primary" type="button" onClick={saveProfile}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
