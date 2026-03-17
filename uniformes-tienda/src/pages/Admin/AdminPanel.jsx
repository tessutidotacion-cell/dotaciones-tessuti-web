import React, { useState, useEffect, useCallback } from "react";
import {
  getOrders, updateOrderStatus, updateDeliveryNote,
  getStats, getStock, updateStock, clearToken,
  getDiscounts, setDiscount, removeDiscount,
} from "../../services/api";
import { LOGO_TESSUTI } from "../../assets";
import { COP } from "../../utils/money";

// ── Constantes de estado ──────────────────────────────────────
const STATUS_ORDER = ["Pago en validación","Pago confirmado","Preparando pedido","Listo para recoger","Entregado"];
const STATUS_ORDER_DOMICILIO = ["Pago en validación","Pago confirmado","Preparando pedido","En camino","Entregado"];
const STATUS_META = {
  "Pago en validación": { bg:"#fef9c3", color:"#854d0e", dot:"#eab308" },
  "Pago confirmado":    { bg:"#dbeafe", color:"#1e3a8a", dot:"#3b82f6" },
  "Preparando pedido":      { bg:"#f3e8ff", color:"#581c87", dot:"#a855f7" },
  "Listo para recoger": { bg:"#dcfce7", color:"#14532d", dot:"#22c55e" },
  "En camino":          { bg:"#ffedd5", color:"#7c2d12", dot:"#f97316" },
  "Entregado":          { bg:"#f0fdf4", color:"#065f46", dot:"#10b981" },
};
const getStatusOptions = (deliveryType) =>
  (deliveryType === "domicilio" || deliveryType === "domicilio_coordinado") ? STATUS_ORDER_DOMICILIO : STATUS_ORDER;

import { DEMO_COLLEGES } from "../../data/colleges";

const getAllUniforms = (col) => col.sections?.length > 0
  ? col.sections.flatMap(s => s.uniforms.map(u => ({ ...u, sectionName: s.name })))
  : col.uniforms.map(u => ({ ...u, sectionName: null }));

