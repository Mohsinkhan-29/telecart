import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import PointerFX from "./PointerFX";
import { useSettings } from "../context/SettingsContext";
import "../storefront.css";

export default function SiteLayout() {
  const s = useSettings();
  const root = useRef(null);
  const { pathname, hash } = useLocation();

  // New page: start at the top (or at #anchor when the link has one).
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div ref={root} className="storefront tc-site" style={{ "--lime": s.theme.accent || "#c5e813" }}>
      <Navbar />
      <main><Outlet /></main>
      <Footer />
      <ChatWidget />
      <PointerFX cursor={s.theme.customCursor !== false} rootRef={root} />
    </div>
  );
}
