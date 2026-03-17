import { useState, useEffect } from "react";
import { LOGO_TESSUTI } from "../../assets";
import { DEMO_COLLEGES } from "../../data/colleges";
import fondoHero from "../../assets/banner_home.webp";

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
      rgba(0,0,0,.04) 0%,
      rgba(0,0,0,.10) 60%,
      rgba(0,0,0,.32) 100%
    );
    pointer-events:none;
  }

  /* Logo centrado en la imagen */
  .hl-hero-logo {
    position:absolute;
    top:50%;left:50%;
    transform:translate(-50%,-60%);
    display:flex;flex-direction:column;align-items:center;gap:14px;
    opacity:0;
    transition:opacity .7s var(--ease-out), transform .7s var(--ease-out);
  }
  .hl-hero-logo.in {
    opacity:1;
    transform:translate(-50%,-60%) translateY(0);
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
    .hl-hero { height:60vh; min-height:420px; }
    .hl-hero-logo img { width:clamp(100px,18vw,140px); height:clamp(100px,18vw,140px); }
    .hl-hero-btns {
      flex-direction:column;
      align-items:center;
      gap:10px;
      padding:0 28px 14vh;
    }
    .hl-hero-nav-btn {
      font-size:10px;
      letter-spacing:.28em;
      padding:12px 0 18px;
      border-bottom:none;
      border:none;
      border-radius:2px;
      background:rgba(10,8,6,.55);
      width:100%;
      max-width:260px;
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
    padding-bottom:4px;
    border-bottom:1px solid rgba(255,255,255,.55);
    text-shadow:0 1px 8px rgba(0,0,0,.4);
    transition:border-color .2s ease, opacity .2s ease;
    line-height:1;
  }
  .hl-hero-nav-btn:hover {
    border-color:rgba(255,255,255,1);
    opacity:.85;
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
    transition:border-color var(--t-mid) ease,box-shadow var(--t-mid) ease,transform var(--t-mid) var(--ease-out);
    display:flex;flex-direction:column;
    animation:fadeUp .4s var(--ease-out) both;
  }
  .cs-card:hover{
    border-color:var(--gold);
    box-shadow:0 12px 48px rgba(28,24,20,.10),0 0 0 1px var(--gold);
    transform:translateY(-4px);
  }

  .cs-banner{
    padding:clamp(28px,5vw,44px) 24px;
    display:flex;align-items:center;justify-content:center;
    min-height:clamp(140px,18vw,190px);position:relative;
    transition:background var(--t-mid) ease;
    overflow:hidden;
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
    width:clamp(72px,11vw,100px);height:clamp(72px,11vw,100px);object-fit:contain;
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

  /* ── Empresarial ── */
  .emp-wrap{
    min-height:calc(100vh - 64px);background:var(--canvas);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:clamp(40px,8vw,80px) 24px;position:relative;overflow:hidden;
    animation:fadeUp .4s var(--ease-out) both;
    font-family:'Helvetica',Arial,sans-serif;
  }
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

  const goBack = () => {
    setSection(null);
    setVisible(false);
    setTimeout(() => setVisible(true), 60);
  };

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
            <button className="hl-hero-nav-btn" onClick={() => setSection("colegios")}>
              Uniformes Colegio
            </button>
            <button className="hl-hero-nav-btn" onClick={() => setSection("empresarial")}>
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
                return filtered.map((col, i) => (
                <button key={col.id} className="cs-card"
                  onClick={()=>onSelect(col)}
                  onMouseEnter={()=>setHovered(col.id)}
                  onMouseLeave={()=>setHovered(null)}
                  style={{animationDelay:`${i*80}ms`}}>

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
                    <span className="cs-badge">{countItems(col)} prendas</span>
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
                      <span className="cs-cta">Ver catálogo</span>
                      <div className="cs-arrow">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ));
              })()}
            </div>
          </div>


        </div>
      )}

      {/* ── EMPRESARIAL ── */}
      {section === "empresarial" && (
        <div className="emp-wrap">
          <button onClick={goBack}
            style={{position:"absolute",top:"clamp(20px,4vw,36px)",left:"clamp(16px,5vw,48px)",
              background:"none",border:"1px solid var(--line-2)",borderRadius:6,
              width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",color:"var(--ink-3)",transition:"all 160ms ease"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--ink)";e.currentTarget.style.color="var(--ink)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--line-2)";e.currentTarget.style.color="var(--ink-3)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>

          <img src={LOGO_TESSUTI} alt="Tessuti"
            style={{width:"clamp(64px,11vw,90px)",height:"clamp(64px,11vw,90px)",objectFit:"contain",marginBottom:28,opacity:.35}}/>
          <div style={{fontSize:9,fontWeight:500,color:"var(--gold)",letterSpacing:".24em",textTransform:"uppercase",marginBottom:16}}>
            Próximamente
          </div>
          <h2 style={{fontFamily:"'Helvetica Compressed','Helvetica',Arial,sans-serif",fontSize:"clamp(22px,4vw,32px)",fontWeight:500,
            color:"var(--ink)",marginBottom:14,textAlign:"center",letterSpacing:".01em",lineHeight:1.2}}>
            Dotación Empresarial
          </h2>
          <p style={{fontSize:13,fontWeight:300,color:"var(--ink-3)",textAlign:"center",maxWidth:320,lineHeight:1.75,marginBottom:32}}>
            Estamos preparando el catálogo de dotaciones para empresas.<br/>
            Por ahora contáctanos directamente.
          </p>
          <a href="https://wa.me/573122040973" target="_blank" rel="noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:10,background:"var(--ink)",color:"#fff",
              padding:"13px clamp(20px,4vw,32px)",borderRadius:4,fontSize:11,fontWeight:500,
              textDecoration:"none",letterSpacing:".16em",textTransform:"uppercase",
              transition:"background 200ms ease,transform 200ms ease",
              boxShadow:"0 4px 20px rgba(28,24,20,.2)"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#333";e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--ink)";e.currentTarget.style.transform="none"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Contactar por WhatsApp
          </a>
        </div>
      )}
    </>
  );
}