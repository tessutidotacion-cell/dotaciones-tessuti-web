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
  const [selected, setSelected] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [activeSection, setActiveSection] = useState(
    college.sections?.length > 0 ? college.sections[0].id : null
  );

  const hasSections = college.sections?.length > 0;
  const currentUniforms = hasSections
    ? (college.sections.find(s => s.id === activeSection)?.uniforms || [])
    : college.uniforms;

  const visibleUniforms = currentUniforms.filter(u => {
    if (!u.hideWhenEmpty) return true;
    const sizeStock = collegeStock?.[String(u.id)];
    // Si nunca se cargó stock para este producto → mostrar
    if (!sizeStock || Object.keys(sizeStock).length === 0) return true;
    // Solo ocultar si fue definido y todas las tallas son 0
    const total = u.sizes.reduce((s, sz) => s + (sizeStock[sz] ?? 0), 0);
    return total > 0;
  });

  const cats      = ["Todos", ...new Set(visibleUniforms.map(u => u.category))];
  const items     = filter === "Todos" ? visibleUniforms : visibleUniforms.filter(u => u.category === filter);
  const cartQty   = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const P = safeCSSColor(college.primaryColor);
  const isEmpresarial = college.id === "empresarial";

  const getDiscountPct = (uid) => Math.max(0, Math.min(90, Number(discounts?.[String(uid)]) || 0));
  const getBasePrice   = (u, selectedSize) =>
    (selectedSize && u.sizePrices?.[selectedSize]) ? u.sizePrices[selectedSize] : u.price;
  const getFinalPrice  = (u, selectedSize) => {
    const base = getBasePrice(u, selectedSize);
    const pct  = getDiscountPct(u.id);
    return pct > 0 ? Math.round(base * (1 - pct / 100)) : base;
  };

  const getImages = (u) => {
    const imgs = [];
    const main = safeSrc(u.image);
    const hover = safeSrc(u.hoverImage);
    if (main) imgs.push(main);
    if (hover) imgs.push(hover);
    if (Array.isArray(u.galleryImages)) {
      u.galleryImages.forEach((g) => { const s = safeSrc(g); if (s) imgs.push(s); });
    }
    return imgs;
  };

  const openProduct = (u) => {
    setSelected(u);
    setActiveImg(0);
  };

  const addToCart = (u) => {
    const size = sizes[u.id];
    if (!size || !Array.isArray(u.sizes) || !u.sizes.includes(size)) return;
    const stockQty = collegeStock?.[String(u.id)]?.[size] ?? null;
    if (stockQty === 0) return;
    const finalPrice = getFinalPrice(u, size);
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
    <div style={{ minHeight: "calc(100vh - 64px)", background: "#fff" }}>
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
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }

        /* ── Header ─── */
        .cat-header {
          background: linear-gradient(135deg, ${P} 0%, ${P}dd 100%);
          padding: 0 clamp(16px,4vw,36px);
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: sticky;
          top: 64px;
          z-index: 50;
          box-shadow: 0 4px 24px rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,255,255,.06);
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

        /* ── Section tabs ─── */
        .cat-sections {
          background: #fff;
          padding: 8px clamp(16px,4vw,36px);
          display: flex;
          gap: 6px;
          overflow-x: auto;
          position: sticky;
          top: calc(64px + 60px);
          z-index: 50;
          scrollbar-width: none;
          border-bottom: 1px solid #e8e5e1;
        }
        .cat-sections::-webkit-scrollbar { display: none; }
        .cat-section-btn {
          padding: 8px 16px;
          border: 1.5px solid #e8e5e1;
          border-radius: 99px;
          cursor: pointer;
          white-space: nowrap;
          background: #fff;
          font-size: 11px;
          font-family: var(--font);
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #9b9591;
          transition: all .15s;
        }
        .cat-section-btn:hover { color: #3d3a36; border-color: #ccc; }
        .cat-section-btn.active {
          color: #fff;
          font-weight: 700;
          background: ${P};
          border-color: ${P};
        }

        /* Mobile dropdown for sections */
        .cat-section-select {
          display: none;
          width: 100%;
          padding: 12px 16px;
          font-family: var(--font);
          font-size: 13px;
          font-weight: 600;
          color: ${P};
          background: #fff;
          border: none;
          border-bottom: 1px solid #e8e5e1;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239b9591' stroke-width='2.5' stroke-linecap='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          cursor: pointer;
          position: sticky;
          top: calc(56px + 44px);
          z-index: 50;
        }
        .cat-section-select:focus {
          outline: none;
          box-shadow: inset 0 -2px 0 ${P};
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

        /* ── Grid (vista catálogo limpia) ─── */
        .cat-grid {
          max-width: 1400px;
          margin: 0 auto;
          padding: clamp(14px,3vw,44px) clamp(10px,4vw,40px);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(10px,2vw,22px);
        }

        /* ── Card limpia ─── */
        .prod-card {
          cursor: pointer;
          animation: prodIn .38s cubic-bezier(.22,.68,0,1.2) both;
          transition: transform .32s cubic-bezier(.16,1,.3,1);
        }
        .prod-card:hover { transform: translateY(-4px); }

        .prod-img {
          aspect-ratio: 3 / 4;
          background: #fff;
          overflow: hidden;
          position: relative;
        }
        .prod-img img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 8px;
          transition: opacity .4s ease, transform .55s cubic-bezier(.16,1,.3,1);
        }
        .prod-card:hover .prod-img img { transform: scale(1.06); }
        .prod-img .prod-img-hover {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 8px;
          opacity: 0;
          transition: opacity .4s ease, transform .55s cubic-bezier(.16,1,.3,1);
        }
        .prod-card:hover .prod-img .prod-img-hover { opacity: 1; transform: scale(1.06); }
        .prod-card:hover .prod-img .prod-img-main { opacity: 0; }
        .prod-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          opacity: .3;
        }
        .prod-disc-badge {
          position: absolute; top: 10px; right: 10px;
          background: #c0392b; color: #fff;
          font-size: 10px; font-weight: 800;
          font-family: var(--font);
          padding: 4px 9px; border-radius: 4px;
          letter-spacing: .04em; pointer-events: none;
        }

        .prod-info {
          padding: 14px 2px 0;
        }
        .prod-name {
          font-family: var(--font);
          font-size: 12px;
          font-weight: 500;
          color: #2a2722;
          letter-spacing: .04em;
          text-transform: uppercase;
          line-height: 1.4;
          transition: color .2s ease;
        }
        .prod-card:hover .prod-name { color: ${P}; }
        .prod-price {
          font-family: var(--font);
          font-size: 12px;
          font-weight: 300;
          color: #9b9591;
          margin-top: 4px;
          letter-spacing: .02em;
        }

        /* ── Vista detalle del producto ─── */
        .pd-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: clamp(20px,4vw,48px) clamp(14px,4vw,36px);
          animation: fadeIn .3s ease;
        }
        .pd-back {
          background: none; border: none; cursor: pointer;
          font-family: var(--font);
          font-size: 11px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          color: #9b9591;
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 24px;
          transition: color .15s;
        }
        .pd-back:hover { color: #3d3a36; }

        .pd-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(24px,4vw,48px);
          align-items: start;
        }

        /* Imágenes lado izquierdo */
        .pd-images {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pd-main-img {
          aspect-ratio: 3 / 4;
          background: #f5f3f0;
          overflow: hidden;
          position: relative;
        }
        .pd-main-img img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 16px;
          transition: opacity .4s ease, transform .6s cubic-bezier(.16,1,.3,1);
        }
        .pd-main-img:hover img { transform: scale(1.04); }
        .pd-thumbs {
          display: flex;
          gap: 8px;
        }
        .pd-thumb {
          width: 80px; height: 100px;
          background: #f5f3f0;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color .2s ease, transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease;
        }
        .pd-thumb:hover:not(.active) {
          border-color: #ddd9d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        .pd-thumb.active { border-color: ${P}; box-shadow: 0 2px 8px ${P}33; }
        .pd-thumb img {
          width: 100%; height: 100%;
          object-fit: cover;
        }

        /* Info lado derecho */
        .pd-info {
          position: sticky;
          top: calc(64px + 60px + 24px);
        }
        .pd-category {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #9b9591;
          margin-bottom: 8px;
        }
        .pd-name {
          font-family: var(--font);
          font-size: clamp(18px,2.5vw,24px);
          font-weight: 600;
          color: #1c1c1c;
          letter-spacing: .02em;
          text-transform: uppercase;
          line-height: 1.3;
        }
        .pd-price {
          font-family: var(--font);
          font-size: clamp(16px,2vw,20px);
          font-weight: 400;
          color: #6b6560;
          margin-top: 8px;
        }
        .pd-price-original {
          font-size: 14px;
          color: #b0a89f;
          text-decoration: line-through;
          margin-left: 10px;
        }
        .pd-desc {
          font-family: var(--font);
          font-size: 13px;
          font-weight: 300;
          color: #6b6560;
          line-height: 1.7;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e8e5e1;
        }

        /* Tallas en detalle */
        .pd-sizes-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #3d3a36;
          margin-top: 24px;
          margin-bottom: 10px;
        }
        .pd-sizes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pd-size {
          min-width: 48px; height: 44px;
          padding: 0 16px;
          border: 1px solid #ddd9d3;
          background: transparent;
          color: #3d3a36;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font);
          letter-spacing: .06em;
          cursor: pointer;
          transition: all .15s;
          display: flex; align-items: center; justify-content: center;
        }
        .pd-size:hover:not(.out):not(.selected) {
          border-color: ${P};
          color: ${P};
        }
        .pd-size.selected {
          background: ${P};
          border-color: ${P};
          color: #fff;
          font-weight: 600;
        }
        .pd-size.out {
          opacity: .55;
          cursor: not-allowed;
          text-decoration: none;
          background: #fef2f2;
          border-color: #fecaca;
          color: #b0a89f;
          flex-direction: column;
          gap: 1px;
        }
        .pd-size.out .pd-size-out-label {
          font-size: 8px;
          font-weight: 700;
          color: #f87171;
          letter-spacing: .06em;
          text-transform: uppercase;
          line-height: 1;
        }

        /* Stock alert */
        .stock-alert {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 7px 10px;
          display: flex; align-items: center; gap: 6px;
          margin-top: 12px;
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

        /* Botón agregar en detalle */
        .pd-add-btn {
          width: 100%;
          padding: 16px 20px;
          font-family: var(--font);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all .2s;
          border: none;
          margin-top: 20px;
        }
        .pd-add-btn.idle {
          background: #e8e5e1;
          color: #b0a89f;
          cursor: not-allowed;
        }
        .pd-add-btn.ready {
          background: ${P};
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .pd-add-btn.ready::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 50%);
          opacity: 0;
          transition: opacity .3s ease;
        }
        .pd-add-btn.ready:hover::before { opacity: 1; }
        .pd-add-btn.ready:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px ${P}44, 0 2px 8px ${P}22;
        }
        .pd-add-btn.added {
          background: #16a34a;
          color: #fff;
          animation: addedPop .35s cubic-bezier(.22,.68,0,1.2) both;
        }

        /* ── Editorial Page Header ─── */
        @keyframes headerIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:none; }
        }
        .cat-page-header {
          position: relative;
          background: #f7f4f0;
          border-bottom: 1px solid #e8e4df;
          overflow: hidden;
          animation: headerIn .4s ease both;
        }
        .cat-page-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: clamp(14px,2.5vw,28px) clamp(10px,4vw,40px) clamp(12px,2vw,22px);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        /* número fantasma de fondo */
        .cat-ghost-num {
          position: absolute;
          right: clamp(24px,6vw,80px);
          bottom: -6px;
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(70px,12vw,130px);
          font-weight: 700;
          font-style: italic;
          color: ${P};
          opacity: .055;
          line-height: 1;
          pointer-events: none;
          user-select: none;
          letter-spacing: -.04em;
        }
        /* barra acento izquierda */
        .cat-page-accent {
          width: 2.5px;
          height: clamp(32px,4vw,50px);
          background: ${P};
          border-radius: 2px;
          flex-shrink: 0;
          margin-bottom: 2px;
          opacity: .85;
        }
        .cat-page-left { display: flex; align-items: flex-end; gap: 12px; }
        .cat-page-titles { display: flex; flex-direction: column; gap: 5px; }
        .cat-breadcrumb {
          display: flex; align-items: center; gap: 5px;
          font-size: 9px; font-weight: 700; color: #b0a89f;
          letter-spacing: .2em; text-transform: uppercase;
        }
        .cat-breadcrumb-link {
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: 9px; font-weight: 700;
          color: #b0a89f; padding: 0; letter-spacing: .2em; text-transform: uppercase;
          transition: color .15s;
        }
        .cat-breadcrumb-link:hover { color: #3d3a36; }
        .cat-breadcrumb-sep { color: #d4cfc9; letter-spacing: 0; }
        .cat-breadcrumb-current { color: #6b6560; }
        .cat-page-title {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(22px, 3.5vw, 38px);
          font-weight: 500;
          font-style: italic;
          color: #1c1c1c;
          letter-spacing: .01em;
          line-height: 1;
        }
        /* contador en esquina derecha */
        .cat-page-right { flex-shrink: 0; text-align: right; padding-bottom: 2px; }
        .cat-count-num {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(20px,3vw,30px);
          font-weight: 400;
          font-style: italic;
          color: ${P};
          line-height: 1;
          opacity: .7;
        }
        .cat-count-label {
          font-size: 8px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          color: #b0a89f; margin-top: 2px;
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

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }
        @media (max-width: 900px) {
          .pd-layout { grid-template-columns: 1fr; gap: 24px; }
          .pd-info { position: static; }
          .pd-wrap { padding: 20px 16px; }
        }
        @media (max-width: 768px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .pd-main-img { aspect-ratio: 3 / 4; }
          .pd-thumbs { gap: 6px; }
          .pd-thumb { width: 64px; height: 80px; }
          .pd-name { font-size: 18px; }
          .pd-price { font-size: 16px; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .cat-header { height: 44px; top: 56px; padding: 0 12px; }
          .cat-sections { display: none; }
          .cat-section-select { display: block; }
          .cat-filters { position: relative; top: auto; padding: 0 12px; }
          .cat-filter-btn { padding: 10px 10px; font-size: 9px; }
          .cat-col-sub { display: none; }
          .cat-col-name { font-size: 13px; }
          .cat-back-btn { width: 30px; height: 30px; }
          .cat-cart-btn .cart-price-text { display: none; }
          .cat-cart-btn { height: 32px; padding: 0 10px; font-size: 9px; }
          .cat-grid { grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; }
          .prod-name { font-size: 10px; }
          .prod-price { font-size: 10px; }
          .prod-info { padding: 8px 2px 0; }

          .pd-wrap { padding: 14px 12px; }
          .pd-back { margin-bottom: 16px; font-size: 10px; }
          .pd-name { font-size: 16px; }
          .pd-price { font-size: 14px; }
          .pd-sizes-label { margin-top: 18px; }
          .pd-size { min-width: 42px; height: 40px; font-size: 11px; padding: 0 12px; }
          .pd-add-btn { padding: 14px 16px; font-size: 10px; }
          .pd-thumb { width: 56px; height: 70px; }
          .pd-desc { font-size: 12px; margin-top: 16px; padding-top: 16px; }
        }

        /* ── Mobile page header ── */
        @media (max-width: 640px) {
          .cat-page-header-inner { padding: 12px 12px 10px; gap: 10px; }
          .cat-page-title { font-size: 20px; }
          .cat-page-accent { height: 28px; }
          .cat-ghost-num { font-size: 60px; }
          .cat-count-num { font-size: 18px; }
        }
        @media (max-width: 420px) {
          .cat-page-right { display: none; }
          .cat-ghost-num { display: none; }
        }

        /* ── Small mobile ── */
        @media (max-width: 380px) {
          .cat-grid { grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; }
          .prod-name { font-size: 9px; }
          .prod-price { font-size: 9px; }
          .pd-name { font-size: 14px; }
          .pd-size { min-width: 38px; height: 36px; font-size: 10px; }
        }
        @media (max-width: 280px) {
          .cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div className="cat-header" role="banner">
        <div className="cat-header-left">
          <button className="cat-back-btn" onClick={selected ? () => setSelected(null) : onBack} aria-label="Volver">
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
            ? <><span className="cat-cart-qty">{cartQty}</span><span className="cart-price-text">{COP(cartTotal)}</span></>
            : <span className="cart-price-text">Sin artículos</span>
          }
        </button>
      </div>

      {/* ── Vista detalle de producto ── */}
      {selected ? (() => {
        const u = selected;
        const images = getImages(u);
        const pct = getDiscountPct(u.id);
        const selectedSize = sizes[u.id];
        const finalPrice = getFinalPrice(u, selectedSize);
        const flashKey = `${u.id}-${sizes[u.id]}`;
        const isAdded = flash[flashKey];
        const hasSz = !!sizes[u.id];
        const btnClass = isAdded ? "added" : hasSz ? "ready" : "idle";

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

        return (
          <div className="pd-wrap">
            <button className="pd-back" onClick={() => setSelected(null)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Volver al catálogo
            </button>

            <div className="pd-layout">
              {/* Imágenes */}
              <div className="pd-images">
                <div className="pd-main-img">
                  {images.length > 0
                    ? <img src={images[activeImg] || images[0]} alt={u.name} />
                    : <div className="prod-img-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1">
                          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                        </svg>
                      </div>
                  }
                </div>
                {images.length > 1 && (
                  <div className="pd-thumbs">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`pd-thumb${activeImg === idx ? " active" : ""}`}
                        onClick={() => setActiveImg(idx)}
                      >
                        <img src={img} alt={`${u.name} ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="pd-info">
                <div className="pd-category">{u.category}</div>
                <div className="pd-name">{u.name}</div>
                {!isEmpresarial && (
                  <div className="pd-price">
                    {COP(finalPrice)}
                    {pct > 0 && <span className="pd-price-original">{COP(getBasePrice(u, selectedSize))}</span>}
                  </div>
                )}

                {(u.description || isEmpresarial) && (
                  <div className="pd-desc">
                    {u.description}
                    {isEmpresarial && (
                      <span style={{ display: "block", marginTop: u.description ? 12 : 0 }}>
                        Cada prenda puede personalizarse según las necesidades de tu empresa: estampado, bordado, serigrafía, sublimación y más. Si deseas personalización, contáctanos directamente. Si prefieres la prenda tal como es, puedes comprarla en la página.
                      </span>
                    )}
                  </div>
                )}

                {/* Tallas */}
                {Array.isArray(u.sizes) && u.sizes.length > 0 && (
                  <>
                    <div className="pd-sizes-label">Talla</div>
                    <div className="pd-sizes">
                      {u.sizes.map(sz => {
                        const q = collegeStock?.[String(u.id)]?.[sz] ?? null;
                        const isOut = q === 0;
                        const isSelected = sizes[u.id] === sz;
                        return (
                          <button
                            key={sz}
                            className={`pd-size${isSelected ? " selected" : ""}${isOut ? " out" : ""}`}
                            onClick={() => {
                              if (isOut) return;
                              setSizes(s => ({ ...s, [u.id]: sz }));
                            }}
                            disabled={isOut}
                            title={isOut ? "Talla agotada" : undefined}
                          >
                            {sz}
                            {isOut && <span className="pd-size-out-label">Agotado</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Stock bajo */}
                {lowSizes.length > 0 && (
                  <div className={`stock-alert ${isUrgent ? "urgent" : "warn"}`}>
                    {isUrgent
                      ? `¡Solo ${minStock} ud. en talla${lowSizes.length > 1 ? "s" : ""} ${lowSizes.join(", ")}!`
                      : `Stock limitado en ${lowSizes.join(", ")}`
                    }
                  </div>
                )}

                {/* Agregar */}
                {isEmpresarial ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                    <a
                      href={`https://wa.me/573122040973?text=${encodeURIComponent(`Hola, me interesa personalizar la prenda: ${u.name}${sizes[u.id] ? `, talla ${sizes[u.id]}` : ""}. Quisiera consultar opciones de estampado / bordado.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        width: "100%", padding: "16px 20px", boxSizing: "border-box",
                        fontFamily: "var(--font)", fontSize: 11, fontWeight: 700,
                        letterSpacing: ".16em", textTransform: "uppercase",
                        textDecoration: "none", cursor: "pointer",
                        background: "#25d366", color: "#fff", border: "none",
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,211,102,.4)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Contactar proveedor
                    </a>
                    <button
                      className={`pd-add-btn ${btnClass}`}
                      onClick={() => addToCart(u)}
                      disabled={!hasSz}
                    >
                      {isAdded
                        ? <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" style={{ marginRight: 8, verticalAlign: "middle" }}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Agregado
                          </>
                        : hasSz
                          ? "Comprar sin personalización"
                          : "Selecciona una talla"
                      }
                    </button>
                  </div>
                ) : (
                  <button
                    className={`pd-add-btn ${btnClass}`}
                    onClick={() => addToCart(u)}
                    disabled={!hasSz}
                  >
                    {isAdded
                      ? <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" style={{ marginRight: 8, verticalAlign: "middle" }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Agregado
                        </>
                      : hasSz
                        ? "Añadir al carrito"
                        : "Selecciona una talla"
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })() : (
        <>
          {/* Section tabs */}
          {hasSections && (
            <>
              <nav className="cat-sections" aria-label="Sección">
                {college.sections.map(s => (
                  <button
                    key={s.id}
                    className={`cat-section-btn${activeSection === s.id ? " active" : ""}`}
                    onClick={() => { setActiveSection(s.id); setFilter("Todos"); }}
                  >
                    {s.name}
                  </button>
                ))}
              </nav>
              <select
                className="cat-section-select"
                value={activeSection}
                onChange={e => { setActiveSection(e.target.value); setFilter("Todos"); }}
                aria-label="Seleccionar sección"
              >
                {college.sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </>
          )}

          {/* Filters */}
          {hasSections && (
          <nav className="cat-filters" style={{ position: "relative", top: "auto" }} aria-label="Filtrar por categoría">
            {cats.map(c => {
              const count = c === "Todos"
                ? currentUniforms.length
                : currentUniforms.filter(u => u.category === c).length;
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
          )}

          {/* Editorial page header */}
          {(() => {
            const activeSecName = hasSections
              ? college.sections.find(s => s.id === activeSection)?.name
              : null;
            const pageTitle = activeSecName || college.name;
            const resultCount = items.length;
            const countStr = String(resultCount).padStart(2, "0");
            return (
              <div className="cat-page-header" role="region" aria-label="Encabezado de catálogo">
                {/* número fantasma decorativo */}
                <div className="cat-ghost-num" aria-hidden="true">{countStr}</div>

                <div className="cat-page-header-inner">
                  <div className="cat-page-left">
                    <div className="cat-page-accent" aria-hidden="true" />
                    <div className="cat-page-titles">
                      <nav className="cat-breadcrumb" aria-label="Ruta de navegación">
                        <button className="cat-breadcrumb-link" onClick={onBack}>Inicio</button>
                        <span className="cat-breadcrumb-sep">·</span>
                        <button className="cat-breadcrumb-link" onClick={onBack}>Uniformes</button>
                        {hasSections && (
                          <>
                            <span className="cat-breadcrumb-sep">·</span>
                            <button className="cat-breadcrumb-link" onClick={() => setActiveSection(college.sections[0].id)}>
                              {college.name}
                            </button>
                          </>
                        )}
                        <span className="cat-breadcrumb-sep">·</span>
                        <span className="cat-breadcrumb-current">{pageTitle}</span>
                      </nav>
                      <h1 className="cat-page-title">{pageTitle}</h1>
                    </div>
                  </div>

                  <div className="cat-page-right">
                    <div className="cat-count-num">{countStr}</div>
                    <div className="cat-count-label">prendas</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Grid limpio */}
          <div className="cat-grid" role="list" aria-label="Productos">
            {items.length === 0 && (
              <div className="cat-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4bfba" strokeWidth="1.2">
                  <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                </svg>
                <div className="cat-empty-title">Sin productos</div>
                <div className="cat-empty-sub">No hay prendas en esta categoría.</div>
                <button
                  onClick={() => setFilter("Todos")}
                  style={{
                    marginTop: 8,
                    padding: "9px 20px",
                    border: `1.5px solid ${P}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: P,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--font)",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = P; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = P; }}
                >
                  Ver todas las prendas
                </button>
              </div>
            )}

            {items.map((u, i) => {
              const imgSrc = safeSrc(u.image);
              const hoverSrc = safeSrc(u.hoverImage);
              const pct = getDiscountPct(u.id);
              const finalPrice = getFinalPrice(u);
              const sizeStock = collegeStock?.[String(u.id)];
              const allOut = u.sizes?.length > 0 && sizeStock &&
                u.sizes.every(sz => (sizeStock[sz] ?? null) === 0);

              return (
                <article
                  key={u.id}
                  className="prod-card"
                  role="listitem"
                  style={{ animationDelay: `${i * 0.045}s`, opacity: allOut ? 0.65 : 1 }}
                  onClick={() => openProduct(u)}
                >
                  <div className="prod-img">
                    {imgSrc
                      ? <>
                          <img className={hoverSrc ? "prod-img-main" : ""} src={imgSrc} alt={u.name} loading="lazy" />
                          {hoverSrc && <img className="prod-img-hover" src={hoverSrc} alt={`${u.name} reverso`} loading="lazy" />}
                        </>
                      : (
                        <div className="prod-img-placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1">
                            <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                          </svg>
                        </div>
                      )
                    }
                    {pct > 0 && !allOut && <span className="prod-disc-badge">-{pct}%</span>}
                    {allOut && (
                      <span style={{
                        position: "absolute", top: 10, left: 10,
                        background: "#1c1c1c", color: "#fff",
                        fontSize: 9, fontWeight: 700,
                        padding: "4px 9px", letterSpacing: ".08em",
                        textTransform: "uppercase", pointerEvents: "none",
                      }}>
                        Agotado
                      </span>
                    )}
                  </div>
                  <div className="prod-info">
                    <div className="prod-name">{u.name}</div>
                    {isEmpresarial
                      ? <div className="prod-price">Precio a consultar</div>
                      : <div className="prod-price">
                          {COP(finalPrice)}
                          {pct > 0 && <span style={{ textDecoration: "line-through", color: "#b0a89f", marginLeft: 8, fontSize: 11 }}>{COP(u.price)}</span>}
                        </div>
                    }
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
