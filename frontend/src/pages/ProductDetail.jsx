import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useSeo } from "../lib/seo";
import { CONDITION_LABELS, formatPKR } from "../lib/format";
import { waLink } from "../lib/whatsapp";
import { AccessoryArt, PhoneArt, phoneColours } from "../components/Art";
import ProductCard from "../components/ProductCard";
import Icon from "../components/Icon";
import { ErrorBox, Loading } from "../components/Status";

const isPhone = (p) => /phone|mobile/i.test(`${p.categoryIcon} ${p.categoryName}`) && !/cable|charg|hands/i.test(p.name);

function Gallery({ p, label }) {
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [p.id]);
  if (p.images.length) {
    return (
      <div>
        <div className="tc-gal"><img src={p.images[i]} alt={p.name} /></div>
        {p.images.length > 1 && (
          <div className="tc-thumbs">
            {p.images.map((src, k) => (
              <button key={src} className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}><img src={src} alt="" /></button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="tc-gal">
      {isPhone(p)
        ? <div className="tc-duo"><div className="b0"><PhoneArt front w={200} label={label} /></div><div className="b1"><PhoneArt w={230} label={label} /></div></div>
        : <AccessoryArt kind={`${p.categoryIcon} ${p.categoryName} ${p.name}`} size={260} />}
    </div>
  );
}

function Detail({ p }) {
  const s = useSettings();
  const { add } = useCart();
  const navigate = useNavigate();
  const [sel, setSel] = useState(() => (p.variants.find((v) => v.stock > 0) ?? p.variants[0])?.id);
  const [added, setAdded] = useState(false);
  const v = p.variants.find((x) => x.id === sel) ?? p.variants[0];
  const prices = p.variants.map((x) => x.price);
  const from = Math.min(...prices), to = Math.max(...prices);
  const related = useFetch(() => api.get(`/products?limit=24`), [p.id]);
  const sameCat = useFetch(() => api.get(`/products?category=${p.categorySlug}&limit=5`), [p.id]);
  const relatedList = (related.data ?? []).filter((x) => x.categoryId !== p.categoryId).slice(0, 4);
  const same = (sameCat.data ?? []).filter((x) => x.id !== p.id).slice(0, 4);

  const vars = {
    name: p.name, brand: p.brand, price: formatPKR(from),
    variants: p.variants.filter((x) => x.label !== "Standard").map((x) => x.label).join(", ") || p.categoryName,
  };
  useSeo({
    title: p.seoTitle || s.seo.productTitle, description: p.seoDescription || s.seo.productDescription, vars,
    jsonLd: {
      "@context": "https://schema.org", "@type": "Product", name: p.name, brand: { "@type": "Brand", name: p.brand },
      description: p.description || undefined, image: p.images.length ? p.images : undefined, category: p.categoryName,
      offers: { "@type": "AggregateOffer", priceCurrency: "PKR", lowPrice: from, highPrice: to, offerCount: p.variants.length,
        availability: p.variants.some((x) => x.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    },
  });

  if (!v) return null;
  const line = () => add({ variantId: v.id, productId: p.id, slug: p.slug, name: p.name, label: v.label, price: v.price,
    stock: v.stock, image: p.images[0], categoryName: p.categoryName, categoryIcon: p.categoryIcon });
  const variantText = v.label !== "Standard" ? ` (${v.label})` : "";
  const specs = Object.entries(p.specs || {});

  return (
    <>
      <section className="tc-sec" style={{ paddingTop: 36 }}>
        <div className="tc-wrap">
          <nav className="tc-crumb" aria-label="Breadcrumb" style={{ color: "var(--mute)" }}>
            <Link to="/">Home</Link><span>/</span>
            <Link to={`/products?category=${p.categorySlug}`}>{p.categoryName}</Link><span>/</span>
            <b style={{ color: "var(--ink)" }}>{p.name}</b>
          </nav>

          <div className="tc-pd">
            <Gallery p={p} label={v.label} />
            <div>
              <span className="tc-eyebrow">{p.brand} · {CONDITION_LABELS[p.condition]}</span>
              <h1>{p.name} price in Pakistan</h1>
              <div className="tc-price">{formatPKR(v.price)}{v.compareAtPrice > v.price && <s>{formatPKR(v.compareAtPrice)}</s>}</div>
              <p className="tc-pnote">{v.label !== "Standard" ? `${v.label}. ` : ""}Price in PKR. {s.store.priceNote}.</p>
              <div className={`tc-stock${v.stock > 0 ? "" : " out"}`}><i />{v.stock > 0 ? (v.stock <= 5 ? `Only ${v.stock} left` : "In stock") : "Out of stock"}</div>

              {p.variants.length > 1 && (
                <>
                  <h2 style={{ fontSize: 15, margin: "28px 0 14px" }}>Choose your option</h2>
                  <div role="group" aria-label="Choose option">
                    {p.variants.map((x) => (
                      <button key={x.id} className={`tc-vr${x.id === v.id ? " on" : ""}`} disabled={x.stock <= 0}
                        onClick={() => { setSel(x.id); setAdded(false); }}>
                        <span className="l"><span className="dotc" style={{ background: phoneColours(x.label)[0] }} />
                          <span>{x.label}<small>{x.stock > 0 ? "In stock" : "Out of stock"}</small></span></span>
                        <strong>{formatPKR(x.price)}</strong>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="tc-buy">
                <button className="tc-btn tc-btn-lime" disabled={v.stock <= 0} onClick={() => { line(); setAdded(true); }}>{added ? "Added to cart" : "Add to cart"}</button>
                <button className="tc-btn tc-btn-line" disabled={v.stock <= 0} onClick={() => { line(); navigate("/cart"); }}>Buy now</button>
                <a className="tc-btn tc-btn-wa" target="_blank" rel="noreferrer"
                  href={waLink(s.store.whatsapp, `Hi ${s.store.name}, I want the ${p.name}${variantText} at ${formatPKR(v.price)}. Is it available?`)}>
                  <Icon name="whatsapp" />Ask on WhatsApp
                </a>
              </div>

              <ul className="tc-bul">
                {p.warranty && <li><Icon name="shield" />Warranty: {p.warranty}</li>}
                <li><Icon name="check" />Price and availability confirmed with you on WhatsApp before dispatch</li>
                <li><Icon name="truck" />Delivery across Pakistan. See our <Link to="/delivery-returns" style={{ textDecoration: "underline", fontWeight: 700 }}>delivery and returns policy</Link></li>
              </ul>
            </div>
          </div>

          {(specs.length > 0 || p.description) && (
            <div className="tc-split" style={{ marginTop: 88, alignItems: "start" }}>
              {p.description && (
                <div className="tc-prose">
                  <h2>About the {p.name}</h2>
                  {p.description.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}
                </div>
              )}
              {specs.length > 0 && (
                <div>
                  <h2 style={{ fontSize: "clamp(22px,2.6vw,30px)", marginBottom: 22 }}>{p.name} specifications</h2>
                  <table className="tc-spec"><tbody>
                    {specs.map(([k, val]) => <tr key={k}><td>{k}</td><td>{val}</td></tr>)}
                    {v.label !== "Standard" && <tr><td>Selected option</td><td>{v.label}</td></tr>}
                    <tr><td>Price</td><td><b>{formatPKR(v.price)}</b></td></tr>
                  </tbody></table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {(same.length > 0 || relatedList.length > 0) && (
        <section className="tc-sec white">
          <div className="tc-wrap">
            {same.length > 0 && (
              <>
                <div className="tc-sh"><div><span className="tc-eyebrow">Compare</span><h2>More {p.categoryName.toLowerCase()}</h2></div></div>
                <div className="tc-pgrid" style={{ marginBottom: relatedList.length ? 64 : 0 }}>{same.map((x) => <ProductCard key={x.id} p={x} />)}</div>
              </>
            )}
            {relatedList.length > 0 && (
              <>
                <div className="tc-sh"><div><span className="tc-eyebrow">Complete your order</span><h2>You may also need</h2></div></div>
                <div className="tc-pgrid">{relatedList.map((x) => <ProductCard key={x.id} p={x} />)}</div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: p, error, loading, reload } = useFetch(() => api.get(`/products/${slug}`), [slug]);
  if (loading) return <div className="tc-wrap" style={{ padding: "60px 32px" }}><Loading /></div>;
  if (error) return <div className="tc-wrap" style={{ padding: "60px 32px" }}><ErrorBox message={error} onRetry={reload} /><Link to="/products" className="tc-vl">Back to shop</Link></div>;
  return <Detail key={p.id} p={p} />;
}
