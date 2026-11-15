import { Fragment, type ReactNode } from "react";

/** Tiny, safe formatter: links, `code`, **bold**, *italic*, ~~strike~~, @mentions. */
const TOKEN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])|(`[^`\n]{1,200}`)|(\*\*[^*\n]{1,200}\*\*)|(~~[^~\n]{1,200}~~)|(\*[^*\n]{1,200}\*)|(@[\p{L}\p{N}_.-]{1,24})/gu;

export function RichText({ text, selfName }: { text: string; selfName?: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  const me = selfName?.toLowerCase();
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const raw = m[0];
    const key = i++;
    if (m[1]) {
      out.push(
        <a key={key} href={raw} target="_blank" rel="noopener noreferrer nofollow" className="rt-link">
          {raw}
        </a>,
      );
    } else if (m[2]) out.push(<code key={key} className="rt-code">{raw.slice(1, -1)}</code>);
    else if (m[3]) out.push(<strong key={key}>{raw.slice(2, -2)}</strong>);
    else if (m[4]) out.push(<s key={key}>{raw.slice(2, -2)}</s>);
    else if (m[5]) out.push(<em key={key}>{raw.slice(1, -1)}</em>);
    else if (m[6]) {
      const tag = raw.slice(1).toLowerCase();
      const self = !!me && (tag === me.replace(/\s+/g, "") || tag === me.split(/\s+/)[0] || tag === "everyone");
      out.push(
        <span key={key} className={self ? "rt-mention self" : "rt-mention"}>
          {raw}
        </span>,
      );
    }
    last = at + raw.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

export function mentions(text: string, name: string) {
  if (!name) return false;
  const lower = text.toLowerCase();
  const first = name.toLowerCase().split(/\s+/)[0];
  return lower.includes("@" + name.toLowerCase()) || (first.length > 1 && new RegExp(`@${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`).test(lower)) || lower.includes("@everyone");
}
