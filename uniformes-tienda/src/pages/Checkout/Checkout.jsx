import React, { useState } from "react";
import { createOrder, uploadPaymentProof } from "../../services/api";
import { COP } from "../../utils/money";
import { imgQrPago } from "../../assets";

const DELIVERY_FEE = 15000;

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation:"spin .7s linear infinite", flexShrink:0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".12em", fontFamily:"var(--font,'DM Sans',sans-serif)" }}>
        {label}{required && <span style={{ color:"#dc2626", marginLeft:2 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize:11, color: hint.startsWith("⚠") ? "#dc2626" : "#9ca3af" }}>{hint}</span>}
    </div>
  );
}

export default function Checkout({ college, cart, setCart, onSuccess, onBack, toast }) {
  const [step,         setStep]        = useState(1);
  const [loading,      setLoading]     = useState(false);
  const [proofFile,    setProofFile]   = useState(null);
  const [proofPreview, setProofPreview]= useState(null);

  const [form, setForm] = useState({
    studentName:"", grade:"", studentDoc:"",
    guardianName:"", phone:"", email:"",
    deliveryType:"recogida",
    street:"", neighborhood:"", city:"Medellín",
    notes:"",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = form.deliveryType === "domicilio" ? DELIVERY_FEE : 0;
  const total       = subtotal + deliveryFee;
  const cartQty     = cart.reduce((s, i) => s + i.qty, 0);
  const emailValid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const needsStreet = form.deliveryType === "domicilio";
  const step1Valid  = form.guardianName.trim() && form.phone.trim() && emailValid &&
    (!needsStreet || form.street.trim());

  const goStep = (n) => { setStep(n); window.scrollTo(0, 0); };

  const handleProof = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = ev => setProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!proofFile) { toast("Adjunta el comprobante de pago", "error"); return; }
    setLoading(true);
    try {
      const orderPayload = {
        collegeId:   college.id,
        collegeName: college.name,
        items: cart.map(i => ({
          id:i.id, name:i.name, size:i.size, qty:i.qty, price:i.price, category:i.category,
        })),
        student:  { name:form.studentName.trim(), grade:form.grade.trim(), document:form.studentDoc.trim() },
        guardian: { name:form.guardianName.trim(), phone:form.phone.trim(), email:form.email.trim() },
        delivery: {
          type: form.deliveryType,
          address: needsStreet
            ? { street:form.street.trim(), neighborhood:form.neighborhood.trim(), city:form.city.trim() }
            : null,
        },
        notes: form.notes.trim(),
      };

      const orderResult = await createOrder(orderPayload);
      const orderId = orderResult.data?.id || orderResult.data?.orderId;

      if (orderId && proofFile) {
        try { await uploadPaymentProof(orderId, proofFile); }
        catch (e) { toast("Pedido creado. Envía el comprobante por WhatsApp.", "warning"); }
      }
      onSuccess(orderResult.data);
    } catch (err) {
      toast(err.message || "Error al crear el pedido", "error");
    } finally {
      setLoading(false);
    }
  };

  const S = { fontFamily:"var(--font,'DM Sans',sans-serif)" };

  return (
    <div style={{ minHeight:"calc(100vh - 56px)", background:"var(--bg,#faf9f7)", ...S }}>
      <style>{`
        .co-wrap {
          max-width:900px; margin:0 auto;
          padding:clamp(16px,3vw,28px) clamp(14px,4vw,24px);
          display:grid;
          grid-template-columns:1fr clamp(260px,32%,320px);
          gap:clamp(14px,2.5vw,22px);
          align-items:start;
        }
        @media(max-width:700px){ .co-wrap{grid-template-columns:1fr} }

        .co-summary { position:sticky; top:108px; }
        @media(max-width:700px){ .co-summary{position:static;order:-1} }

        .co-card {
          background:#fff; border:1px solid #e5e7eb; border-radius:10px;
          overflow:hidden; animation:fadeUp .2s ease;
        }
        .co-card-head { padding:13px 18px; border-bottom:1px solid #e5e7eb; background:#fafafa; }

        .co-section-label {
          font-size:9px; font-weight:700; color:#9ca3af;
          text-transform:uppercase; letter-spacing:.14em;
          margin-bottom:14px; padding-bottom:9px;
          border-bottom:1px solid #f3f4f6;
        }
        .co-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media(max-width:440px){ .co-grid-2{grid-template-columns:1fr} }
        .co-full { grid-column:1/-1; }

        .del-opts { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
        .del-opt {
          flex:1; min-width:140px; padding:11px 14px;
          border-radius:8px; cursor:pointer; text-align:left;
          border:1.5px solid #e5e7eb; background:#fff;
          transition:all .15s; font-family:inherit;
        }
        .del-opt.on { border-color:#111; background:#fafafa; }

        .steps { display:flex; align-items:center; gap:6px; }
        .step-dot {
          width:22px; height:22px; border-radius:50%;
          font-size:10px; font-weight:700;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .step-line { width:20px; height:2px; border-radius:1px; }

        .btn-pri {
          width:100%; padding:12px; border-radius:7px; border:none;
          background:#111; color:#fff; font-size:13px; font-weight:600;
          cursor:pointer; letter-spacing:.04em;
          display:flex; align-items:center; justify-content:center; gap:8px;
          font-family:inherit; transition:background .15s;
        }
        .btn-pri:hover:not(:disabled) { background:#2d2d2d; }
        .btn-pri:disabled { background:#f3f4f6; color:#9ca3af; cursor:not-allowed; }

        .btn-ghost-sm {
          display:flex; align-items:center; gap:5px;
          background:none; border:none; cursor:pointer;
          color:#9ca3af; font-size:12px; padding:0;
          font-family:inherit; transition:color .15s;
          margin-bottom:12px;
        }
        .btn-ghost-sm:hover { color:#374151; }

        .upload-zone {
          display:flex; flex-direction:column; align-items:center;
          gap:8px; padding:clamp(20px,4vw,30px) 16px;
          border:1.5px dashed #d1d5db; border-radius:8px; cursor:pointer;
          transition:border-color .15s;
        }
        .upload-zone:hover { border-color:#111; }

        /* QR section */
        .qr-block {
          display:flex; gap:clamp(16px,3vw,24px);
          flex-wrap:wrap; align-items:flex-start;
          padding:clamp(16px,3vw,22px);
        }
        .qr-img {
          width:clamp(200px,50vw,260px);
          height:clamp(200px,50vw,260px);
          object-fit:contain;
          border-radius:8px;
          border:1px solid #e5e7eb;
          flex-shrink:0;
        }
        @media(max-width:500px) {
          .qr-block { flex-direction:column; align-items:center; }
          .qr-img { width:min(280px, 80vw); height:min(280px, 80vw); }
        }

        /* Wompi strip */
        .wompi-strip {
          border-top:1px solid #e5e7eb;
          padding:12px 16px;
          display:flex; align-items:center;
          justify-content:space-between;
          gap:12px; flex-wrap:wrap;
          background:#fafafa;
        }
        .wompi-badge {
          display:inline-flex; align-items:center; gap:6px;
          font-size:11px; font-weight:600; color:#5b21b6;
          letter-spacing:.02em;
        }
        .wompi-btn {
          padding:8px 16px; border-radius:6px;
          background:#7c3aed; color:#fff;
          font-size:12px; font-weight:600;
          text-decoration:none; white-space:nowrap;
          transition:background .15s; flex-shrink:0;
        }
        .wompi-btn:hover { background:#6d28d9; }
      `}</style>

      {/* ── Sub-header sticky ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb",
        padding:"9px clamp(14px,4vw,24px)",
        position:"sticky", top:56, zIndex:50,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>

        <button className="btn-ghost-sm" style={{ marginBottom:0 }} onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver
        </button>

        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#111", letterSpacing:".02em" }}>Finalizar pedido</div>
          <div style={{ fontSize:10, color:"#9ca3af", letterSpacing:".04em" }}>{college.name} · {cartQty} prenda{cartQty!==1?"s":""}</div>
        </div>

        <div className="steps">
          {[1,2].map((n,i) => {
            const done = step > n, active = step === n;
            return (
              <React.Fragment key={n}>
                <div className="step-dot" style={{
                  background: done?"#059669":active?"#111":"#f3f4f6",
                  color: done||active?"#fff":"#9ca3af",
                }}>
                  {done
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    : n}
                </div>
                {i===0 && <div className="step-line" style={{ background:step>1?"#059669":"#e5e7eb" }}/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="co-wrap">

        {/* ── Columna principal ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* PASO 1 — Datos */}
          {step === 1 && (
            <div className="co-card">
              <div className="co-card-head">
                <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".14em", marginBottom:3 }}>Paso 1 de 2</div>
                <div style={{ fontSize:16, fontWeight:600, color:"#111", fontFamily:"var(--font-display,'Cormorant Garamond',serif)", letterSpacing:".02em" }}>Información del pedido</div>
              </div>

              <div style={{ padding:"clamp(14px,3vw,20px)", display:"flex", flexDirection:"column", gap:20 }}>

                {/* Estudiante */}
                <div>
                  <div className="co-section-label" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>Estudiante</span>
                    <span style={{ fontSize:9, fontWeight:500, color:"#9ca3af", textTransform:"none", letterSpacing:".04em", fontStyle:"italic" }}>
                      Opcional
                    </span>
                  </div>
                  <div className="co-grid-2">
                    <div className="co-full">
                      <Field label="Nombre completo">
                        <input
                          value={form.studentName}
                          placeholder="Nombre del estudiante"
                          autoComplete="name"
                          onChange={e => {
                            const v = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, "");
                            set("studentName", v);
                          }}
                        />
                      </Field>
                    </div>
                    <Field label="Curso">
                      <input
                        value={form.grade}
                        placeholder="Ej: 5° A"
                        onChange={e => {
                          const v = e.target.value.replace(/[^a-zA-Z0-9°\s]/g, "");
                          set("grade", v);
                        }}
                      />
                    </Field>
                    <Field label="Documento">
                      <input
                        value={form.studentDoc}
                        placeholder="N° documento"
                        inputMode="numeric"
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "");
                          set("studentDoc", v);
                        }}
                      />
                    </Field>
                  </div>
                </div>

                {/* Acudiente */}
                <div>
                  <div className="co-section-label">Acudiente</div>
                  <div className="co-grid-2">
                    <div className="co-full">
                      <Field label="Nombre completo" required>
                        <input
                          value={form.guardianName}
                          placeholder="Nombre del acudiente"
                          autoComplete="name"
                          onChange={e => {
                            const v = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, "");
                            set("guardianName", v);
                          }}
                        />
                      </Field>
                    </div>
                    <Field label="Teléfono" required>
                      <input
                        type="tel"
                        value={form.phone}
                        placeholder="+57 312 000 0000"
                        autoComplete="tel"
                        inputMode="tel"
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9+\s]/g, "");
                          set("phone", v);
                        }}
                      />
                    </Field>
                    <Field label="Correo electrónico" required hint={form.email.trim() && !emailValid ? "⚠ Ingresa un correo válido con @ y dominio" : "Recibirás la confirmación aquí"}>
                      <input
                        type="email"
                        value={form.email}
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                        inputMode="email"
                        onChange={e => set("email", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>

                {/* Entrega */}
                <div>
                  <div className="co-section-label">Tipo de entrega</div>
                  <div className="del-opts">
                    {[
                      { value:"domicilio",             label:"Domicilio",               sub:`+ ${COP(DELIVERY_FEE)} · Envigado / El Poblado` },
                      { value:"domicilio_coordinado",  label:"Domicilio fuera de zona", sub:"El admin te contacta para el cobro" },
                      { value:"recogida",              label:"Recoger en tienda",       sub:"Sin costo adicional" },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        className={`del-opt${form.deliveryType===opt.value?" on":""}`}
                        onClick={()=>set("deliveryType",opt.value)}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#111", marginBottom:2 }}>{opt.label}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>

                  {form.deliveryType==="domicilio_coordinado" && (
                    <div style={{ animation:"fadeUp .2s ease" }}>
                      <div style={{
                        display:"flex", alignItems:"flex-start", gap:10,
                        background:"#eff6ff", border:"1px solid #93c5fd",
                        borderRadius:8, padding:"11px 14px",
                      }}>
                        <svg style={{ flexShrink:0, marginTop:1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", letterSpacing:".04em", textTransform:"uppercase", marginBottom:3 }}>
                            Soporte te contactará
                          </div>
                          <div style={{ fontSize:11, fontWeight:400, color:"#1e40af", lineHeight:1.55 }}>
                            Completa tu pedido normalmente. Una vez confirmado, te contactaremos al teléfono o correo registrado para coordinar el costo y la fecha de envío.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {form.deliveryType==="recogida" && (
                    <div style={{ animation:"fadeUp .2s ease" }}>
                      <div style={{
                        display:"flex", alignItems:"flex-start", gap:10,
                        background:"#f0fdf4", border:"1px solid #86efac",
                        borderRadius:8, padding:"11px 14px",
                      }}>
                        <svg style={{ flexShrink:0, marginTop:1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:"#15803d", letterSpacing:".04em", textTransform:"uppercase", marginBottom:3 }}>
                            ¿Cuándo puedo recoger mi pedido?
                          </div>
                          <div style={{ fontSize:11, fontWeight:400, color:"#166534", lineHeight:1.55 }}>
                            Te notificaremos por correo cuando tu pedido esté <strong>listo para recoger</strong>. Solo preséntate en tienda con el número de pedido.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {form.deliveryType==="domicilio" && (
                    <div style={{ animation:"fadeUp .2s ease", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Aviso zona de cobertura */}
                      <div style={{
                        display:"flex", alignItems:"flex-start", gap:10,
                        background:"#fffbeb", border:"1px solid #fcd34d",
                        borderRadius:8, padding:"11px 14px",
                      }}>
                        <svg style={{ flexShrink:0, marginTop:1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:"#92400e", letterSpacing:".04em", textTransform:"uppercase", marginBottom:3 }}>
                            Cobertura: Envigado y El Poblado
                          </div>
                          <div style={{ fontSize:11, fontWeight:400, color:"#b45309", lineHeight:1.55 }}>
                            Si estás fuera de esta zona, selecciona la opción <strong>"Domicilio fuera de zona"</strong> para que te contactemos y coordinemos el envío.
                          </div>
                        </div>
                      </div>

                      <div className="co-grid-2">
                        <div className="co-full">
                          <Field label="Dirección" required>
                            <input value={form.street} placeholder="Calle / Carrera y número"
                              onChange={e=>set("street",e.target.value)}/>
                          </Field>
                        </div>
                        <Field label="Barrio">
                          <input value={form.neighborhood} placeholder="Barrio"
                            onChange={e=>set("neighborhood",e.target.value)}/>
                        </Field>
                        <Field label="Ciudad">
                          <input value={form.city} onChange={e=>set("city",e.target.value)}/>
                        </Field>
                      </div>
                    </div>
                  )}
                </div>

                <Field label="Observaciones" hint="Opcional — instrucciones especiales, tallas, etc.">
                  <textarea style={{ resize:"vertical", minHeight:64 }}
                    value={form.notes} placeholder="Cualquier detalle adicional..."
                    onChange={e=>set("notes",e.target.value)}/>
                </Field>

                {/* Métodos de pago aceptados */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", padding:"10px 0 2px" }}>
                  <span style={{ fontSize:10, color:"#9ca3af", marginRight:4 }}>Pagos aceptados:</span>
                  {[
                    { label:"Nequi",       bg:"#7b1fa2", color:"#fff" },
                    { label:"Daviplata",   bg:"#e53935", color:"#fff" },
                    { label:"Bancolombia", bg:"#ffc107", color:"#111" },
                    { label:"Transferencia", bg:"#f3f4f6", color:"#374151" },
                    { label:"PSE",         bg:"#f3f4f6", color:"#374151" },
                  ].map(({ label, bg, color }) => (
                    <span key={label} style={{
                      background:bg, color,
                      fontSize:9, fontWeight:700, letterSpacing:".04em",
                      padding:"3px 8px", borderRadius:3,
                    }}>{label}</span>
                  ))}
                </div>

                <button className="btn-pri"
                  disabled={!step1Valid}
                  title={!step1Valid ? "Completa los datos del acudiente (nombre, teléfono y correo)" : undefined}
                  onClick={()=>{ if(!step1Valid){toast("Completa los datos del acudiente","error");return;} goStep(2); }}>
                  Continuar al pago
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 — Pago */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeUp .2s ease" }}>
              <button className="btn-ghost-sm" onClick={()=>goStep(1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Volver a datos
              </button>

              {/* Bloque QR + Wompi */}
              <div className="co-card" style={{ border:"1.5px solid #111" }}>
                {/* Header */}
                <div style={{ background:"#111", padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ color:"#fff", fontWeight:600, fontSize:13, letterSpacing:".04em" }}>Pago por transferencia</div>
                  <span style={{ background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.8)", fontSize:9, fontWeight:700, padding:"2px 9px", borderRadius:20, letterSpacing:".1em", textTransform:"uppercase" }}>
                    Recomendado
                  </span>
                </div>

                {/* QR */}
                <div className="qr-block">
                  <img src={imgQrPago} alt="Código QR de pago" className="qr-img"/>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#374151", letterSpacing:".08em", textTransform:"uppercase", marginBottom:12 }}>
                      Instrucciones
                    </div>
                    {[
                      "Abre tu app bancaria",
                      "Selecciona la opción Pagar con QR",
                      "Agrega el número de documento del estudiante en la descripción del pago",
                      `Transfiere exactamente ${COP(total)}`,
                      "Adjunta el comprobante abajo",
                    ].map((t,i) => (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:9 }}>
                        <span style={{ width:20, height:20, borderRadius:"50%", background:"#f3f4f6", fontSize:9, fontWeight:700, color:"#374151", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {i+1}
                        </span>
                        <span style={{ fontSize:13, color:"#374151", lineHeight:1.5 }}>{t}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:14, background:"#f0fdf4", border:"1px solid #86efac", borderRadius:7, padding:"10px 13px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                      <span style={{ fontSize:11, color:"#065f46", fontWeight:600 }}>Total a transferir</span>
                      <span style={{ fontSize:18, fontWeight:700, color:"#065f46", fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>{COP(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Wompi — siempre visible */}
                <div className="wompi-strip">
                  <div>
                    <div className="wompi-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                      Pagar con tarjeta o PSE
                    </div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
                      Procesado de forma segura por Wompi
                    </div>
                  </div>
                  {import.meta.env.VITE_WOMPI_LINK ? (
                    <a href={import.meta.env.VITE_WOMPI_LINK} target="_blank" rel="noreferrer" className="wompi-btn">
                      Pagar con Wompi
                    </a>
                  ) : (
                    <span style={{ fontSize:11, color:"#9ca3af", fontStyle:"italic" }}>Próximamente</span>
                  )}
                </div>
              </div>

              {/* Comprobante */}
              <div className="co-card" style={{ border: !proofFile ? "1.5px solid #fca5a5" : "1px solid #e5e7eb" }}>
                <div className="co-card-head">
                  <div style={{ fontSize:13, fontWeight:600, color:"#111", marginBottom:2 }}>
                    Comprobante de pago <span style={{ color:"#dc2626" }}>*</span>
                  </div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>
                    Adjunta la captura de pantalla o foto del pago
                  </div>
                </div>
                <div style={{ padding:"clamp(14px,3vw,18px)" }}>
                  {proofPreview ? (
                    <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                      <img src={proofPreview} alt="Comprobante"
                        style={{ width:90, height:90, objectFit:"cover", borderRadius:8, border:"1px solid #e5e7eb", flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#065f46", marginBottom:4 }}>Comprobante adjunto</div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginBottom:9, wordBreak:"break-all" }}>{proofFile?.name}</div>
                        <button onClick={()=>{setProofFile(null);setProofPreview(null);}}
                          style={{ fontSize:11, color:"#dc2626", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:5, padding:"4px 10px" }}>
                          Cambiar archivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="upload-zone">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                      <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Seleccionar archivo</div>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>JPG, PNG o PDF — máx. 5 MB</div>
                      <input type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={handleProof}/>
                    </label>
                  )}
                </div>
              </div>
              {!proofFile && (
  <div style={{
    background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:7,
    padding:"10px 14px", display:"flex", alignItems:"center", gap:8,
    fontSize:12, color:"#dc2626", fontWeight:500
  }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
    </svg>
    Debes adjuntar el comprobante de pago para continuar
  </div>
)}

{/* Botón confirmar */}
<button className="btn-pri" onClick={handleSubmit} disabled={loading || !proofFile}></button>
              {/* Botón confirmar */}
              <button className="btn-pri" onClick={handleSubmit} disabled={loading || !proofFile}>
                {loading
                  ? <><Spinner size={15}/> Enviando pedido...</>
                  : <>Confirmar pedido · {COP(total)}</>}
              </button>
            </div>
          )}
        </div>

        {/* ── Resumen ── */}
        <div className="co-summary">
          <div className="co-card">
            <div className="co-card-head">
              <div style={{ fontSize:9, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".14em" }}>Resumen del pedido</div>
            </div>
            <div style={{ padding:"clamp(12px,2vw,16px)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:13, paddingBottom:13, borderBottom:"1px solid #f3f4f6" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:college.primaryColor, flexShrink:0 }}/>
                <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{college.name}</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:12 }}>
                {cart.map(item => (
                  <div key={item.id+item.size} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:"#111", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:10, color:"#9ca3af", marginTop:1 }}>
                        T.{item.size} · {COP(item.price)} c/u
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:0, marginTop:6 }}>
                        <button
                          onClick={() => setCart(prev => {
                            if (item.qty <= 1) return prev.filter(i => !(i.id === item.id && i.size === item.size));
                            return prev.map(i => i.id === item.id && i.size === item.size ? { ...i, qty: i.qty - 1 } : i);
                          })}
                          style={{ width:28, height:28, borderRadius:"4px 0 0 4px", border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#374151" }}
                        >
                          {item.qty <= 1 ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                          ) : "−"}
                        </button>
                        <span style={{ width:32, height:28, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e5e7eb", borderLeft:"none", borderRight:"none", fontSize:12, fontWeight:700, color:"#111", background:"#fff" }}>
                          {item.qty}
                        </span>
                        <button
                          onClick={() => setCart(prev => prev.map(i => i.id === item.id && i.size === item.size ? { ...i, qty: i.qty + 1 } : i))}
                          style={{ width:28, height:28, borderRadius:"0 4px 4px 0", border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#374151" }}
                        >+</button>
                      </div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#111", flexShrink:0 }}>{COP(item.price*item.qty)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop:"1px solid #e5e7eb", paddingTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b7280" }}>
                  <span>Subtotal</span><span>{COP(subtotal)}</span>
                </div>
                {form.deliveryType==="domicilio" && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b7280" }}>
                    <span>Envío a domicilio</span><span>+ {COP(DELIVERY_FEE)}</span>
                  </div>
                )}
                {form.deliveryType==="domicilio_coordinado" && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#2563eb" }}>
                    <span>Envío por coordinar</span>
                    <span style={{ fontWeight:600 }}>Te contactamos</span>
                  </div>
                )}
                {form.deliveryType==="recogida" && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#16a34a" }}>
                    <span>Recogida en tienda</span>
                    <span style={{ fontWeight:600 }}>Te avisamos cuando esté listo</span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #e5e7eb", fontSize:15, fontWeight:700, color:"#111" }}>
                  <span>Total</span>
                  <span style={{ fontFamily:"var(--font-mono,'DM Mono',monospace)" }}>{COP(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}