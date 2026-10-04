import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useSettings } from "../context/SettingsContext";
import { useSeo } from "../lib/seo";
import { formatPKR } from "../lib/format";
import { waLink } from "../lib/whatsapp";
import ProductCard from "../components/ProductCard";
import { phoneColours } from "../components/Art";
import { SeoBlocks } from "../components/PageHead";
import Icon from "../components/Icon";
import { ErrorBox } from "../components/Status";

/* ================================================================== */
/* HERO: unchanged from your version. Its text now comes from          */
/* Admin → Site content → Hero (defaults are the original wording).    */
/* ================================================================== */

const PALETTES = [
  ["#e9e2d8", "#3a3a3a"],
  ["#dfe6ea", "#1e2a30"],
  ["#ecdccb", "#4a3324"],
];

/* Glow border, keyframes and reduced-motion rule (pseudo-elements can't be Tailwind classes) */
const CSS = `
@keyframes tcpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){.tc-anim{animation:none!important;transition:none!important}}
`;

/* Hyperspeed canvas background (lime / charcoal) */
function Hyperspeed() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const COLORS = ["#c6e619", "#9ec72a", "#3a3b40", "#5c5d63"];
    let W, H, cx, cy, raf;

    const size = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      cx = W / 2;
      cy = H * 0.42;
    };
    const mk = (init) => ({
      a: Math.random() * Math.PI * 2,
      d: init ? Math.random() * Math.max(W, H) * 0.5 : 4,
      speed: 2 + Math.random() * 4,
      len: 20 + Math.random() * 40,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    size();
    window.addEventListener("resize", size);
    const streaks = Array.from({ length: 140 }, () => mk(true));

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      ctx.fillStyle = "#141518";
      ctx.fillRect(0, 0, W, H);
      return () => window.removeEventListener("resize", size);
    }

    const frame = () => {
      ctx.fillStyle = "rgba(20,21,24,0.32)";
      ctx.fillRect(0, 0, W, H);
      streaks.forEach((s) => {
        const x1 = cx + Math.cos(s.a) * s.d;
        const y1 = cy + Math.sin(s.a) * s.d * 0.6;
        s.d += s.speed;
        s.speed *= 1.012;
        const x2 = cx + Math.cos(s.a) * s.d;
        const y2 = cy + Math.sin(s.a) * s.d * 0.6;
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = Math.min(1, s.d / 300);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (s.d > Math.max(W, H) * 0.9) Object.assign(s, mk(false));
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full bg-[#141518]"
    />
  );
}

/* Shared class strings */
const WRAP = "mx-auto max-w-[1180px] px-7";
const H2 = "font-extrabold leading-[1.08] tracking-[-0.02em]";
const BTN = "inline-flex items-center gap-2 rounded-full border-[1.5px] px-6 py-[13px] text-sm font-bold transition-colors";
const BTN_LIME = `${BTN} border-transparent bg-[#9ec72a] text-[#12140a] hover:bg-[#c6e619]`;
const BTN_LINE = `${BTN} border-[#e9e9e5] text-[#17181a] hover:border-[#9ec72a]`;

/* Internal paths use the router; #anchors and full URLs are plain links. */
const SmartLink = ({ to, className, children }) =>
  to?.startsWith("/") ? <Link to={to} className={className}>{children}</Link> : <a href={to} className={className}>{children}</a>;

function Hero() {
  const h = useSettings().hero;

  /* hero phone colour cycle */
  const [pi, setPi] = useState(0);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    let t2;
    const t1 = setInterval(() => {
      setFade(true);
      t2 = setTimeout(() => {
        setPi((n) => (n + 1) % PALETTES.length);
        setFade(false);
      }, 420);
    }, 3600);
    return () => {
      clearInterval(t1);
      clearTimeout(t2);
    };
  }, []);
  const [a, b] = PALETTES[pi];

  return (
    <section className="tc-hero-keep relative z-[1] bg-transparent pb-[60px] pt-[76px]">
      <div className={`${WRAP} grid items-center gap-7 lg:grid-cols-[1.05fr_1fr] lg:gap-9`}>
        <div className="rounded-[28px] bg-white/90 p-[26px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.5)] backdrop-blur-[8px] sm:p-10">
          <div className="mb-3.5 text-[13.5px] font-bold text-[#7ba01e]">{h.eyebrow}</div>
          <h1 className={`${H2} text-[clamp(32px,4.4vw,52px)] text-[#17181a]`}>
            {h.titleLine1}
            <br />
            <em className="not-italic text-[#7ba01e]">{h.titleLine2}</em>
          </h1>
          <p className="mb-7 mt-[18px] max-w-[440px] text-base leading-[1.6] text-[#6c6d72]">
            {h.text}
          </p>
          <div className="mb-8 flex flex-wrap gap-3.5">
            <SmartLink to={h.primaryLink} className={BTN_LIME}>{h.primaryLabel}</SmartLink>
            <SmartLink to={h.secondaryLink} className={BTN_LINE}>{h.secondaryLabel}</SmartLink>
          </div>
          <div className="flex flex-wrap gap-[22px]">
            {h.features.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-[7px] text-xs font-bold text-[#6c6d72]">
                <i className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#f6f6f3] text-sm not-italic">{icon}</i>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* phone stage */}
        <div className="tc-phone-stage relative flex h-[300px] items-center justify-center sm:h-[360px] lg:h-[420px]" aria-hidden="true">
          <Phone className="left-[2%] top-[8%] z-[1] rotate-[-9deg]" bg={`linear-gradient(160deg,${b},${a})`} />
          <Phone
            className="left-[32%] top-[-2%] z-[3]"
            bg={`linear-gradient(160deg,${a},${b})`}
            style={{
              opacity: fade ? 0 : 1,
              transform: fade ? "translateY(24px) scale(.94)" : "translateY(0) scale(1)",
            }}
          />
          <Phone className="left-[60%] top-[12%] z-[2] rotate-[9deg]" bg={`linear-gradient(160deg,${a},${b})`} />
          {h.showBadge && (
            <div className="tc-anim absolute right-[2%] top-[3%] z-[4] flex h-[70px] w-[70px] animate-[tcpulse_2.4s_ease-in-out_infinite] flex-col items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#6c6d72] shadow-[0_14px_30px_-8px_rgba(0,0,0,.3)] sm:h-[82px] sm:w-[82px] sm:text-[11px]">
              {h.badgeTop}<b className="text-[20px] text-[#7ba01e]">{h.badgeValue}</b>{h.badgeBottom}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Phone({ className = "", bg, style }) {
  return (
    <div
      className={`absolute h-[250px] w-[128px] rounded-[25px] border-[3px] border-[#101114] bg-[#1b1c1e] shadow-[0_30px_50px_-18px_rgba(0,0,0,.4)] transition-[transform,opacity] duration-[800ms] sm:h-[290px] sm:w-[150px] lg:h-[330px] lg:w-[170px] lg:rounded-[30px] ${className}`}
      style={style}
    >
      <span className="absolute left-1/2 top-3.5 h-[5px] w-[34px] -translate-x-1/2 rounded bg-[#101114]" />
      <i className="absolute inset-[7px] rounded-[18px] transition-[background] duration-1000 lg:inset-[9px] lg:rounded-[22px]" style={{ background: bg }} />
    </div>
  );
}

/* ================================================================== */
/* Everything below the hero: the new design                           */
/* ================================================================== */

function SecHead({ eyebrow, title, children }) {
  return (
    <div className="tc-sh tc-rv">
      <div>{eyebrow && <span className="tc-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
      {children}
    </div>
  );
}

function Ticker({ items }) {
  if (!items?.length) return null;
  const all = [...items, ...items, ...items];
  return (
    <div className="tc-tick" aria-hidden="true">
      <div className="tc-tick-t">{all.map((t, i) => <span key={i}><Icon name="check" />{t}</span>)}</div>
    </div>
  );
}

function Categories({ c }) {
  const cats = useFetch(() => api.get("/categories"));
  const list = (cats.data ?? []).filter((x) => x.showOnHome && x.productCount > 0).slice(0, Number(c.limit) || 4);
  if (!c.show || !list.length) return <span id="cat" />;
  return (
    <section id="cat" className="tc-sec">
      <div className="tc-wrap">
        <SecHead eyebrow={c.eyebrow} title={c.title}>
          <Link className="tc-vl" to="/products">{c.linkLabel} <Icon name="arrow" /></Link>
        </SecHead>
        <div className="tc-cats">
          {list.map((x) => (
            <Link key={x.id} className="tc-cat tc-rv" to={`/products?category=${x.slug}`}>
              <span className="ct"><Icon name={x.icon} /></span>
              <span>{x.name}<small>{x.subtitle || `${x.productCount} product${x.productCount === 1 ? "" : "s"}`}</small></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Popular({ c }) {
  const featured = useFetch(() => api.get(`/products?featured=1&limit=${Number(c.limit) || 8}`));
  const latest = useFetch(() => api.get(`/products?limit=${Number(c.limit) || 8}`));
  const list = featured.data?.length ? featured.data : latest.data ?? [];
  const track = useRef(null);
  const hover = useRef(false);

  const go = (dir) => {
    const t = track.current;
    if (!t?.firstElementChild) return;
    const step = t.firstElementChild.getBoundingClientRect().width + 24;
    const atEnd = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
    if (dir > 0 && atEnd) t.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && t.scrollLeft <= 2) t.scrollTo({ left: t.scrollWidth, behavior: "smooth" });
    else t.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  useEffect(() => {
    const id = setInterval(() => { if (!hover.current) go(1); }, 4500);
    return () => clearInterval(id);
  }, []);

  if (!c.show) return null;
  return (
    <section id="products" className="tc-sec" style={{ paddingTop: 8 }}>
      <div className="tc-wrap">
        <SecHead eyebrow={c.eyebrow} title={c.title}>
          <div className="tc-pc-nav">
            <button onClick={() => go(-1)} aria-label="Previous products"><Icon name="arrowLeft" /></button>
            <button onClick={() => go(1)} aria-label="Next products"><Icon name="arrow" /></button>
          </div>
        </SecHead>
        {featured.error && <ErrorBox message={featured.error} onRetry={featured.reload} />}
        <div className="tc-pc-track" ref={track} onPointerEnter={() => { hover.current = true; }} onPointerLeave={() => { hover.current = false; }}>
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function Deals({ c, store }) {
  const cats = useFetch(() => api.get("/categories"));
  const slug = useMemo(() => {
    const list = cats.data ?? [];
    if (list.some((x) => x.slug === c.categorySlug)) return c.categorySlug;
    return list.find((x) => x.icon === "phone" && x.productCount > 0)?.slug ?? "";
  }, [cats.data, c.categorySlug]);
  const products = useFetch(() => (slug ? api.get(`/products?category=${slug}`) : Promise.resolve([])), [slug]);

  const rows = (products.data ?? []).flatMap((p) => p.variants.map((v) => ({ p, v })))
    .sort((x, y) => y.v.price - x.v.price).slice(0, 12);
  const auto = (products.data ?? [])
    .map((p) => ({ label: `${p.name} from`, value: formatPKR(Math.min(...p.variants.map((v) => v.price))), min: Math.min(...p.variants.map((v) => v.price)) }))
    .sort((x, y) => x.min - y.min).slice(0, 3);
  const highlights = c.highlights?.length ? c.highlights : auto;

  if (!c.show || !rows.length) return <span id="deals" />;
  return (
    <section className="tc-deals" id="deals">
      <div className="tc-wrap">
        <div className="tc-dtop">
          <div className="tc-rv">
            <span className="tc-eyebrow iv">{c.eyebrow}</span>
            <h2>{c.title} <em>{c.titleHighlight}</em></h2>
            <p className="tc-lead-d">{c.text}</p>
            {highlights.length > 0 && (
              <div className="tc-best">{highlights.map((h) => <div key={h.label}><span>{h.label}</span><b>{h.value}</b></div>)}</div>
            )}
            <a className="tc-btn tc-btn-wa" href={waLink(store.whatsapp, `Hi ${store.name}, please send me today's price list`)} target="_blank" rel="noreferrer">{c.buttonLabel}</a>
          </div>
          <div className="tc-rate-wrap tc-rv">
            <div className="tc-rate-top"><h3>{c.tableTitle}</h3><span>{store.priceNote}</span></div>
            <div className="tc-rate-sc">
              <table className="tc-rate">
                <thead><tr><th>Model</th><th>Option</th><th>Price</th></tr></thead>
                <tbody>
                  {rows.map(({ p, v }) => (
                    <tr key={v.id}>
                      <td><span className="tc-sw" style={{ background: phoneColours(v.label)[0] }} /><Link to={`/products/${p.slug}`}>{p.name}</Link></td>
                      <td>{v.label === "Standard" ? "-" : v.label}</td>
                      <td><b>{formatPKR(v.price)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Why({ c }) {
  if (!c.show || !c.cards?.length) return null;
  return (
    <section className="tc-sec">
      <div className="tc-wrap">
        <SecHead eyebrow={c.eyebrow} title={c.title} />
        <div className="tc-wgrid">
          {c.cards.map((w) => (
            <div key={w.title} className="tc-spc tc-rv" data-spc>
              <div className="wi"><Icon name={w.icon} /></div>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
              {w.linkLabel && w.linkTo && <Link className="lk" to={w.linkTo}>{w.linkLabel}</Link>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const s = useSettings();
  const h = s.home;
  useSeo({ page: "home" });

  return (
    <>
      <style>{CSS}</style>
      <Hyperspeed />
      <Hero />
      <Ticker items={h.ticker} />
      <Categories c={h.categories} />
      <Popular c={h.popular} />
      <Deals c={h.deals} store={s.store} />
      <Why c={h.why} />
      {h.seo.show && h.seo.blocks?.length > 0 && (
        <section className="tc-sec white"><div className="tc-wrap"><SeoBlocks blocks={h.seo.blocks} /></div></section>
      )}
    </>
  );
}
