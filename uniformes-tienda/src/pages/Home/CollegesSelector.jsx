import { useState, useEffect, useCallback } from "react";
import { LOGO_TESSUTI } from "../../assets";
import { DEMO_COLLEGES, EMPRESARIAL_CATALOG } from "../../data/colleges";
import fondoHero from "../../assets/TheNewSchool/banner_home.webp";

const getAllUniforms = (col) => col.sections?.length > 0
  ? col.sections.flatMap(s => s.uniforms)
  : col.uniforms;
const countItems    = (col) => getAllUniforms(col).length;
const getCategories = (col) => [...new Set(getAllUniforms(col).map(u => u.category))];

// ── Todos los estilos en un solo bloque — siempre montado ─────
const ALL_STYLES = `
  @font-face {
    font-family: 'Helvetica';
    src: url('/fuentes/helvetica-light-587ebe5a59211.woff') format('woff');
    font-weight: 300; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'Helvetica';
    src: url('/fuentes/Helvetica.woff') format('woff');
    font-weight: 400; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'Helvetica';
    src: url('/fuentes/Helvetica-Bold.woff') format('woff');
    font-weight: 600 700; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'Helvetica Compressed';
    src: url('/fuentes/helvetica-compressed-5871d14b6903a.woff') format('woff');
    font-weight: 400; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'Helvetica Rounded';
    src: url('/fuentes/helvetica-rounded-bold-5871d05ead8de.woff') format('woff');
    font-weight: 700; font-style: normal; font-display: swap;
  }

  :root {
    --canvas:   #f8f6f2;
    --ink:      #1c1c1c;
    --ink-2:    #3a3a3a;
    --ink-3:    #6b6b6b;
    --ink-4:    #a0a0a0;
    --gold:     #b89a6a;
    --gold-lt:  #e8d9c4;
    --surface:  #ffffff;
    --line:     rgba(28,28,28,.10);
    --line-2:   rgba(28,28,28,.16);
    --t-fast:   160ms;
    --t-mid:    300ms;
    --t-slow:   600ms;
    --ease-out: cubic-bezier(.16,1,.3,1);
  }

  /* ── Hero Undergold style ── */
  .hl-hero {
    position:relative;
    width:100%;
    height:calc(100vh - 64px);
    overflow:hidden;
    display:flex;
    align-items:flex-end;
  }

  .hl-hero-img {
    position:absolute;inset:0;
    width:100%;height:100%;
    object-fit:cover;object-position:center center;
    transform:scale(1.02);
    transition:transform 1.2s cubic-bezier(.16,1,.3,1);
  }
  .hl-hero-img.in { transform:scale(1); }

  .hl-hero-overlay {
    position:absolute;inset:0;
    background:linear-gradient(
      to bottom,
      rgba(0,0,0,.06) 0%,
      rgba(0,0,0,.08) 40%,
      rgba(0,0,0,.38) 100%
    );
    pointer-events:none;
  }
  /* Subtle vignette for cinematic feel */
  .hl-hero::after {
    content:'';
    position:absolute;inset:0;
    background:radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.18) 100%);
    pointer-events:none;
    z-index:1;
  }

  /* Logo centrado en la imagen */
  .hl-hero-logo {
    position:absolute;
    top:50%;left:50%;
    transform:translate(-50%,-60%) scale(.94);
    display:flex;flex-direction:column;align-items:center;gap:14px;
    opacity:0;
    z-index:2;
    transition:opacity .9s var(--ease-out) .15s, transform .9s var(--ease-out) .15s;
  }
  .hl-hero-logo.in {
    opacity:1;
    transform:translate(-50%,-60%) scale(1);
  }
  .hl-hero-logo img {
    width:clamp(140px,22vw,180px);
    height:clamp(140px,22vw,180px);
    object-fit:contain;
    filter:drop-shadow(0 4px 24px rgba(0,0,0,.35));
  }
  .hl-hero-brand {
    font-family:'Helvetica Compressed','Helvetica',Arial,sans-serif;
    font-size:clamp(26px,5vw,38px);
    font-weight:400;
    letter-spacing:.28em;
    text-transform:uppercase;
    color:#fff;
    text-shadow:0 2px 16px rgba(0,0,0,.3);
  }

  /* Botones inferiores */
  .hl-hero-btns {
    position:relative;z-index:2;
    width:100%;
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    padding:0 clamp(40px,8vw,120px) clamp(36px,6vh,64px);
    opacity:0;transform:translateY(14px);
    transition:opacity .7s var(--ease-out) .3s, transform .7s var(--ease-out) .3s;
  }
  .hl-hero-btns.in { opacity:1;transform:none; }

  @media (max-width:640px) {
    .hl-hero { height:100vh; height:100dvh; min-height:0; }
    .hl-hero-logo img { width:clamp(100px,18vw,140px); height:clamp(100px,18vw,140px); }
    .hl-hero-btns {
      flex-direction:column;
      align-items:center;
      gap:10px;
      padding:0 28px 22vh;
    }
    .hl-hero-nav-btn {
      font-size:11px;
      letter-spacing:.28em;
      padding:14px 0 20px;
      border-bottom:none;
      border:none;
      border-radius:4px;
      background:rgba(10,8,6,.62);
      backdrop-filter:blur(6px);
      width:100%;
      max-width:280px;
      text-align:center;
      display:flex;
      align-items:center;
      justify-content:center;
      text-shadow:none;
      color:rgba(255,255,255,.92);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.12),
        inset 0 -1px 0 rgba(255,255,255,.06),
        inset 1px 0 0 rgba(184,154,106,.3),
        inset -1px 0 0 rgba(184,154,106,.3),
        0 8px 32px rgba(0,0,0,.3);
      transition:background .3s ease, box-shadow .3s ease, color .3s ease;
      position:relative;
    }
    .hl-hero-nav-btn::after {
      content:'';
      position:absolute;
      bottom:0; left:50%;
      transform:translateX(-50%) scaleX(0);
      width:40%; height:1px;
      background:var(--gold);
      transition:transform .3s var(--ease-out);
    }
    .hl-hero-nav-btn:active {
      background:rgba(10,8,6,.62);
      color:#fff;
    }
    .hl-hero-nav-btn:active::after {
      transform:translateX(-50%) scaleX(1);
    }
  }

  .hl-hero-nav-btn {
    background:none;border:none;cursor:pointer;
    font-family:'Helvetica',Arial,sans-serif;
    font-size:clamp(11px,1.6vw,13px);
    font-weight:500;
    letter-spacing:.18em;text-transform:uppercase;
    color:#fff;
    padding-bottom:6px;
    border-bottom:1px solid rgba(255,255,255,.45);
    text-shadow:0 1px 8px rgba(0,0,0,.4);
    transition:all .35s cubic-bezier(.16,1,.3,1);
    line-height:1;
    position:relative;
  }
  .hl-hero-nav-btn::after {
    content:'';
    position:absolute;
    bottom:-1px;left:0;right:0;
    height:1px;
    background:var(--gold);
    transform:scaleX(0);
    transform-origin:center;
    transition:transform .35s cubic-bezier(.16,1,.3,1);
  }
  .hl-hero-nav-btn:hover {
    border-color:transparent;
    letter-spacing:.22em;
  }
  .hl-hero-nav-btn:hover::after {
    transform:scaleX(1);
  }

  /* ── Colegios section ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}

  .cs-header{
    background:rgba(255,255,255,.95);backdrop-filter:blur(12px);
    border-bottom:1px solid var(--line);
    padding:14px clamp(16px,5vw,48px);
    display:flex;align-items:center;gap:16px;
    position:sticky;top:64px;z-index:10;
  }
  .cs-back{
    background:none;border:1px solid var(--line-2);border-radius:6px;
    width:32px;height:32px;display:flex;align-items:center;justify-content:center;
    cursor:pointer;color:var(--ink-3);flex-shrink:0;
    transition:all var(--t-fast) ease;
  }
  .cs-back:hover{border-color:var(--ink);color:var(--ink);background:var(--canvas)}

  /* ── Buscador ── */
  .cs-search-wrap {
    flex:1;max-width:320px;position:relative;
  }
  .cs-search-wrap svg {
    position:absolute;left:11px;top:50%;transform:translateY(-50%);
    pointer-events:none;
  }
  .cs-search {
    width:100%;height:34px;
    padding:0 12px 0 34px;
    border:1px solid var(--line-2);border-radius:6px;
    background:var(--canvas);
    font-family:'Helvetica',Arial,sans-serif;font-size:12px;font-weight:300;
    color:var(--ink);
    outline:none;
    transition:border-color var(--t-fast) ease,box-shadow var(--t-fast) ease;
  }
  .cs-search::placeholder { color:var(--ink-4); }
  .cs-search:focus {
    border-color:var(--gold);
    box-shadow:0 0 0 3px rgba(184,154,106,.12);
  }
  .cs-no-results {
    grid-column:1/-1;
    display:flex;flex-direction:column;align-items:center;
    padding:clamp(40px,6vw,80px) 24px;gap:10px;
    font-family:'Helvetica',Arial,sans-serif;
    color:var(--ink-4);text-align:center;
  }
  .cs-no-results-title {
    font-size:13px;font-weight:500;color:var(--ink-3);letter-spacing:.04em;
  }
  .cs-no-results-sub { font-size:12px;font-weight:300;line-height:1.6; }

  .cs-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));
    gap:clamp(12px,2vw,20px);
  }

  .cs-card{
    background:var(--surface);border:1px solid var(--line);border-radius:12px;
    overflow:hidden;cursor:pointer;text-align:left;
    transition:border-color .35s ease,box-shadow .45s cubic-bezier(.16,1,.3,1),transform .45s cubic-bezier(.16,1,.3,1);
    display:flex;flex-direction:column;
    animation:fadeUp .4s var(--ease-out) both;
  }
  .cs-card:hover{
    border-color:var(--gold);
    box-shadow:0 16px 56px rgba(28,24,20,.12),0 0 0 1px var(--gold);
    transform:translateY(-6px);
  }

  .cs-banner{
    padding:0;
    display:flex;align-items:center;justify-content:center;
    height:clamp(160px,22vw,220px);position:relative;
    transition:background var(--t-mid) ease;
    overflow:hidden;
    background:#ffffff;
  }

  .cs-badge{
    position:absolute;top:12px;right:12px;
    background:var(--canvas);border:1px solid var(--line-2);
    border-radius:20px;padding:3px 10px;
    font-family:'Helvetica',Arial,sans-serif;font-size:9px;font-weight:500;
    color:var(--ink-3);letter-spacing:.08em;text-transform:uppercase;
    transition:all var(--t-mid) ease;
  }
  .cs-card:hover .cs-badge{background:rgba(184,154,106,.12);border-color:var(--gold);color:var(--gold)}

  .cs-logo-img{
    width:100%;height:100%;
    object-fit:contain;
    padding:10px;
    transition:transform var(--t-mid) var(--ease-out);
  }
  .cs-card:hover .cs-logo-img{transform:scale(1.06)}

  .cs-logo-placeholder{
    width:clamp(72px,11vw,100px);height:clamp(72px,11vw,100px);
    border-radius:50%;background:var(--gold-lt);
    display:flex;align-items:center;justify-content:center;
    font-family:'Helvetica Compressed','Helvetica',Arial,sans-serif;
    font-size:clamp(26px,4vw,38px);font-weight:500;color:var(--gold);
    transition:transform var(--t-mid) var(--ease-out);
  }
  .cs-card:hover .cs-logo-placeholder{transform:scale(1.06)}

  .cs-body{padding:clamp(16px,2.5vw,22px) clamp(16px,3vw,24px) clamp(18px,3vw,24px)}

  .cs-name{
    font-family:'Helvetica Compressed','Helvetica',Arial,sans-serif;
    font-size:clamp(15px,2vw,18px);font-weight:500;
    color:var(--ink);margin-bottom:6px;letter-spacing:.01em;line-height:1.25;
  }
  .cs-desc{
    font-family:'Helvetica',Arial,sans-serif;font-size:12px;font-weight:300;
    color:var(--ink-3);line-height:1.65;margin-bottom:14px;
  }
  .cs-cats{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px}
  .cs-cat{
    font-family:'Helvetica',Arial,sans-serif;font-size:9px;font-weight:500;
    letter-spacing:.12em;text-transform:uppercase;
    padding:3px 9px;border-radius:2px;
    background:var(--canvas);color:var(--ink-3);border:1px solid var(--line);
    transition:all var(--t-fast) ease;
  }
  .cs-card:hover .cs-cat{background:rgba(184,154,106,.08);border-color:var(--gold-lt);color:var(--gold)}

  .cs-footer{
    display:flex;align-items:center;justify-content:space-between;
    padding-top:clamp(12px,2vw,16px);border-top:1px solid var(--line);
  }
  .cs-cta{
    font-family:'Helvetica',Arial,sans-serif;font-size:10px;font-weight:500;
    letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);
    transition:color var(--t-fast) ease;
  }
  .cs-card:hover .cs-cta{color:var(--gold)}
  .cs-arrow{
    width:28px;height:28px;border-radius:50%;border:1px solid var(--line-2);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    transition:all var(--t-mid) var(--ease-out);
  }
  .cs-card:hover .cs-arrow{background:var(--gold);border-color:var(--gold);transform:translateX(2px)}
  .cs-card:hover .cs-arrow svg{stroke:#fff}

`;

