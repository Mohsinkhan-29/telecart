import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { SITE_DEFAULTS, mergeDeep } from "../lib/siteDefaults";
import { ICON_NAMES } from "../components/Icon";
import { ErrorBox, Loading } from "../components/Status";

/* ---------- field helpers ---------- */
const t = (path, label, help) => ({ type: "text", path, label, help });
const ta = (path, label, help, rows = 4) => ({ type: "textarea", path, label, help, rows });
const tog = (path, label) => ({ type: "toggle", path, label });
const num = (path, label) => ({ type: "number", path, label });
const icon = (path, label = "Icon") => ({ type: "icon", path, label });
const head = (label, help) => ({ type: "heading", label, help });
const list = (path, label, fields, help) => ({ type: "list", path, label, fields, help });
const strings = (path, label, help) => ({ type: "strings", path, label, help });
const LINK_HELP = "Use [link text](/products) inside the text to add a link.";

/* ---------- what can be edited ---------- */
const SECTIONS = [
  { key: "store", label: "Store details", help: "Shown in the header, footer, contact page and used by the chatbot.", fields: [
    t("name", "Store name"),
    t("whatsapp", "WhatsApp number", "Orders are sent here. Write it like 0300 1234567 or 923001234567."),
    t("phone", "Phone number"), t("email", "Email"),
    ta("address", "Store address", "", 2), t("hours", "Opening hours", "e.g. Mon to Sat, 12 pm to 10 pm"),
    t("facebook", "Facebook page link"), t("instagram", "Instagram link"),
    t("utilityText", "Top bar text"), t("priceNote", "Price note", "Shown under price lists and in the footer."),
  ] },
  { key: "theme", label: "Theme", fields: [
    { type: "color", path: "accent", label: "Accent colour", help: "The logo green by default. Used for buttons, highlights and the cursor." },
    tog("customCursor", "Custom cursor (dot and ring) on desktop"),
  ] },
  { key: "header", label: "Header", fields: [
    list("links", "Menu links", [t("label", "Label"), t("to", "Link", "e.g. /products or /about")]),
    t("ctaLabel", "WhatsApp button label"),
  ] },
  { key: "hero", label: "Hero", help: "Your original hero. Only the text changes here, the design stays the same.", fields: [
    t("eyebrow", "Small heading"), t("titleLine1", "Title line 1"), t("titleLine2", "Title line 2 (green)"),
    ta("text", "Text", "", 3),
    t("primaryLabel", "Main button label"), t("primaryLink", "Main button link"),
    t("secondaryLabel", "Second button label"), t("secondaryLink", "Second button link", "#cat scrolls to the categories."),
    list("features", "Feature chips", [t("icon", "Icon (emoji)"), t("label", "Label")]),
    tog("showBadge", "Show discount badge"), t("badgeTop", "Badge top"), t("badgeValue", "Badge value"), t("badgeBottom", "Badge bottom"),
  ] },
  { key: "home", label: "Home page", fields: [
    head("Scrolling strip"),
    strings("ticker", "Strip messages"),
    head("Shop by category", "Categories come from Admin → Categories. Tick 'Show on home' there."),
    tog("categories.show", "Show this section"), t("categories.eyebrow", "Small heading"), t("categories.title", "Title"),
    t("categories.linkLabel", "Link label"), num("categories.limit", "How many categories"),
    head("Popular products", "Shows products marked 'Featured on home' in the catalog."),
    tog("popular.show", "Show this section"), t("popular.eyebrow", "Small heading"), t("popular.title", "Title"), num("popular.limit", "How many products"),
    head("Best deals and price list", "The price table is built from your catalog automatically."),
    tog("deals.show", "Show this section"), t("deals.eyebrow", "Small heading"), t("deals.title", "Title"), t("deals.titleHighlight", "Title (green part)"),
    ta("deals.text", "Text", "", 3), t("deals.categorySlug", "Category for the price list", "Category slug, e.g. mobile-phones. See Admin → Categories."),
    list("deals.highlights", "Highlight rows", [t("label", "Label"), t("value", "Value")], "Leave empty to show the three lowest prices automatically."),
    t("deals.buttonLabel", "WhatsApp button label"), t("deals.tableTitle", "Table title"),
    head("Why choose us"),
    tog("why.show", "Show this section"), t("why.eyebrow", "Small heading"), t("why.title", "Title"),
    list("why.cards", "Cards", [icon("icon"), t("title", "Title"), ta("text", "Text", "", 2), t("linkLabel", "Link label (optional)"), t("linkTo", "Link (optional)")]),
    head("SEO text at the bottom", LINK_HELP),
    tog("seo.show", "Show this section"),
    list("seo.blocks", "Text blocks", [t("heading", "Heading"), ta("body", "Text", LINK_HELP)]),
  ] },
  { key: "shop", label: "Shop page", fields: [
    t("eyebrow", "Breadcrumb label"), t("title", "Title"), t("titleHighlight", "Title (green part)"), ta("intro", "Intro", "", 3),
    list("seoBlocks", "SEO text blocks", [t("heading", "Heading"), ta("body", "Text", LINK_HELP)]),
  ] },
  { key: "about", label: "About page", fields: [
    t("eyebrow", "Breadcrumb label"), t("title", "Title"), ta("intro", "Intro", "", 2),
    t("storyTitle", "Story title"), ta("story", "Story", "Leave a blank line between paragraphs. " + LINK_HELP, 7),
    t("stepsTitle", "Steps title"), list("steps", "Steps", [t("title", "Title"), ta("text", "Text", "", 2)]),
    t("valuesTitle", "Values title"), list("values", "Values", [icon("icon"), t("title", "Title"), ta("text", "Text", "", 2)]),
    t("visitTitle", "Visit box title"), ta("visitText", "Visit box text", "Address and hours come from Store details.", 2),
  ] },
  { key: "contact", label: "Contact page", fields: [
    t("title", "Title"), ta("intro", "Intro", "", 2), t("formTitle", "Form title"), ta("formText", "Form text", "", 2),
  ] },
  { key: "policies", label: "Delivery & returns", help: "Replace every [PLACEHOLDER]. The chatbot also reads this page.", fields: [
    t("title", "Title"), ta("intro", "Intro", "", 2),
    list("sections", "Sections", [t("title", "Title"), ta("body", "Text", LINK_HELP, 4)]),
  ] },
  { key: "footer", label: "Footer", fields: [
    tog("newsletterShow", "Show newsletter box"), t("newsletterEyebrow", "Newsletter small heading"), t("newsletterTitle", "Newsletter title"),
    ta("newsletterText", "Newsletter text", "", 2), ta("about", "About text", "", 3),
    list("popularSearches", "Popular searches links", [t("label", "Label"), t("to", "Link")], "Good for SEO: use phrases people search, like 'best mobiles in Pakistan'."),
  ] },
  { key: "seo", label: "SEO", help: "Search titles (about 60 characters) and descriptions (about 155). {shop} is replaced with your store name.", fields: [
    ...["home", "products", "cart", "about", "contact", "policies"].flatMap((p) => [
      head(`${p[0].toUpperCase()}${p.slice(1)} page`), t(`${p}.title`, "Title"), ta(`${p}.description`, "Description", "", 2),
    ]),
    head("Product pages", "Placeholders: {name} {brand} {price} {variants} {shop}. A product's own SEO fields override these."),
    t("productTitle", "Title template"), ta("productDescription", "Description template", "", 2),
  ] },
];

