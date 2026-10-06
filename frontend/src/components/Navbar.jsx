import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { waLink } from "../lib/whatsapp";
import Icon from "./Icon";

const isActive = (to, loc) => {
  const [path, query] = to.split("?");

  if (path === "/") {
    return loc.pathname === "/";
  }

  if (query) {
    return loc.pathname === path && loc.search.includes(query);
  }

  return loc.pathname === path && !loc.search.includes("category=");
};

export default function Navbar() {
  const { count } = useCart();
  const s = useSettings();
  const loc = useLocation();
  const menu = useRef(null);

  useEffect(() => {
    if (menu.current) {
      menu.current.open = false;
    }
  }, [loc.pathname, loc.search]);

  const order = waLink(
    s.store.whatsapp,
    `Hi ${s.store.name}, I want to place an order`
  );

  return (
    <header className="tc-head">
      {/* Utility bar */}
      <div className="tc-util">
        <div className="tc-wrap">
          <span>
            <Icon name="truck" />
            {s.store.utilityText}
          </span>

          {s.store.whatsapp && (
            <a
              href={order}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="whatsapp" />
              WhatsApp: {s.store.whatsapp}
            </a>
          )}
        </div>
      </div>

      {/* Main navbar */}
      <nav className="tc-nav" aria-label="Main">
        <div className="tc-wrap">

          {/* Logo */}
          <Link
            to="/"
            className="tc-brand flex items-center shrink-0"
            aria-label={s.store.name}
          >
            <img
              src="/navlogo.png"
              alt={s.store.name}
              className="
                block
                w-[100px]
                h-[42px]
                sm:w-[115px]
                sm:h-[46px]
                lg:w-[125px]
                lg:h-[48px]
                object-contain
              "
            />
          </Link>

          {/* Desktop navigation */}
          <div className="tc-nav-links">
            {s.header.links.map((l) => (
              <Link
                key={l.label + l.to}
                to={l.to}
                className={isActive(l.to, loc) ? "on" : ""}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="tc-nav-r">

            {/* Search */}
            <Link
              className="tc-ibtn"
              to="/products"
              aria-label="Search products"
            >
              <Icon name="search" />
            </Link>

            {/* Cart */}
            <Link
              className="tc-ibtn relative"
              to="/cart"
              aria-label={`Cart${count ? `, ${count} items` : ""}`}
            >
              <Icon name="cart" />

              {count > 0 && (
                <span className="n">
                  {count}
                </span>
              )}
            </Link>

            {/* WhatsApp CTA */}
            <a
              className="tc-btn tc-btn-wa tc-btn-sm"
              href={order}
              target="_blank"
              rel="noreferrer"
            >
              {s.header.ctaLabel}
            </a>

            {/* Mobile menu */}
            <details
              className="tc-mnav"
              ref={menu}
            >
              <summary
                className="tc-ibtn"
                aria-label="Open menu"
              >
                <Icon name="menu" />
              </summary>

              <div className="mp">
                {s.header.links.map((l) => (
                  <Link
                    key={l.label + l.to}
                    to={l.to}
                  >
                    {l.label}
                  </Link>
                ))}

                <a
                  href={order}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.header.ctaLabel}
                </a>
              </div>
            </details>

          </div>
        </div>
      </nav>
    </header>
  );
}