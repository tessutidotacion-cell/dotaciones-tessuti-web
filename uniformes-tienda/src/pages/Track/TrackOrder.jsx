import { useState } from "react";
import { trackOrder } from "../../services/api";
import { COP } from "../../utils/money";
import { waLink } from "../../constants/contact";

// Íconos SVG en lugar de emojis
const StatusIcon = ({ status, size = 22 }) => {
  const icons = {
    "Pago en validación": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    "Pago confirmado": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
      </svg>
    ),
    "Preparando pedido": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M12 2v2M4.93 4.93l1.41 1.41M2 12h2M4.93 19.07l1.41-1.41M12 20v2M19.07 19.07l-1.41-1.41M22 12h-2"/>
      </svg>
    ),
    "Listo para recoger": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
    "En camino": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
      </svg>
    ),
    "Entregado": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 10V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l2-1.14"/><path d="M16.5 9.4L7.55 4.24M3.29 7L12 12l8.71-5M12 22V12"/><path d="M18 21l2 2 4-4"/>
      </svg>
    ),
  };
  return icons[status] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
};

const STATUS_META = {
  "Pago en validación": { bg:"#fef9c3", color:"#854d0e", dot:"#eab308" },
  "Pago confirmado":    { bg:"#dbeafe", color:"#1e3a8a", dot:"#3b82f6" },
  "Preparando pedido":      { bg:"#f3e8ff", color:"#581c87", dot:"#a855f7" },
  "Listo para recoger": { bg:"#dcfce7", color:"#14532d", dot:"#22c55e" },
  "En camino":          { bg:"#ffedd5", color:"#7c2d12", dot:"#f97316" },
  "Entregado":          { bg:"#f0fdf4", color:"#065f46", dot:"#10b981" },
};

const ALL_STEPS       = ["Pago en validación","Pago confirmado","Preparando pedido","Listo para recoger","Entregado"];
const STEPS_DOMICILIO = ["Pago en validación","Pago confirmado","Preparando pedido","En camino","Entregado"];

function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation:"spin .7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