/* ---------- path helpers ---------- */
const getAt = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const setAt = (obj, path, val) => {
  const keys = path.split(".");
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = out;
  keys.slice(0, -1).forEach((k) => { cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] ?? {}) }; cur = cur[k]; });
  cur[keys[keys.length - 1]] = val;
  return out;
};

function Help({ children }) { return children ? <p className="text-xs text-chrome mt-1">{children}</p> : null; }

function Field({ f, value, onChange }) {
  if (f.type === "heading") return <div className="pt-4 border-t border-steel-line"><h3 className="text-sm text-amber">{f.label}</h3><Help>{f.help}</Help></div>;
  if (f.type === "toggle") return (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>
  );
  if (f.type === "textarea") return (
    <div><label className="label">{f.label}</label><textarea className="input" rows={f.rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /><Help>{f.help}</Help></div>
  );
  if (f.type === "number") return (
    <div><label className="label">{f.label}</label><input type="number" min={0} className="input max-w-[140px]" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} /></div>
  );
  if (f.type === "color") return (
    <div><label className="label">{f.label}</label>
      <div className="flex items-center gap-3"><input type="color" value={value || "#c5e813"} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 bg-transparent" />
        <input className="input max-w-[160px] font-mono" value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div><Help>{f.help}</Help></div>
  );
  if (f.type === "icon") return (
    <div><label className="label">{f.label}</label>
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</select></div>
  );
  if (f.type === "strings") {
    const arr = value ?? [];
    return (
      <div><label className="label">{f.label}</label>
        <div className="space-y-2">
          {arr.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" value={v} onChange={(e) => onChange(arr.map((x, j) => (j === i ? e.target.value : x)))} />
              <button type="button" className="text-chrome hover:text-danger px-2" onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
            </div>
          ))}
          <button type="button" className="text-xs text-amber" onClick={() => onChange([...arr, ""])}>+ Add</button>
        </div><Help>{f.help}</Help></div>
    );
  }
  if (f.type === "list") {
    const arr = value ?? [];
    const blank = Object.fromEntries(f.fields.map((x) => [x.path, x.type === "icon" ? "check" : ""]));
    const move = (i, d) => { const a = [...arr]; [a[i], a[i + d]] = [a[i + d], a[i]]; onChange(a); };
    return (
      <div><label className="label">{f.label}</label><Help>{f.help}</Help>
        <div className="space-y-3 mt-2">
          {arr.map((item, i) => (
            <div key={i} className="border border-steel-line rounded p-3 space-y-2 bg-asphalt">
              <div className="flex justify-between text-xs text-chrome"><span>#{i + 1}</span>
                <span className="flex gap-3">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-amber disabled:opacity-30">↑</button>
                  <button type="button" disabled={i === arr.length - 1} onClick={() => move(i, 1)} className="hover:text-amber disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => onChange(arr.filter((_, j) => j !== i))} className="hover:text-danger">Remove</button>
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {f.fields.map((sub) => (
                  <div key={sub.path} className={sub.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Field f={sub} value={item?.[sub.path]} onChange={(v) => onChange(arr.map((x, j) => (j === i ? { ...x, [sub.path]: v } : x)))} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="text-xs text-amber" onClick={() => onChange([...arr, blank])}>+ Add item</button>
        </div>
      </div>
    );
  }
  return <div><label className="label">{f.label}</label><input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} /><Help>{f.help}</Help></div>;
}

export default function SiteContent() {
  const saved = useFetch(() => adminApi.get("/settings"));
  const [tab, setTab] = useState("store");
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const section = SECTIONS.find((s) => s.key === tab);

  const current = useMemo(() => drafts[tab] ?? mergeDeep(SITE_DEFAULTS[tab], saved.data?.[tab]), [drafts, tab, saved.data]);
  const dirty = !!drafts[tab];
  useEffect(() => setMsg(null), [tab]);

  const change = (path, v) => setDrafts((d) => ({ ...d, [tab]: setAt(current, path, v) }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await adminApi.put(`/settings/${tab}`, { value: current });
      setDrafts((d) => { const n = { ...d }; delete n[tab]; return n; });
      await saved.reload();
      window.dispatchEvent(new Event("telecart-settings"));
      setMsg({ ok: true, text: "Saved. The storefront now shows this." });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  }
  async function reset() {
    if (!confirm(`Reset "${section.label}" to the default text?`)) return;
    setBusy(true);
    try {
      await adminApi.del(`/settings/${tab}`);
      setDrafts((d) => { const n = { ...d }; delete n[tab]; return n; });
      await saved.reload();
      window.dispatchEvent(new Event("telecart-settings"));
      setMsg({ ok: true, text: "Back to the default text." });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  }

  if (saved.loading && !saved.data) return <Loading />;
  if (saved.error) return <ErrorBox message={saved.error} onRetry={saved.reload} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Site content</h1>
          <p className="text-sm text-chrome-light mt-1">Edit every text, link and contact detail on the storefront. Products, prices and categories are edited in Catalog and Categories.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline text-xs">View store ↗</a>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:w-48 shrink-0">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`text-left px-3 py-2 rounded text-sm whitespace-nowrap ${tab === s.key ? "bg-steel text-amber" : "text-chrome-light hover:text-amber"}`}>
              {s.label}{drafts[s.key] ? " •" : ""}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0 max-w-3xl">
          <div className="spec-plate space-y-4">
            <div><h2 className="text-lg">{section.label}</h2><Help>{section.help}</Help></div>
            {section.fields.map((f, i) => (
              <Field key={f.path ?? `h${i}`} f={f} value={f.path ? getAt(current, f.path) : undefined} onChange={(v) => change(f.path, v)} />
            ))}
          </div>
          <div className="sticky bottom-0 bg-asphalt py-4 flex flex-wrap items-center gap-3 border-t border-steel-line mt-4">
            <button className="btn btn-primary" disabled={busy || !dirty} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
            {dirty && <button className="btn btn-outline" disabled={busy} onClick={() => setDrafts((d) => { const n = { ...d }; delete n[tab]; return n; })}>Discard</button>}
            <button className="text-xs text-chrome hover:text-danger ml-auto" disabled={busy} onClick={reset}>Reset section to default</button>
            {msg && <p className={`text-sm w-full ${msg.ok ? "text-ok" : "text-danger"}`}>{msg.text}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
