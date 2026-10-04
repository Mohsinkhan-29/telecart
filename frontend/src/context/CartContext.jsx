import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);
const KEY = "telecart-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ } }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.qty * i.price, 0),
    add: (item, qty = 1) => setItems((cur) => {
      const max = Math.max(1, item.stock);
      const found = cur.find((c) => c.variantId === item.variantId);
      if (found) return cur.map((c) => (c.variantId === item.variantId ? { ...c, ...item, qty: Math.min(max, c.qty + qty) } : c));
      return [...cur, { ...item, qty: Math.min(max, qty) }];
    }),
    setQty: (id, qty) => setItems((cur) => cur.map((c) => (c.variantId === id ? { ...c, qty: Math.max(1, Math.min(c.stock || 1, qty)) } : c))),
    remove: (id) => setItems((cur) => cur.filter((c) => c.variantId !== id)),
    clear: () => setItems([]),
  }), [items]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
export const useCart = () => useContext(CartCtx);
