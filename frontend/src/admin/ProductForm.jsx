import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetch } from "../lib/useFetch";
import { specsToText } from "../lib/format";
import { ErrorBox, Loading } from "../components/Status";
import { adminApi, imgUrl } from "../lib/api";

const blankVariant = () => ({ label: "", sku: "", price: "", compareAtPrice: "", stock: "0" });
const EMPTY = {
  name: "", brand: "", categoryId: "", description: "", condition: "NEW", warranty: "", specs: "", images: "",
  isActive: true, isFeatured: false, seoTitle: "", seoDescription: "", variants: [{ ...blankVariant(), label: "Standard" }]
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cats = useFetch(() => adminApi.get("/categories"));
  const existing = useFetch(() => (id ? adminApi.get(`/products/${id}`) : Promise.resolve(null)), [id]);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setF({
      name: p.name, brand: p.brand, categoryId: p.categoryId, description: p.description, condition: p.condition,
      warranty: p.warranty ?? "", specs: specsToText(p.specs), images: p.images.join("\n"), isActive: p.isActive, isFeatured: p.isFeatured,
      seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
      variants: p.variants.map((v) => ({ id: v.id, label: v.label, sku: v.sku ?? "", price: String(v.price), compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "", stock: String(v.stock) })),
    });
  }, [existing.data]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setVar = (i, k, v) => setF((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets you pick the same file again
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Image must be under 5 MB.");
    setUploading(true); setError(null);
    try {
      const { url } = await adminApi.upload(file);
      setF((s) => ({ ...s, images: s.images ? `${s.images}\n${url}` : url }));
    } catch (err) { setError(err.message); }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault(); setBusy(true); setError(null);
    const body = {
      name: f.name, brand: f.brand, categoryId: Number(f.categoryId), description: f.description, condition: f.condition,
      warranty: f.warranty || null, specs: f.specs, images: f.images, isActive: f.isActive, isFeatured: f.isFeatured,
      seoTitle: f.seoTitle || null, seoDescription: f.seoDescription || null,
      variants: f.variants.map((v) => ({
        id: v.id, label: v.label, sku: v.sku || null, price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null, stock: Number(v.stock || 0),
      })),
    };
    try {
      if (id) await adminApi.put(`/products/${id}`, body); else await adminApi.post("/products", body);
      navigate("/admin/catalog");
    } catch (err) { setError(err.message); setBusy(false); }
  }

  if (id && existing.loading) return <Loading />;
  if (existing.error) return <ErrorBox message={existing.error} />;
  const images = f.images.split("\n").filter(Boolean);

  return (
    <div>
      <h1 className="text-3xl mb-6">{id ? "Edit product" : "New product"}</h1>
      <form onSubmit={save} className="space-y-5 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Name</label><input required className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label className="label">Brand</label><input required className="input" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></div>
          <div><label className="label">Category</label>
            <select required className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Select…</option>{(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Condition</label>
            <select className="input" value={f.condition} onChange={(e) => set("condition", e.target.value)}>
              <option value="NEW">New</option><option value="OPEN_BOX">Open box</option><option value="USED">Used</option>
            </select></div>
          <div><label className="label">Warranty</label><input className="input" placeholder="e.g. 1 year" value={f.warranty} onChange={(e) => set("warranty", e.target.value)} /></div>
        </div>
        <div><label className="label">Description</label><textarea rows={3} className="input" value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div><label className="label">Specs (one per line, Key: Value)</label><textarea rows={5} className="input font-mono text-xs" placeholder={'Display: 6.5" AMOLED\nBattery: 5000 mAh'} value={f.specs} onChange={(e) => set("specs", e.target.value)} /></div>

        <div>
          <label className="label" htmlFor="pf-image">Product images</label>
          <input id="pf-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input"
            disabled={uploading} onChange={uploadImage} />
          {uploading && <p className="text-xs text-chrome mt-1">Uploading…</p>}
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div key={src} className="text-center">
                  <img src={imgUrl(src)} alt={`${f.name || "Product"} photo ${i + 1}`}
                    className="w-28 h-28 object-contain rounded border border-steel-line bg-white p-2" />
                  <button type="button" className="text-xs text-chrome hover:text-danger mt-1"
                    onClick={() => set("images", images.filter((_, j) => j !== i).join("\n"))}>
                    {i === 0 ? "Remove (main)" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-chrome mt-1">JPG, PNG, WEBP or GIF, up to 5 MB. The first image is the main photo. No photo? Phones get a drawn phone in the colour named in the variant label.</p>
        </div>

        <details className="spec-plate" open={!!(f.seoTitle || f.seoDescription)}>
          <summary className="cursor-pointer text-sm font-display uppercase tracking-wide">Search engine (SEO) — optional</summary>
          <div className="space-y-3 mt-4">
            <div><label className="label">SEO title</label><input className="input" maxLength={120} placeholder="Leave empty to use: {name} Price in Pakistan | Store" value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></div>
            <div><label className="label">SEO description</label><textarea rows={2} maxLength={320} className="input" value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
              <p className="text-xs text-chrome mt-1">Empty uses the template in Site content → SEO. Placeholders: {"{name} {brand} {price} {variants} {shop}"}.</p></div>
          </div>
        </details>

        <div className="spec-plate space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm">Variants — price &amp; stock</h3>
            <button type="button" className="text-xs text-amber" onClick={() => setF((s) => ({ ...s, variants: [...s.variants, blankVariant()] }))}>+ Add variant</button>
          </div>
          {f.variants.map((v, i) => (
            <div key={v.id ?? `n${i}`} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-end">
              <div className="col-span-2 sm:col-span-1"><label className="label text-xs">Label</label><input required className="input py-1.5" placeholder="256GB · Blue · eSIM" value={v.label} onChange={(e) => setVar(i, "label", e.target.value)} /></div>
              <div><label className="label text-xs">Price</label><input required type="number" min={0} className="input py-1.5" value={v.price} onChange={(e) => setVar(i, "price", e.target.value)} /></div>
              <div><label className="label text-xs">Was</label><input type="number" min={0} className="input py-1.5" value={v.compareAtPrice} onChange={(e) => setVar(i, "compareAtPrice", e.target.value)} /></div>
              <div><label className="label text-xs">Stock</label><input required type="number" min={0} className="input py-1.5" value={v.stock} onChange={(e) => setVar(i, "stock", e.target.value)} /></div>
              <div><label className="label text-xs">SKU</label><input className="input py-1.5" value={v.sku} onChange={(e) => setVar(i, "sku", e.target.value)} /></div>
              <button type="button" disabled={f.variants.length === 1} onClick={() => setF((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i) }))} className="text-chrome hover:text-danger pb-2 disabled:opacity-30" aria-label="Remove variant">✕</button>
            </div>
          ))}
        </div>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Visible in store</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Featured on home</label>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button className="btn btn-primary" disabled={busy || uploading}>{busy ? "Saving…" : id ? "Save changes" : "Create product"}</button>
      </form>
    </div>
  );
}