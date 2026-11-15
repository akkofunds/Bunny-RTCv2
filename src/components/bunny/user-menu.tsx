import { useState } from "react";
import { AtSign, Ban, Ban as BanIcon, Check, Clock, Copy, LogOut, MessageCircle, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert, UserMinus, UserPlus } from "lucide-react";
import type { Bunny } from "@/lib/bunny/use-bunny";
import { Face, Floating, RoleBadge, Toggle } from "./ui";

export type MenuTarget = { id: string; x: number; y: number };

export function UserMenu({ bunny, target, onClose, onMention }: { bunny: Bunny; target: MenuTarget; onClose: () => void; onMention?: (name: string) => void }) {
  const [mode, setMode] = useState<"main" | "warn" | "ban" | "kick" | "perks">("main");
  const perk = bunny.perks[target.id];
  const [animated, setAnimated] = useState(!!perk?.animated);
  const [roleText, setRoleText] = useState(perk?.role?.text || "");
  const [roleColor, setRoleColor] = useState(perk?.role?.color || "#a78bfa");
  const [reason, setReason] = useState("");
  const info = bunny.lookup(target.id);
  const self = target.id === bunny.identity?.id;
  const friend = !!bunny.friends[target.id];
  const pending = !!bunny.outgoing[target.id];
  const incoming = bunny.requests[target.id];
  const blocked = bunny.blocked.includes(target.id);
  const isAdmin = bunny.isAdminPerson(target.id) || !!bunny.admins[target.id];
  const banned = bunny.isBanned(target.id);
  const canMod = bunny.adminMode && !!bunny.session && !self && !bunny.admins[target.id];

  return (
    <Floating x={target.x} y={target.y} onClose={onClose}>
      <div className="menu-head">
        <Face avatar={info.avatar} anim={info.anim} color={info.color} label={info.name} status={info.online ? info.status : undefined} />
        <div style={{ minWidth: 0 }}>
          <strong>
            {info.name}
            <RoleBadge role={info.role} admin={isAdmin} />
            {banned ? <span className="tag ban">Banned</span> : null}
          </strong>
          <p>{self ? "This is you" : info.bio || (info.online ? (info.status === "dnd" ? "Do not disturb" : info.status === "idle" ? "Idle" : "Online") : "Offline")}</p>
        </div>
      </div>
      {mode === "main" ? (
        <>
          {!self ? (
            <>
              <button
                className="menu-item"
                type="button"
                disabled={!info.box || blocked}
                onClick={() => {
                  bunny.openDirect(target.id);
                  onClose();
                }}
              >
                <MessageCircle size={17} /> {info.box ? "Message" : "Message (needs them online)"}
              </button>
              {incoming ? (
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    bunny.acceptFriend(incoming);
                    onClose();
                  }}
                >
                  <Check size={17} /> Accept friend request
                </button>
              ) : friend ? (
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    bunny.removeFriend(target.id);
                    bunny.say(`Removed ${info.name} from friends`);
                    onClose();
                  }}
                >
                  <UserMinus size={17} /> Remove friend
                </button>
              ) : (
                <button
                  className="menu-item"
                  type="button"
                  disabled={pending || !info.box || blocked}
                  onClick={() => {
                    bunny.requestFriend(target.id);
                    onClose();
                  }}
                >
                  {pending ? <Clock size={17} /> : <UserPlus size={17} />} {pending ? "Request sent" : "Add friend"}
                </button>
              )}
              {onMention ? (
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    onMention(info.name);
                    onClose();
                  }}
                >
                  <AtSign size={17} /> Mention
                </button>
              ) : null}
            </>
          ) : null}
          <button
            className="menu-item"
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(target.id);
                bunny.say("User ID copied");
              } catch {
                bunny.say("Could not copy");
              }
              onClose();
            }}
          >
            <Copy size={17} /> Copy user ID
          </button>
          {!self ? (
            <>
              <div className="menu-sep" />
              <button
                className="menu-item danger"
                type="button"
                onClick={() => {
                  bunny.toggleBlock(target.id);
                  bunny.say(blocked ? `Unblocked ${info.name}` : `Blocked ${info.name}`);
                  onClose();
                }}
              >
                <BanIcon size={17} /> {blocked ? "Unblock" : "Block"}
              </button>
            </>
          ) : null}
          {canMod ? (
            <>
              <div className="menu-sep" />
              <button className="menu-item" type="button" onClick={() => setMode("perks")}>
                <Sparkles size={17} /> Perks & role
              </button>
              <button className="menu-item warn" type="button" onClick={() => setMode("warn")}>
                <TriangleAlert size={17} /> Warn user
              </button>
              {info.online ? (
                <button className="menu-item warn" type="button" onClick={() => setMode("kick")}>
                  <LogOut size={17} /> Kick from room
                </button>
              ) : null}
              {banned ? (
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    void bunny.ban(target.id, info.name, "", "unban");
                    onClose();
                  }}
                >
                  <ShieldCheck size={17} /> Unban
                </button>
              ) : (
                <button className="menu-item danger" type="button" onClick={() => setMode("ban")}>
                  <Ban size={17} /> Ban from server
                </button>
              )}
            </>
          ) : null}
        </>
      ) : mode === "perks" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void bunny.setPerk(target.id, info.name, animated, roleText.trim() ? { text: roleText.trim(), color: roleColor } : null);
            onClose();
          }}
        >
          <span className="label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Sparkles size={13} /> Perks for {info.name}
          </span>
          <label className="perk-row">
            <span>Animated profile picture</span>
            <Toggle label="Animated profile picture" on={animated} onChange={setAnimated} />
          </label>
          <span className="label" style={{ marginTop: "0.2rem" }}>
            Role tag
          </span>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input className="input" value={roleText} maxLength={18} placeholder="VIP, Mod, Artist…" onChange={(e) => setRoleText(e.target.value)} aria-label="Role tag text" />
            <label className="color-pick" title="Role color">
              <input type="color" value={roleColor} onChange={(e) => setRoleColor(e.target.value)} aria-label="Role color" />
              <span style={{ background: roleColor }} />
            </label>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <RoleBadge role={roleText.trim() ? { text: roleText.trim(), color: roleColor } : null} admin={false} />
            <div className="row">
              <button className="gbtn sm" type="button" onClick={() => setMode("main")}>
                Back
              </button>
              <button className="gbtn sm primary" type="submit">
                Save
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "warn") {
              if (!reason.trim()) return;
              void bunny.warn(target.id, info.name, reason);
            } else if (mode === "kick") void bunny.kick(target.id, info.name, reason);
            else void bunny.ban(target.id, info.name, reason || "Broke the server rules");
            onClose();
          }}
        >
          <span className="label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <ShieldAlert size={13} /> {mode === "warn" ? `Warn ${info.name}` : mode === "kick" ? `Kick ${info.name}` : `Ban ${info.name}`}
          </span>
          <textarea
            className="input"
            autoFocus
            maxLength={300}
            value={reason}
            placeholder={mode === "warn" ? "What should they know?" : "Reason (optional, shown to them)"}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="gbtn sm" type="button" onClick={() => setMode("main")}>
              Back
            </button>
            <button className={mode === "ban" ? "gbtn sm danger" : "gbtn sm primary"} type="submit" disabled={mode === "warn" && !reason.trim()}>
              {mode === "warn" ? "Send warning" : mode === "kick" ? "Kick" : "Ban"}
            </button>
          </div>
        </form>
      )}
    </Floating>
  );
}
