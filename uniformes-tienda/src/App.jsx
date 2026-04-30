import React, { useCallback, useEffect, useState, useRef } from "react";
import { clearToken, getStock, getPublicDiscounts } from "./services/api";
import {
  ShoppingBag, Package, Settings, X, Menu, ChevronRight, MessageCircle
} from "lucide-react";

import GlobalStyles from "./components/ui/GlobalStyles";
import Toast from "./components/ui/Toast";
import { LOGO_TESSUTI } from "./assets";
import { DEMO_COLLEGES, loadCollegeImages } from "./data/colleges";
import { COP } from "./utils/money";
import { useToast } from "./hooks/useToast";

import { lazy, Suspense } from "react";
const CollegeSelector = lazy(() => import("./pages/Home/CollegesSelector"));
const Catalog         = lazy(() => import("./pages/Catalog/Catalog"));
const Checkout        = lazy(() => import("./pages/Checkout/Checkout"));
const OrderSuccess    = lazy(() => import("./pages/Succes/OrderSucces"));
const TrackOrder      = lazy(() => import("./pages/Track/TrackOrder"));
const AdminLogin      = lazy(() => import("./pages/Admin/AdminLogin"));
const AdminPanel      = lazy(() => import("./pages/Admin/AdminPanel"));

function encodeHash(view, collegeId) {
  return collegeId ? `#${view}/${collegeId}` : `#${view}`;
}
function decodeHash(hash) {
  const raw = (hash || "").replace(/^#/, "");
  const [view, collegeId] = raw.split("/");
  return { view: view || "home", collegeId: collegeId || null };
}

const VALID_VIEWS = ["home","catalog","checkout","success","track","adminLogin","admin"];
const ADMIN_VIEWS = ["adminLogin","admin"];

export default function App() {
  const [view,         setView]         = useState("home");
  const [college,      setCollege]      = useState(null);
  const [cart,         setCart]         = useState([]);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [catalogStock, setCatalogStock] = useState({});
  const [discounts,    setDiscounts]    = useState({});
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
const { toastState, toast, clearToast } = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Retorno desde Wompi ───────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wompiId = params.get("id");
    if (!wompiId) return;
    const stored = sessionStorage.getItem("wompi_pending_order");
    if (stored) {
      try {
        const order = JSON.parse(stored);
        sessionStorage.removeItem("wompi_pending_order");
        setSuccessOrder({ ...order, wompiTransactionId: wompiId });
        window.history.replaceState({}, "", window.location.pathname + window.location.hash);
        setView("success");
      } catch (e) { console.error("[Wompi return] failed to parse pending order:", e); }
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const go = useCallback((nextView, nextCollege) => {
    const col = nextCollege !== undefined ? nextCollege : college;
    const needsId = ["catalog","checkout"].includes(nextView) && col?.id;
    const hash = encodeHash(nextView, needsId ? col.id : null);
    window.history.pushState({ view: nextView, collegeId: col?.id || null }, "", hash);
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [college]);

  useEffect(() => {
    const onPop = async (e) => {
      const state = e.state;
      const targetView    = state?.view      || decodeHash(window.location.hash).view;
      const targetCollege = state?.collegeId || decodeHash(window.location.hash).collegeId;
      if (targetCollege && ["catalog","checkout"].includes(targetView)) {
        const found = DEMO_COLLEGES.find(c => c.id === targetCollege);
        if (found) {
          const enriched = await loadCollegeImages(found);
          setCollege(enriched);
        }
      }
      const safe = VALID_VIEWS.includes(targetView) ? targetView : "home";
      if (safe === "admin" && !sessionStorage.getItem("ue_admin_token")) setView("adminLogin");
      else setView(safe);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const { view: v, collegeId } = decodeHash(window.location.hash);
    const hasToken = !!sessionStorage.getItem("ue_admin_token");
    if (v === "admin") {
      if (hasToken) { setIsAdmin(true); setView("admin"); }
      else setView("adminLogin");
      window.history.replaceState({ view: v }, "", window.location.hash);
      return;
    }
    if (collegeId && ["catalog","checkout"].includes(v)) {
      const found = DEMO_COLLEGES.find(c => c.id === collegeId);
      if (found) {
        loadCollegeImages(found).then(enriched => {
          setCollege(enriched); setView(v);
          window.history.replaceState({ view: v, collegeId }, "", window.location.hash);
        });
        return;
      }
    }
    const safe = VALID_VIEWS.includes(v) && v !== "success" ? v : "home";
    setView(safe);
    window.history.replaceState({ view: safe }, "", encodeHash(safe, null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "catalog" && college) {
      getStock(college.id)
        .then(({ data }) => setCatalogStock(data || {}))
        .catch(() => {
          // Fallback: build stock map from hardcoded data in colleges.js
          const fallback = {};
          const allUniforms = college.sections
            ? college.sections.flatMap(s => s.uniforms)
            : (college.uniforms || []);
          allUniforms.forEach(u => {
            if (u.stock) fallback[String(u.id)] = u.stock;
          });
          setCatalogStock(fallback);
        });
    }
  }, [view, college]);

  useEffect(() => {
    getPublicDiscounts()
      .then(({ data }) => setDiscounts(data || {}))
      .catch(() => {});
  }, []);

  const isPublic  = !ADMIN_VIEWS.includes(view);
  const cartQty   = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      {/* ── Safe-area filler: covers Dynamic Island / notch on iOS ── */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: "env(safe-area-inset-top)",
        background: "#f8f6f2",
        zIndex: 10000,
        pointerEvents: "none",
      }} />
      <GlobalStyles />
      <style>{`
        /* ── Nav buttons ────────────────────────── */
        .nav-btn {
          height: 36px;
          padding: 0 18px;
          border-radius: var(--r-sm);
          border: 1px solid var(--line-2);
          background: var(--surface);
          color: var(--ink-3);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .09em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all var(--t-sm) var(--ease);
          white-space: nowrap;
          font-family: var(--font);
          box-shadow: var(--sh-xs);
        }
        .nav-btn:hover {
          border-color: var(--line-3);
          color: var(--ink);
          background: var(--surface-2);
          transform: translateY(-1px);
          box-shadow: var(--sh-sm);
        }
        .nav-btn.primary {
          background: var(--ink);
          color: #fff;
          border-color: var(--ink);
          box-shadow: 0 2px 12px rgba(24,23,21,.2);
          font-weight: 600;
        }
        .nav-btn.primary:hover {
          background: var(--ink-2);
          box-shadow: 0 4px 18px rgba(24,23,21,.25);
          transform: translateY(-1px);
        }

        /* Cart qty pill */
        .cart-qty {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          background: #fff;
          color: var(--ink);
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          margin-left: -3px;
        }

        /* ── Logo ───────────────────────────────── */
        .nav-logo-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          padding: 6px 8px 6px 0;
          border-radius: var(--r);
          transition: opacity var(--t-sm) var(--ease);
          flex-shrink: 0;
        }
        .nav-logo-btn:hover { opacity: .75; }
        .nav-logo-img {
          width: 38px; height: 38px;
          border-radius: 50%; object-fit: cover;
          border: 1.5px solid var(--line-2);
          box-shadow: var(--sh-sm);
          display: block; flex-shrink: 0;
          transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease;
        }
        .nav-logo-btn:hover .nav-logo-img {
          transform: scale(1.08) rotate(-3deg);
          box-shadow: 0 4px 16px rgba(24,23,21,.12);
        }
        .nav-logo-texts { display: none; }

        /* Nombre centrado en la navbar */
        .nav-center-name {
          position: absolute;
          left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center;
          line-height: 1;
          background: none; border: none; padding: 6px 12px;
          cursor: pointer; border-radius: var(--r);
          transition: opacity var(--t-sm) var(--ease);
        }
        .nav-center-name:hover { opacity: .65; }
        .nav-center-name span:first-child {
          font-family: var(--font-display);
          font-size: 22px; font-weight: 500;
          color: var(--ink); letter-spacing: .06em;
          text-transform: uppercase;
        }
        .nav-center-name span:last-child {
          font-size: 8px; color: var(--ink-4);
          font-weight: 600; letter-spacing: .22em;
          text-transform: uppercase; margin-top: 3px;
        }

        /* ── Nav desktop actions ─────────────────── */
        .nav-actions {
          display: flex; align-items: center; gap: 8px;
        }

        /* ── Hamburger ──────────────────────────── */
        .nav-ham {
          display: none;
          width: 38px; height: 38px;
          border: 1px solid var(--line-2);
          border-radius: var(--r);
          background: var(--surface);
          color: var(--ink-3);
          cursor: pointer;
          align-items: center; justify-content: center;
          transition: all var(--t-sm) var(--ease);
          flex-shrink: 0; box-shadow: var(--sh-xs);
        }
        .nav-ham:hover { border-color: var(--line-3); color: var(--ink); }

        /* ── Nav separator ──────────────────────── */
        .nav-sep {
          width: 1px; height: 22px;
          background: var(--line); flex-shrink: 0;
          margin: 0 4px;
        }

        /* ── Mobile overlay ─────────────────────── */
        .mob-overlay {
          display: none;
          position: fixed; inset: 0; top: calc(64px + env(safe-area-inset-top));
          background: rgba(24,23,21,.12);
          backdrop-filter: blur(3px);
          z-index: 198;
        }
        .mob-overlay.open { display: block; }

        /* ── Mobile menu ────────────────────────── */
        .mob-menu {
          display: none;
          position: fixed; top: calc(64px + env(safe-area-inset-top)); left: 0; right: 0;
          background: var(--surface);
          z-index: 199;
          flex-direction: column;
          padding: 16px 20px 24px;
          gap: 8px;
          border-bottom: 1px solid var(--line);
          box-shadow: 0 16px 40px rgba(24,23,21,.1);
          animation: slideDown .2s var(--ease-out);
        }
        .mob-menu.open { display: flex; }

        .mob-btn {
          width: 100%;
          text-align: left;
          padding: 14px 18px;
          border-radius: var(--r);
          border: 1px solid var(--line);
          background: var(--surface);
          font-size: 13px; font-weight: 400;
          letter-spacing: .03em; text-transform: none;
          color: var(--ink-2);
          cursor: pointer; font-family: var(--font);
          transition: all var(--t-xs) var(--ease);
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .mob-btn .mob-btn-left { display: flex; align-items: center; gap: 12px; }
        .mob-btn:hover { background: var(--surface-2); border-color: var(--line-2); }
        .mob-btn.primary {
          background: var(--ink); color: #fff;
          border-color: var(--ink); font-weight: 500;
        }
        .mob-btn.primary:hover { background: var(--ink-2); }

        /* ── Cart FAB ───────────────────────────── */
        @keyframes cartFabIn {
          0%   { opacity:0; transform:translateY(24px) scale(.8); }
          65%  { transform:translateY(-6px) scale(1.05); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes cartPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(24,23,21,.28), 0 0 0 0 rgba(184,154,106,.6); }
          60%      { box-shadow: 0 4px 20px rgba(24,23,21,.28), 0 0 0 12px rgba(184,154,106,0); }
        }
        @keyframes cartQtyPop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        .cart-fab {
          position: fixed; bottom: calc(88px + env(safe-area-inset-bottom)); right: 24px; z-index: 7999;
          height: 48px;
          padding: 0 20px;
          border-radius: 99px;
          background: var(--ink);
          color: #fff;
          border: 1px solid rgba(255,255,255,.08);
          cursor: pointer;
          display: flex; align-items: center; gap: 9px;
          font-family: var(--font);
          font-size: 11px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          white-space: nowrap;
          animation: cartFabIn .5s cubic-bezier(.22,.68,0,1.2) both,
                     cartPulse 2.6s ease-in-out 1.2s infinite;
          transition: transform .18s, box-shadow .18s;
          backdrop-filter: blur(8px);
        }
        @media (max-width: 640px) {
          .cart-fab {
            bottom: calc(80px + env(safe-area-inset-bottom)); left: 16px; right: 16px;
            width: auto;
            justify-content: center;
            height: 52px;
            font-size: 12px;
            border-radius: 14px;
            box-shadow: 0 6px 28px rgba(24,23,21,.35);
          }
        }
        .cart-fab:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 10px 30px rgba(24,23,21,.35);
          animation: none;
        }
        .cart-fab:active { transform: scale(.97); animation: none; }
        .cart-fab-qty {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; padding: 0 5px;
          background: #b89a6a;
          color: #fff;
          border-radius: 99px;
          font-size: 10px; font-weight: 700;
          animation: cartQtyPop .4s cubic-bezier(.22,.68,0,1.2) both;
        }

        /* ── WhatsApp FAB ───────────────────────── */
        .wa-fab {
          position: fixed; bottom: calc(24px + env(safe-area-inset-bottom)); right: calc(24px + env(safe-area-inset-right)); z-index: 8000;
          width: 52px; height: 52px; border-radius: 50%;
          background: #25d366;
          display: flex; align-items: center; justify-content: center;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(37,211,102,.4), 0 2px 8px rgba(24,23,21,.1);
          transition: transform var(--t) var(--ease), box-shadow var(--t) var(--ease);
        }
        .wa-fab:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 8px 32px rgba(37,211,102,.45), 0 4px 12px rgba(24,23,21,.12);
          opacity: 1;
        }
        .wa-fab:active { transform: scale(.96); }

        @media (max-width: 640px) {
          .nav-actions { display: none !important; }
          .nav-ham     { display: flex !important; }
        }

        /* ── Transición de vistas ─────────────────── */
        @keyframes viewFadeIn {
          from { opacity: 0; transform: translateY(14px); filter: blur(2px); }
          to   { opacity: 1; transform: none; filter: blur(0); }
        }
        .view-enter {
          animation: viewFadeIn 0.4s cubic-bezier(.16,1,.3,1) both;
        }
      `}</style>

      {toastState && (
        <Toast key={toastState.key} msg={toastState.msg} type={toastState.type} onClose={clearToast} />
      )}

      {isPublic && (
        <>
          {/* ── Navbar ── */}
          <nav className={`app-nav${scrolled ? " scrolled" : ""}`} role="navigation" aria-label="Navegación principal">
            <button
              className="nav-logo-btn"
              onClick={() => { setCart([]); setCollege(null); go("home", null); }}
              aria-label="Ir al inicio — Tessuti Dotaciones"
            >
              <img src={LOGO_TESSUTI} alt="Tessuti" className="nav-logo-img" fetchpriority="high" />
            </button>

            {/* Nombre centrado */}
            <button className="nav-center-name"
              onClick={() => { setCart([]); setCollege(null); go("home", null); }}
              aria-label="Ir al inicio">
              <span>Tessuti</span>
              <span>Dotaciones</span>
            </button>

            <div className="nav-actions">
              {view === "catalog" && cartQty > 0 && (
                <button className="nav-btn primary" onClick={() => go("checkout")}>
                  <ShoppingBag size={13} strokeWidth={2} />
                  <span className="cart-qty">{cartQty}</span>
                  {COP(cartTotal)}
                </button>
              )}
              <div className="nav-sep" aria-hidden="true" />
              <button className="nav-btn" onClick={() => go("track")}>
                <Package size={13} strokeWidth={1.8} />
                Mi pedido
              </button>
              <button className="nav-btn" onClick={() => go("adminLogin")}>
                <Settings size={13} strokeWidth={1.8} />
                Administración
              </button>
            </div>

            <button
              className="nav-ham"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              {menuOpen
                ? <X size={16} strokeWidth={2} />
                : <Menu size={16} strokeWidth={2} />
              }
            </button>
          </nav>

          {/* ── Mobile overlay ── */}
          <div
            className={`mob-overlay${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* ── Mobile menu ── */}
          <div
            className={`mob-menu${menuOpen ? " open" : ""}`}
            role="menu"
            aria-label="Menú móvil"
          >
            {view === "catalog" && cartQty > 0 && (
              <button className="mob-btn primary" onClick={() => go("checkout")} role="menuitem">
                <span className="mob-btn-left">
                  <ShoppingBag size={15} strokeWidth={2} />
                  Carrito ({cartQty}) · {COP(cartTotal)}
                </span>
                <ChevronRight size={14} strokeWidth={1.8} />
              </button>
            )}
            <button className="mob-btn" onClick={() => go("track")} role="menuitem">
              <span className="mob-btn-left">
                <Package size={15} strokeWidth={1.8} />
                Mi pedido
              </span>
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>
            <button className="mob-btn" onClick={() => go("adminLogin")} role="menuitem">
              <span className="mob-btn-left">
                <Settings size={15} strokeWidth={1.8} />
                Administración
              </span>
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>
          </div>
        </>
      )}

      {/* ── Views ── */}
      {/* ── Views ── */}
<div key={view} className="view-enter">
<Suspense fallback={
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem",
    fontFamily: "var(--font)"
  }}>
    Cargando…
  </div>
}>
  {view === "home" && (
    <CollegeSelector onSelect={async (c) => {
      const enriched = await loadCollegeImages(c);
      setCollege(enriched); setCart([]); go("catalog", enriched);
    }} />
  )}
  {view === "catalog" && college && (
    <Catalog
      college={college} cart={cart} setCart={setCart}
      onCheckout={() => go("checkout")}
      onBack={() => window.history.back()}
      collegeStock={catalogStock}
      discounts={discounts[college?.id] || {}}
    />
  )}
  {view === "checkout" && college && (
    <Checkout
      college={college} cart={cart} setCart={setCart}
      onSuccess={(o) => { setSuccessOrder(o); setCart([]); go("success"); }}
      onBack={() => window.history.back()}
      toast={toast}
    />
  )}
  {view === "success" && successOrder && (
    <OrderSuccess order={successOrder} onHome={() => { setCollege(null); go("home", null); }} />
  )}
  {view === "track"      && <TrackOrder onBack={() => window.history.back()} />}
  {view === "adminLogin" && <AdminLogin onLogin={() => { setIsAdmin(true); go("admin"); }} onBack={() => window.history.back()} />}
  {view === "admin" && isAdmin && (
    <AdminPanel onLogout={() => { setIsAdmin(false); clearToken(); go("home"); }} toast={toast} />
  )}
</Suspense>
</div>

      {/* ── Footer global (todas las vistas públicas excepto admin) ── */}
      {isPublic && !["adminLogin"].includes(view) && (
        <footer style={{
          background: "#0f0e0d",
          borderTop: "2px solid #b89a6a",
          fontFamily: "'Jost', sans-serif",
          position: "relative",
        }}>
          <div style={{
            borderBottom: "1px solid rgba(255,255,255,.06)",
            padding: "clamp(24px,4vw,44px) clamp(16px,4vw,48px)",
          }}>
            <div style={{
              maxWidth: 1100, margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: "clamp(20px,3vw,32px)",
            }}>
              {/* Brand */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <img src={LOGO_TESSUTI} alt="Tessuti"
                    style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover",
                      border:"1px solid rgba(255,255,255,.12)" }}/>
                  <div>
                    <div style={{ color:"#fff", fontFamily:"'Cormorant Garamond',Georgia,serif",
                      fontSize:17, fontWeight:500, letterSpacing:".04em", lineHeight:1 }}>
                      Tessuti
                    </div>
                    <div style={{ color:"rgba(255,255,255,.25)", fontSize:9,
                      letterSpacing:".18em", textTransform:"uppercase", marginTop:2 }}>
                      Dotaciones
                    </div>
                  </div>
                </div>
                <p style={{ fontSize:12, fontWeight:300,
                  color:"rgba(255,255,255,.28)", lineHeight:1.75, maxWidth:220 }}>
                  Fabricantes de uniformes escolares de alta calidad para instituciones educativas de Medellín.
                </p>
              </div>

              {/* Contacto */}
              <div>
                <div style={{ fontSize:9, fontWeight:500, textTransform:"uppercase",
                  letterSpacing:".18em", color:"rgba(255,255,255,.25)", marginBottom:16 }}>
                  Contacto
                </div>
                <a href="https://wa.me/573122040973" target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:8,
                    color:"rgba(255,255,255,.35)", fontSize:12, fontWeight:300,
                    textDecoration:"none", marginBottom:10,
                    transition:"color 200ms ease" }}
                  onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.35)"}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  312 204 0973
                </a>
                <div style={{ display:"flex", alignItems:"center", gap:8,
                  color:"rgba(255,255,255,.28)", fontSize:12, fontWeight:300 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Medellín, Antioquia
                </div>
              </div>

              {/* Cómo funciona */}
              <div>
                <div style={{ fontSize:9, fontWeight:500, textTransform:"uppercase",
                  letterSpacing:".18em", color:"rgba(255,255,255,.25)", marginBottom:16 }}>
                  Cómo funciona
                </div>
                {[
                  ["01","Elige tu colegio"],
                  ["02","Selecciona las prendas"],
                  ["03","Adjunta el comprobante"],
                  ["04","Recibe tu pedido"],
                ].map(([n,t]) => (
                  <div key={n} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                    <span style={{ fontSize:9, fontWeight:500, color:"#b89a6a",
                      minWidth:18, letterSpacing:".04em" }}>{n}</span>
                    <span style={{ fontSize:12, fontWeight:300,
                      color:"rgba(255,255,255,.3)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Copyright */}
          <div style={{ padding:"14px clamp(16px,4vw,48px)",
            display:"flex", flexWrap:"wrap", gap:8,
            justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:11, fontWeight:500, color:"rgba(255,255,255,.6)" }}>
              © {new Date().getFullYear()} Dotaciones Tessuti · Todos los derechos reservados
            </div>
            <div style={{ fontSize:11, fontWeight:400, color:"rgba(255,255,255,.45)" }}>
              Fabricado con ♥ en Medellín
            </div>
          </div>
        </footer>
      )}

      {/* ── Cart FAB ── */}
      {view === "catalog" && cartQty > 0 && (
        <button
          className="cart-fab"
          onClick={() => go("checkout")}
          aria-label={`Ver carrito: ${cartQty} artículos, ${COP(cartTotal)}`}
        >
          <ShoppingBag size={15} strokeWidth={2} />
          <span className="cart-fab-qty">{cartQty}</span>
          {COP(cartTotal)}
        </button>
      )}

      {/* ── WhatsApp FAB ── */}
      {isPublic && (
        <a
          href="https://wa.me/573122040973?text=Hola%2C%20necesito%20ayuda%20con%20mi%20pedido%20de%20uniformes"
          target="_blank"
          rel="noreferrer"
          className="wa-fab"
          title="Soporte por WhatsApp"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={24} color="#fff" strokeWidth={2} fill="rgba(255,255,255,.15)" />
        </a>
      )}
    </>
  );
}