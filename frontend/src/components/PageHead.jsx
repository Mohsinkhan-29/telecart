import { Link } from "react-router-dom";
import RichText from "./RichText";

/** Dark page header band with breadcrumb, H1 (last words highlighted) and intro. */
export function PageHead({ crumbs = [], title, highlight, intro }) {
  return (
    <header className="tc-phead">
      <div className="tc-wrap">
        <nav className="tc-crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "contents" }}>
              <span>/</span>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <b>{c.label}</b>}
            </span>
          ))}
        </nav>
        <h1>{title}{highlight ? <> <em>{highlight}</em></> : null}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
    </header>
  );
}

/** SEO copy blocks: [{ heading, body }] with [text](/link) support. */
export function SeoBlocks({ blocks = [] }) {
  if (!blocks.length) return null;
  return (
    <div className="tc-prose tc-rv">
      {blocks.map((b, i) => (
        <div key={i}>
          {b.heading && (i === 0 ? <h2>{b.heading}</h2> : <h3>{b.heading}</h3>)}
          <RichText text={b.body} />
        </div>
      ))}
    </div>
  );
}
