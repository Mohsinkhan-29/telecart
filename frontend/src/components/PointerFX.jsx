import { useEffect, useRef } from "react";

/**
 * Pointer effects for the whole storefront:
 *  - custom cursor: a small accent dot with a trailing ring (mouse only, can be turned off in Theme)
 *  - border glow on [data-bgc] cards: the edge nearest the pointer lights up
 *  - spotlight on [data-spc] cards: a soft light follows the pointer inside the card
 */
export default function PointerFX({ cursor = true, rootRef }) {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const root = rootRef?.current;
    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    const useCursor = cursor && fine;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    let mx = -1000, my = -1000, rx = -1000, ry = -1000, shown = false, dirty = true, raf = 0;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY; dirty = true;
      if (!useCursor || e.pointerType === "touch") return;
      if (!shown) { shown = true; rx = mx; ry = my; root?.classList.add("tc-cursor-on"); }
      dot.current?.classList.remove("tc-cur-hidden");
      ring.current?.classList.remove("tc-cur-hidden");
    };
    const onOut = (e) => {
      if (e.relatedTarget) return;
      mx = -1000; my = -1000; dirty = true;
      dot.current?.classList.add("tc-cur-hidden");
      ring.current?.classList.add("tc-cur-hidden");
    };
    const onScroll = () => { dirty = true; };

    const cards = () => {
      document.querySelectorAll("[data-bgc]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const hw = r.width / 2, hh = r.height / 2;
        if (!hw || !hh) return;
        const dx = mx - (r.left + hw), dy = my - (r.top + hh);
        const t = Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
        let e = t <= 1 ? clamp((t - 0.55) / 0.45, 0, 1) : clamp(1 - (t - 1) / 0.4, 0, 1);
        e = e * e * (3 - 2 * e);
        el.style.setProperty("--edge", e.toFixed(3));
        el.style.setProperty("--ang", `${(Math.atan2(dy, dx) * 180 / Math.PI + 90).toFixed(1)}deg`);
        el.style.setProperty("--mx", `${(mx - r.left).toFixed(0)}px`);
        el.style.setProperty("--my", `${(my - r.top).toFixed(0)}px`);
      });
      document.querySelectorAll("[data-spc]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const inside = mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
        el.style.setProperty("--mx", `${(mx - r.left).toFixed(0)}px`);
        el.style.setProperty("--my", `${(my - r.top).toFixed(0)}px`);
        el.style.setProperty("--sp", inside ? "1" : "0");
      });
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (useCursor && shown && dot.current && ring.current) {
        rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
        dot.current.style.transform = `translate3d(${mx}px,${my}px,0)`;
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      }
      if (dirty) { dirty = false; cards(); }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerout", onOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScroll);
      root?.classList.remove("tc-cursor-on");
    };
  }, [cursor, rootRef]);

  if (!cursor) return null;
  return (
    <>
      <div ref={dot} className="tc-cur-dot tc-cur-hidden" aria-hidden="true" />
      <div ref={ring} className="tc-cur-ring tc-cur-hidden" aria-hidden="true" />
    </>
  );
}
