import { useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useSeo } from "../lib/seo";
import { formatPKR } from "../lib/format";
import { AccessoryArt, PhoneArt } from "../components/Art";
import { PageHead } from "../components/PageHead";

const CITIES = ["Karachi", "Lahore", "Islamabad / Rawalpindi", "Faisalabad", "Hyderabad", "Multan", "Peshawar", "Other city"];

function Thumb({ i }) {
  if (i.image) return <img src={imgUrl(i.image)} alt="" />;
  const kind = `${i.categoryIcon || ""} ${i.categoryName || ""} ${i.name}`;
  if (/phone|mobile|iphone/i.test(kind) && !/cable|charg|hands/i.test(i.name)) return <PhoneArt w={40} label={i.label} mark="" />;
  return <AccessoryArt kind={kind} size={64} />;
}

export default function Cart() {
  useSeo({ page: "cart" });
  const { items, total, count, setQty, remove, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", city: CITIES[0], address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function checkout(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    const note = [form.city && `City: ${form.city}`, form.address && `Address: ${form.address}`, form.note].filter(Boolean).join("\n");
    try {
      const { waUrl } = await api.post("/orders", { name: form.name, phone: form.phone, note: note.slice(0, 500), items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })) });
      clear();
      window.location.href = waUrl; // opens WhatsApp with the order pre-filled
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  }

  return (
    <>
      <PageHead crumbs={[{ label: "Cart" }]} title="Your" highlight="cart"
        intro="Check your items, add your details and send the order to us on WhatsApp. We confirm price, availability and delivery before anything is dispatched." />
      <section className="tc-sec" style={{ paddingTop: 56 }}>
        <div className="tc-wrap">
          {items.length === 0 ? (
            <div className="tc-empty">
              <h2 style={{ fontSize: 24, marginBottom: 12 }}>Your cart is empty</h2>
              <p style={{ color: "var(--mute)", marginBottom: 24 }}>Browse the latest phones and accessories and add what you like.</p>
              <Link to="/products" className="tc-btn tc-btn-lime">Browse products</Link>
            </div>
          ) : (
            <div className="tc-cart">
              <div>
                {items.map((i) => (
                  <div key={i.variantId} className="tc-crow">
                    <div className="tc-cthumb" aria-hidden="true"><Thumb i={i} /></div>
                    <div>
                      <h3><Link to={`/products/${i.slug}`}>{i.name}</Link></h3>
                      <div className="meta">{i.label !== "Standard" ? `${i.label} · ` : ""}{formatPKR(i.price)} each</div>
                      <button className="tc-rm" onClick={() => remove(i.variantId)}>Remove</button>
                    </div>
                    <div className="tc-qty">
                      <button onClick={() => setQty(i.variantId, i.qty - 1)} disabled={i.qty <= 1} aria-label={`Decrease quantity of ${i.name}`}>−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.variantId, i.qty + 1)} disabled={i.qty >= i.stock} aria-label={`Increase quantity of ${i.name}`}>+</button>
                    </div>
                    <div className="tc-lp">{formatPKR(i.price * i.qty)}</div>
                  </div>
                ))}
                <Link className="tc-vl" to="/products" style={{ marginTop: 12 }}>Continue shopping</Link>
              </div>

              <form className="tc-sum" onSubmit={checkout} aria-label="Checkout">
                <h2>Order summary</h2>
                <div className="tc-sl"><span>Items ({count})</span><b>{formatPKR(total)}</b></div>
                <div className="tc-sl"><span>Delivery</span><b>Confirmed on WhatsApp</b></div>
                <div className="tc-sl t" style={{ marginBottom: 22 }}><span>Total</span><b>{formatPKR(total)}</b></div>

                <div className="tc-fld"><label htmlFor="c-name">Full name</label><input id="c-name" required minLength={2} value={form.name} onChange={set("name")} /></div>
                <div className="tc-fld"><label htmlFor="c-phone">Mobile / WhatsApp number</label><input id="c-phone" required type="tel" placeholder="03XX XXXXXXX" value={form.phone} onChange={set("phone")} /></div>
                <div className="tc-fld"><label htmlFor="c-city">City</label>
                  <select id="c-city" value={form.city} onChange={set("city")}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="tc-fld"><label htmlFor="c-addr">Delivery address</label><textarea id="c-addr" rows={3} placeholder="House / flat, street, area" value={form.address} onChange={set("address")} /></div>
                <div className="tc-fld"><label htmlFor="c-note">Order notes (optional)</label><input id="c-note" value={form.note} onChange={set("note")} placeholder="e.g. call before delivery" /></div>

                {error && <p className="tc-msg err" style={{ marginBottom: 12 }}>{error}</p>}
                <button className="tc-btn tc-btn-wa tc-btn-block" disabled={busy}>{busy ? "Placing order…" : "Order on WhatsApp"}</button>
                <p style={{ color: "var(--mute-i)", fontSize: 13, lineHeight: 1.6, marginTop: 14 }}>We save your order, then open WhatsApp with it pre-filled. Send the message to confirm. No payment is taken here.</p>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}