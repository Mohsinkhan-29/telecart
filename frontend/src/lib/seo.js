import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

const fill = (tpl, vars) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

function setMeta(name, content, attr = "name") {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Sets <title>, meta description, Open Graph tags and optional JSON-LD for the current page. */
export function useSeo({ page, title, description, vars = {}, jsonLd } = {}) {
  const s = useSettings();
  const shop = s.store.name;
  const preset = page ? s.seo[page] : null;
  const t = fill(title ?? preset?.title, { shop, ...vars });
  const d = fill(description ?? preset?.description, { shop, ...vars });
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    if (t) document.title = t;
    if (d) {
      setMeta("description", d);
      setMeta("og:description", d, "property");
    }
    if (t) setMeta("og:title", t, "property");
    setMeta("og:type", "website", "property");
    let script = document.getElementById("tc-jsonld");
    if (ld) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "tc-jsonld";
        document.head.appendChild(script);
      }
      script.textContent = ld;
    } else if (script) script.remove();
  }, [t, d, ld]);
}

export { fill as fillTemplate };
