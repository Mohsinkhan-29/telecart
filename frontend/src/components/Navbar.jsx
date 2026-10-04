import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { waLink } from "../lib/whatsapp";
import Icon from "./Icon";

export function BrandMark({ size = 30 }) {
  return (
    <svg viewBox="0 0 40 46" width={size} height={size * 1.15} aria-hidden="true">
      <rect x="2" y="2" width="25" height="42" rx="8" style={{ fill: "none", stroke: "#8d9098", strokeWidth: 3 }} />
      <path d="M9 17h13M15.5 17v11a5 5 0 005 5" style={{ fill: "none", stroke: "#fff", strokeWidth: 3.4, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M37 17a8 8 0 00-6-3M37 29a8 8 0 01-6 4" style={{ fill: "none", stroke: "var(--lime)", strokeWidth: 3.4, strokeLinecap: "round" }} />
    </svg>
  );
}

/** "Tele Cart" -> TELE <b>CART</b>: the last word takes the accent colour. */
export function BrandName({ name }) {
  const words = String(name || "").trim().split(/\s+/);
  if (words.length < 2) return <span>{name}</span>;
  return <span>{words.slice(0, -1).join(" ")} <b>{words[words.length - 1]}</b></span>;
}

const isActive = (to, loc) => {
  const [path, query] = to.split("?");
  if (path === "/") return loc.pathname === "/";
  if (query) return loc.pathname === path && loc.search.includes(query);
  return loc.pathname === path && !loc.search.includes("category=");
};

export default function Navbar() {
  const { count } = useCart();
  const s = useSettings();
  const loc = useLocation();
  const menu = useRef(null);
  useEffect(() => { if (menu.current) menu.current.open = false; }, [loc.pathname, loc.search]);
  const order = waLink(s.store.whatsapp, `Hi ${s.store.name}, I want to place an order`);

  return (
    <header className="tc-head">
      <div className="tc-util">
        <div className="tc-wrap">
          <span><Icon name="truck" />{s.store.utilityText}</span>
          {s.store.whatsapp && <a href={order} target="_blank" rel="noreferrer"><Icon name="whatsapp" />WhatsApp: {s.store.whatsapp}</a>}
        </div>
      </div>
      <nav className="tc-nav" aria-label="Main">
        <div className="tc-wrap">
          <Link to="/" className="tc-brand"><BrandMark /><BrandName name={s.store.name} /></Link>
          <div className="tc-nav-links">
            {s.header.links.map((l) => (
              <Link key={l.label + l.to} to={l.to} className={isActive(l.to, loc) ? "on" : ""}>{l.label}</Link>
            ))}
          </div>
          <div className="tc-nav-r">
            <Link className="tc-ibtn" to="/products" aria-label="Search products"><Icon name="search" /></Link>
            <Link className="tc-ibtn" to="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`}>
              <Icon name="cart" />{count > 0 && <span className="n">{count}</span>}
            </Link>
            <a className="tc-btn tc-btn-wa tc-btn-sm" href={order} target="_blank" rel="noreferrer">{s.header.ctaLabel}</a>
            <details className="tc-mnav" ref={menu}>
              <summary className="tc-ibtn" aria-label="Open menu"><Icon name="menu" /></summary>
              <div className="mp">
                {s.header.links.map((l) => <Link key={l.label + l.to} to={l.to}>{l.label}</Link>)}
                <a href={order} target="_blank" rel="noreferrer">{s.header.ctaLabel}</a>
              </div>
            </details>
          </div>
        </div>
      </nav>
    </header>
  );
}
