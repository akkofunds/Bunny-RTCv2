import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ImageOff, Loader2, X } from "lucide-react";
import type { MediaRef, Prepared } from "@/lib/bunny/media";
import { MAX_ATTACHMENTS, prepareFile } from "@/lib/bunny/media";

type Loader = (ref: MediaRef) => Promise<string>;

function MediaItem({ media, load, single, onOpen }: { media: MediaRef; load: Loader; single: boolean; onOpen: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    load(media).then(
      (u) => alive && setUrl(u),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [media, load]);
  const ratio = media.w && media.h ? `${media.w} / ${media.h}` : "16 / 10";
  const style: React.CSSProperties = single ? { aspectRatio: ratio, maxWidth: media.w && media.h && media.h > media.w ? "16rem" : "26rem" } : {};
  if (failed)
    return (
      <div className="media-cell media-missing" style={style}>
        <ImageOff size={20} />
        <span>Attachment unavailable</span>
      </div>
    );
  if (!url)
    return (
      <div className="media-cell media-loading" style={style} aria-label="Loading attachment">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  if (media.kind === "video")
    return (
      <div className="media-cell" style={style}>
        <video src={url} controls playsInline preload="metadata" />
      </div>
    );
  return (
    <button type="button" className="media-cell" style={style} onClick={() => onOpen(url)} aria-label={`Open ${media.name || "image"}`}>
      <img src={url} alt={media.name || "Shared image"} loading="lazy" />
    </button>
  );
}

export function MediaGrid({ media, load }: { media: MediaRef[]; load: Loader }) {
  const [open, setOpen] = useState<string | null>(null);
  const single = media.length === 1;
  return (
    <>
      <div className={`media-grid ${single ? "one" : ""}`}>
        {media.map((m) => (
          <MediaItem key={m.id} media={m} load={load} single={single} onOpen={setOpen} />
        ))}
      </div>
      {open ? <Lightbox url={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const node = (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label="Image viewer">
      <img src={url} alt="" onClick={(e) => e.stopPropagation()} />
      <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <a className="gbtn" href={url} download="bunny-image">
          <Download size={16} /> Save
        </a>
        <button className="gbtn icon" type="button" aria-label="Close viewer" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
  const host = document.querySelector(".stage");
  return host ? createPortal(node, host) : node;
}

/* ---------- composer attachments ---------- */

export type Pending = Prepared & { key: string };

export function useAttachments(say: (msg: string) => void) {
  const [items, setItems] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const countRef = useRef(0);
  countRef.current = items.length;
  const add = useCallback(
    async (files: FileList | File[] | null) => {
      const list = [...(files || [])];
      if (!list.length) return;
      setBusy(true);
      for (const file of list) {
        if (countRef.current >= MAX_ATTACHMENTS) {
          say(`Up to ${MAX_ATTACHMENTS} attachments per message`);
          break;
        }
        try {
          const p = await prepareFile(file);
          countRef.current += 1;
          setItems((prev) => (prev.length >= MAX_ATTACHMENTS ? prev : [...prev, { ...p, key: Math.random().toString(36).slice(2) }]));
        } catch (e) {
          say(e instanceof Error ? e.message : "That file can't be shared");
        }
      }
      setBusy(false);
    },
    [say],
  );
  const remove = useCallback((key: string) => {
    setItems((prev) => {
      const hit = prev.find((p) => p.key === key);
      if (hit) URL.revokeObjectURL(hit.preview);
      return prev.filter((p) => p.key !== key);
    });
  }, []);
  const clear = useCallback(() => setItems([]), []);
  return { items, busy, add, remove, clear };
}

export function AttachTray({ items, onRemove, progress }: { items: Pending[]; onRemove: (key: string) => void; progress: number | null }) {
  if (!items.length) return null;
  return (
    <div className="tray">
      {items.map((p) => (
        <div className="tray-item" key={p.key}>
          {p.kind === "video" ? <video src={p.preview} muted playsInline /> : <img src={p.preview} alt="" />}
          {p.kind === "video" ? <span className="tray-kind">Video</span> : null}
          {progress === null ? (
            <button className="tray-x" type="button" aria-label={`Remove ${p.name}`} onClick={() => onRemove(p.key)}>
              <X size={12} />
            </button>
          ) : null}
        </div>
      ))}
      {progress !== null ? (
        <div className="tray-progress" aria-live="polite">
          <i style={{ width: `${Math.round(progress * 100)}%` }} />
          <span>Uploading {Math.round(progress * 100)}%</span>
        </div>
      ) : null}
    </div>
  );
}

export const ACCEPT = "image/*,video/mp4,video/webm,video/quicktime";
