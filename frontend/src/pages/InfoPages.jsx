import { useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useSeo } from "../lib/seo";
import { waLink } from "../lib/whatsapp";
import { PageHead } from "../components/PageHead";
import RichText from "../components/RichText";
import { BrandMark } from "../components/Navbar";
import Icon from "../components/Icon";

function VisitDetails({ st }) {
  const rows = [
    ["Address", st.address], ["Hours", st.hours], ["WhatsApp", st.whatsapp], ["Phone", st.phone],
  ].filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <div style={{ display: "flex", gap: "28px 40px", flexWrap: "wrap", marginBottom: 28, color: "#e6e7ea", fontWeight: 500, lineHeight: 1.7 }}>
      {rows.map(([k, v]) => <div key={k}><div className="tc-fh" style={{ marginBottom: 6 }}>{k}</div>{v}</div>)}
    </div>
  );
}

export function About() {
  const s = useSettings();
  const a = s.about, st = s.store;
  useSeo({ page: "about" });
  return (
    <>
      <PageHead crumbs={[{ label: a.eyebrow }]} title={a.title} intro={a.intro} />
      <section className="tc-sec">
        <div className="tc-wrap">
          <div className="tc-split">
            <div className="tc-prose tc-rv">
              <h2>{a.storyTitle}</h2>
              <RichText text={a.story} />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                <Link className="tc-btn tc-btn-lime" to="/products">Shop now</Link>
                <Link className="tc-btn tc-btn-line" to="/contact">Talk to us</Link>
              </div>
            </div>
            <div className="tc-rv" style={{ display: "flex", justifyContent: "center" }}>
              <div className="tc-logo-tile"><BrandMark size={150} /></div>
            </div>
          </div>
        </div>
      </section>

      {a.steps?.length > 0 && (
        <section className="tc-sec white">
          <div className="tc-wrap">
            <div className="tc-sh tc-rv"><div><span className="tc-eyebrow">Simple and safe</span><h2>{a.stepsTitle}</h2></div></div>
            <div className="tc-steps4">
              {a.steps.map((x) => <div key={x.title} className="tc-st tc-rv"><h3>{x.title}</h3><p>{x.text}</p></div>)}
            </div>
          </div>
        </section>
      )}

      {a.values?.length > 0 && (
        <section className="tc-sec">
          <div className="tc-wrap">
            <div className="tc-sh tc-rv"><div><span className="tc-eyebrow">Our values</span><h2>{a.valuesTitle}</h2></div></div>
            <div className="tc-wgrid">
              {a.values.map((w) => (
                <div key={w.title} className="tc-spc tc-rv" data-spc>
                  <div className="wi"><Icon name={w.icon} /></div><h3>{w.title}</h3><p>{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="tc-sec" style={{ paddingTop: 0 }}>
        <div className="tc-wrap">
          <div className="tc-quote tc-rv">
            <h2>{a.visitTitle}</h2>
            <p>{a.visitText}</p>
            <VisitDetails st={st} />
            <a className="tc-btn tc-btn-wa" href={waLink(st.whatsapp, `Hi ${st.name}, I want to place an order`)} target="_blank" rel="noreferrer">Order on WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
}

export function Contact() {
  const s = useSettings();
  const c = s.contact, st = s.store;
  useSeo({ page: "contact" });
  const [f, setF] = useState({ name: "", phone: "", msg: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const text = `Hi ${st.name}${f.name ? `, this is ${f.name}` : ""}. ${f.msg}${f.phone ? ` (Contact: ${f.phone})` : ""}`;

  const cards = [
    st.whatsapp && { icon: "whatsapp", title: "WhatsApp", body: <a href={waLink(st.whatsapp)} target="_blank" rel="noreferrer">{st.whatsapp}</a>, note: "Fastest way to get a price or place an order." },
    st.phone && { icon: "call", title: "Phone", body: <a href={`tel:${st.phone.replace(/[^\d+]/g, "")}`}>{st.phone}</a> },
    st.email && { icon: "mail", title: "Email", body: <a href={`mailto:${st.email}`}>{st.email}</a> },
    st.address && { icon: "pin", title: "Store address", body: st.address },
    st.hours && { icon: "clock", title: "Opening hours", body: st.hours },
    (st.instagram || st.facebook) && { icon: "instagram", title: "Social", body: <>
      {st.instagram && <a href={st.instagram} target="_blank" rel="noreferrer">Instagram</a>}
      {st.instagram && st.facebook && <br />}
      {st.facebook && <a href={st.facebook} target="_blank" rel="noreferrer">Facebook</a>}
    </> },
  ].filter(Boolean);

  return (
    <>
      <PageHead crumbs={[{ label: "Contact" }]} title={c.title} intro={c.intro} />
      <section className="tc-sec" style={{ paddingTop: 56 }}>
        <div className="tc-wrap">
          <div className="tc-split" style={{ alignItems: "start" }}>
            <div className="tc-spc" data-spc style={{ padding: "40px 36px", display: "grid", gap: 30 }}>
              {cards.length === 0 && <p>Add your WhatsApp number, address and hours in Admin → Site content → Store details.</p>}
              {cards.map((x) => (
                <div key={x.title} className="tc-crd">
                  <div className="wi"><Icon name={x.icon} /></div>
                  <div><h3>{x.title}</h3><p>{x.body}{x.note && <><br />{x.note}</>}</p></div>
                </div>
              ))}
            </div>
            <form className="tc-panel" onSubmit={(e) => { e.preventDefault(); window.open(waLink(st.whatsapp, text), "_blank", "noopener"); }}>
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>{c.formTitle}</h2>
              <p style={{ color: "var(--mute)", marginBottom: 26, lineHeight: 1.6 }}>{c.formText}</p>
              <div className="tc-fld"><label htmlFor="ct-name">Your name</label><input id="ct-name" required value={f.name} onChange={set("name")} /></div>
              <div className="tc-fld"><label htmlFor="ct-phone">Mobile number</label><input id="ct-phone" type="tel" placeholder="03XX XXXXXXX" value={f.phone} onChange={set("phone")} /></div>
              <div className="tc-fld"><label htmlFor="ct-msg">What do you need?</label><textarea id="ct-msg" required placeholder="e.g. Price and availability of iPhone 17 Pro Max 256GB Blue eSIM?" value={f.msg} onChange={set("msg")} /></div>
              <button className="tc-btn tc-btn-wa"><Icon name="whatsapp" />Send on WhatsApp</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export function Policies() {
  const p = useSettings().policies;
  useSeo({ page: "policies" });
  return (
    <>
      <PageHead crumbs={[{ label: "Delivery and returns" }]} title={p.title} intro={p.intro} />
      <section className="tc-sec" style={{ paddingTop: 56 }}>
        <div className="tc-wrap">
          <div className="tc-prose">
            {p.sections.map((x) => <div key={x.title}><h2>{x.title}</h2><RichText text={x.body} /></div>)}
            <h2>Need help?</h2>
            <p>Message us on <Link to="/contact">WhatsApp</Link>. Ready to order? Browse the <Link to="/products">best mobiles and accessories</Link>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
