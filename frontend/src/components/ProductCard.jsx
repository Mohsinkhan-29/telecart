import { Link } from "react-router-dom";
import { formatPKR, CONDITION_LABELS } from "../lib/format";
import { useCart } from "../context/CartContext";
import { ProductVisual } from "./Art";
import Icon from "./Icon";

/** Dark card with the border-glow effect (see PointerFX). */
export default function ProductCard({ p }) {
  const { add } = useCart();
  const prices = p.variants.map((v) => v.price);
  const from = prices.length ? Math.min(...prices) : 0;
  const cheapest = p.variants.find((v) => v.price === from) ?? p.variants[0];
  const inStock = p.variants.some((v) => v.stock > 0);
  const firstInStock = p.variants.find((v) => v.stock > 0);
  const tags = [...new Set(p.variants.flatMap((v) => (v.label === "Standard" ? [] : v.label.split("·").map((x) => x.trim()))))].slice(0, 3);

  const quickAdd = () => {
    if (!firstInStock) return;
    add({ variantId: firstInStock.id, productId: p.id, slug: p.slug, name: p.name, label: firstInStock.label,
      price: firstInStock.price, stock: firstInStock.stock, image: p.images[0], categoryName: p.categoryName, categoryIcon: p.categoryIcon });
  };

  return (
    <div className="tc-bgc" data-bgc>
      <div className="tc-bgc-in">
        <Link to={`/products/${p.slug}`} className="tc-pstage" aria-label={p.name} tabIndex={-1}>
          <ProductVisual product={p} variantLabel={cheapest?.label} />
        </Link>
        <div className="tc-pbody">
          <span className="tc-pbrand">{p.brand}{p.condition !== "NEW" ? ` · ${CONDITION_LABELS[p.condition]}` : ""}</span>
          <h3 className="tc-pname"><Link to={`/products/${p.slug}`}>{p.name}</Link></h3>
          <div className="tc-tags">
            {!inStock && <span className="tc-tag warn">Out of stock</span>}
            {tags.map((t, i) => <span key={t} className={`tc-tag${i === 0 && inStock ? " hi" : ""}`}>{t}</span>)}
          </div>
          <div className="tc-prow">
            <div>
              <small>{prices.length > 1 ? "From" : "Price"}</small>
              <strong>{formatPKR(from)}</strong>
              {cheapest?.compareAtPrice > from && <s>{formatPKR(cheapest.compareAtPrice)}</s>}
            </div>
            {p.variants.length > 1
              ? <Link className="tc-cb" to={`/products/${p.slug}`} aria-label={`Choose options for ${p.name}`}><Icon name="arrow" /></Link>
              : <button className="tc-cb" onClick={quickAdd} disabled={!inStock} aria-label={`Add ${p.name} to cart`}><Icon name="cart" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