// ── Helpers UI ────────────────────────────────────────────────
function Spinner({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
      style={{ animation: "spin .7s linear infinite", flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function Badge({ status }) {
  const m = STATUS_META[status] || { bg:"#f3f4f6", color:"#374151", dot:"#9ca3af" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      background:m.bg, color:m.color, padding:"3px 9px", borderRadius:20,
      fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:m.dot, flexShrink:0 }} />
      {status}
    </span>
  );
}

const COORDINATION_PRESETS = [
  "Dirección confirmada",
  "Fecha de entrega acordada",
  "Punto de encuentro definido",
  "Cliente recoge en punto alterno",
  "Envío por transportadora",
  "En espera de respuesta",
];

// ── Modal detalle pedido ──────────────────────────────────────
function OrderDetailModal({ order, onClose, onOrderUpdate }) {
  const isCoord = order?.delivery?.type === "domicilio_coordinado";
  const [noteText,   setNoteText]   = useState(order?.delivery?.coordinationNote || "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved,  setNoteSaved]  = useState(false);

  if (!order) return null;
  const deliveryFee = order.delivery?.type === "domicilio" ? 15000 : 0;

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const { data } = await updateDeliveryNote(order.id, noteText);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
      if (onOrderUpdate) onOrderUpdate(data);
    } catch (e) {
      alert("No se pudo guardar: " + e.message);
    } finally {
      setSavingNote(false);
    }
  };
  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:9000,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:520,
          maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 48px rgba(0,0,0,.3)",
          animation:"fadeUp .2s ease" }}>
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #e5e7eb",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          position:"sticky", top:0, background:"#fff", zIndex:1 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".1em", marginBottom:2 }}>Detalle del pedido</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#111", fontFamily:"monospace", letterSpacing:1 }}>{order.id}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:"#f3f4f6",
            border:"1px solid #e5e7eb", fontSize:16, color:"#6b7280", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Badge status={order.status} />
            <span style={{ fontSize:11, color:"#9ca3af" }}>
              {new Date(order.createdAt).toLocaleDateString("es-CO",{ year:"numeric", month:"long", day:"numeric" })}
            </span>
          </div>

          {/* Info colegio + entrega */}
          <div style={{ background:"#f9fafb", borderRadius:8, padding:"12px 14px",
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px", fontSize:13 }}>
            <div>
              <span style={{ color:"#9ca3af", fontSize:11, fontWeight:600, display:"block", marginBottom:2 }}>Institución</span>
              {order.collegeName}
            </div>
            <div>
              <span style={{ color:"#9ca3af", fontSize:11, fontWeight:600, display:"block", marginBottom:2 }}>Entrega</span>
              {order.delivery?.type === "domicilio"
                ? <span>Domicilio<br /><span style={{ fontSize:11, color:"#9ca3af" }}>{order.delivery?.address?.street}, {order.delivery?.address?.neighborhood}</span></span>
                : order.delivery?.type === "domicilio_coordinado"
                  ? <span>Fuera de zona<br /><span style={{ fontSize:11, color: order.delivery?.coordinationNote ? "#059669" : "#9ca3af" }}>{order.delivery?.coordinationNote || "Pendiente coordinar"}</span></span>
                  : "Recogida en tienda"}
            </div>
          </div>

          {/* Domicilio por coordinar */}
          {isCoord && (
            <div style={{ border:"1px solid #fdba74", borderRadius:8, overflow:"hidden" }}>
              {/* Cabecera */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:10,
                background:"#fff7ed", padding:"12px 14px" }}>
                <svg style={{ flexShrink:0, marginTop:1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#9a3412", letterSpacing:".04em", textTransform:"uppercase", marginBottom:6 }}>
                    Domicilio por coordinar
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <div style={{ fontSize:12, color:"#7c2d12", fontWeight:600 }}>{order.guardian?.name}</div>
                    <a href={`tel:${order.guardian?.phone}`} style={{ fontSize:12, color:"#ea580c", textDecoration:"none", fontWeight:600 }}>
                      {order.guardian?.phone}
                    </a>
                    <a href={`https://wa.me/57${order.guardian?.phone?.replace(/\D/g,"")}?text=Hola%20${encodeURIComponent(order.guardian?.name?.split(" ")[0] || "")}%2C%20soy%20de%20Tessuti%20Dotaciones.%20Tu%20pedido%20${order.id}%20est%C3%A1%20listo%2C%20%C2%BFnos%20podr%C3%ADas%20dar%20tu%20direcci%C3%B3n%20para%20coordinar%20el%20env%C3%ADo%3F`}
                      target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#16a34a", textDecoration:"none", marginTop:2 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.492a.5.5 0 00.6.601l5.701-1.463A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.681-.516-5.21-1.416l-.375-.222-3.884.997 1.028-3.77-.244-.39A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      Escribir por WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Sección de coordinación */}
              <div style={{ background:"#fff", padding:"12px 14px", borderTop:"1px solid #fdba74" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>
                  Lo coordinado con el cliente
                </div>
                {/* Opciones rápidas */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                  {COORDINATION_PRESETS.map(preset => (
                    <button key={preset} onClick={() => setNoteText(preset)}
                      style={{ fontSize:11, padding:"4px 10px", borderRadius:20,
                        border:"1px solid #d1d5db", background: noteText === preset ? "#111" : "#f9fafb",
                        color: noteText === preset ? "#fff" : "#374151",
                        cursor:"pointer", fontWeight:500, transition:"all .15s" }}>
                      {preset}
                    </button>
                  ))}
                </div>
                {/* Texto libre */}
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="O escribe lo que se acordó con el cliente..."
                  rows={2}
                  maxLength={500}
                  style={{ width:"100%", boxSizing:"border-box", fontSize:13, padding:"8px 10px",
                    border:"1px solid #d1d5db", borderRadius:6, resize:"vertical",
                    fontFamily:"inherit", color:"#111", outline:"none" }}
                />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <span style={{ fontSize:11, color:"#9ca3af" }}>{noteText.length}/500</span>
                  <button onClick={handleSaveNote} disabled={savingNote}
                    style={{ display:"inline-flex", alignItems:"center", gap:6,
                      padding:"7px 16px", borderRadius:7, border:"none",
                      background: noteSaved ? "#16a34a" : "#111",
                      color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", transition:"background .2s" }}>
                    {savingNote ? <Spinner size={12} color="#fff" /> : null}
                    {noteSaved ? "Guardado" : "Guardar coordinación"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estudiante / Acudiente */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
            {[
              ["Estudiante", [order.student?.name, `Grado: ${order.student?.grade}`, order.student?.document && `Doc: ${order.student.document}`]],
              ["Acudiente",  [order.guardian?.name, order.guardian?.phone, order.guardian?.email]],
            ].map(([title, lines]) => (
              <div key={title} style={{ background:"#f9fafb", borderRadius:8, padding:"12px 14px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>{title}</div>
                {lines.filter(Boolean).map((l,i) => (
                  <div key={i} style={{ fontSize:i===0?13:12, fontWeight:i===0?600:400, color:i===0?"#111":"#6b7280", marginBottom:2 }}>{l}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Artículos */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".1em", marginBottom:10 }}>Artículos</div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden" }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 14px", borderBottom:i<order.items.length-1?"1px solid #e5e7eb":"none",
                  background:i%2===0?"#fff":"#f9fafb" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{item.name}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>Talla: {item.size} · {COP(item.price)} c/u</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{COP(item.price * item.qty)}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>× {item.qty} ud{item.qty>1?"s":""}</div>
                  </div>
                </div>
              ))}
              {deliveryFee > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"#eff6ff", borderTop:"1px solid #e5e7eb" }}>
                  <span style={{ fontSize:13, color:"#1e3a8a" }}>Costo de domicilio</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1e3a8a" }}>+ {COP(deliveryFee)}</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px", background:"#f3f4f6", borderTop:"1px solid #e5e7eb" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#111" }}>Total</span>
                <span style={{ fontSize:16, fontWeight:700, color:"#111" }}>{COP(order.total)}</span>
              </div>
            </div>
          </div>

          {order.paymentProofUrl && (
            <a href={order.paymentProofUrl} target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                padding:10, borderRadius:8, background:"#f0fdf4", border:"1px solid #6ee7b7",
                color:"#065f46", fontWeight:600, fontSize:13, textDecoration:"none" }}>
              Ver comprobante de pago
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DiscountRow (tabla desktop) ───────────────────────────────
function DiscountRow({ uniform, college, currentPct, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [pct,     setPct]     = useState(currentPct ?? "");
  const [saving,  setSaving]  = useState(false);
  const has = currentPct != null && currentPct > 0;

  const handleSave = async () => {
    const val = parseInt(pct, 10);
    if (isNaN(val) || val < 1 || val > 90) return;
    setSaving(true); await onSave(val); setSaving(false); setEditing(false);
  };
  const handleRemove = async () => {
    setSaving(true); await onRemove(); setSaving(false); setEditing(false); setPct("");
  };

  return (
    <tr style={{ borderBottom:"1px solid #e5e7eb" }}>
      <td style={{ padding:"11px 14px" }}>
        <div style={{ fontWeight:600, fontSize:13, color:"#111" }}>{uniform.name}</div>
        <div style={{ fontSize:11, color:"#9ca3af" }}>{uniform.category}</div>
      </td>
      <td style={{ padding:"11px 14px", fontSize:13, color:"#6b7280" }}>{college.name}</td>
      <td style={{ padding:"11px 14px" }}>
        {has
          ? <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#fef3c7", color:"#92400e", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>
              {currentPct}% OFF
            </span>
          : <span style={{ fontSize:12, color:"#d1d5db" }}>Sin descuento</span>}
      </td>
      <td style={{ padding:"11px 14px" }}>
        {editing ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ position:"relative", width:80 }}>
              <input type="number" min="1" max="90" value={pct} onChange={e=>setPct(e.target.value)} autoFocus
                style={{ width:"100%", boxSizing:"border-box", padding:"6px 22px 6px 8px", border:"1px solid #6366f1", borderRadius:6, fontSize:13, fontWeight:600, outline:"none" }} />
              <span style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#9ca3af", pointerEvents:"none" }}>%</span>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ padding:"6px 12px", background:"#111", color:"#fff", border:"none", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              {saving ? <Spinner size={12} color="#fff" /> : "Guardar"}
            </button>
            {has && (
              <button onClick={handleRemove} disabled={saving}
                style={{ padding:"6px 10px", background:"#fef2f2", color:"#991b1b", border:"1px solid #fca5a5", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Quitar
              </button>
            )}
            <button onClick={() => { setEditing(false); setPct(currentPct ?? ""); }}
              style={{ padding:"6px 10px", background:"#f3f4f6", color:"#6b7280", border:"1px solid #e5e7eb", borderRadius:6, fontSize:12, cursor:"pointer" }}>
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => { setPct(currentPct ?? ""); setEditing(true); }}
            style={{ padding:"6px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer",
              border: has ? "1px solid #6366f1" : "1px solid #d1d5db",
              background: has ? "#eef2ff" : "#fff",
              color:      has ? "#4338ca" : "#374151" }}>
            {has ? "Editar" : "Agregar"}
          </button>
        )}
      </td>
    </tr>
  );
}

// ── DiscountCard (móvil) ──────────────────────────────────────
function DiscountCard({ uniform, college, currentPct, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [pct,     setPct]     = useState(currentPct ?? "");
  const [saving,  setSaving]  = useState(false);
  const has = currentPct != null && currentPct > 0;

  const handleSave = async () => {
    const val = parseInt(pct, 10);
    if (isNaN(val) || val < 1 || val > 90) return;
    setSaving(true); await onSave(val); setSaving(false); setEditing(false);
  };
  const handleRemove = async () => {
    setSaving(true); await onRemove(); setSaving(false); setEditing(false); setPct("");
  };

  return (
    <div style={{ border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", padding:"14px 16px", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{uniform.name}</div>
          <div style={{ fontSize:11, color:"#9ca3af" }}>{uniform.category} · {college.name}</div>
        </div>
        {has && (
          <span style={{ background:"#fef3c7", color:"#92400e", padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, marginLeft:8 }}>
            {currentPct}% OFF
          </span>
        )}
      </div>
      {editing ? (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <div style={{ position:"relative", width:80 }}>
            <input type="number" min="1" max="90" value={pct} onChange={e=>setPct(e.target.value)} autoFocus
              style={{ width:"100%", boxSizing:"border-box", padding:"7px 22px 7px 8px", border:"1px solid #6366f1", borderRadius:6, fontSize:13, fontWeight:600, outline:"none" }} />
            <span style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#9ca3af", pointerEvents:"none" }}>%</span>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:"7px 14px", background:"#111", color:"#fff", border:"none", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {saving ? "..." : "Guardar"}
          </button>
          {has && (
            <button onClick={handleRemove} disabled={saving}
              style={{ padding:"7px 10px", background:"#fef2f2", color:"#991b1b", border:"1px solid #fca5a5", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              Quitar
            </button>
          )}
          <button onClick={() => { setEditing(false); setPct(currentPct ?? ""); }}
            style={{ padding:"7px 10px", background:"#f3f4f6", color:"#6b7280", border:"1px solid #e5e7eb", borderRadius:6, fontSize:12, cursor:"pointer" }}>
            ✕
          </button>
        </div>
      ) : (
        <button onClick={() => { setPct(currentPct ?? ""); setEditing(true); }}
          style={{ width:"100%", padding:"8px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer",
            border:      has ? "1px solid #6366f1" : "1px solid #d1d5db",
            background:  has ? "#eef2ff" : "#f9fafb",
            color:       has ? "#4338ca" : "#374151" }}>
          {has ? "Editar descuento" : "Agregar descuento"}
        </button>
      )}
    </div>
  );
}

// ── SizeStockInput ────────────────────────────────────────────
function SizeStockInput({ size, currentQty, onSave, saving }) {
  const [input, setInput] = useState("");
  const q = currentQty ?? null;
  const out = q === 0; const low = q !== null && q > 0 && q <= 3; const ok = q !== null && q > 3;
  const bg    = out?"#fee2e2":low?"#fef9c3":ok?"#dcfce7":"#f3f4f6";
  const color = out?"#991b1b":low?"#854d0e":ok?"#065f46":"#9ca3af";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #f3f4f6" }}>
      <span style={{ width:32, fontSize:11, fontWeight:700, color:"#6b7280", flexShrink:0 }}>{size}</span>
      <span style={{ background:bg, color, padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700, minWidth:64, textAlign:"center" }}>
        {q === null ? "—" : q === 0 ? "Agotado" : `${q} uds`}
      </span>
      <input type="number" min="0" max="9999" value={input} onChange={e=>setInput(e.target.value)}
        placeholder={q !== null ? String(q) : "0"}
        style={{ width:72, padding:"5px 8px", fontSize:12, border:"1px solid #d1d5db", borderRadius:6 }}
        onKeyDown={e=>{ if(e.key==="Enter" && input!=="") onSave(size, input, ()=>setInput("")); }} />
      <button onClick={()=>{ if(input!=="") onSave(size, input, ()=>setInput("")); }}
        disabled={saving || input===""}
        style={{ padding:"5px 12px", fontSize:11, fontWeight:600, borderRadius:6, border:"1px solid #d1d5db",
          background: saving||input===""?"#f9fafb":"#111", color: saving||input===""?"#9ca3af":"#fff",
          cursor:saving||input===""?"not-allowed":"pointer", whiteSpace:"nowrap" }}>
        {saving ? "..." : "OK"}
      </button>
    </div>
  );
}

// ── StockRow ──────────────────────────────────────────────────
function StockRow({ uniform, college, stockData, onStockUpdated, isEven, toast, mobileOnly }) {
  const [savingSize, setSavingSize] = useState(null);
  const [expanded, setExpanded]     = useState(false);
  const sizeMap  = stockData?.[String(uniform.id)] || {};
  const totalQty = uniform.sizes.reduce((s,sz) => s + (sizeMap[sz] ?? 0), 0);
  const hasStock = Object.keys(sizeMap).length > 0;
  const bg    = !hasStock?"#f3f4f6":totalQty===0?"#fee2e2":totalQty<=5?"#fef9c3":"#dcfce7";
  const color = !hasStock?"#9ca3af":totalQty===0?"#991b1b":totalQty<=5?"#854d0e":"#065f46";

  const handleSave = async (size, inputVal, clearInput) => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)||val<0||val>9999) { toast("Ingresa un número entre 0 y 9999","error"); return; }
    setSavingSize(size);
    try {
      await updateStock(college.id, String(uniform.id), size, val);
      onStockUpdated(String(uniform.id), size, val);
      clearInput();
      toast(`Stock talla ${size} actualizado`, "success");
    } catch(err) { toast(err.message,"error"); }
    finally { setSavingSize(null); }
  };

  // Mobile-only: render just the expandable size editor
  if (mobileOnly) {
    return (
      <div>
        <button onClick={()=>setExpanded(e=>!e)}
          style={{ fontSize:12, padding:"6px 12px", borderRadius:6, border:"1px solid #d1d5db",
            background:"#fff", cursor:"pointer", fontWeight:500, marginTop:4 }}>
          {expanded ? "▲ Cerrar" : " Editar tallas"}
        </button>
        {expanded && (
          <div style={{ marginTop:10, background:"#f8fafc", borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>
              Stock por talla
            </div>
            {uniform.sizes.map(sz => (
              <SizeStockInput key={sz} size={sz} currentQty={sizeMap[sz]??null}
                onSave={handleSave} saving={savingSize===sz} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <tr style={{ borderBottom:"1px solid #e5e7eb", background:isEven?"#fff":"#f9fafb" }}>
        <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, color:"#111" }}>{uniform.name}</td>
        <td style={{ padding:"12px 14px", fontSize:11, color:"#9ca3af" }}>{uniform.category}</td>
        <td style={{ padding:"12px 14px" }}>
          <span style={{ background:bg, color, padding:"3px 9px", borderRadius:4, fontSize:11, fontWeight:700 }}>
            {!hasStock?"Sin definir":totalQty===0?"Agotado":`${totalQty} uds`}
          </span>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
            {uniform.sizes.map(sz => {
              const q = sizeMap[sz] ?? null;
              const c = q===null?"#9ca3af":q===0?"#991b1b":q<=3?"#854d0e":"#065f46";
              const b = q===null?"#f3f4f6":q===0?"#fee2e2":q<=3?"#fef9c3":"#dcfce7";
              return <span key={sz} style={{ background:b, color:c, padding:"1px 6px", borderRadius:3, fontSize:10, fontWeight:700 }}>{sz}: {q??"—"}</span>;
            })}
          </div>
        </td>
        <td style={{ padding:"12px 14px" }}>
          <button onClick={()=>setExpanded(e=>!e)}
            style={{ padding:"6px 12px", fontSize:12, borderRadius:6, border:"1px solid #d1d5db",
              background:"#fff", cursor:"pointer", fontWeight:500 }}>
            {expanded ? "▲ Cerrar" : " Editar tallas"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background:isEven?"#f8fafc":"#f1f5f9", borderBottom:"1px solid #e5e7eb" }}>
          <td colSpan={4} style={{ padding:"14px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".1em", marginBottom:10 }}>
              Stock por talla — {uniform.name}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"0 24px" }}>
              {uniform.sizes.map(sz => (
                <SizeStockInput key={sz} size={sz} currentQty={sizeMap[sz]??null}
                  onSave={handleSave} saving={savingSize===sz} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── AdminPanel principal ──────────────────────────────────────
export default function AdminPanel({ onLogout, toast }) {
  const [tab, setTab]           = useState("orders");
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [updatingId, setUpdatingId]     = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statsData, setStatsData]   = useState(null);
  const [stockData, setStockData]   = useState({});
  const [loadingStock, setLoadingStock] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Pedidos
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getOrders();
      setOrders(data || []);
    } catch(err) { toast(err.message, "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { if(tab==="orders") loadOrders(); }, [tab, loadOrders]);

  const handleStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateOrderStatus(id, status);
      setOrders(os => os.map(o => o.id===id ? {...o, status} : o));
      toast("Estado actualizado", "success");
    } catch(err) { toast(err.message,"error"); }
    finally { setUpdatingId(null); }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.id?.toLowerCase().includes(q) || o.student?.name?.toLowerCase().includes(q) || o.collegeName?.toLowerCase().includes(q);
    const matchS = !filterStatus || o.status === filterStatus;
    return matchQ && matchS;
  });

  // Stats
  const loadStats = useCallback(async () => {
    try {
      const { data } = await getStats();
      setStatsData(data);
    } catch(err) { toast(err.message,"error"); }
  }, [toast]);

  useEffect(() => { if(tab==="stats") loadStats(); }, [tab, loadStats]);

  // Stock
  const loadStock = useCallback(async () => {
    setLoadingStock(true);
    try {
      const results = {};
      await Promise.all(DEMO_COLLEGES.map(async col => {
        const { data } = await getStock(col.id);
        results[col.id] = data || {};
      }));
      setStockData(results);
    } catch(err) { toast(err.message,"error"); }
    finally { setLoadingStock(false); }
  }, [toast]);

  useEffect(() => { if(tab==="stock") loadStock(); }, [tab, loadStock]);

  // Descuentos
  const [discountData,       setDiscountData]       = useState({});
  const [loadingDiscounts,   setLoadingDiscounts]   = useState(false);
  const [discountColFilter,  setDiscountColFilter]  = useState("all");
  const [stockSectionFilter, setStockSectionFilter] = useState({});   // { [colId]: "all" | sectionId }

  const loadDiscounts = useCallback(async () => {
    setLoadingDiscounts(true);
    try {
      const { data } = await getDiscounts();
      setDiscountData(data || {});
    } catch(err) { toast(err.message, "error"); }
    finally { setLoadingDiscounts(false); }
  }, [toast]);

  useEffect(() => { if(tab==="discounts") loadDiscounts(); }, [tab, loadDiscounts]);

  const handleSetDiscount = async (collegeId, uniformId, pct) => {
    try {
      await setDiscount(collegeId, uniformId, pct);
      setDiscountData(d => ({
        ...d,
        [collegeId]: { ...(d[collegeId] || {}), [String(uniformId)]: pct },
      }));
      toast(`Descuento del ${pct}% aplicado`, "success");
    } catch(err) { toast(err.message, "error"); }
  };

  const handleRemoveDiscount = async (collegeId, uniformId) => {
    try {
      await removeDiscount(collegeId, uniformId);
      setDiscountData(d => {
        const col = { ...(d[collegeId] || {}) };
        delete col[String(uniformId)];
        return { ...d, [collegeId]: col };
      });
      toast("Descuento eliminado", "success");
    } catch(err) { toast(err.message, "error"); }
  };

  const TABS = [
    { id:"orders",    label:"Pedidos" },
    { id:"stats",     label:"Estadísticas" },
    { id:"stock",     label:"Stock" },
    { id:"discounts", label:"Descuentos" },
  ];

  const TabBar = () => (
    <>
      {/* Desktop tabs */}
      <div className="admin-tabs-desktop" style={{ display:"flex", gap:4, marginBottom:24, borderBottom:"1px solid #e5e7eb", paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:"10px 18px", fontSize:13, fontWeight:600, border:"none",
              borderBottom: tab===t.id ? "2px solid #111" : "2px solid transparent",
              background:"none", cursor:"pointer",
              color: tab===t.id ? "#111" : "#9ca3af",
              transition:"all .15s", marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Mobile select */}
      <div className="admin-tabs-mobile" style={{ display:"none", marginBottom:16 }}>
        <select
          value={tab}
          onChange={e => setTab(e.target.value)}
          style={{ width:"100%", padding:"12px 16px", fontSize:14, fontWeight:600,
            color:"#111", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8,
            appearance:"none", WebkitAppearance:"none",
            backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat:"no-repeat", backgroundPosition:"right 16px center",
            cursor:"pointer", fontFamily:"inherit" }}>
          {TABS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>
    </>
  );

  const ActionBar = ({ onRefresh }) => (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <button onClick={onRefresh}
        style={{ padding:"8px 14px", fontSize:12, fontWeight:600, borderRadius:6,
          border:"1px solid #d1d5db", background:"#fff", cursor:"pointer", color:"#374151" }}>
        Actualizar
      </button>
      <button onClick={onLogout}
        style={{ padding:"8px 14px", fontSize:12, fontWeight:600, borderRadius:6,
          border:"1px solid #fca5a5", background:"#fef2f2", cursor:"pointer", color:"#991b1b" }}>
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        .tbl-wrap{overflow-x:auto}
        table{width:100%;border-collapse:collapse}
        th{padding:10px 13px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;text-align:left}
        .sidebar{width:220px;background:#0f0e0c;flex-shrink:0;display:flex;flex-direction:column;transition:transform .25s ease}
        .mobile-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:998}
        .mobile-topbar{display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:#0f0e0c;position:sticky;top:0;z-index:50}
        .order-card{display:none;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:14px 16px;margin-bottom:10px;cursor:pointer}
        .order-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
        .order-card-body{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
        .order-card-field{font-size:11px;color:#9ca3af;margin-bottom:2px}
        .order-card-value{font-size:13px;color:#111;font-weight:500}
        .order-card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #f3f4f6}
        .stock-card{border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:14px 16px;margin-bottom:10px}
        .mobile-stock-cards{display:none}
        @media(max-width:768px){
          .admin-tabs-desktop{display:none!important}
          .admin-tabs-mobile{display:block!important}
          .sidebar{position:fixed;top:0;left:0;height:100%;z-index:999;transform:translateX(-100%)}
          .sidebar.open{transform:translateX(0);animation:slideIn .25s ease}
          .mobile-overlay.visible{display:block}
          .mobile-topbar{display:flex}
          .desktop-table{display:none!important}
          .order-card{display:block}
          .mobile-stock-cards{display:block}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .stat-bar-label{width:auto!important;flex:1}
        }
        @media(max-width:480px){
          .stats-grid{grid-template-columns:1fr!important}
          .order-card-body{grid-template-columns:1fr}
        }
      `}</style>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={()=>setSelectedOrder(null)}
        onOrderUpdate={updated => {
          setSelectedOrder(updated);
          setOrders(os => os.map(o => o.id === updated.id ? updated : o));
        }} />}

      {/* Mobile overlay */}
      <div className={`mobile-overlay${sidebarOpen?" visible":""}`} onClick={()=>setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button onClick={()=>setSidebarOpen(true)}
          style={{ background:"transparent", border:"none", cursor:"pointer", padding:4, display:"flex", flexDirection:"column", gap:4 }}>
          <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:2 }} />
          <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:2 }} />
          <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:2 }} />
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <img src={LOGO_TESSUTI} alt="Tessuti"
            style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(255,255,255,.2)" }} />
          <span style={{ color:"#fff", fontWeight:600, fontSize:14, fontFamily:"'Cormorant Garamond',serif" }}>Tessuti Admin</span>
        </div>
        <button onClick={onLogout} style={{ background:"transparent", border:"none", cursor:"pointer", color:"rgba(255,255,255,.5)", fontSize:11 }}>Salir</button>
      </div>

      {/* Sidebar + main */}
      <div style={{ display:"flex", minHeight:"100vh", fontFamily:"var(--font,'DM Sans',sans-serif)" }}>

        {/* Sidebar */}
        <aside className={`sidebar${sidebarOpen?" open":""}`}>
          <div style={{ padding:"24px 20px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img src={LOGO_TESSUTI} alt="Tessuti"
                style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(255,255,255,.12)" }} />
              <div>
                <div style={{ color:"#fff", fontWeight:600, fontSize:14, fontFamily:"'Cormorant Garamond',serif", letterSpacing:".04em" }}>Tessuti</div>
                <div style={{ color:"rgba(255,255,255,.3)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase" }}>Admin</div>
              </div>
            </div>
            <button onClick={()=>setSidebarOpen(false)}
              style={{ background:"transparent", border:"none", color:"rgba(255,255,255,.3)", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
          </div>

          <nav style={{ padding:"16px 12px", flex:1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>{ setTab(t.id); setSidebarOpen(false); }}
                style={{ width:"100%", textAlign:"left", padding:"10px 12px",
                  borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500,
                  marginBottom:2, transition:"all .15s",
                  background: tab===t.id ? "rgba(255,255,255,.1)" : "transparent",
                  color: tab===t.id ? "#fff" : "rgba(255,255,255,.4)" }}>
                {t.label}
              </button>
            ))}
          </nav>

          <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
            <button onClick={onLogout}
              style={{ width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:8,
                border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,.25)",
                background:"transparent", display:"flex", alignItems:"center", gap:8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, background:"#f9fafb", overflow:"auto" }}>
          <div style={{ padding:"clamp(20px,4vw,36px) clamp(16px,4vw,32px)" }}>

            {/* ── PEDIDOS ── */}
            {tab === "orders" && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ fontSize:22, fontWeight:700, color:"#111", marginBottom:2 }}>Pedidos</h2>
                    <p style={{ fontSize:13, color:"#9ca3af" }}>{filtered.length} resultado{filtered.length!==1?"s":""}</p>
                  </div>
                  <ActionBar onRefresh={loadOrders} />
                </div>

                <TabBar />

                {/* Filtros */}
                <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:16, display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:"1 1 200px" }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Buscar</label>
                    <input value={search} onChange={e=>setSearch(e.target.value)}
                      placeholder="N° pedido, estudiante, institución..."
                      style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13 }} />
                  </div>
                  <div style={{ flex:"0 1 200px" }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Estado</label>
                    <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                      style={{ width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13 }}>
                      <option value="">Todos</option>
                      {STATUS_ORDER.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Tabla - desktop */}
                <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }} className="desktop-table">
                  {loading
                    ? <div style={{ display:"flex", justifyContent:"center", padding:52 }}><Spinner size={28} color="#9ca3af" /></div>
                    : filtered.length === 0
                    ? <div style={{ textAlign:"center", padding:60, color:"#9ca3af" }}>No se encontraron pedidos</div>
                    : <div className="tbl-wrap">
                        <table>
                          <thead>
                            <tr style={{ background:"#f3f4f6", borderBottom:"1px solid #e5e7eb" }}>
                              {["","N° Pedido","Estudiante","Institución","Entrega","Total","Comprobante","Estado","Cambiar estado"].map(h=>(
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((o,i) => (
                              <tr key={o.id} style={{ borderBottom:"1px solid #e5e7eb", background:i%2===0?"#fff":"#f9fafb" }}>
                                <td style={{ padding:"8px 10px" }}>
                                  <button onClick={()=>setSelectedOrder(o)}
                                    style={{ background:"#111", color:"#fff", border:"none", borderRadius:6,
                                      padding:"5px 10px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                                    Ver
                                  </button>
                                </td>
                                <td style={{ padding:"11px 13px", fontSize:12, fontWeight:700, color:"#374151", fontFamily:"monospace" }}>{o.id}</td>
                                <td style={{ padding:"11px 13px" }}>
                                  <div style={{ fontWeight:500, fontSize:13 }}>{o.student?.name}</div>
                                  <div style={{ fontSize:11, color:"#9ca3af" }}>{o.guardian?.name}</div>
                                </td>
                                <td style={{ padding:"11px 13px", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>{o.collegeName}</td>
                                <td style={{ padding:"11px 13px", fontSize:12, whiteSpace:"nowrap" }}>
                                  {o.delivery?.type==="domicilio"
                                    ? <span style={{ background:"#eff6ff", color:"#1e3a8a", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Domicilio</span>
                                    : o.delivery?.type==="domicilio_coordinado"
                                      ? <div>
                                          <span style={{ background:"#fff7ed", color:"#9a3412", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Por coordinar</span>
                                          {o.delivery?.coordinationNote && <div style={{ fontSize:10, color:"#9a3412", marginTop:3, maxWidth:140, whiteSpace:"normal", lineHeight:1.3 }}>{o.delivery.coordinationNote}</div>}
                                        </div>
                                      : <span style={{ background:"#f3f4f6", color:"#6b7280", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Recogida</span>}
                                </td>
                                <td style={{ padding:"11px 13px", fontSize:13, fontWeight:600, whiteSpace:"nowrap" }}>
                                  {COP(o.total)}
                                  {o.delivery?.type==="domicilio" && <div style={{ fontSize:10, color:"#9ca3af" }}>envío {COP(15000)}</div>}
                                  {o.delivery?.type==="domicilio_coordinado" && <div style={{ fontSize:10, color:"#ea580c", fontWeight:600 }}>envío por coordinar</div>}
                                </td>
                                <td style={{ padding:"11px 13px" }}>
                                  {o.paymentProofUrl
                                    ? <a href={o.paymentProofUrl} target="_blank" rel="noreferrer"
                                        style={{ fontSize:11, fontWeight:600, color:"#065f46", background:"#f0fdf4", padding:"3px 9px", borderRadius:4, textDecoration:"none" }}>
                                        Ver
                                      </a>
                                    : <span style={{ fontSize:11, color:"#d1d5db" }}>—</span>}
                                </td>
                                <td style={{ padding:"11px 13px" }}><Badge status={o.status} /></td>
                                <td style={{ padding:"11px 13px" }}>
                                  {updatingId===o.id
                                    ? <Spinner size={14} color="#9ca3af" />
                                    : <select value={o.status} onChange={e=>handleStatus(o.id,e.target.value)}
                                        style={{ fontSize:12, padding:"5px 8px", borderRadius:6, border:"1px solid #d1d5db", minWidth:120 }}>
                                        {getStatusOptions(o.delivery?.type).map(s=><option key={s}>{s}</option>)}
                                      </select>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  }
                </div>

                {/* Tarjetas - móvil */}
                <div>
                  {loading
                    ? <div style={{ display:"flex", justifyContent:"center", padding:52 }}><Spinner size={28} color="#9ca3af" /></div>
                    : filtered.length === 0
                    ? null
                    : filtered.map(o => (
                      <div key={o.id} className="order-card" onClick={()=>setSelectedOrder(o)}>
                        <div className="order-card-header">
                          <div>
                            <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>N° Pedido</div>
                            <div style={{ fontSize:13, fontWeight:700, fontFamily:"monospace", color:"#111" }}>{o.id}</div>
                          </div>
                          <Badge status={o.status} />
                        </div>
                        <div className="order-card-body">
                          <div>
                            <div className="order-card-field">Estudiante</div>
                            <div className="order-card-value">{o.student?.name}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>{o.guardian?.name}</div>
                          </div>
                          <div>
                            <div className="order-card-field">Institución</div>
                            <div className="order-card-value">{o.collegeName}</div>
                          </div>
                          <div>
                            <div className="order-card-field">Entrega</div>
                            <div className="order-card-value">
                              {o.delivery?.type==="domicilio"
                                ? <span style={{ background:"#eff6ff", color:"#1e3a8a", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Domicilio</span>
                                : o.delivery?.type==="domicilio_coordinado"
                                  ? <span style={{ background:"#fff7ed", color:"#9a3412", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Por coordinar</span>
                                  : <span style={{ background:"#f3f4f6", color:"#6b7280", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600 }}>Recogida</span>}
                            </div>
                          </div>
                          <div>
                            <div className="order-card-field">Total</div>
                            <div className="order-card-value" style={{ fontWeight:700 }}>{COP(o.total)}</div>
                          </div>
                        </div>
                        <div className="order-card-footer" onClick={e=>e.stopPropagation()}>
                          {o.paymentProofUrl &&
                            <a href={o.paymentProofUrl} target="_blank" rel="noreferrer"
                              style={{ fontSize:11, fontWeight:600, color:"#065f46", background:"#f0fdf4", padding:"5px 10px", borderRadius:6, textDecoration:"none" }}>
                              Ver comprobante
                            </a>}
                          {updatingId===o.id
                            ? <Spinner size={14} color="#9ca3af" />
                            : <select value={o.status} onChange={e=>handleStatus(o.id,e.target.value)}
                                style={{ fontSize:12, padding:"6px 8px", borderRadius:6, border:"1px solid #d1d5db", flex:1, maxWidth:180, marginLeft:"auto" }}>
                                {getStatusOptions(o.delivery?.type).map(s=><option key={s}>{s}</option>)}
                              </select>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            {/* ── ESTADÍSTICAS ── */}
            {tab === "stats" && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ fontSize:22, fontWeight:700, color:"#111", marginBottom:2 }}>Estadísticas</h2>
                    <p style={{ fontSize:13, color:"#9ca3af" }}>Resumen general de pedidos e ingresos</p>
                  </div>
                  <ActionBar onRefresh={loadStats} />
                </div>
                <TabBar />

                {!statsData
                  ? <div style={{ display:"flex", justifyContent:"center", padding:52 }}><Spinner size={28} color="#9ca3af" /></div>
                  : <>
                      <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:24 }}>
                        {[
                          ["Total pedidos", statsData.total || 0, "#111"],
                          ["Ingresos", COP(statsData.totalRevenue || 0), "#065f46"],
                          ["Entregados", statsData.byStatus?.["Entregado"] || 0, "#1e3a8a"],
                          ["Preparando pedido", (statsData.byStatus?.["Preparando pedido"] || 0) + (statsData.byStatus?.["En producción"] || 0), "#581c87"],
                        ].map(([label, value, color]) => (
                          <div key={label} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"20px 18px" }}>
                            <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>{label}</div>
                            <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"20px" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".1em", marginBottom:16 }}>Por estado</div>
                        {STATUS_ORDER.map(s => {
                          // Compatibilidad: sumar pedidos con estado renombrado
                          const legacy = s === "Preparando pedido" ? (statsData.byStatus?.["En producción"] || 0) : 0;
                          const count = (statsData.byStatus?.[s] || 0) + legacy;
                          const pct = statsData.total ? Math.round(count/statsData.total*100) : 0;
                          const m = STATUS_META[s];
                          return (
                            <div key={s} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                              <span className="stat-bar-label" style={{ width:160, fontSize:12, color:"#374151", flexShrink:0 }}>{s}</span>
                              <div style={{ flex:1, background:"#f3f4f6", borderRadius:4, height:8, overflow:"hidden" }}>
                                <div style={{ width:`${pct}%`, height:"100%", background:m?.dot || "#9ca3af", borderRadius:4, transition:"width .5s" }} />
                              </div>
                              <span style={{ width:36, fontSize:12, fontWeight:600, color:"#374151", textAlign:"right" }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                }
              </>
            )}

            {/* ── STOCK ── */}
            {tab === "stock" && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ fontSize:22, fontWeight:700, color:"#111", marginBottom:2 }}>Gestión de Stock</h2>
                    <p style={{ fontSize:13, color:"#9ca3af" }}>Administra unidades disponibles por producto y colegio</p>
                  </div>
                  <ActionBar onRefresh={loadStock} />
                </div>
                <TabBar />

                {loadingStock
                  ? <div style={{ display:"flex", justifyContent:"center", padding:52 }}><Spinner size={28} color="#9ca3af" /></div>
                  : DEMO_COLLEGES.map(col => {
                    const allUnis = getAllUniforms(col);
                    const hasSections = col.sections?.length > 0;
                    const currentFilter = stockSectionFilter[col.id] || "all";
                    const allSections = hasSections
                      ? col.sections.map(s => ({ id: s.id, name: s.name, uniforms: s.uniforms }))
                      : [{ id: null, name: null, uniforms: col.uniforms }];
                    const sections = currentFilter === "all"
                      ? allSections
                      : allSections.filter(s => s.id === currentFilter);

                    return (
                    <div key={col.id} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
                      <div style={{ padding:"14px 18px", borderBottom:"1px solid #e5e7eb", background:"#f9fafb",
                        display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:col.primaryColor }} />
                        <span style={{ fontWeight:700, fontSize:14, color:"#111" }}>{col.name}</span>
                        <span style={{ fontSize:12, color:"#9ca3af" }}>· {allUnis.length} productos</span>
                        {hasSections && (
                          <select
                            value={currentFilter}
                            onChange={e => setStockSectionFilter(prev => ({ ...prev, [col.id]: e.target.value }))}
                            style={{ marginLeft:"auto", padding:"6px 10px", border:"1px solid #d1d5db", borderRadius:6,
                              fontSize:12, background:"#fff", color:"#374151", cursor:"pointer" }}>
                            <option value="all">Todas las secciones</option>
                            {col.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        )}
                      </div>

                      {sections.map((section, si) => (
                        <div key={section.id || si}>
                          {section.name && (
                            <div style={{ padding:"10px 18px", background:"#f3f4f6", borderBottom:"1px solid #e5e7eb",
                              fontSize:12, fontWeight:700, color:"#6b7280", letterSpacing:".06em", textTransform:"uppercase" }}>
                              {section.name}
                            </div>
                          )}
                          <div className="desktop-table">
                            <table style={{ width:"100%", borderCollapse:"collapse" }}>
                              <thead>
                                <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
                                  {["Producto","Categoría","Stock actual","Editar"].map(h=><th key={h}>{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {section.uniforms.map((u,i) => (
                                  <StockRow key={u.id} uniform={u} college={col}
                                    stockData={stockData[col.id]}
                                    onStockUpdated={(pid,size,val)=>setStockData(s=>({
                                      ...s, [col.id]:{ ...s[col.id], [pid]:{ ...(s[col.id]?.[pid]||{}), [size]:val } }
                                    }))}
                                    isEven={i%2===0} toast={toast} />
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Mobile stock cards */}
                          <div style={{ padding:"0 0 8px" }} className="mobile-stock-cards">
                            {section.uniforms.map((u,i) => {
                              const sizeMap = stockData[col.id]?.[String(u.id)] || {};
                              const totalQty = u.sizes.reduce((s,sz) => s + (sizeMap[sz] ?? 0), 0);
                              const hasStock = Object.keys(sizeMap).length > 0;
                              const bg    = !hasStock?"#f3f4f6":totalQty===0?"#fee2e2":totalQty<=5?"#fef9c3":"#dcfce7";
                              const color = !hasStock?"#9ca3af":totalQty===0?"#991b1b":totalQty<=5?"#854d0e":"#065f46";
                              return (
                                <div key={u.id} className="stock-card">
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                    <div>
                                      <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{u.name}</div>
                                      <div style={{ fontSize:11, color:"#9ca3af" }}>{u.category}</div>
                                    </div>
                                    <span style={{ background:bg, color, padding:"3px 9px", borderRadius:4, fontSize:11, fontWeight:700, flexShrink:0 }}>
                                      {!hasStock?"Sin definir":totalQty===0?"Agotado":`${totalQty} uds`}
                                    </span>
                                  </div>
                                  <StockRow uniform={u} college={col}
                                    stockData={stockData[col.id]}
                                    onStockUpdated={(pid,size,val)=>setStockData(s=>({
                                      ...s, [col.id]:{ ...s[col.id], [pid]:{ ...(s[col.id]?.[pid]||{}), [size]:val } }
                                    }))}
                                    isEven={i%2===0} toast={toast} mobileOnly={true} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );})
                }
              </>
            )}

            {/* ── DESCUENTOS ── */}
            {tab === "discounts" && (() => {
              const allItems = DEMO_COLLEGES.flatMap(col =>
                getAllUniforms(col).map(u => ({
                  college: col, uniform: u,
                  pct: discountData[col.id]?.[String(u.id)] ?? null,
                }))
              );
              const activeItems = allItems.filter(d => d.pct > 0);
              const visibleItems = discountColFilter === "all"
                ? allItems
                : allItems.filter(d => d.college.id === discountColFilter);

              return (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                    <div>
                      <h2 style={{ fontSize:22, fontWeight:700, color:"#111", marginBottom:2 }}>Descuentos</h2>
                      <p style={{ fontSize:13, color:"#9ca3af" }}>
                        {activeItems.length > 0
                          ? <><span style={{ color:"#92400e", fontWeight:600 }}>{activeItems.length} activo{activeItems.length !== 1 ? "s" : ""}</span> · Visibles en el catálogo</>
                          : "Aplica porcentajes de descuento a prendas por colegio"}
                      </p>
                    </div>
                    <ActionBar onRefresh={loadDiscounts} />
                  </div>

                  <TabBar />

                  {/* Resumen activos */}
                  {activeItems.length > 0 && (
                    <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10,
                      padding:"12px 16px", marginBottom:20, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#92400e", marginRight:4 }}>Activos:</span>
                      {activeItems.map(d => (
                        <span key={`${d.college.id}-${d.uniform.id}`} style={{
                          background:"#fff", border:"1px solid #fcd34d", borderRadius:20,
                          padding:"3px 10px", fontSize:11, fontWeight:600, color:"#92400e",
                          display:"inline-flex", alignItems:"center", gap:5 }}>
                          <span style={{ width:7, height:7, borderRadius:"50%", background:d.college.primaryColor, display:"inline-block" }} />
                          {d.uniform.name} — {d.pct}% OFF
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Filtro */}
                  <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10,
                    padding:"12px 16px", marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#6b7280",
                      textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Filtrar por institución</label>
                    <select value={discountColFilter} onChange={e => setDiscountColFilter(e.target.value)}
                      style={{ padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, minWidth:220 }}>
                      <option value="all">Todas las instituciones</option>
                      {DEMO_COLLEGES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {loadingDiscounts
                    ? <div style={{ display:"flex", justifyContent:"center", padding:52 }}><Spinner size={28} color="#9ca3af" /></div>
                    : <>
                        {/* Desktop */}
                        <div className="desktop-table" style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
                          <table style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                              <tr style={{ background:"#f3f4f6", borderBottom:"1px solid #e5e7eb" }}>
                                {["Prenda","Institución","Descuento actual","Acción"].map(h => (
                                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11,
                                    fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {visibleItems.map(({ college: col, uniform: u, pct }) => (
                                <DiscountRow key={`${col.id}-${u.id}`}
                                  uniform={u} college={col} currentPct={pct}
                                  onSave={val => handleSetDiscount(col.id, u.id, val)}
                                  onRemove={() => handleRemoveDiscount(col.id, u.id)} />
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Móvil */}
                        <div className="mobile-stock-cards">
                          {visibleItems.map(({ college: col, uniform: u, pct }) => (
                            <DiscountCard key={`${col.id}-${u.id}`}
                              uniform={u} college={col} currentPct={pct}
                              onSave={val => handleSetDiscount(col.id, u.id, val)}
                              onRemove={() => handleRemoveDiscount(col.id, u.id)} />
                          ))}
                        </div>
                      </>
                  }
                </>
              );
            })()}

          </div>
        </main>
      </div>
    </>
  );
}