import React, { useState } from "react";
import { COP } from "../../utils/money";
import { LOGO_TESSUTI } from "../../assets";

export default function OrderSuccess({ order, onHome }) {
  const [copied, setCopied] = useState(false);
  const orderId = order?.orderId || order?.id || "—";

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 56px)",
      background: "var(--bg, #faf9f7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "clamp(24px,6vw,60px) clamp(16px,4vw,24px)",
      fontFamily: "var(--font, 'DM Sans', sans-serif)",
    }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes drawLine { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }

        .os-wrap { width:100%; max-width:440px; animation:fadeUp .4s ease both; }

        .os-id-box {
          background:#fff; border:1px solid #e5e7eb; border-radius:8px;
          padding:13px 15px; display:flex; align-items:center;
          justify-content:space-between; gap:12px; flex-wrap:wrap;
        }
        .os-copy-btn {
          background:none; border:1px solid #e5e7eb; border-radius:5px;
          padding:5px 11px; font-size:11px; font-weight:600; letter-spacing:.03em;
          color:#6b7280; cursor:pointer; white-space:nowrap;
          transition:all .15s; font-family:inherit;
        }
        .os-copy-btn:hover          { border-color:#1a1a1a; color:#1a1a1a; }
        .os-copy-btn.copied         { border-color:#059669; color:#059669; background:#f0fdf4; }

        .os-btn-primary {
          width:100%; padding:12px; border-radius:7px; border:none;
          background:#1a1a1a; color:#fff; font-size:13px; font-weight:600;
          letter-spacing:.04em; cursor:pointer; transition:background .15s;
          font-family:inherit;
        }
        .os-btn-primary:hover { background:#333; }

        .os-btn-secondary {
          width:100%; padding:11px; border-radius:7px;
          border:1px solid #e5e7eb; background:#fff;
          color:#374151; font-size:13px; font-weight:500; letter-spacing:.02em;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          gap:8px; text-decoration:none; transition:background .15s; font-family:inherit;
        }
        .os-btn-secondary:hover { background:#fafafa; }

        .os-step { display:flex; gap:14px; align-items:flex-start; }
        .os-step-col { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:18px; }
        .os-dot { width:6px; height:6px; border-radius:50%; background:#1a1a1a; margin-top:7px; }
        .os-line { width:1px; flex:1; min-height:22px; background:#e5e7eb; margin:4px 0; }
      `}</style>

      <div className="os-wrap">

        {/* Logo + check */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <img src={LOGO_TESSUTI} alt="Tessuti"
            style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover",
              border:"1px solid #e5e7eb", margin:"0 auto 16px" }}/>

          <div style={{ width:44, height:44, borderRadius:"50%",
            border:"1.5px solid #1a1a1a", margin:"0 auto 16px",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1a1a1a" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray:60, strokeDashoffset:0,
                  animation:"drawLine .45s .05s ease both" }}/>
            </svg>
          </div>

          <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af",
            textTransform:"uppercase", letterSpacing:".18em", marginBottom:8 }}>
            Pedido recibido
          </div>

          <h1 style={{ fontFamily:"var(--font-display,'Cormorant Garamond',serif)",
            fontSize:"clamp(22px,4vw,30px)", fontWeight:600, color:"#1a1a1a",
            letterSpacing:".025em", lineHeight:1.2, marginBottom:8 }}>
            Pedido confirmado
          </h1>

          <p style={{ fontSize:13, color:"#9ca3af", lineHeight:1.65,
            maxWidth:300, margin:"0 auto" }}>
            Validaremos tu pago y te notificaremos al número registrado.
          </p>
        </div>

        {/* Separador */}
        <div style={{ width:36, height:1, background:"#e5e7eb", margin:"0 auto 24px" }}/>

        {/* N° pedido */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af",
            textTransform:"uppercase", letterSpacing:".14em", marginBottom:9 }}>
            Número de pedido
          </div>
          <div className="os-id-box">
            <div>
              <div style={{ fontFamily:"var(--font-mono,'DM Mono',monospace)",
                fontSize:"clamp(15px,3vw,19px)", fontWeight:500,
                color:"#1a1a1a", letterSpacing:".08em" }}>
                {orderId}
              </div>
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>
                Guárdalo para consultar tu pedido
              </div>
            </div>
            <button className={`os-copy-btn${copied?" copied":""}`} onClick={handleCopy}>
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Próximos pasos */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af",
            textTransform:"uppercase", letterSpacing:".14em", marginBottom:14 }}>
            Próximos pasos
          </div>
          {[
            ["Validación de pago",   "En menos de 24 horas hábiles"],
            ["Preparando tu pedido", "Alistamos y empacamos tu pedido una vez confirmado el pago"],
            ["Notificación",         "Te avisamos cuando tu pedido esté listo"],
          ].map(([title, sub], i, arr) => (
            <div key={title} className="os-step">
              <div className="os-step-col">
                <div className="os-dot"/>
                {i < arr.length - 1 && <div className="os-line"/>}
              </div>
              <div style={{ paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a", lineHeight:1.3 }}>{title}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2, lineHeight:1.55 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        {order?.items?.length > 0 && (
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af",
              textTransform:"uppercase", letterSpacing:".14em", marginBottom:9 }}>
              Resumen
            </div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"8px 12px",
                  borderBottom: i < order.items.length-1 ? "1px solid #f3f4f6" : "none",
                  background: i%2===0 ? "#fff" : "#fafafa" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:"#1a1a1a" }}>{item.name}</div>
                    <div style={{ fontSize:10, color:"#9ca3af", marginTop:1,
                      fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>
                      T.{item.size} · ×{item.qty}
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#1a1a1a",
                    fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>
                    {COP(item.price * item.qty)}
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between",
                padding:"9px 12px", background:"#fafafa", borderTop:"1px solid #e5e7eb" }}>
                <span style={{ fontSize:12, fontWeight:600, color:"#1a1a1a" }}>Total</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#1a1a1a",
                  fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>
                  {COP(order.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          <button className="os-btn-primary" onClick={onHome}>
            Volver al inicio
          </button>
          <a href={`https://wa.me/573122040973?text=Hola,%20mi%20pedido%20es%20${orderId}`}
            target="_blank" rel="noreferrer" className="os-btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contactar por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}