export default function CollegeSelector({ onSelect }) {
  const [section, setSection] = useState(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [search,  setSearch]  = useState("");
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Restore section from history state on mount
  useEffect(() => {
    const s = window.history.state?.section;
    if (s) setSection(s);
  }, []);

  const goToSection = useCallback((s) => {
    setSection(s);
    if (s) window.history.pushState({ view: "home", section: s }, "", "#home");
  }, []);

  const goBack = () => {
    window.history.back();
  };

  // Handle internal back (colegios → hero) when CollegesSelector stays mounted
  useEffect(() => {
    const onPop = () => {
      const s = window.history.state?.section || null;
      setSection(s);
      if (!s) {
        setVisible(false);
        setTimeout(() => setVisible(true), 60);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <>
      <style>{ALL_STYLES}</style>

      {/* ── INICIO ── */}
      {!section && (
        <div className={`hl-hero`}>
          <img
            src={fondoHero}
            alt="Tessuti"
            className={`hl-hero-img${visible ? " in" : ""}`}
            fetchpriority="high"
            decoding="async"
          />

          {/* Overlay degradado */}
          <div className="hl-hero-overlay" />

          {/* Logo centrado */}
          <div className={`hl-hero-logo${visible ? " in" : ""}`}>
            <img src={LOGO_TESSUTI} alt="Dotaciones Tessuti" />
            <span className="hl-hero-brand"></span>
          </div>

          {/* Botones inferiores — estilo Undergold */}
          <div className={`hl-hero-btns${visible ? " in" : ""}`}>
            <button className="hl-hero-nav-btn" onClick={() => goToSection("colegios")}>
              Uniformes Colegio
            </button>
            <button className="hl-hero-nav-btn" onClick={() => onSelect(EMPRESARIAL_CATALOG)}>
              Dotación Empresarial
            </button>
          </div>
        </div>
      )}

      {/* ── COLEGIOS ── */}
      {section === "colegios" && (
        <div style={{minHeight:"calc(100vh - 64px)",background:"var(--canvas)"}}>
          <div className="cs-header">
            <button className="cs-back" onClick={goBack} aria-label="Volver">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <img src={LOGO_TESSUTI} alt="Tessuti" style={{width:28,height:28,objectFit:"contain",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Helvetica',Arial,sans-serif",fontSize:9,fontWeight:500,
                letterSpacing:".18em",textTransform:"uppercase",color:"var(--gold)",marginBottom:2}}>
                Uniformes Colegio
              </div>
              <div style={{fontFamily:"'Helvetica Compressed','Helvetica',Arial,sans-serif",fontSize:14,fontWeight:500,color:"var(--ink)"}}>
                Selecciona tu institución
              </div>
            </div>
            <div className="cs-search-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="cs-search"
                type="search"
                placeholder="Buscar institución…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Buscar institución"
              />
            </div>
          </div>

          <div style={{maxWidth:1100,margin:"0 auto",padding:"clamp(24px,4vw,48px) clamp(14px,4vw,36px)"}}>
            <div className="cs-grid">
              {(() => {
                const q = search.trim().toLowerCase();
                const filtered = q
                  ? DEMO_COLLEGES.filter(c =>
                      c.name.toLowerCase().includes(q) ||
                      c.description?.toLowerCase().includes(q)
                    )
                  : DEMO_COLLEGES;
                if (filtered.length === 0) return (
                  <div className="cs-no-results">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.2">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <div className="cs-no-results-title">Sin resultados</div>
                    <div className="cs-no-results-sub">No encontramos una institución con ese nombre.<br/>Intenta con otro término.</div>
                  </div>
                );
                return filtered.map((col, i) => {
                  const disabled = col.id === "2";
                  return (
                  <button key={col.id} className="cs-card"
                    onClick={()=>{ if(!disabled) onSelect(col); }}
                    onMouseEnter={()=>{ if(!disabled) setHovered(col.id); }}
                    onMouseLeave={()=>setHovered(null)}
                    disabled={disabled}
                    style={{
                      animationDelay:`${i*80}ms`,
                      opacity: disabled ? 0.5 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}>

                    <div className="cs-banner"
                      style={{background: hovered===col.id
                        ? `linear-gradient(135deg,${col.primaryColor}18 0%,${col.primaryColor}08 100%)`
                        : "var(--canvas)"}}>
                      {col.logo
                        ? <img src={col.logo} alt={col.name} className="cs-logo-img"/>
                        : <div className="cs-logo-placeholder">
                            {col.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                          </div>
                      }
                      <span className="cs-badge">{disabled ? "Próximamente" : `${countItems(col)} prendas`}</span>
                    </div>

                    <div className="cs-body">
                      <div className="cs-name">{col.name}</div>
                      <div className="cs-desc">{col.description}</div>
                      <div className="cs-cats">
                        {getCategories(col).map(cat=>(
                          <span key={cat} className="cs-cat">{cat}</span>
                        ))}
                      </div>
                      <div className="cs-footer">
                        <span className="cs-cta">{disabled ? "Próximamente" : "Ver catálogo"}</span>
                        {!disabled && (
                          <div className="cs-arrow">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  );
                });
              })()}
            </div>
          </div>


        </div>
      )}

    </>
  );
}