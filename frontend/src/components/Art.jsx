/* Drawn product art, used when a product has no photo yet. */

const COLOURS = [
  [/white|silver|starlight/i, ["#eceef0", "#a9aeb6"]],
  [/orange|copper/i, ["#f4aa72", "#b4501a"]],
  [/blue|navy|teal/i, ["#8aa3cb", "#2b4066"]],
  [/natural|titanium|desert|gold|sand|beige/i, ["#d2ccc0", "#6e685b"]],
  [/green|sage|mint/i, ["#c3d2b6", "#56664b"]],
  [/pink|rose/i, ["#f1c7cf", "#a8606f"]],
  [/purple|lavender|violet/i, ["#c9bde0", "#5a4a7d"]],
  [/red/i, ["#e2726e", "#8a2622"]],
  [/grey|gray|graphite|space/i, ["#8d9098", "#33363c"]],
  [/black|midnight|onyx/i, ["#4a4d54", "#0f1012"]],
];

/** Colours for the drawn phone, taken from a variant label like "256GB · Blue · eSIM". */
export function phoneColours(text = "") {
  return COLOURS.find(([re]) => re.test(text))?.[1] ?? ["#6a6d73", "#15161a"];
}

export function PhoneArt({ w = 100, label = "", front = false, mark = "TC", style }) {
  const [c1, c2] = phoneColours(label);
  const vars = { "--w": `${w}px`, "--c1": c1, "--c2": c2, ...style };
  if (front) {
    return (
      <div className="tc-ph tc-fr" style={vars} aria-hidden="true">
        <div className="tc-sc"><i className="tc-isl" /><span className="tc-clk">10:08</span></div>
      </div>
    );
  }
  return (
    <div className="tc-ph" style={vars} aria-hidden="true">
      <i className="tc-bt" />
      <div className="tc-cm"><i className="tc-ln a" /><i className="tc-ln b" /><i className="tc-ln c" /><i className="tc-fl" /></div>
      <span className="tc-mk">{mark}</span>
    </div>
  );
}

export function AccessoryArt({ kind = "box", size = 110 }) {
  const k = /charg|adapter|power/i.test(kind) ? "charger" : /cable|wire|lead/i.test(kind) ? "cable" : /hands|head|ear|audio|buds/i.test(kind) ? "audio" : kind;
  return (
    <svg className="tc-art" viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      {k === "charger" && <>
        <rect x="32" y="28" width="56" height="70" rx="13" className="a1" />
        <rect x="32" y="74" width="56" height="24" rx="12" className="a2" />
        <rect x="47" y="12" width="9" height="18" rx="2.5" className="a2" />
        <rect x="64" y="12" width="9" height="18" rx="2.5" className="a2" />
        <rect x="50" y="50" width="20" height="9" rx="4.5" className="a4" />
      </>}
      {k === "cable" && <>
        <path d="M26 94C26 54 56 76 60 56S92 62 94 30" className="ao" />
        <rect x="14" y="90" width="26" height="16" rx="4" className="a1" />
        <rect x="82" y="14" width="26" height="16" rx="4" className="a1" />
        <rect x="20" y="98" width="14" height="5" rx="2" className="a4" />
      </>}
      {k === "audio" && <>
        <path d="M38 78C38 40 60 44 60 22C60 44 82 40 82 78" className="ao" />
        <rect x="29" y="76" width="18" height="26" rx="9" className="a1" />
        <rect x="73" y="76" width="18" height="26" rx="9" className="a1" />
        <circle cx="38" cy="98" r="3" className="a4" />
        <circle cx="82" cy="98" r="3" className="a4" />
      </>}
      {!["charger", "cable", "audio"].includes(k) && <>
        <rect x="26" y="30" width="68" height="60" rx="12" className="a1" />
        <path d="M26 50h68" className="ao" style={{ strokeWidth: 3 }} />
        <rect x="52" y="44" width="16" height="12" rx="3" className="a4" />
      </>}
    </svg>
  );
}

/** Photo if the product has one, otherwise drawn art based on its category. */
export function ProductVisual({ product, variantLabel, w = 100, size = 110 }) {
  if (product.images?.[0]) return <img src={product.images[0]} alt={product.name} className="tc-pimg" loading="lazy" />;
  const kind = `${product.categoryIcon || ""} ${product.categoryName || ""} ${product.name || ""}`;
  if (/phone|mobile|iphone|galaxy|pixel/i.test(kind) && !/cable|charg|hands/i.test(product.name)) {
    return <PhoneArt w={w} label={variantLabel ?? product.variants?.[0]?.label ?? product.name} />;
  }
  return <AccessoryArt kind={kind} size={size} />;
}