export default function TrackOrder({ onBack }) {
  const [id,       setId]       = useState("");
  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimId = id.trim().toUpperCase();
    if (!trimId) {
      setError("Ingresa el número de pedido.");
      return;
    }
    setLoading(true); setError(""); setOrder(null); setSearched(true);
    try {
      const { data } = await trackOrder(trimId);
      setOrder(data);
    } catch (err) {
      setError("No encontramos ese pedido. Verifica el número e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const steps       = ["domicilio","domicilio_coordinado"].includes(order?.delivery?.type) ? STEPS_DOMICILIO : ALL_STEPS;
  const currentStep = steps.indexOf(order?.status ?? "");
  const meta        = STATUS_META[order?.status ?? ""];

  return (
    <div style={{ minHeight:"calc(100vh - 56px)", background:"var(--bg,#faf9f7)", fontFamily:"var(--font,'DM Sans',sans-serif)" }}>
      <style>{`
        .tr-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
        .tr-card-head { padding:12px 16px; border-bottom:1px solid #e5e7eb; background:#fafafa; }
        .btn-back-tr {
          display:flex; align-items:center; gap:6px;
          background:none; border:none; cursor:pointer;
          color:#9ca3af; font-size:12px; padding:0; margin-bottom:24px;
          font-family:inherit; transition:color .15s; letter-spacing:.02em;
        }
        .btn-back-tr:hover { color:#374151; }
        .search-btn {
          width:100%; padding:11px; border-radius:7px; border:none;
          font-size:13px; font-weight:600; cursor:pointer; letter-spacing:.04em;
          display:flex; align-items:center; justify-content:center; gap:8px;
          font-family:inherit; transition:all .15s;
        }
      `}</style>

      <div style={{ maxWidth:580, margin:"0 auto", padding:"clamp(28px,5vw,52px) clamp(14px,4vw,24px)" }}>

        <button className="btn-back-tr" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver al inicio
        </button>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:"clamp(22px,4vw,30px)", fontWeight:600, color:"#111", letterSpacing:".03em", marginBottom:6 }}>
            Consultar pedido
          </h1>
          <p style={{ fontSize:13, color:"#9ca3af", lineHeight:1.65 }}>
            Ingresa el número de pedido para ver el estado y los detalles.
          </p>
        </div>

        {/* Formulario */}
        <div className="tr-card" style={{ marginBottom:14, padding:"clamp(14px,3vw,20px)", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".12em", marginBottom:7 }}>
              Número de pedido
            </label>
            <input
              value={id}
              onChange={e=>setId(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter" && handleSearch()}
              placeholder="Ej: PED-2024-1234"
              autoComplete="off"
              disabled={loading}
              style={{ fontFamily:"var(--font-mono,'DM Mono',monospace)", letterSpacing:".06em", textTransform:"uppercase", opacity: loading ? 0.6 : 1 }}
            />
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:5 }}>Lo encontrarás en tu correo de confirmación</div>
          </div>

          <button className="search-btn"
            onClick={handleSearch}
            disabled={loading || !id.trim()}
            style={{
              background: loading || !id.trim() ? "#f3f4f6" : "#111",
              color:      loading || !id.trim() ? "#9ca3af" : "#fff",
            }}>
            {loading ? <><Spinner size={14}/> Buscando...</> : "Buscar pedido"}
          </button>
        </div>

        {/* Error */}
        {error && !loading && (
          <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8,
            padding:"11px 14px", marginBottom:14,
            display:"flex", alignItems:"flex-start", gap:10, animation:"fadeUp .2s ease" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <span style={{ fontSize:13, color:"#991b1b", lineHeight:1.55 }}>{error}</span>
          </div>
        )}

        {/* Resultado */}
        {order && !loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeUp .3s ease" }}>

            {/* Badge estado */}
            <div style={{ background:meta?.bg||"#f3f4f6", border:`1px solid ${meta?.dot||"#d1d5db"}30`,
              borderRadius:10, padding:"clamp(14px,3vw,20px)",
              display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ width:48, height:48, borderRadius:"50%",
                background:`${meta?.dot||"#9ca3af"}18`, color:meta?.color||"#374151",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <StatusIcon status={order.status} size={24}/>
              </div>
              <div>
                <div style={{ fontSize:9, fontWeight:700, color:meta?.color, textTransform:"uppercase", letterSpacing:".14em", marginBottom:4 }}>
                  Estado actual
                </div>
                <div style={{ fontSize:"clamp(15px,3vw,19px)", fontWeight:600, color:meta?.color||"#111",
                  fontFamily:"var(--font-display,'Cormorant Garamond',serif)", letterSpacing:".02em" }}>
                  {order.status}
                </div>
              </div>
            </div>

            {/* Progreso */}
            <div className="tr-card">
              <div className="tr-card-head">
                <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".14em" }}>Seguimiento</div>
              </div>
              <div style={{ padding:"clamp(14px,3vw,18px)" }}>
                {steps.map((step, i) => {
                  const done   = i <= currentStep;
                  const active = i === currentStep;
                  const m      = STATUS_META[step];
                  return (
                    <div key={step} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%",
                          border:`2px solid ${done ? m?.dot||"#10b981" : "#e5e7eb"}`,
                          background: done ? m?.dot||"#10b981" : "#fff",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          transition:"all .3s" }}>
                          {done
                            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                            : <div style={{ width:7, height:7, borderRadius:"50%", background:"#e5e7eb" }}/>
                          }
                        </div>
                        {i < steps.length-1 && (
                          <div style={{ width:2, height:28, background:i<currentStep?"#d1fae5":"#f3f4f6", margin:"3px 0" }}/>
                        )}
                      </div>
                      <div style={{ paddingTop:4, paddingBottom:i<steps.length-1?24:0 }}>
                        <div style={{ fontSize:13, fontWeight:active?600:400, color:done?"#111":"#9ca3af" }}>{step}</div>
                        {active && <div style={{ fontSize:11, color:m?.color, marginTop:2, letterSpacing:".02em" }}>Estado actual</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalles */}
            <div className="tr-card">
              <div className="tr-card-head">
                <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".14em" }}>Detalles</div>
              </div>
              <div style={{ padding:"clamp(12px,3vw,16px)", display:"flex", flexDirection:"column", gap:0 }}>
                {[
                  ["N° Pedido",   order.id,            true,  false],
                  ["Institución", order.collegeName,   false, false],
                  ["Estudiante",  order.student?.name, false, false],
                  ["Grado",       order.student?.grade,false, false],
                  ["Entrega",     order.delivery?.type==="domicilio"
                    ? `Domicilio${order.delivery?.address?.street ? ` — ${order.delivery.address.street}` : ""}`
                    : "Recogida en tienda", false, false],
                  ["Total",       COP(order.total),    false, true],
                  ["Fecha",       new Date(order.createdAt).toLocaleDateString("es-CO",{year:"numeric",month:"long",day:"numeric"}), false, false],
                ].filter(([,v])=>v).map(([label, value, mono, bold]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", gap:10,
                    padding:"9px 0", borderBottom:"1px solid #f3f4f6" }}>
                    <span style={{ fontSize:12, color:"#9ca3af", flexShrink:0 }}>{label}</span>
                    <span style={{ fontSize:13, color:"#111", fontWeight:bold?700:500, textAlign:"right",
                      fontFamily:mono?"var(--font-mono,'DM Mono',monospace)":"inherit" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {order.items?.length > 0 && (
                <div style={{ borderTop:"1px solid #e5e7eb" }}>
                  <div style={{ padding:"10px 16px", fontSize:9, fontWeight:700, color:"#9ca3af",
                    textTransform:"uppercase", letterSpacing:".14em", borderBottom:"1px solid #f3f4f6" }}>
                    Artículos
                  </div>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"9px 16px", borderBottom:i<order.items.length-1?"1px solid #f3f4f6":"none",
                      background:i%2===0?"#fff":"#fafafa" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:"#111" }}>{item.name}</div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:1,
                          fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>
                          Talla {item.size} · ×{item.qty}
                        </div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{COP(item.price * item.qty)}</div>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 16px",
                    background:"#fafafa", borderTop:"1px solid #e5e7eb" }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>Total</span>
                    <span style={{ fontSize:14, fontWeight:700, fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>
                      {COP(order.total)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Soporte */}
            <a href={waLink(`Hola, consulto mi pedido ${order.id}`)}
              target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                padding:"11px", borderRadius:7, border:"1px solid #e5e7eb",
                background:"#fff", color:"#374151", fontSize:13, fontWeight:500,
                textDecoration:"none", letterSpacing:".02em", transition:"background .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#fafafa"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar soporte
            </a>
          </div>
        )}

        {/* Estado vacío */}
        {!searched && (
          <div style={{ textAlign:"center", padding:"32px 20px", color:"#d1d5db" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin:"0 auto 10px", display:"block" }}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p style={{ fontSize:13, color:"#9ca3af" }}>Ingresa los datos para consultar tu pedido</p>
          </div>
        )}
      </div>
    </div>
  );
}