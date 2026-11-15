import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BunnySocket } from "@/lib/bunny-mqtt";
import {
  ESCROW_BOX_PUB,
  isPoint,
  open,
  randomId,
  seal,
  signRecord,
  signText,
  verifyCert,
  verifyRecord,
  verifyText,
  type AdminClaim,
  type Point,
  type Sealed,
} from "./crypto";
import { identityToToken, loadIdentity, saveIdentity, tokenToIdentity, type Identity } from "./identity";
import { mentions } from "@/components/bunny/rich-text";
import {
  BROKER,
  DEFAULT_SETTINGS,
  PRESETS,
  T,
  cleanName,
  colorFor,
  ls,
  safeAvatar,
  safeColor,
  safeWallpaperUrl,
  type AdminSession,
  type AnnounceRec,
  type BanRec,
  type DmMsg,
  type Friend,
  type FriendReq,
  type ModLog,
  type Msg,
  type Person,
  type Profile,
  type Settings,
  type WallpaperRec,
  type WarnRec,
} from "./types";

export type Tab = "server" | "direct" | "mod";
export type View = { tab: Tab; peer: string | null };
export type Known = { id: string; name: string; color: string; avatar?: string; lastSeen: number };

const ID_RE = /^[a-z0-9]{4,40}$/;
const USER_RE = /^[a-z0-9]{8,40}$/;
const STATUSES = new Set(["online", "idle", "dnd"]);

let audio: AudioContext | null = null;
function chime(freq: number) {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.035;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.stop(ctx.currentTime + 0.17);
  } catch {
    /* autoplay can block */
  }
}

export const msgSigText = (m: Pick<Msg, "id" | "authorId" | "at" | "text">) => `${m.id}\n${m.authorId}\n${m.at}\n${m.text}`;

function parse<V>(payload: string): V | null {
  try {
    return JSON.parse(payload) as V;
  } catch {
    return null;
  }
}

