import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useSettings } from "../context/SettingsContext";
import { waLink } from "../lib/whatsapp";
import { BrandMark, BrandName } from "./Navbar";
import Icon from "./Icon";

function Newsletter({ f }) {
  const [state, setState] = useState({ busy: false, msg: null, ok: false });
  async function submit(e) {
    e.preventDefault();
    const email = new FormData(e.target).get("email");
    setState({ busy: true, msg: null, ok: false });
    try {
      await api.post("/subscribe", { email });
      e.target.reset();
      setState({ busy: false, msg: "Thanks, you're on the list.", ok: true });
    } catch (err) { setState({ busy: false, msg: err.message, ok: false }); }
  }
  return (
    <div className="tc-nl">
      <div>
        <span className="tc-eyebrow iv">{f.newsletterEyebrow}</span>
        <h3>{f.newsletterTitle}</h3>
        <p>{f.newsletterText}</p>
      </div>
      <form className="tc-nlf" onSubmit={submit}>
        <label className="tc-vh" htmlFor="tc-nl-email">Email address</label>
        <input id="tc-nl-email" name="email" type="email" required placeholder="Enter your email" />
        <button className="tc-btn tc-btn-lime" disabled={state.busy}>{state.busy ? "Saving…" : "Subscribe"}</button>
        {state.msg && <p style={{ color: state.ok ? "var(--lime)" : "#ff9c86" }}>{state.msg}</p>}
      </form>
    </div>
  );
}

export default function Footer() {
  const s = useSettings();
  const cats = useFetch(() => api.get("/categories"));
  const f = s.footer, st = s.store;
  const shopCats = (cats.data ?? []).filter((c) => c.productCount > 0).slice(0, 6);

  return (
    <footer className="tc-foot">
      <div className="tc-wrap">
        {f.newsletterShow && <Newsletter f={f} />}
        <div className="tc-fgrid">
          <div>
            <Link to="/" className="tc-brand" style={{ color: "#fff" }}><BrandMark /><BrandName name={st.name} /></Link>
            <p className="about">{f.about}</p>
            <div className="tc-soc">
              {st.facebook && <a href={st.facebook} target="_blank" rel="noreferrer" aria-label={`${st.name} on Facebook`}><Icon name="facebook" /></a>}
              {st.instagram && <a href={st.instagram} target="_blank" rel="noreferrer" aria-label={`${st.name} on Instagram`}><Icon name="instagram" /></a>}
              <a href={waLink(st.whatsapp, `Hi ${st.name}`)} target="_blank" rel="noreferrer" aria-label={`${st.name} on WhatsApp`}><Icon name="whatsapp" /></a>
            </div>
          </div>
          <div className="tc-fcol">
            <div className="tc-fh">Shop</div>
            <Link to="/products">All products</Link>
            {shopCats.map((c) => <Link key={c.id} to={`/products?category=${c.slug}`}>{c.name}</Link>)}
            <Link to="/cart">Your cart</Link>
          </div>
          <div className="tc-fcol">
            <div className="tc-fh">Help</div>
            <Link to="/about">About us</Link>
            <Link to="/delivery-returns">Delivery and returns</Link>
            <Link to="/contact">Contact us</Link>
          </div>
          <div className="tc-fcol">
            <div className="tc-fh">Popular searches</div>
            {f.popularSearches.map((l) => <Link key={l.label + l.to} to={l.to}>{l.label}</Link>)}
          </div>
          <div className="tc-fcol">
            <div className="tc-fh">Visit and contact</div>
            {st.address && <div className="row"><Icon name="pin" />{st.address}</div>}
            {st.phone && <a href={`tel:${st.phone.replace(/[^\d+]/g, "")}`}><Icon name="call" />{st.phone}</a>}
            {st.whatsapp && <a href={waLink(st.whatsapp)} target="_blank" rel="noreferrer"><Icon name="whatsapp" />{st.whatsapp}</a>}
            {st.email && <a href={`mailto:${st.email}`}><Icon name="mail" />{st.email}</a>}
            {st.hours && <div className="row"><Icon name="clock" />{st.hours}</div>}
            <Link to="/contact">Get in touch</Link>
          </div>
        </div>
        <div className="tc-fbot">
          <span>© {new Date().getFullYear()} {st.name}. All rights reserved.</span>
          <span>{st.priceNote}</span>
        </div>
      </div>
    </footer>
  );
}
