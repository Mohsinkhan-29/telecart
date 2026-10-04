import { Link } from "react-router-dom";

/** Plain text from the admin with blank-line paragraphs and [link text](/url) links. */
export function Inline({ text = "" }) {
  const parts = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    parts.push(/^https?:/.test(href)
      ? <a key={i++} href={href} target="_blank" rel="noreferrer">{label}</a>
      : <Link key={i++} to={href}>{label}</Link>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function RichText({ text = "" }) {
  return String(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p, i) => <p key={i}><Inline text={p} /></p>);
}