export function useBunny(mode: "user" | "admin") {
  const adminMode = mode === "admin";
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: "", bio: "", color: "#149c86" });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [online, setOnline] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [admins, setAdmins] = useState<Record<string, AdminClaim>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const [bans, setBans] = useState<Record<string, BanRec>>({});
  const [wallpaper, setWallpaper] = useState<WallpaperRec | null>(null);
  const [announce, setAnnounce] = useState<AnnounceRec | null>(null);
  const [typing, setTyping] = useState<Record<string, { name: string; at: number }>>({});
  const [friends, setFriends] = useState<Record<string, Friend>>({});
  const [contacts, setContacts] = useState<Record<string, Friend>>({});
  const [requests, setRequests] = useState<Record<string, FriendReq>>({});
  const [outgoing, setOutgoing] = useState<Record<string, number>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [dms, setDms] = useState<Record<string, DmMsg>>({});
  const [lastRead, setLastRead] = useState<Record<string, number>>({});
  const [warnings, setWarnings] = useState<WarnRec[]>([]);
  const [allDms, setAllDms] = useState<Record<string, DmMsg>>({});
  const [logs, setLogs] = useState<Record<string, ModLog>>({});
  const [warnsIssued, setWarnsIssued] = useState<Record<string, WarnRec>>({});
  const [directory, setDirectory] = useState<Record<string, Known>>({});
  const [view, setViewState] = useState<View>({ tab: "server", peer: null });
  const [serverUnread, setServerUnread] = useState(0);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  const socketRef = useRef<BunnySocket | null>(null);
  const idRef = useRef<Identity | null>(null);
  const profileRef = useRef(profile);
  const settingsRef = useRef(settings);
  const sessionRef = useRef<AdminSession | null>(null);
  const friendsRef = useRef(friends);
  const contactsRef = useRef(contacts);
  const outgoingRef = useRef(outgoing);
  const blockedRef = useRef(blocked);
  const bansRef = useRef(bans);
  const adminsRef = useRef(admins);
  const viewRef = useRef(view);
  const peopleRef = useRef<Person[]>([]);
  const msgMapRef = useRef(new Map<string, Msg>());
  const connectedAtRef = useRef(0);
  const acksRef = useRef<string[]>([]);
  const lastTypingRef = useRef(0);
  const seenDmRef = useRef(new Set<string>());
  const allDmsRef = useRef<Record<string, DmMsg>>({});

  profileRef.current = profile;
  settingsRef.current = settings;
  sessionRef.current = session;
  friendsRef.current = friends;
  contactsRef.current = contacts;
  outgoingRef.current = outgoing;
  blockedRef.current = blocked;
  bansRef.current = bans;
  adminsRef.current = admins;
  viewRef.current = view;
  allDmsRef.current = allDms;

  const say = useCallback((text: string) => setToast(text), []);

  /* ---------- load local state ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const me = await loadIdentity();
      const name = cleanName(localStorage.getItem("bunny_name") || "") || `Guest-${me.id.slice(0, 4)}`;
      const avatar = safeAvatar(localStorage.getItem("bunny_avatar") || undefined);
      const bio = (localStorage.getItem("bunny_bio") || "").slice(0, 80);
      const color = safeColor(localStorage.getItem("bunny_color"), me.id);
      const stored = ls.get<Partial<Settings>>("bunny_settings", {});
      const legacySound = localStorage.getItem("bunny_sound");
      const nextSettings: Settings = {
        ...DEFAULT_SETTINGS,
        ...(legacySound === "0" ? { sounds: false } : {}),
        ...stored,
      };
      let verifiedSession: AdminSession | null = null;
      const sess = ls.get<AdminSession | null>("bunny_admin_v1", null);
      if (sess && sess.id === me.id) {
        const claim = await verifyCert(sess.cert);
        if (claim && claim.id === me.id && claim.sign.x === me.sign.x && claim.sign.y === me.sign.y) verifiedSession = sess;
      }
      if (!alive) return;
      const k = (s: string) => `bunny_${s}_${me.id}`;
      idRef.current = me;
      setIdentity(me);
      setProfile({ name, avatar, bio, color });
      setSettings(nextSettings);
      setSession(verifiedSession);
      setFriends(ls.get(k("friends"), {}));
      setContacts(ls.get(k("contacts"), {}));
      setOutgoing(ls.get(k("outgoing"), {}));
      setBlocked(ls.get(k("blocked"), []));
      const storedDms = ls.get<Record<string, DmMsg>>(k("dms"), {});
      seenDmRef.current = new Set(Object.keys(storedDms));
      setDms(storedDms);
      setLastRead(ls.get(k("lastread"), {}));
      acksRef.current = ls.get(k("acks"), []);
      if (adminMode && verifiedSession) setLogs(ls.get(k("modlogs"), {}));
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [adminMode]);

  /* ---------- persist ---------- */
  const persistKey = (s: string) => (identity ? `bunny_${s}_${identity.id}` : "");
  useEffect(() => void (loaded && ls.set(persistKey("friends"), friends)), [friends, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void (loaded && ls.set(persistKey("contacts"), contacts)), [contacts, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void (loaded && ls.set(persistKey("outgoing"), outgoing)), [outgoing, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void (loaded && ls.set(persistKey("blocked"), blocked)), [blocked, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void (loaded && ls.set(persistKey("lastread"), lastRead)), [lastRead, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!loaded) return;
    const list = Object.values(dms).sort((a, b) => b.at - a.at).slice(0, 800);
    ls.set(persistKey("dms"), Object.fromEntries(list.map((d) => [d.id, d])));
  }, [dms, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!loaded || !adminMode) return;
    const list = Object.values(logs).sort((a, b) => b.at - a.at).slice(0, 600);
    ls.set(persistKey("modlogs"), Object.fromEntries(list.map((l) => [l.key, l])));
  }, [logs, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loaded) ls.set("bunny_settings", settings);
  }, [settings, loaded]);

  /* ---------- toast timer ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ---------- typing prune ---------- */
  useEffect(() => {
    const t = window.setInterval(() => {
      setTyping((prev) => {
        const cutoff = Date.now() - 4500;
        const next = Object.fromEntries(Object.entries(prev).filter(([, v]) => v.at > cutoff));
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 1500);
    return () => window.clearInterval(t);
  }, []);

  const notify = useCallback((kind: "server" | "dm", title: string, body: string, mentioned: boolean) => {
    const s = settingsRef.current;
    if (s.status === "dnd") return;
    if (kind === "server") {
      if (s.notifyOn === "none") return;
      if (s.notifyOn === "mentions" && !mentioned) return;
    } else if (!s.dmNotify) return;
    if (s.sounds) chime(kind === "dm" ? 880 : mentioned ? 988 : 740);
    if (
      s.desktop &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      (document.hidden || !document.hasFocus())
    ) {
      try {
        new Notification(title, { body: body.slice(0, 140), icon: "/favicon.svg", tag: kind });
      } catch {
        /* some browsers only allow SW notifications */
      }
    }
  }, []);

  const addLog = useCallback((entry: ModLog) => {
    setLogs((prev) => {
      const old = prev[entry.key];
      if (old && old.actorId && !entry.actorId) return prev;
      return { ...prev, [entry.key]: { ...old, ...entry } };
    });
  }, []);

  /* ---------- the connection ---------- */
  const myId = identity?.id;
  const escrowReady = adminMode && !!session;
  useEffect(() => {
    const me = idRef.current;
    if (!loaded || !me || !myId) return;
    let retry = 0;
    let timer = 0;
    let beat = 0;
    let guardTimer = 0;
    const peopleMap = new Map<string, Person>();
    const msgMap = msgMapRef.current;
    msgMap.clear();
    const guardCache = ls.get<Record<string, string>>("bunny_guard", {});
    const guardLatest = new Map<string, string>();
    const sess = sessionRef.current;

    const topics = [
      T.CHAT,
      T.HISTORY + "+",
      T.PRESENCE + "+",
      T.TYPING,
      T.ADMINS + "+",
      T.MOD + "+",
      escrowReady ? T.INBOX + "+/+" : T.INBOX + me.id + "/+",
      ...(escrowReady ? [T.MODLOG + "+"] : []),
    ];

    const sockSend = (topic: string, payload: string, retained: boolean) => socketRef.current?.publish(topic, payload, retained);

    const publishPresence = async () => {
      const p = profileRef.current;
      const ts = Date.now();
      const body: Person = {
        id: me.id,
        name: p.name,
        color: p.color,
        avatar: p.avatar,
        bio: p.bio || undefined,
        status: settingsRef.current.status,
        box: { x: me.box.x, y: me.box.y },
        ts,
        at: ts,
      };
      if (sessionRef.current) body.sig = await signText(me.sign, `${me.id}\n${ts}`);
      sockSend(T.PRESENCE + me.id, JSON.stringify(body), true);
    };

    const flushPeople = () => {
      const cutoff = Date.now() - 40000;
      const list = [...peopleMap.values()].filter((p) => p.at >= cutoff);
      if (!list.some((p) => p.id === me.id)) {
        const p = profileRef.current;
        list.push({ id: me.id, name: p.name, color: p.color, avatar: p.avatar, bio: p.bio, status: settingsRef.current.status, at: Date.now() });
      }
      list.sort((a, b) => a.name.localeCompare(b.name));
      peopleRef.current = list;
      setPeople(list);
    };

    const flushMsgs = () => setMessages([...msgMap.values()].sort((a, b) => a.at - b.at).slice(-300));

    const know = (id: string, name: string, color?: string, avatar?: string) => {
      setDirectory((prev) => {
        const old = prev[id];
        if (old && old.name === name && (!avatar || old.avatar === avatar) && Date.now() - old.lastSeen < 60000) return prev;
        return { ...prev, [id]: { id, name, color: color || old?.color || colorFor(id), avatar: avatar || old?.avatar, lastSeen: Date.now() } };
      });
    };

    const guardRemember = (topic: string, payload: string) => {
      guardLatest.set(topic, payload);
      if (guardCache[topic] === payload) return;
      guardCache[topic] = payload;
      ls.set("bunny_guard", guardCache);
    };
    const guardEmpty = (topic: string) => {
      guardLatest.set(topic, "");
      const cached = guardCache[topic];
      if (!cached) return;
      window.setTimeout(() => {
        if (guardLatest.get(topic) === "") sockSend(topic, cached, true);
      }, 1500 + Math.random() * 4000);
    };

    const handleHistory = (topic: string, payload: string) => {
      const keyId = topic.startsWith(T.HISTORY) ? topic.slice(T.HISTORY.length) : "";
      if (!payload) {
        const old = keyId ? msgMap.get(keyId) : undefined;
        if (old) {
          msgMap.delete(keyId);
          flushMsgs();
          if (escrowReady)
            addLog({ key: `del:${old.id}`, kind: "delete", scope: "server", msgId: old.id, authorId: old.authorId, authorName: old.name, before: old.text, at: Date.now() });
        }
        return;
      }
      const raw = parse<Msg>(payload);
      if (!raw || typeof raw.id !== "string" || !ID_RE.test(raw.id) || typeof raw.text !== "string" || typeof raw.authorId !== "string") return;
      if (keyId && keyId !== raw.id) return;
      const msg: Msg = {
        id: raw.id,
        authorId: raw.authorId.slice(0, 40),
        name: cleanName(raw.name) || "Guest",
        text: raw.text.slice(0, 2000),
        at: Number(raw.at) || Date.now(),
        editedAt: raw.editedAt ? Number(raw.editedAt) : undefined,
        reactions: raw.reactions && typeof raw.reactions === "object" ? raw.reactions : undefined,
        replyTo:
          raw.replyTo && typeof raw.replyTo.id === "string"
            ? { id: raw.replyTo.id.slice(0, 40), name: cleanName(raw.replyTo.name), text: String(raw.replyTo.text || "").slice(0, 120) }
            : undefined,
        sig: typeof raw.sig === "string" ? raw.sig.slice(0, 200) : undefined,
      };
      const prev = msgMap.get(msg.id);
      if (escrowReady && prev && msg.editedAt && prev.text !== msg.text) {
        addLog({
          key: `edit:${msg.id}:${msg.editedAt}`,
          kind: "edit",
          scope: "server",
          msgId: msg.id,
          authorId: msg.authorId,
          authorName: msg.name,
          before: prev.text,
          after: msg.text,
          at: msg.editedAt,
        });
      }
      msgMap.set(msg.id, msg);
      flushMsgs();
      know(msg.authorId, msg.name);
      if (!prev && msg.authorId !== me.id && msg.at > connectedAtRef.current - 3000) {
        const hidden = blockedRef.current.includes(msg.authorId) || (bansRef.current[msg.authorId]?.kind === "ban" && !adminsRef.current[msg.authorId]);
        if (hidden) return;
        if (viewRef.current.tab !== "server" || document.hidden) setServerUnread((n) => n + 1);
        const mentioned = mentions(msg.text, profileRef.current.name) || (!!msg.replyTo && msgMap.get(msg.replyTo.id)?.authorId === me.id);
        notify("server", `${msg.name} in Bunny RTC`, msg.text, mentioned);
      }
    };

    const handlePresence = (id: string, payload: string) => {
      if (!payload) peopleMap.delete(id);
      else {
        const raw = parse<Person>(payload);
        if (!raw || raw.id !== id) return;
        const person: Person = {
          id,
          name: cleanName(raw.name) || "Guest",
          color: safeColor(raw.color, id),
          avatar: safeAvatar(raw.avatar),
          bio: typeof raw.bio === "string" ? raw.bio.slice(0, 80) : undefined,
          status: STATUSES.has(raw.status as string) ? raw.status : "online",
          box: isPoint(raw.box) ? raw.box : undefined,
          ts: Number(raw.ts) || undefined,
          sig: typeof raw.sig === "string" ? raw.sig.slice(0, 200) : undefined,
          at: Date.now(),
        };
        peopleMap.set(id, person);
        know(id, person.name, person.color, person.avatar);
      }
      flushPeople();
    };

    const handleInbox = async (uid: string, item: string, payload: string) => {
      const mine = uid === me.id;
      if (!payload) {
        if (item.startsWith("dm-")) {
          const id = item.slice(3);
          if (mine) setDms((prev) => (prev[id] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id)) : prev));
          const old = escrowReady ? allDmsRef.current[id] : undefined;
          if (old) {
            addLog({ key: `dmdel:${id}`, kind: "delete", scope: "direct", msgId: id, authorId: old.from, authorName: old.name, before: old.text, at: Date.now() });
            setAllDms((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          }
        }
        if (mine && item.startsWith("fr-")) {
          const from = item.slice(3);
          setRequests((prev) => {
            if (!prev[from]) return prev;
            const next = { ...prev };
            delete next[from];
            return next;
          });
        }
        return;
      }
      if (item.startsWith("dm-")) {
        const env = parse<{ t: string; id: string; from: string; to: string; at: number; fb: Point; env: Sealed }>(payload);
        if (!env || env.t !== "dm" || !ID_RE.test(env.id) || !USER_RE.test(env.from) || !USER_RE.test(env.to)) return;
        if (uid !== env.from && uid !== env.to) return;
        if (mine) {
          const body = await open<{ text: string; name: string; color?: string }>(env.env, me.id, me.box);
          if (body && typeof body.text === "string") {
            const peer = env.from === me.id ? env.to : env.from;
            const incoming = env.from !== me.id;
            if (incoming) {
              if (blockedRef.current.includes(env.from)) return;
              if (settingsRef.current.dmsFrom === "friends" && !friendsRef.current[env.from]) return;
            }
            const dm: DmMsg = {
              id: env.id,
              from: env.from,
              to: env.to,
              at: Number(env.at) || Date.now(),
              text: body.text.slice(0, 2000),
              name: cleanName(body.name) || "Guest",
              color: safeColor(body.color, env.from),
            };
            const fresh = !seenDmRef.current.has(dm.id);
            seenDmRef.current.add(dm.id);
            setDms((prev) => (prev[dm.id] ? prev : { ...prev, [dm.id]: dm }));
            if (incoming && isPoint(env.fb)) {
              setContacts((prev) => {
                const old = prev[peer];
                if (old && old.box.x === env.fb.x && old.name === dm.name) return prev;
                return { ...prev, [peer]: { id: peer, name: dm.name, color: dm.color || colorFor(peer), box: env.fb, since: old?.since || Date.now() } };
              });
            }
            if (fresh && incoming && dm.at > connectedAtRef.current - 3000) {
              const v = viewRef.current;
              if (!(v.tab === "direct" && v.peer === peer && !document.hidden)) notify("dm", `${dm.name} sent you a message`, dm.text, true);
            }
          }
        }
        if (escrowReady && sessionRef.current) {
          const body = await open<{ text: string; name: string; color?: string }>(env.env, "mod", sessionRef.current.escrow);
          if (body && typeof body.text === "string") {
            const dm: DmMsg = {
              id: env.id,
              from: env.from,
              to: env.to,
              at: Number(env.at) || Date.now(),
              text: body.text.slice(0, 2000),
              name: cleanName(body.name) || "Guest",
              color: safeColor(body.color, env.from),
            };
            setAllDms((prev) => (prev[dm.id] ? prev : { ...prev, [dm.id]: dm }));
            know(env.from, dm.name, dm.color);
          }
        }
        return;
      }
      if (!mine && !item.startsWith("warn-")) return;
      if (item.startsWith("fr-") || item.startsWith("fa-")) {
        const req = parse<{ t: string; from: string; name: string; color: string; box: Point; at: number }>(payload);
        if (!req || !USER_RE.test(req.from) || !isPoint(req.box) || item.slice(3) !== req.from) return;
        const info: Friend = { id: req.from, name: cleanName(req.name) || "Guest", color: safeColor(req.color, req.from), box: req.box, since: Date.now() };
        if (blockedRef.current.includes(req.from)) return;
        if (req.t === "fa") {
          if (outgoingRef.current[req.from] || friendsRef.current[req.from]) {
            setFriends((prev) => ({ ...prev, [req.from]: { ...info, since: prev[req.from]?.since || Date.now() } }));
            setOutgoing((prev) => {
              const next = { ...prev };
              delete next[req.from];
              return next;
            });
            if (!friendsRef.current[req.from]) setToast(`${info.name} accepted your friend request`);
          }
          sockSend(T.INBOX + me.id + "/" + item, "", true);
          return;
        }
        if (req.t === "fr") {
          if (friendsRef.current[req.from] || outgoingRef.current[req.from]) {
            // Already friends, or both asked: accept straight away.
            setFriends((prev) => ({ ...prev, [req.from]: { ...info, since: prev[req.from]?.since || Date.now() } }));
            setOutgoing((prev) => {
              const next = { ...prev };
              delete next[req.from];
              return next;
            });
            const p = profileRef.current;
            sockSend(
              T.INBOX + req.from + "/fa-" + me.id,
              JSON.stringify({ t: "fa", from: me.id, name: p.name, color: p.color, box: { x: me.box.x, y: me.box.y }, at: Date.now() }),
              true,
            );
            sockSend(T.INBOX + me.id + "/" + item, "", true);
            return;
          }
          setRequests((prev) => ({ ...prev, [req.from]: { from: req.from, name: info.name, color: info.color, box: req.box, at: Number(req.at) || Date.now() } }));
          if (Number(req.at) > connectedAtRef.current - 3000) notify("dm", "New friend request", `${info.name} wants to be friends`, true);
        }
        return;
      }
      if (item.startsWith("warn-")) {
        const rec = await verifyRecord<WarnRec>(parse(payload));
        if (!rec || rec.kind !== "warn" || rec.target !== uid || `warn-${rec.id}` !== item) return;
        if (escrowReady) setWarnsIssued((prev) => ({ ...prev, [rec.id]: rec }));
        if (mine && !acksRef.current.includes(rec.id)) setWarnings((prev) => (prev.some((w) => w.id === rec.id) ? prev : [...prev, rec]));
      }
    };

    const handleMod = async (topic: string, key: string, payload: string) => {
      if (!payload) return guardEmpty(topic);
      const rec = await verifyRecord<BanRec | WallpaperRec | AnnounceRec>(parse(payload));
      if (!rec) return;
      if ((rec.kind === "ban" || rec.kind === "unban") && key === `ban-${rec.target}`) {
        setBans((prev) => (prev[rec.target] && prev[rec.target].at >= rec.at ? prev : { ...prev, [rec.target]: rec }));
        know(rec.target, rec.targetName);
      } else if (rec.kind === "wallpaper" && key === "wallpaper") {
        if (rec.mode === "image" && !safeWallpaperUrl(rec.value)) return;
        if (rec.mode === "preset" && !(typeof rec.value === "string" && PRESETS[rec.value])) return;
        if (!["default", "preset", "image"].includes(rec.mode)) return;
        setWallpaper((prev) => (prev && prev.at >= rec.at ? prev : rec));
      } else if (rec.kind === "announce" && key === "announce") {
        setAnnounce((prev) => (prev && prev.at >= rec.at ? prev : rec));
      } else return;
      guardRemember(topic, payload);
    };

    const handleAdmins = async (topic: string, id: string, payload: string) => {
      if (!payload) return guardEmpty(topic);
      const claim = await verifyCert(parse(payload));
      if (!claim || claim.id !== id) return;
      setAdmins((prev) => (prev[id]?.iat === claim.iat ? prev : { ...prev, [id]: claim }));
      guardRemember(topic, payload);
    };

    const onPublish = (topic: string, payload: string) => {
      if (topic === T.CHAT || topic.startsWith(T.HISTORY)) return handleHistory(topic, payload);
      if (topic.startsWith(T.PRESENCE)) return handlePresence(topic.slice(T.PRESENCE.length), payload);
      if (topic === T.TYPING) {
        const t = parse<{ id: string; name: string }>(payload);
        if (!t || typeof t.id !== "string" || t.id === me.id) return;
        setTyping((prev) => ({ ...prev, [t.id]: { name: cleanName(t.name) || "Someone", at: Date.now() } }));
        return;
      }
      if (topic.startsWith(T.ADMINS)) return void handleAdmins(topic, topic.slice(T.ADMINS.length), payload);
      if (topic.startsWith(T.MOD)) return void handleMod(topic, topic.slice(T.MOD.length), payload);
      if (topic.startsWith(T.INBOX)) {
        const [uid, item] = topic.slice(T.INBOX.length).split("/");
        if (!uid || !item) return;
        return void handleInbox(uid, item, payload);
      }
      if (topic.startsWith(T.MODLOG) && escrowReady && payload && sessionRef.current) {
        const sealed = parse<Sealed>(payload);
        if (!sealed) return;
        void open<ModLog>(sealed, "mod", sessionRef.current.escrow).then((entry) => {
          if (entry && typeof entry.key === "string" && typeof entry.before === "string") addLog(entry);
        });
      }
    };

    const connect = () => {
      window.clearTimeout(timer);
      setStatus("Connecting…");
      setOnline(false);
      const sock = new BunnySocket(
        BROKER,
        `bunny-${me.id}-${Math.random().toString(36).slice(2, 6)}`,
        T.PRESENCE + me.id,
        topics,
        () => {
          retry = 0;
          connectedAtRef.current = Date.now();
          setOnline(true);
          setStatus("Live");
          void publishPresence();
          if (sess) sock.publish(T.ADMINS + me.id, JSON.stringify(sess.cert), true);
          window.clearInterval(beat);
          beat = window.setInterval(() => {
            void publishPresence();
            flushPeople();
          }, 12000);
          window.clearTimeout(guardTimer);
          guardTimer = window.setTimeout(() => {
            for (const [topic, cached] of Object.entries(guardCache)) {
              if (!guardLatest.has(topic)) sock.publish(topic, cached, true);
            }
          }, 6000 + Math.random() * 3000);
        },
        onPublish,
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
    const onVisible = () => {
      if (!document.hidden && viewRef.current.tab === "server") setServerUnread(0);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(guardTimer);
      window.clearInterval(beat);
      document.removeEventListener("visibilitychange", onVisible);
      const sock = socketRef.current;
      socketRef.current = null;
      sock?.publish(T.PRESENCE + me.id, "", true);
      sock?.stop();
    };
  }, [loaded, myId, escrowReady, addLog, notify]);

  /* ---------- re-announce presence when profile/status changes ---------- */
  useEffect(() => {
    const me = idRef.current;
    const sock = socketRef.current;
    if (!me || !sock || !online) return;
    const ts = Date.now();
    void (async () => {
      const body: Person = {
        id: me.id,
        name: profile.name,
        color: profile.color,
        avatar: profile.avatar,
        bio: profile.bio || undefined,
        status: settings.status,
        box: { x: me.box.x, y: me.box.y },
        ts,
        at: ts,
      };
      if (sessionRef.current) body.sig = await signText(me.sign, `${me.id}\n${ts}`);
      sock.publish(T.PRESENCE + me.id, JSON.stringify(body), true);
    })();
  }, [profile, settings.status, online]);

  /* ---------- verify admin-signed messages and presence ---------- */
  const verifyCache = useRef(new Map<string, boolean>());
  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<string, boolean> = {};
      const check = async (k: string, claim: AdminClaim, text: string, sig: string) => {
        let ok = verifyCache.current.get(k);
        if (ok === undefined) {
          ok = await verifyText(claim.sign, text, sig);
          verifyCache.current.set(k, ok);
        }
        if (ok) next[k] = true;
      };
      for (const m of messages) {
        const claim = admins[m.authorId];
        if (claim && m.sig) await check(`m:${m.id}:${m.sig}`, claim, msgSigText(m), m.sig);
      }
      for (const p of people) {
        const claim = admins[p.id];
        if (claim && p.sig && p.ts) await check(`p:${p.id}:${p.sig}`, claim, `${p.id}\n${p.ts}`, p.sig);
      }
      if (alive) setVerified(next);
    })();
    return () => {
      alive = false;
    };
  }, [messages, people, admins]);

  const isAdminMsg = useCallback((m: Msg) => !!m.sig && !!verified[`m:${m.id}:${m.sig}`], [verified]);
  const isAdminPerson = useCallback(
    (id: string) => {
      const p = people.find((x) => x.id === id);
      return !!p?.sig && !!verified[`p:${p.id}:${p.sig}`];
    },
    [people, verified],
  );
  const isBanned = useCallback((id: string) => bans[id]?.kind === "ban" && !admins[id], [bans, admins]);

  /* ---------- view ---------- */
  const setView = useCallback((next: View) => {
    setViewState(next);
    if (next.tab === "server") setServerUnread(0);
    if (next.tab === "direct" && next.peer) setLastRead((prev) => ({ ...prev, [next.peer!]: Date.now() }));
  }, []);
  useEffect(() => {
    if (view.tab === "direct" && view.peer) {
      const peer = view.peer;
      const newest = Object.values(dms).reduce((max, d) => (d.from === peer && d.at > max ? d.at : max), 0);
      if (newest > (lastRead[peer] || 0)) setLastRead((prev) => ({ ...prev, [peer]: Date.now() }));
    }
  }, [dms, view, lastRead]);

  /* ---------- helpers ---------- */
  const lookup = useCallback(
    (id: string) => {
      const p = people.find((x) => x.id === id);
      const f = friends[id] || contacts[id];
      const d = directory[id];
      return {
        id,
        name: p?.name || f?.name || d?.name || "Guest",
        color: p?.color || f?.color || d?.color || colorFor(id),
        avatar: p?.avatar || f?.avatar || d?.avatar,
        bio: p?.bio,
        status: p ? p.status || "online" : undefined,
        online: !!p,
        box: p?.box || f?.box,
      };
    },
    [people, friends, contacts, directory],
  );

  const publish = (topic: string, payload: string, retained: boolean) => socketRef.current?.publish(topic, payload, retained);

  const sealLog = async (entry: ModLog) => {
    const sealed = await seal({ mod: ESCROW_BOX_PUB }, entry);
    publish(T.MODLOG + randomId(10), JSON.stringify(sealed), true);
  };

  /* ---------- chat actions ---------- */
  const sendMessage = useCallback(
    async (text: string, replyTo?: Msg) => {
      const me = idRef.current;
      const clean = text.trim().slice(0, 2000);
      if (!me || !clean || !socketRef.current) return false;
      const msg: Msg = {
        id: `${Date.now().toString(36)}${randomId(3)}`.slice(0, 24),
        authorId: me.id,
        name: profileRef.current.name,
        text: clean,
        at: Date.now(),
        replyTo: replyTo ? { id: replyTo.id, name: replyTo.name, text: replyTo.text.slice(0, 120) } : undefined,
      };
      if (sessionRef.current) msg.sig = await signText(me.sign, msgSigText(msg));
      const body = JSON.stringify(msg);
      publish(T.HISTORY + msg.id, body, true);
      publish(T.CHAT, body, false);
      return true;
    },
    [],
  );

  const editMessage = useCallback(async (msg: Msg, text: string) => {
    const me = idRef.current;
    const clean = text.trim().slice(0, 2000);
    if (!me || !clean || clean === msg.text) return;
    const next: Msg = { ...msg, text: clean, name: msg.authorId === me.id ? profileRef.current.name : msg.name, editedAt: Date.now() };
    if (msg.authorId === me.id) {
      if (sessionRef.current) next.sig = await signText(me.sign, msgSigText(next));
      else delete next.sig;
    }
    publish(T.HISTORY + msg.id, JSON.stringify(next), true);
    void sealLog({
      key: `edit:${msg.id}:${next.editedAt}`,
      kind: "edit",
      scope: "server",
      msgId: msg.id,
      authorId: msg.authorId,
      authorName: msg.name,
      before: msg.text,
      after: clean,
      actorId: me.id,
      actorName: profileRef.current.name,
      at: next.editedAt!,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteMessage = useCallback((msg: Msg) => {
    const me = idRef.current;
    if (!me) return;
    publish(T.HISTORY + msg.id, "", true);
    void sealLog({
      key: `del:${msg.id}`,
      kind: "delete",
      scope: "server",
      msgId: msg.id,
      authorId: msg.authorId,
      authorName: msg.name,
      before: msg.text,
      actorId: me.id,
      actorName: profileRef.current.name,
      at: Date.now(),
    });
    setToast("Message deleted");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const react = useCallback((msg: Msg, emoji: string) => {
    const me = idRef.current;
    if (!me) return;
    const current = { ...(msg.reactions || {}) };
    const ids = new Set(current[emoji] || []);
    if (ids.has(me.id)) ids.delete(me.id);
    else ids.add(me.id);
    if (ids.size) current[emoji] = [...ids];
    else delete current[emoji];
    publish(T.HISTORY + msg.id, JSON.stringify({ ...msg, reactions: current }), true);
  }, []);  

  const pingTyping = useCallback(() => {
    const me = idRef.current;
    if (!me || !settingsRef.current.sendTyping) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 2500) return;
    lastTypingRef.current = now;
    publish(T.TYPING, JSON.stringify({ id: me.id, name: profileRef.current.name, at: now }), false);
  }, []);  

  /* ---------- profile & settings ---------- */
  const saveProfile = useCallback((next: Profile) => {
    const name = cleanName(next.name);
    if (name.length < 2) return false;
    const p: Profile = { name, avatar: next.avatar, bio: next.bio.slice(0, 80), color: safeColor(next.color, idRef.current?.id || "x") };
    localStorage.setItem("bunny_name", p.name);
    if (p.avatar) localStorage.setItem("bunny_avatar", p.avatar);
    else localStorage.removeItem("bunny_avatar");
    localStorage.setItem("bunny_bio", p.bio);
    localStorage.setItem("bunny_color", p.color);
    setProfile(p);
    return true;
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  /* ---------- friends & direct ---------- */
  const requestFriend = useCallback(
    (id: string) => {
      const me = idRef.current;
      if (!me || id === me.id) return;
      const p = profileRef.current;
      setOutgoing((prev) => ({ ...prev, [id]: Date.now() }));
      publish(
        T.INBOX + id + "/fr-" + me.id,
        JSON.stringify({ t: "fr", from: me.id, name: p.name, color: p.color, box: { x: me.box.x, y: me.box.y }, at: Date.now() }),
        true,
      );
      setToast("Friend request sent");
    },
    [],  
  );

  const acceptFriend = useCallback((req: FriendReq) => {
    const me = idRef.current;
    if (!me) return;
    setFriends((prev) => ({ ...prev, [req.from]: { id: req.from, name: req.name, color: req.color, box: req.box, since: Date.now() } }));
    setRequests((prev) => {
      const next = { ...prev };
      delete next[req.from];
      return next;
    });
    const p = profileRef.current;
    publish(
      T.INBOX + req.from + "/fa-" + me.id,
      JSON.stringify({ t: "fa", from: me.id, name: p.name, color: p.color, box: { x: me.box.x, y: me.box.y }, at: Date.now() }),
      true,
    );
    publish(T.INBOX + me.id + "/fr-" + req.from, "", true);
    setToast(`You and ${req.name} are now friends`);
  }, []);  

  const declineFriend = useCallback((req: FriendReq) => {
    const me = idRef.current;
    if (!me) return;
    setRequests((prev) => {
      const next = { ...prev };
      delete next[req.from];
      return next;
    });
    publish(T.INBOX + me.id + "/fr-" + req.from, "", true);
  }, []);  

  const removeFriend = useCallback((id: string) => {
    setFriends((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOutgoing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const toggleBlock = useCallback((id: string) => {
    setBlocked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /** Remember someone as a DM contact so they show up in Direct. */
  const openDirect = useCallback(
    (id: string) => {
      const info = lookup(id);
      if (info.box && !friends[id] && !contacts[id]) {
        setContacts((prev) => ({ ...prev, [id]: { id, name: info.name, color: info.color, avatar: info.avatar, box: info.box!, since: Date.now() } }));
      }
      setView({ tab: "direct", peer: id });
    },
    [lookup, friends, contacts, setView],
  );

  const sendDirect = useCallback(
    async (peer: string, text: string) => {
      const me = idRef.current;
      const clean = text.trim().slice(0, 2000);
      if (!me || !clean) return false;
      const info = lookup(peer);
      if (!info.box) {
        setToast("They need to come online once before you can message them");
        return false;
      }
      const at = Date.now();
      const id = `${at.toString(36)}${randomId(4)}`.slice(0, 24);
      const p = profileRef.current;
      const env = await seal({ [me.id]: { x: me.box.x, y: me.box.y }, [peer]: info.box, mod: ESCROW_BOX_PUB }, { text: clean, name: p.name, color: p.color });
      const body = JSON.stringify({ t: "dm", id, from: me.id, to: peer, at, fb: { x: me.box.x, y: me.box.y }, env });
      publish(T.INBOX + peer + "/dm-" + id, body, true);
      publish(T.INBOX + me.id + "/dm-" + id, body, true);
      seenDmRef.current.add(id);
      setDms((prev) => ({ ...prev, [id]: { id, from: me.id, to: peer, at, text: clean, name: p.name, color: p.color } }));
      if (!friends[peer] && !contacts[peer]) {
        setContacts((prev) => ({ ...prev, [peer]: { id: peer, name: info.name, color: info.color, avatar: info.avatar, box: info.box!, since: at } }));
      }
      return true;
    },
    [lookup, friends, contacts],  
  );

  const unsendDirect = useCallback((dm: DmMsg) => {
    const me = idRef.current;
    if (!me || dm.from !== me.id) return;
    publish(T.INBOX + dm.to + "/dm-" + dm.id, "", true);
    publish(T.INBOX + dm.from + "/dm-" + dm.id, "", true);
    setDms((prev) => {
      const next = { ...prev };
      delete next[dm.id];
      return next;
    });
    void sealLog({
      key: `dmdel:${dm.id}`,
      kind: "delete",
      scope: "direct",
      msgId: dm.id,
      authorId: dm.from,
      authorName: dm.name,
      before: dm.text,
      actorId: me.id,
      actorName: profileRef.current.name,
      at: Date.now(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ackWarning = useCallback((id: string) => {
    acksRef.current = [...acksRef.current, id].slice(-200);
    if (idRef.current) ls.set(`bunny_acks_${idRef.current.id}`, acksRef.current);
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  /* ---------- account ---------- */
  const token = useMemo(() => (identity ? identityToToken(identity) : ""), [identity]);

  const restoreFromToken = useCallback((value: string) => {
    const next = tokenToIdentity(value);
    if (!next) return false;
    saveIdentity(next);
    window.location.reload();
    return true;
  }, []);

  /* ---------- admin actions ---------- */
  const modPublish = useCallback(async (topic: string, payload: object) => {
    const me = idRef.current;
    const sess = sessionRef.current;
    if (!me || !sess) return false;
    const rec = await signRecord(me.sign, sess.cert, payload);
    publish(topic, JSON.stringify(rec), true);
    return true;
  }, []);  

  const ban = useCallback(
    async (target: string, targetName: string, reason: string, kind: "ban" | "unban" = "ban") => {
      const me = idRef.current;
      if (!me || target === me.id) return;
      const rec: BanRec = { kind, target, targetName, reason: reason.slice(0, 200), at: Date.now(), by: me.id, byName: profileRef.current.name };
      if (await modPublish(T.MOD + "ban-" + target, rec)) setToast(kind === "ban" ? `${targetName} was banned` : `${targetName} was unbanned`);
    },
    [modPublish],
  );

  const warn = useCallback(
    async (target: string, targetName: string, reason: string) => {
      const me = idRef.current;
      if (!me) return;
      const id = randomId(6);
      const rec: WarnRec = { kind: "warn", id, target, targetName, reason: reason.slice(0, 300), at: Date.now(), by: me.id, byName: profileRef.current.name };
      if (await modPublish(T.INBOX + target + "/warn-" + id, rec)) setToast(`Warning sent to ${targetName}`);
    },
    [modPublish],
  );

  const setGlobalWallpaper = useCallback(
    async (modeName: WallpaperRec["mode"], value?: string) => {
      const me = idRef.current;
      if (!me) return;
      if (modeName === "image" && !safeWallpaperUrl(value)) {
        setToast("That image link won't work. Use an https:// image");
        return;
      }
      const rec: WallpaperRec = { kind: "wallpaper", mode: modeName, value, at: Date.now(), by: me.id, byName: profileRef.current.name };
      if (await modPublish(T.MOD + "wallpaper", rec)) setToast(modeName === "default" ? "Wallpaper reset for everyone" : "Wallpaper updated for everyone");
    },
    [modPublish],
  );

  const setAnnouncement = useCallback(
    async (text: string) => {
      const me = idRef.current;
      if (!me) return;
      const rec: AnnounceRec = { kind: "announce", text: text.trim().slice(0, 240), at: Date.now(), by: me.id, byName: profileRef.current.name };
      if (await modPublish(T.MOD + "announce", rec)) setToast(rec.text ? "Announcement posted" : "Announcement cleared");
    },
    [modPublish],
  );

  /* ---------- derived ---------- */
  const conversations = useMemo(() => {
    if (!identity) return [];
    const map = new Map<string, { peer: string; last?: DmMsg; unread: number }>();
    for (const id of [...Object.keys(friends), ...Object.keys(contacts)]) map.set(id, { peer: id, unread: 0 });
    for (const dm of Object.values(dms)) {
      const peer = dm.from === identity.id ? dm.to : dm.from;
      if (blocked.includes(peer)) continue;
      const entry = map.get(peer) || { peer, unread: 0 };
      if (!entry.last || dm.at > entry.last.at) entry.last = dm;
      if (dm.from === peer && dm.at > (lastRead[peer] || 0) && !(view.tab === "direct" && view.peer === peer)) entry.unread += 1;
      map.set(peer, entry);
    }
    return [...map.values()]
      .filter((c) => !blocked.includes(c.peer))
      .sort((a, b) => (b.last?.at || 0) - (a.last?.at || 0) || lookup(a.peer).name.localeCompare(lookup(b.peer).name));
  }, [identity, friends, contacts, dms, lastRead, view, blocked, lookup]);

  const directUnread = conversations.reduce((n, c) => n + c.unread, 0) + Object.keys(requests).length;

  return {
    adminMode,
    loaded,
    identity,
    token,
    profile,
    settings,
    session,
    online,
    status,
    messages,
    people,
    admins,
    bans,
    wallpaper,
    announce,
    typing,
    friends,
    contacts,
    requests,
    outgoing,
    blocked,
    dms,
    warnings,
    allDms,
    logs,
    warnsIssued,
    directory,
    view,
    serverUnread,
    directUnread,
    conversations,
    toast,
    say,
    setView,
    lookup,
    isAdminMsg,
    isAdminPerson,
    isBanned,
    sendMessage,
    editMessage,
    deleteMessage,
    react,
    pingTyping,
    saveProfile,
    updateSettings,
    requestFriend,
    acceptFriend,
    declineFriend,
    removeFriend,
    toggleBlock,
    openDirect,
    sendDirect,
    unsendDirect,
    ackWarning,
    restoreFromToken,
    ban,
    warn,
    setGlobalWallpaper,
    setAnnouncement,
  };
}

export type Bunny = ReturnType<typeof useBunny>;
