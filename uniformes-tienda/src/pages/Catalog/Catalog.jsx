import React, { useState } from "react";
import LogoBox from "../../components/ui/LogoBox";
import { COP } from "../../utils/money";

const safeCSSColor = (color) => {
  if (typeof color !== "string") return "#4a2510";
  const trimmed = color.trim();
  const allowed = /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\([^)]{0,60}\)|hsl\([^)]{0,60}\)|hsla\([^)]{0,60}\)|[a-zA-Z]{2,30})$/;
  return allowed.test(trimmed) ? trimmed : "#4a2510";
};

const safeSrc = (src) => {
  if (!src || typeof src !== "string") return null;
  if (
    src.startsWith("data:image/") ||
    src.startsWith("https://") ||
    src.startsWith("http://") ||
    src.startsWith("/") ||
    src.startsWith("blob:")
  ) return src;
  return null;
};

export default function Catalog({ college, cart, setCart, onCheckout, onBack, collegeStock, discounts = {} }) {
  const [filter, setFilter]   = useState("Todos");
  const [sizes,  setSizes]    = useState({});
  const [flash,  setFlash]    = useState({});

  const cats      = ["Todos", ...new Set(college.uniforms.map(u => u.category))];
  const items     = filter === "Todos" ? college.uniforms : college.uniforms.filter(u => u.category === filter);
  const cartQty   = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const P = safeCSSColor(college.primaryColor);

  const getDiscountPct = (uid) => Math.max(0, Math.min(90, Number(discounts?.[String(uid)]) || 0));
  const getFinalPrice  = (u)   => {
    const pct = getDiscountPct(u.id);
    return pct > 0 ? Math.round(u.price * (1 - pct / 100)) : u.price;
  };

  const addToCart = (u) => {
    const size = sizes[u.id];
    if (!size || !Array.isArray(u.sizes) || !u.sizes.includes(size)) return;
    const stockQty = collegeStock?.[String(u.id)]?.[size] ?? null;
    if (stockQty === 0) return;
    const finalPrice = getFinalPrice(u);
    setCart(prev => {
      const ex = prev.find(i => i.id === u.id && i.size === size);
      if (ex) return prev.map(i => i.id === u.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: u.id, name: u.name, price: finalPrice, size, qty: 1 }];
    });

    const key = `${u.id}-${size}`;
    setFlash(f => ({ ...f, [key]: true }));
    setTimeout(() => setFlash(f => ({ ...f, [key]: false })), 900);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "#fafaf9" }}>
      <style>{`
        @keyframes prodIn {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes addedPop {
          0%   { transform:scale(1); }
          40%  { transform:scale(.96); }
          70%  { transform:scale(1.02); }
          100% { transform:scale(1); }
        }

        /* ── Header ─── */
        .cat-header {
          background: ${P};
          padding: 0 clamp(16px,4vw,36px);
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: sticky;
          top: 64px;
          z-index: 50;
          box-shadow: 0 2px 20px rgba(0,0,0,.18);
        }
        .cat-header-left {
          display: flex; align-items: center;
          gap: 10px; min-width: 0; flex: 1;
        }
        .cat-back-btn {
          width: 34px; height: 34px;
          border-radius: 4px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.2);
          color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background .15s;
        }
        .cat-back-btn:hover { background: rgba(255,255,255,.22); }
        .cat-col-sub {
          font-size: 9px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase;
          color: rgba(255,255,255,.5); line-height: 1;
        }
        .cat-col-name {
          font-family: var(--font);
          color: #fff;
          font-size: clamp(13px,2vw,15px);
          font-weight: 500;
          letter-spacing: .04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 3px;
          line-height: 1;
        }
        .cat-cart-btn {
          background: #fff;
          color: ${P};
          height: 36px;
          padding: 0 clamp(10px,2vw,20px);
          border-radius: 4px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; gap: 7px;
          font-size: clamp(10px,1.8vw,11px);
          font-weight: 700;
          font-family: var(--font);
          letter-spacing: .1em;
          text-transform: uppercase;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,.15);
          transition: all .15s;
          white-space: nowrap;
        }
        .cat-cart-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(0,0,0,.22);
        }
        .cat-cart-btn:disabled {
          background: rgba(255,255,255,.16);
          color: rgba(255,255,255,.35);
          box-shadow: none; cursor: not-allowed;
        }
        .cat-cart-qty {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; padding: 0 5px;
          background: ${P};
          color: #fff;
          border-radius: 99px;
          font-size: 10px; font-weight: 700;
        }

        /* ── Filters ─── */
        .cat-filters {
          background: #fff;
          border-bottom: 1px solid #e8e5e1;
          padding: 0 clamp(16px,4vw,36px);
          display: flex;
          gap: 0;
          overflow-x: auto;
          position: sticky;
          top: calc(64px + 60px);
          z-index: 49;
          scrollbar-width: none;
        }
        .cat-filters::-webkit-scrollbar { display: none; }
        .cat-filter-btn {
          padding: 14px clamp(12px,2vw,20px);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          background: transparent;
          font-size: 10px;
          font-family: var(--font);
          font-weight: 500;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9b9591;
          border-bottom: 2px solid transparent;
          transition: color .15s;
        }
        .cat-filter-btn:hover { color: #3d3a36; }
        .cat-filter-btn.active {
          color: ${P};
          font-weight: 700;
          border-bottom-color: ${P};
        }
        .cat-filter-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 16px; height: 16px; padding: 0 4px;
          background: #f0ede9;
          color: #9b9591;
          border-radius: 99px;
          font-size: 9px; font-weight: 700;
          margin-left: 5px; vertical-align: middle;
        }
        .cat-filter-btn.active .cat-filter-count {
          background: ${P}22;
          color: ${P};
        }

        /* ── Grid ─── */
        .cat-grid {
          max-width: 1400px;
          margin: 0 auto;
          padding: clamp(20px,3vw,44px) clamp(16px,4vw,40px);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%,260px), 1fr));
          gap: clamp(14px,2vw,22px);
        }

        /* ── Card ─── */
        .prod-card {
          background: #fff;
          border: 1px solid #ebe8e3;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: prodIn .38s cubic-bezier(.22,.68,0,1.2) both;
          transition: box-shadow .22s, transform .22s, border-color .22s;
        }
        .prod-card:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,.1);
          border-color: #d4cfc9;
          transform: translateY(-3px);
        }

        /* Image */
        .prod-img {
          aspect-ratio: 1 / 1;
          background: #f5f3f0;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .prod-img img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 18px;
          transition: transform .45s cubic-bezier(.22,.68,0,1.2);
        }
        .prod-card:hover .prod-img img { transform: scale(1.06); }
        .prod-img-placeholder {
          width: 64px; height: 64px;
          display: flex; align-items: center; justify-content: center;
          opacity: .3;
        }

        /* Discount badge */
        .prod-disc-badge {
          position: absolute; top: 10px; right: 10px;
          background: #c0392b; color: #fff;
          font-size: 10px; font-weight: 800;
          font-family: var(--font);
          padding: 4px 9px; border-radius: 4px;
          letter-spacing: .04em; pointer-events: none;
        }

        /* Body */
        .prod-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          border-top: 1px solid #ebe8e3;
        }

        /* Name + price row */
        .prod-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .prod-name {
          font-size: 10px;
          font-weight: 600;
          color: #2a2722;
          letter-spacing: .12em;
          text-transform: uppercase;
          line-height: 1.5;
          flex: 1;
        }
        .prod-price-col {
          text-align: right;
          flex-shrink: 0;
        }
        .prod-price-final {
          font-size: 14px;
          font-weight: 600;
          color: ${P};
          letter-spacing: .02em;
          white-space: nowrap;
        }
        .prod-price-original {
          font-size: 11px;
          font-weight: 400;
          color: #b0a89f;
          text-decoration: line-through;
          display: block;
          white-space: nowrap;
        }

        /* Category label */
        .prod-category {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #b0a89f;
          line-height: 1;
        }

        /* ── Size pills ─── */
        .size-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #9b9591;
          margin-bottom: 7px;
          display: block;
        }
        .size-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .size-pill {
          min-width: 36px;
          height: 34px;
          padding: 0 10px;
          border: 1px solid #ddd9d3;
          background: transparent;
          color: #3d3a36;
          font-size: 11px;
          font-weight: 500;
          font-family: var(--font);
          letter-spacing: .06em;
          cursor: pointer;
          transition: all .15s;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .size-pill:hover:not(.out):not(.selected) {
          border-color: ${P};
          color: ${P};
        }
        .size-pill.selected {
          background: ${P};
          border-color: ${P};
          color: #fff;
          font-weight: 600;
        }
        .size-pill.out {
          opacity: .35;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        /* Stock alert */
        .stock-alert {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 7px 10px;
          display: flex; align-items: center; gap: 6px;
        }
        .stock-alert.urgent {
          background: #fff5f5;
          color: #c0392b;
          border: 1px solid #fca5a5;
        }
        .stock-alert.warn {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        /* Add button */
        .prod-add-btn {
          width: 100%;
          padding: 12px 14px;
          font-family: var(--font);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all .15s;
          border: 1px solid;
          margin-top: auto;
        }
        .prod-add-btn.idle {
          background: #f5f3f0;
          color: #c4bfba;
          border-color: #e8e4df;
          cursor: not-allowed;
        }
        .prod-add-btn.ready {
          background: #fff;
          color: ${P};
          border-color: ${P};
        }
        .prod-add-btn.ready:hover {
          background: ${P};
          color: #fff;
          box-shadow: 0 4px 16px ${P}40;
        }
        .prod-add-btn.added {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #86efac;
          animation: addedPop .35s cubic-bezier(.22,.68,0,1.2) both;
        }

        /* Empty */
        .cat-empty {
          grid-column: 1/-1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: clamp(48px,8vw,96px) 24px;
          gap: 12px; text-align: center;
          color: #9b9591;
        }
        .cat-empty-title {
          font-family: var(--font);
          font-size: 14px; font-weight: 500;
          letter-spacing: .06em; text-transform: uppercase;
          color: #6b6560;
        }
        .cat-empty-sub {
          font-size: 12px; font-weight: 300; line-height: 1.6;
        }

        @media (max-width: 420px) {
          .cat-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .prod-body { padding: 12px 12px 14px; gap: 10px; }
          .size-pill { min-width: 32px; height: 30px; font-size: 10px; }
        }
        @media (max-width: 280px) {
          .cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div className="cat-header" role="banner">
        <div className="cat-header-left">
          <button className="cat-back-btn" onClick={onBack} aria-label="Volver">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <LogoBox logo={college.logo} name={college.name} color="rgba(255,255,255,.18)" size={32} />
          <div style={{ minWidth: 0 }}>
            <div className="cat-col-sub">Catálogo de uniformes</div>
            <div className="cat-col-name">{college.name}</div>
          </div>
        </div>

        <button
          className="cat-cart-btn"
          onClick={onCheckout}
          disabled={cartQty === 0}
          aria-label={cartQty > 0 ? `Ver carrito: ${cartQty} artículos` : "Carrito vacío"}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartQty > 0
            ? <><span className="cat-cart-qty">{cartQty}</span>{COP(cartTotal)}</>
            : "Sin artículos"
          }
        </button>
      </div>

      {/* Filters */}
      <nav className="cat-filters" aria-label="Filtrar por categoría">
        {cats.map(c => {
          const count = c === "Todos"
            ? college.uniforms.length
            : college.uniforms.filter(u => u.category === c).length;
          return (
            <button
              key={c}
              className={`cat-filter-btn${filter === c ? " active" : ""}`}
              onClick={() => setFilter(c)}
              aria-pressed={filter === c}
            >
              {c}
              <span className="cat-filter-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* Grid */}
      <div className="cat-grid" role="list" aria-label="Productos">
        {items.length === 0 && (
          <div className="cat-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4bfba" strokeWidth="1.2">
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
            </svg>
            <div className="cat-empty-title">Sin productos</div>
            <div className="cat-empty-sub">Selecciona otra categoría.</div>
          </div>
        )}

        {items.map((u, i) => {
          const flashKey   = `${u.id}-${sizes[u.id]}`;
          const isAdded    = flash[flashKey];
          const hasSz      = !!sizes[u.id];
          const imgSrc     = safeSrc(u.image);
          const pct        = getDiscountPct(u.id);
          const finalPrice = getFinalPrice(u);

          const lowSizes = Array.isArray(u.sizes)
            ? u.sizes.filter(sz => {
                const q = collegeStock?.[String(u.id)]?.[sz] ?? null;
                return q !== null && q > 0 && q <= 5;
              })
            : [];
          const minStock = lowSizes.length > 0
            ? Math.min(...lowSizes.map(sz => collegeStock[String(u.id)][sz]))
            : Infinity;
          const isUrgent = minStock <= 2;

          const btnClass = isAdded ? "added" : hasSz ? "ready" : "idle";

          return (
            <article
              key={u.id}
              className="prod-card"
              role="listitem"
              style={{ animationDelay: `${i * 0.045}s` }}
              aria-label={u.name}
            >
              {/* Imagen */}
              <div className="prod-img">
                {imgSrc
                  ? <img src={imgSrc} alt={u.name} loading="lazy" />
                  : (
                    <div className="prod-img-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1">
                        <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                      </svg>
                    </div>
                  )
                }
                {pct > 0 && (
                  <span className="prod-disc-badge">−{pct}%</span>
                )}
              </div>

              {/* Cuerpo */}
              <div className="prod-body">
                <div>
                  <div className="prod-category">{u.category}</div>
                  <div className="prod-top" style={{ marginTop: 5 }}>
                    <div className="prod-name">{u.name}</div>
                    <div className="prod-price-col">
                      <div className="prod-price-final">{COP(finalPrice)}</div>
                      {pct > 0 && (
                        <span className="prod-price-original">{COP(u.price)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tallas */}
                {Array.isArray(u.sizes) && u.sizes.length > 0 && (
                  <div>
                    <span className="size-label">Talla</span>
                    <div className="size-pills" role="group" aria-label={`Tallas de ${u.name}`}>
                      {u.sizes.map(sz => {
                        const q = collegeStock?.[String(u.id)]?.[sz] ?? null;
                        const isOut      = q === 0;
                        const isSelected = sizes[u.id] === sz;
                        return (
                          <button
                            key={sz}
                            className={`size-pill${isSelected ? " selected" : ""}${isOut ? " out" : ""}`}
                            onClick={() => {
                              if (isOut) return;
                              if (!u.sizes.includes(sz)) return;
                              setSizes(s => ({ ...s, [u.id]: sz }));
                            }}
                            disabled={isOut}
                            aria-label={`Talla ${sz}${isOut ? ", agotado" : ""}`}
                            aria-pressed={isSelected}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock bajo */}
                {lowSizes.length > 0 && (
                  <div
                    className={`stock-alert ${isUrgent ? "urgent" : "warn"}`}
                    role="alert"
                    aria-live="polite"
                  >
                    {isUrgent ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                    {isUrgent
                      ? `¡Solo ${minStock} ud. en talla${lowSizes.length > 1 ? "s" : ""} ${lowSizes.join(", ")}!`
                      : `Stock limitado en ${lowSizes.join(", ")}`
                    }
                  </div>
                )}

                {/* Agregar */}
                <button
                  className={`prod-add-btn ${btnClass}`}
                  onClick={() => addToCart(u)}
                  disabled={!hasSz}
                  aria-label={
                    isAdded ? `${u.name} agregado`
                    : hasSz  ? `Agregar ${u.name} T.${sizes[u.id]}`
                    : "Selecciona talla"
                  }
                >
                  {isAdded
                    ? <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" style={{ marginRight: 6, verticalAlign: "middle" }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Agregado
                      </>
                    : hasSz
                      ? "Agregar al carrito"
                      : "Selecciona una talla"
                  }
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
