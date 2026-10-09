import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useSettings } from "../context/SettingsContext";
import { useSeo } from "../lib/seo";
import ProductCard from "../components/ProductCard";
import { PageHead, SeoBlocks } from "../components/PageHead";
import { ErrorBox, Loading } from "../components/Status";

import { imgUrl } from "../lib/api";

const SORTS = [["", "Newest"], ["low", "Price: low to high"], ["high", "Price: high to low"]];
const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));

export default function Products() {
  const s = useSettings();
  const [sp, setSp] = useSearchParams();
  const category = sp.get("category") || "", brand = sp.get("brand") || "", q = sp.get("q") || "", sort = sp.get("sort") || "";
  const qs = new URLSearchParams(Object.entries({ category, brand, q }).filter(([, v]) => v)).toString();
  const products = useFetch(() => api.get(`/products${qs ? `?${qs}` : ""}`), [qs]);
  const cats = useFetch(() => api.get("/categories"));
  const brands = useFetch(() => api.get("/brands"));
  const cat = (cats.data ?? []).find((c) => c.slug === category);

  const update = (patch) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    setSp(next);
  };

  const list = useMemo(() => {
    const l = [...(products.data ?? [])];
    if (sort === "low") l.sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === "high") l.sort((a, b) => minPrice(b) - minPrice(a));
    return l;
  }, [products.data, sort]);

  const sh = s.shop;
  const title = cat ? `${cat.name} price in Pakistan` : q ? `Results for "${q}"` : sh.title;
  const highlight = cat ? "" : q ? "" : sh.titleHighlight;
  useSeo(cat
    ? { title: `${cat.name} Price in Pakistan | {shop}`, description: `${cat.name} prices in Pakistan${cat.subtitle ? `: ${cat.subtitle}` : ""}. Buy online from {shop} and order on WhatsApp.` }
    : { page: "products" });

  const chip = (on) => `tc-chip${on ? " on" : ""}`;

  return (
    <>
      <PageHead crumbs={cat ? [{ label: sh.eyebrow, to: "/products" }, { label: cat.name }] : [{ label: sh.eyebrow }]}
        title={title} highlight={highlight} intro={cat?.subtitle ? `${cat.subtitle}. ${sh.intro}` : sh.intro} />

      <section className="tc-sec" style={{ paddingTop: 56 }}>
        <div className="tc-wrap">
          <div className="tc-shop">
            <aside className="tc-filt" aria-label="Filters">
              <div className="tc-fg">
                <h3>Search</h3>
                <form className="tc-search" onSubmit={(e) => { e.preventDefault(); update({ q: new FormData(e.target).get("q").trim() }); }}>
                  <label className="tc-vh" htmlFor="tc-q">Search products</label>
                  <input id="tc-q" name="q" defaultValue={q} key={q} placeholder="e.g. iPhone 16" className="tc-input" />
                </form>
              </div>
              <div className="tc-fg">
                <h3>Category</h3>
                <div className="tc-chiprow">
                  <button className={chip(!category)} onClick={() => update({ category: "" })}>All</button>
                  {(cats.data ?? []).filter((c) => c.productCount > 0).map((c) => (
                    <button key={c.id} className={chip(category === c.slug)} onClick={() => update({ category: c.slug })}>{c.name}</button>
                  ))}
                </div>
              </div>
              {(brands.data ?? []).length > 1 && (
                <div className="tc-fg">
                  <h3>Brand</h3>
                  <div className="tc-chiprow">
                    {brands.data.map((b) => <button key={b} className={chip(brand === b)} onClick={() => update({ brand: brand === b ? "" : b })}>{b}</button>)}
                  </div>
                </div>
              )}
              <div className="tc-fg">
                <h3>Sort by</h3>
                <div className="tc-chiprow">
                  {SORTS.map(([k, l]) => <button key={k} className={chip(sort === k)} onClick={() => update({ sort: k })}>{l}</button>)}
                </div>
              </div>
            </aside>

            <div>
              {products.loading && <Loading />}
              {products.error && <ErrorBox message={products.error} onRetry={products.reload} />}
              {products.data && (
                <>
                  <div className="tc-lhead"><span>Showing <b>{list.length}</b> product{list.length === 1 ? "" : "s"}</span><span>Prices in PKR</span></div>
                  {list.length === 0
                    ? <div className="tc-empty"><p>No products match. Try another category or search.</p></div>
                    : <div className="tc-pgrid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {sh.seoBlocks?.length > 0 && (
        <section className="tc-sec white"><div className="tc-wrap"><SeoBlocks blocks={sh.seoBlocks} /></div></section>
      )}
    </>
  );
}
