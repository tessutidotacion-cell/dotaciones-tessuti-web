import { useState } from "react";
import { createOrder, uploadPaymentProof, validateCoupon, getWompiSignature } from "../../services/api";
import { COP } from "../../utils/money";
import { imgQrPago } from "../../assets";

const DELIVERY_FEE = 15000;
const ACCENT = "#b89a6a";
const INK    = "#1c1c1c";

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation:"spin .7s linear infinite", flexShrink:0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

function Field({ label, required, hint, error, children }) {
  const autoId = `field-${(label || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
  const child = React.isValidElement(children)
    ? React.cloneElement(children, { id: children.props.id ?? autoId })
    : children;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label htmlFor={React.isValidElement(children) ? (children.props.id ?? autoId) : undefined} style={{
        fontSize:10, fontWeight:700, color: error ? "#dc2626" : "#6b6560",
        textTransform:"uppercase", letterSpacing:".12em",
        fontFamily:"var(--font,'Jost',sans-serif)",
      }}>
        {label}{required && <span style={{ color:"#dc2626", marginLeft:2 }}>*</span>}
      </label>
      {child}
      {(hint || error) && (
        <span style={{ fontSize:11, color: error ? "#dc2626" : "#9b9591", display:"flex", alignItems:"center", gap:4 }}>
          {error && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          )}
          {error || hint}
        </span>
      )}
    </div>
  );
}

export default function Checkout({ college, cart, setCart, onSuccess, onBack, toast }) {
  const [step,           setStep]          = useState(1);
  const [loading,        setLoading]       = useState(false);
  const [proofFile,      setProofFile]     = useState(null);
  const [proofPreview,   setProofPreview]  = useState(null);
  const [dragOver,       setDragOver]      = useState(false);

  const [couponInput,    setCouponInput]   = useState("");
  const [coupon,         setCoupon]        = useState(null);   // { code, pct } cuando válido
  const [couponLoading,  setCouponLoading] = useState(false);
  const [paymentMethod,  setPaymentMethod] = useState("transfer"); // "transfer" | "cash" | "wompi"

  const [form, setForm] = useState({
    guardianName:"", guardianDoc:"", phone:"", email:"",
    billingAddress:"",
    deliveryType:"recogida",
    street:"", neighborhood:"", city:"Medellín",
    shippingStreet:"", shippingNeighborhood:"", shippingCity:"Medellín",
    notes:"",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = form.deliveryType === "domicilio" ? DELIVERY_FEE : 0;
  const discount    = coupon ? Math.round(subtotal * coupon.pct / 100) : 0;
  const total       = subtotal + deliveryFee - discount;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const res = await validateCoupon(code);
      if (res.data?.valid) {
        setCoupon({ code, pct: res.data.pct });
        toast(`Cupón aplicado: ${res.data.pct}% de descuento`, "success");
      } else {
        toast("Código inválido o expirado", "error");
        setCoupon(null);
      }
    } catch {
      toast("No se pudo validar el cupón", "error");
    } finally {
      setCouponLoading(false);
    }
  };
  const cartQty     = cart.reduce((s, i) => s + i.qty, 0);
  const emailValid  = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email.trim());
  const phoneValid  = /^(\+?57|0057)?3\d{9}$/.test(form.phone.replace(/[\s\-\(\)]/g, ""));
  const needsStreet      = form.deliveryType === "domicilio";
  const needsShipCoord   = form.deliveryType === "domicilio_coordinado";
  const step1Valid  = form.guardianName.trim() && form.guardianDoc.trim() &&
    phoneValid && emailValid && form.billingAddress.trim() &&
    (!needsStreet    || form.street.trim()) &&
    (!needsShipCoord || form.shippingStreet.trim());

  const goStep = (n) => { setStep(n); window.scrollTo(0, 0); };

  const handleProof = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg","image/png","image/webp","image/heic","image/heif","application/pdf"];
    const validExts = [".jpg",".jpeg",".png",".webp",".heic",".heif",".pdf"];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!allowed.includes(file.type) || !hasValidExt) {
      toast("Solo se permiten imágenes (JPG, PNG, WEBP) o PDF", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { toast("El archivo supera los 5 MB", "error"); return; }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = ev => setProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (paymentMethod === "transfer" && !proofFile) { toast("Adjunta el comprobante de pago", "error"); return; }
    setLoading(true);
    try {
      const orderPayload = {
        collegeId:   college.id,
        collegeName: college.name,
        items: cart.map(i => ({
          id:i.id, name:i.name, size:i.size, qty:i.qty, price:i.price, category:i.category,
        })),
        guardian: {
          name:           form.guardianName.trim(),
          document:       form.guardianDoc.trim(),
          phone:          form.phone.trim(),
          email:          form.email.trim(),
          billingAddress: form.billingAddress.trim(),
        },
        delivery: {
          type: form.deliveryType,
          address: needsStreet
            ? { street:form.street.trim(), neighborhood:form.neighborhood.trim(), city:form.city.trim() }
            : needsShipCoord
            ? { street:form.shippingStreet.trim(), neighborhood:form.shippingNeighborhood.trim(), city:form.shippingCity.trim() }
            : null,
        },
        notes: form.notes.trim(),
        coupon: coupon ? { code: coupon.code, pct: coupon.pct, discount } : null,
        paymentMethod,
      };

      const orderResult = await createOrder(orderPayload);
      const orderId = orderResult.data?.id || orderResult.data?.orderId;

      if (paymentMethod === "transfer" && orderId && proofFile) {
        try { await uploadPaymentProof(orderId, proofFile); }
        catch { toast("Pedido creado. Envía el comprobante por WhatsApp.", "warning"); }
      }

      // ── Wompi redirect ──────────────────────────────────────
      if (paymentMethod === "wompi" && orderId) {
        const amountInCents = total * 100;
        const signRes = await getWompiSignature(orderId, amountInCents);
        const { signature, publicKey } = signRes.data;

        // Guardar pedido antes de salir de la SPA
        sessionStorage.setItem("wompi_pending_order", JSON.stringify(orderResult.data));

        const wompiUrl = new URL("https://checkout.wompi.co/p/");
        wompiUrl.searchParams.set("public-key",         publicKey);
        wompiUrl.searchParams.set("currency",           "COP");
        wompiUrl.searchParams.set("amount-in-cents",    String(amountInCents));
        wompiUrl.searchParams.set("reference",          orderId);
        wompiUrl.searchParams.set("signature:integrity",signature);
        wompiUrl.searchParams.set("redirect-url",       window.location.origin + "/");

        window.location.href = wompiUrl.toString();
        return; // no llama onSuccess — Wompi redirige de vuelta
      }

      onSuccess(orderResult.data);
    } catch (err) {
      toast(err.message || "Error al crear el pedido", "error");
    } finally {
      setLoading(false);
    }
  };

  const deliveryOptions = [
    {
      value: "recogida",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: "Recoger en tienda",
      sub:   "Sin costo adicional",
      color: "#16a34a",
    },
    {
      value: "domicilio",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M9 21H6a2 2 0 01-2-2v-6"/><rect x="9" y="11" width="14" height="10" rx="2"/><path d="M12 21v-6"/>
        </svg>
      ),
      label: "Domicilio",
      sub:   `+ ${COP(DELIVERY_FEE)} · Envigado / El Poblado`,
      color: "#2563eb",
    },
    {
      value: "domicilio_coordinado",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      label: "Fuera de zona",
      sub:   "El admin coordina el envío",
      color: "#d97706",
    },
  ];

  return (
    <div style={{ minHeight:"calc(100vh - 56px)", background:"#faf9f7", fontFamily:"var(--font,'Jost',sans-serif)" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── Layout ── */
        .co-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: clamp(20px,3vw,36px) clamp(14px,4vw,24px);
          display: grid;
          grid-template-columns: 1fr clamp(270px,30%,320px);
          gap: clamp(16px,2.5vw,28px);
          align-items: start;
        }
        @media(max-width:720px) {
          .co-wrap { grid-template-columns:1fr; }
        }
        .co-summary {
          position: sticky;
          top: calc(64px + env(safe-area-inset-top) + 56px);
        }
        @media(max-width:720px) {
          .co-summary { position:static; order:-1; }
        }

        /* ── Card ── */
        .co-card {
          background: #fff;
          border: 1px solid #e8e5e1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(28,28,28,.05);
        }
        .co-card-head {
          padding: 16px 20px;
          border-bottom: 1px solid #f0ede9;
          background: #faf9f7;
        }
        .co-section-title {
          font-size: 9px;
          font-weight: 700;
          color: #9b9591;
          text-transform: uppercase;
          letter-spacing: .16em;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f0ede9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ── Grid campos ── */
        .co-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .co-full  { grid-column: 1 / -1; }
        @media(max-width:440px) { .co-grid { grid-template-columns:1fr; } }

        /* ── Inputs ── */
        .co-wrap input,
        .co-wrap textarea,
        .co-wrap select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 13px;
          border: 1.5px solid #e8e5e1;
          border-radius: 8px;
          font-family: var(--font,'Jost',sans-serif);
          font-size: 13px;
          color: #1c1c1c;
          background: #fff;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          -webkit-appearance: none;
        }
        .co-wrap input::placeholder,
        .co-wrap textarea::placeholder { color: #c4bfba; }
        .co-wrap input:focus,
        .co-wrap textarea:focus,
        .co-wrap select:focus {
          border-color: ${INK};
          box-shadow: 0 0 0 3px rgba(28,28,28,.07);
        }
        .co-wrap textarea { resize: vertical; min-height: 72px; }

        /* ── Delivery options ── */
        .del-opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        @media(max-width:500px) { .del-opts { grid-template-columns: 1fr; } }
        .del-opt {
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          border: 2px solid #e8e5e1;
          background: #fff;
          transition: all .18s;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .del-opt:hover { border-color: #c4bfba; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(28,28,28,.07); }
        .del-opt.on {
          border-color: ${INK};
          background: #faf9f7;
          box-shadow: 0 4px 16px rgba(28,28,28,.1);
        }
        .del-opt-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2px;
          background: #f5f3f0;
          color: #6b6560;
          transition: all .18s;
          flex-shrink: 0;
        }
        .del-opt.on .del-opt-icon { background: ${INK}; color: #fff; }

        /* ── Info boxes ── */
        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-radius: 10px;
          padding: 13px 15px;
          margin-bottom: 4px;
          animation: fadeUp .2s ease;
        }

        /* ── Step nav ── */
        .btn-ghost {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #9b9591; font-size: 12px; font-family: inherit;
          padding: 0; transition: color .15s; letter-spacing: .04em;
        }
        .btn-ghost:hover { color: #1c1c1c; }

        /* ── Primary button ── */
        .btn-pri {
          width: 100%;
          padding: 14px 20px;
          border-radius: 10px;
          border: none;
          background: ${INK};
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: inherit;
          transition: all .18s;
          box-shadow: 0 4px 20px rgba(28,28,28,.18);
        }
        .btn-pri:hover:not(:disabled) {
          background: #2d2d2d;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(28,28,28,.24);
        }
        .btn-pri:disabled { background: #e8e5e1; color: #b0a89f; cursor:not-allowed; box-shadow:none; }

        /* ── Upload zone ── */
        .upload-zone {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px;
          padding: clamp(28px,5vw,40px) 16px;
          border: 2px dashed #d4cfc9;
          border-radius: 12px;
          cursor: pointer;
          transition: all .18s;
          text-align: center;
        }
        .upload-zone:hover,
        .upload-zone.drag { border-color: ${INK}; background: #f7f5f2; }

        /* ── QR ── */
        .qr-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(18px,3vw,26px);
          gap: clamp(20px,3vw,28px);
        }
        .qr-img {
          width: clamp(210px,58vw,340px);
          height: clamp(210px,58vw,340px);
          object-fit: contain;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .qr-instructions {
          width: 100%;
        }
        @media(max-width:480px) {
          .qr-img { width: min(240px, 78vw); height: min(240px, 78vw); }
        }

        /* ── Payment step number ── */
        .pay-step {
          display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;
        }
        .pay-step-num {
          width: 24px; height: 24px; border-radius: 50%;
          background: #f0ede9;
          font-size: 10px; font-weight: 700; color: #6b6560;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }

        /* ── Cart item qty controls ── */
        .qty-ctrl {
          display: flex; align-items: center;
        }
        .qty-btn {
          width: 28px; height: 28px;
          border: 1.5px solid #e8e5e1;
          background: #faf9f7;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #6b6560;
          transition: all .12s;
        }
        .qty-btn:hover { background: #f0ede9; color: #1c1c1c; }
        .qty-btn:first-child { border-radius: 6px 0 0 6px; }
        .qty-btn:last-child  { border-radius: 0 6px 6px 0; }
        .qty-val {
          width: 34px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border-top: 1.5px solid #e8e5e1;
          border-bottom: 1.5px solid #e8e5e1;
          font-size: 12px; font-weight: 700; color: #1c1c1c;
          background: #fff;
        }

      `}</style>

      {/* ── Sub-header ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e5e1",
        padding: "0 clamp(14px,4vw,24px)",
        position: "sticky", top: "calc(64px + env(safe-area-inset-top))", zIndex: 50,
        height: 56,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        boxShadow: "0 2px 12px rgba(28,28,28,.05)",
      }}>
        <button className="btn-ghost" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver
        </button>

        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{
            fontFamily: "var(--font-display,'Cormorant Garamond',serif)",
            fontSize: 17, fontWeight: 500, fontStyle: "italic", color: INK, lineHeight:1,
          }}>
            Finalizar pedido
          </div>
          <div style={{ fontSize:10, color:"#9b9591", letterSpacing:".06em", marginTop:2 }}>
            {college.name} · {cartQty} prenda{cartQty!==1?"s":""}
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {[1,2].map((n,i) => {
            const done   = step > n;
            const active = step === n;
            return (
              <React.Fragment key={n}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background: done ? "#16a34a" : active ? INK : "#f0ede9",
                  color: done||active ? "#fff" : "#9b9591",
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .2s",
                  boxShadow: active ? `0 2px 10px rgba(28,28,28,.2)` : "none",
                }}>
                  {done
                    ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    : n}
                </div>
                {i === 0 && (
                  <div style={{ width:24, height:2, borderRadius:1, background: step>1 ? "#16a34a" : "#e8e5e1", transition:"background .3s" }}/>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="co-wrap">

        {/* ── Columna principal ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp .25s ease" }}>

          {/* ═══════ PASO 1 ═══════ */}
          {step === 1 && (
            <>
                  {/* Acudiente */}
              <div className="co-card">
                <div className="co-card-head">
                  <div style={{ fontSize:10, fontWeight:600, color:"#dc2626", letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>Requerido</div>
                  <div style={{ fontSize:16, fontWeight:600, color:INK, fontFamily:"var(--font-display,'Cormorant Garamond',serif)", letterSpacing:".02em" }}>
                    Datos de contacto
                  </div>
                </div>
                <div style={{ padding:"clamp(16px,3vw,22px)", display:"flex", flexDirection:"column", gap:14 }}>
                  <div className="co-grid">
                    <div className="co-full">
                      <Field label="Nombre completo" required>
                        <input
                          value={form.guardianName}
                          placeholder="Tu nombre completo"
                          autoComplete="name"
                          onChange={e => set("guardianName", e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, ""))}
                        />
                      </Field>
                    </div>
                    <Field label="Cédula / NIT" required>
                      <input
                        value={form.guardianDoc}
                        placeholder="N° cédula o NIT"
                        inputMode="numeric"
                        onChange={e => set("guardianDoc", e.target.value.replace(/[^0-9\-]/g, ""))}
                      />
                    </Field>
                    <Field
                      label="Teléfono"
                      required
                      error={form.phone.trim() && !phoneValid ? "Ingresa un número colombiano válido (ej: 312 000 0000)" : ""}
                    >
                      <input
                        type="tel"
                        value={form.phone}
                        placeholder="+57 312 000 0000"
                        autoComplete="tel"
                        inputMode="tel"
                        onChange={e => set("phone", e.target.value.replace(/[^0-9+\s]/g, ""))}
                        style={{ borderColor: form.phone.trim() && !phoneValid ? "#dc2626" : undefined }}
                      />
                    </Field>
                    <div className="co-full">
                      <Field
                        label="Correo electrónico"
                        required
                        error={form.email.trim() && !emailValid ? "Ingresa un correo válido (ej: nombre@correo.com)" : ""}
                        hint={!form.email.trim() || emailValid ? "Recibirás la confirmación aquí" : ""}
                      >
                        <input
                          type="email"
                          value={form.email}
                          placeholder="correo@ejemplo.com"
                          autoComplete="email"
                          inputMode="email"
                          onChange={e => set("email", e.target.value)}
                          style={{ borderColor: form.email.trim() && !emailValid ? "#dc2626" : undefined }}
                        />
                      </Field>
                    </div>
                    <div className="co-full">
                      <Field label="Dirección de facturación" required hint="Dirección asociada a tu cédula o NIT">
                        <input
                          value={form.billingAddress}
                          placeholder="Calle / Carrera, número, barrio, ciudad"
                          autoComplete="street-address"
                          onChange={e => set("billingAddress", e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="co-card">
                <div className="co-card-head">
                  <div style={{ fontSize:10, fontWeight:600, color:ACCENT, letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>Entrega</div>
                  <div style={{ fontSize:16, fontWeight:600, color:INK, fontFamily:"var(--font-display,'Cormorant Garamond',serif)", letterSpacing:".02em" }}>
                    ¿Cómo recibes tu pedido?
                  </div>
                </div>
                <div style={{ padding:"clamp(16px,3vw,22px)", display:"flex", flexDirection:"column", gap:14 }}>
                  <div className="del-opts">
                    {deliveryOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`del-opt${form.deliveryType===opt.value?" on":""}`}
                        onClick={() => {
                          if (opt.value === "recogida") {
                            setForm(f => ({
                              ...f,
                              deliveryType: opt.value,
                              street: "", neighborhood: "", city: "Medellín",
                              shippingStreet: "", shippingNeighborhood: "", shippingCity: "Medellín",
                            }));
                          } else {
                            set("deliveryType", opt.value);
                            if (paymentMethod === "cash") {
                              setPaymentMethod("transfer");
                              toast("Efectivo solo disponible para recogida en tienda. Se cambió a Transferencia / QR.", "warning");
                            }
                          }
                        }}
                      >
                        <div className="del-opt-icon">{opt.icon}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:INK, letterSpacing:".02em" }}>{opt.label}</div>
                        <div style={{ fontSize:10, color:"#9b9591", lineHeight:1.4 }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Info según entrega */}
                  {form.deliveryType === "recogida" && (
                    <div className="info-box" style={{ background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
                      <svg style={{ flexShrink:0, marginTop:1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#15803d", letterSpacing:".06em", textTransform:"uppercase", marginBottom:3 }}>Sin costo extra</div>
                        <div style={{ fontSize:12, color:"#166534", lineHeight:1.6 }}>
                          Te avisaremos por correo cuando tu pedido esté <strong>listo para recoger</strong>. Solo preséntate con el número de pedido.
                        </div>
                      </div>
                    </div>
                  )}
                  {form.deliveryType === "domicilio_coordinado" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeUp .2s ease" }}>
                      <div className="info-box" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", marginBottom:0 }}>
                        <svg style={{ flexShrink:0, marginTop:1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.14 9.81 19.79 19.79 0 01.07 1.18 2 2 0 012.05 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91A16 16 0 0014 15.82l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:3 }}>Te contactamos</div>
                          <div style={{ fontSize:12, color:"#1e40af", lineHeight:1.6 }}>
                            Completa tu pedido normalmente. Te contactaremos al teléfono o correo registrado para coordinar costo y fecha de envío.
                          </div>
                        </div>
                      </div>
                      <div className="co-grid">
                        <div className="co-full">
                          <Field label="Dirección de envío" required>
                            <input value={form.shippingStreet} placeholder="Calle / Carrera y número"
                              onChange={e => set("shippingStreet", e.target.value)}/>
                          </Field>
                        </div>
                        <Field label="Barrio">
                          <input value={form.shippingNeighborhood} placeholder="Barrio"
                            onChange={e => set("shippingNeighborhood", e.target.value)}/>
                        </Field>
                        <Field label="Ciudad">
                          <input value={form.shippingCity} onChange={e => set("shippingCity", e.target.value)}/>
                        </Field>
                      </div>
                    </div>
                  )}
                  {form.deliveryType === "domicilio" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"fadeUp .2s ease" }}>
                      <div className="info-box" style={{ background:"#fffbeb", border:"1px solid #fde68a", marginBottom:0 }}>
                        <svg style={{ flexShrink:0, marginTop:1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <div style={{ fontSize:12, color:"#92400e", lineHeight:1.6 }}>
                          Cobertura: <strong>Envigado y El Poblado</strong>. Si estás fuera de esta zona, usa la opción <strong>"Fuera de zona"</strong>.
                        </div>
                      </div>
                      <div className="co-grid">
                        <div className="co-full">
                          <Field label="Dirección" required>
                            <input value={form.street} placeholder="Calle / Carrera y número"
                              onChange={e => set("street", e.target.value)}/>
                          </Field>
                        </div>
                        <Field label="Barrio">
                          <input value={form.neighborhood} placeholder="Barrio"
                            onChange={e => set("neighborhood", e.target.value)}/>
                        </Field>
                        <Field label="Ciudad">
                          <input value={form.city} onChange={e => set("city", e.target.value)}/>
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="co-card">
                <div style={{ padding:"clamp(16px,3vw,22px)" }}>
                  <Field label="Observaciones" hint="Opcional — instrucciones especiales, notas del pedido, etc.">
                    <textarea
                      value={form.notes}
                      placeholder="¿Algo más que debamos saber?"
                      onChange={e => set("notes", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              {/* Botón continuar */}
              {/* Cupón de descuento */}
              <div className="co-card">
                <div className="co-card-head">
                  <div style={{ fontSize:10, fontWeight:600, color:ACCENT, letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>Opcional</div>
                  <div style={{ fontSize:16, fontWeight:600, color:INK, fontFamily:"var(--font-display,'Cormorant Garamond',serif)", letterSpacing:".02em" }}>
                    Cupón de descuento
                  </div>
                </div>
                <div style={{ padding:"clamp(14px,2.5vw,20px)" }}>
                  {coupon ? (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                      background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#15803d" }}>{coupon.code}</div>
                          <div style={{ fontSize:11, color:"#166534" }}>{coupon.pct}% de descuento aplicado · −{COP(discount)}</div>
                        </div>
                      </div>
                      <button onClick={() => { setCoupon(null); setCouponInput(""); }}
                        style={{ fontSize:11, color:"#dc2626", background:"#fef2f2", border:"1px solid #fca5a5",
                          borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", gap:8 }}>
                      <input
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={e => { if(e.key==="Enter") handleApplyCoupon(); }}
                        placeholder="Ingresa tu código"
                        style={{
                          flex:1, padding:"11px 13px", border:"1.5px solid #e8e5e1", borderRadius:8,
                          fontFamily:"var(--font,'Jost',sans-serif)", fontSize:13, color:INK,
                          background:"#fff", outline:"none", letterSpacing:".06em", fontWeight:600,
                        }}
                      />
                      <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                        style={{
                          padding:"11px 18px", borderRadius:8, border:"none", flexShrink:0,
                          background: couponLoading||!couponInput.trim() ? "#f0ede9" : INK,
                          color: couponLoading||!couponInput.trim() ? "#b0a89f" : "#fff",
                          fontSize:12, fontWeight:700, cursor: couponLoading||!couponInput.trim() ? "not-allowed" : "pointer",
                          fontFamily:"inherit", letterSpacing:".06em", transition:"all .15s",
                          display:"flex", alignItems:"center", gap:6,
                        }}>
                        {couponLoading
                          ? <Spinner size={12}/>
                          : "Aplicar"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="btn-pri"
                disabled={!step1Valid}
                onClick={() => { if(!step1Valid){ toast("Completa todos los campos requeridos del acudiente","error"); return; } goStep(2); }}
              >
                Continuar al pago
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </>
          )}

          {/* ═══════ PASO 2 ═══════ */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp .25s ease" }}>

              <button className="btn-ghost" onClick={() => goStep(1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Volver a datos
              </button>

              {/* Total destacado */}
              <div style={{
                background: INK,
                borderRadius: 12,
                padding: "clamp(18px,3vw,26px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                boxShadow: "0 6px 28px rgba(28,28,28,.2)",
              }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,.45)", letterSpacing:".16em", textTransform:"uppercase", marginBottom:4 }}>
                    Total a pagar
                  </div>
                  <div style={{
                    fontFamily:"var(--font-display,'Cormorant Garamond',serif)",
                    fontSize:"clamp(28px,5vw,36px)", fontWeight:500, color:"#fff",
                    letterSpacing:".02em", lineHeight:1,
                  }}>
                    {COP(total)}
                  </div>
                  {form.deliveryType === "domicilio" && (
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:4 }}>
                      Incluye domicilio {COP(DELIVERY_FEE)}
                    </div>
                  )}
                  {coupon && (
                    <div style={{ fontSize:11, color:"#86efac", marginTop:4 }}>
                      Cupón {coupon.code} · −{COP(discount)} aplicado
                    </div>
                  )}
                </div>
                <div style={{
                  background: ACCENT,
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 11, fontWeight: 700,
                  color: "#fff", letterSpacing: ".08em", textTransform: "uppercase",
                }}>
                  {cartQty} prenda{cartQty!==1?"s":""}
                </div>
              </div>

              {/* Pago QR + transferencia */}
              {paymentMethod === "transfer" && <div className="co-card" style={{ border:`2px solid ${INK}` }}>
                <div style={{ background:INK, padding:"13px 20px", display:"flex", alignItems:"center", gap:10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2">
                    <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/>
                    <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 22h.01M22 14h.01M22 18h.01M22 22h.01"/>
                  </svg>
                  <div style={{ flex:1, color:"#fff", fontWeight:600, fontSize:13, letterSpacing:".04em" }}>
                    Pagar con transferencia / QR
                  </div>
                  <span style={{ background:"rgba(184,154,106,.25)", color:ACCENT, fontSize:9, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:".12em", textTransform:"uppercase", border:`1px solid ${ACCENT}40` }}>
                    Recomendado
                  </span>
                </div>

                <div className="qr-block">
                  {/* ── QR image full width ── */}
                  {/* ── Bancolombia info centrado ── */}
                  <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:6, width:"100%" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#9b9591", letterSpacing:".14em", textTransform:"uppercase" }}>A cuenta de Bancolombia</div>
                    <div style={{ fontSize:22, fontWeight:800, color:INK, fontFamily:"monospace", letterSpacing:".06em" }}>862-000243-81</div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#9b9591", letterSpacing:".08em", textTransform:"uppercase" }}>Cuenta de Ahorros</div>
                    <div style={{ height:1, background:"#ebe8e4", width:"60%", margin:"4px 0" }}/>
                    <div style={{ fontSize:10, fontWeight:700, color:"#9b9591", letterSpacing:".14em", textTransform:"uppercase" }}>Llave</div>
                    <div style={{ fontSize:18, fontWeight:800, color:INK, fontFamily:"monospace", letterSpacing:".06em" }}>0050069103</div>
                  </div>

                  {/* ── QR image full width ── */}
                  <img
                    src={imgQrPago}
                    alt="Código QR de pago"
                    style={{
                      width:"100%",
                      height:"auto",
                      display:"block",
                      borderRadius:12,
                      boxShadow:"0 6px 28px rgba(28,28,28,.12)",
                    }}
                  />

                  <div className="qr-instructions">
                    <div style={{ fontSize:10, fontWeight:700, color:"#9b9591", letterSpacing:".14em", textTransform:"uppercase", marginBottom:16 }}>
                      Instrucciones paso a paso
                    </div>
                    {[
                      "Abre tu aplicación bancaria",
                      "Selecciona la opción «Pagar con QR»",
                      <span>Transfiere exactamente <strong style={{ color:INK }}>{COP(total)}</strong></span>,
                      "Descarga o captura el comprobante",
                    ].map((t,i) => (
                      <div key={i} className="pay-step">
                        <div className="pay-step-num">{i+1}</div>
                        <div style={{ fontSize:13, color:"#4b4844", lineHeight:1.55, paddingTop:2 }}>{t}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              }

              {/* Info Wompi */}
              {paymentMethod === "wompi" && (
                <div className="info-box" style={{ background:"#f5f3ff", border:"1.5px solid #c4b5fd", borderRadius:12, padding:"18px 20px" }}>
                  <svg style={{ flexShrink:0, marginTop:1 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
                  </svg>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#6d28d9", letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>Pago seguro con Wompi</div>
                    <div style={{ fontSize:13, color:"#4c1d95", lineHeight:1.6 }}>
                      Al confirmar serás redirigido a <strong>Wompi</strong> para pagar <strong>{COP(total)}</strong> con tarjeta, PSE, Nequi o Efecty. Tu pedido queda registrado antes del pago.
                    </div>
                  </div>
                </div>
              )}

              {/* Info efectivo */}
              {paymentMethod === "cash" && (
                <div className="info-box" style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"18px 20px" }}>
                  <svg style={{ flexShrink:0, marginTop:1 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>
                  </svg>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#15803d", letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>Pago en efectivo</div>
                    <div style={{ fontSize:13, color:"#166534", lineHeight:1.6 }}>
                      Pagarás <strong>{COP(total)}</strong> en efectivo al momento de recoger o recibir tu pedido. No necesitas adjuntar comprobante.
                    </div>
                  </div>
                </div>
              )}

              {/* Comprobante — solo transferencia */}
              {paymentMethod === "transfer" && <div className="co-card" style={{ border: proofFile ? "2px solid #86efac" : "2px dashed #fca5a5" }}>
                <div className="co-card-head" style={{ background: proofFile ? "#f0fdf4" : "#fff5f5" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {proofFile
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    }
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color: proofFile ? "#15803d" : "#dc2626" }}>
                        Comprobante de pago <span style={{ color:"#dc2626" }}>*</span>
                      </div>
                      <div style={{ fontSize:11, color: proofFile ? "#166534" : "#9b9591", marginTop:1 }}>
                        {proofFile ? "Archivo adjunto correctamente" : "Adjunta la captura de pantalla o foto del pago"}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding:"clamp(16px,3vw,20px)" }}>
                  {proofPreview ? (
                    <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                      <img src={proofPreview} alt="Comprobante"
                        style={{ width:96, height:96, objectFit:"cover", borderRadius:10, border:"1.5px solid #e8e5e1", flexShrink:0, boxShadow:"0 2px 10px rgba(28,28,28,.08)" }}
                      />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#15803d", marginBottom:3 }}>¡Listo!</div>
                        <div style={{ fontSize:11, color:"#9b9591", marginBottom:12, wordBreak:"break-all" }}>{proofFile?.name}</div>
                        <button
                          onClick={() => { setProofFile(null); setProofPreview(null); }}
                          style={{ fontSize:11, color:"#dc2626", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:6, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      className={`upload-zone${dragOver?" drag":""}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); handleProof(e.dataTransfer.files?.[0]); }}
                    >
                      <div style={{
                        width:52, height:52, borderRadius:12,
                        background:"#f5f3f0",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b9591" strokeWidth="1.6">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                        </svg>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#4b4844" }}>
                        {dragOver ? "Suelta aquí" : "Arrastra o selecciona el comprobante"}
                      </div>
                      <div style={{ fontSize:11, color:"#9b9591" }}>JPG, PNG o PDF · máx. 5 MB</div>
                      <input type="file" accept="image/*,application/pdf" style={{ display:"none" }}
                        onChange={e => handleProof(e.target.files?.[0])}/>
                    </label>
                  )}
                </div>
              </div>

              }

              {/* Selector método de pago */}
              <div className="co-card">
                <div className="co-card-head">
                  <div style={{ fontSize:10, fontWeight:600, color:"#dc2626", letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>Método de pago</div>
                  <div style={{ fontSize:16, fontWeight:600, color:INK, fontFamily:"var(--font-display,'Cormorant Garamond',serif)" }}>¿Cómo vas a pagar?</div>
                </div>
                <div style={{ padding:"clamp(14px,2.5vw,20px)", display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[
                    {
                      value: "transfer",
                      label: "Transferencia / QR",
                      sub: "",
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/>
                          <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 22h.01M22 14h.01M22 18h.01M22 22h.01"/>
                        </svg>
                      ),
                    },
                    {
                      value: "wompi",
                      label: "Wompi",
                      sub: "",
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
                        </svg>
                      ),
                    },
                    {
                      value: "cash",
                      label: "Efectivo",
                      sub: "Solo recogida en tienda",
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>
                        </svg>
                      ),
                    },
                  ].filter(opt => opt.value !== "cash" || form.deliveryType === "recogida")
                  .map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      style={{
                        flex: opt.value === "wompi" ? "0 0 auto" : 1,
                        width: opt.value === "wompi" ? "fit-content" : undefined,
                        padding: opt.value === "wompi" ? "10px 14px" : "14px 12px",
                        borderRadius:10, cursor:"pointer", textAlign:"left",
                        border: paymentMethod === opt.value ? `2px solid ${INK}` : "2px solid #e8e5e1",
                        background: paymentMethod === opt.value ? "#faf9f7" : opt.value === "wompi" ? "#fafafa" : "#fff",
                        boxShadow: paymentMethod === opt.value ? `0 4px 16px rgba(28,28,28,.1)` : "none",
                        transition:"all .18s", fontFamily:"inherit",
                        display:"flex", flexDirection:"column", gap: opt.value === "wompi" ? 4 : 6,
                        opacity: 1,
                      }}
                    >
                      <div style={{
                        width: opt.value === "wompi" ? 28 : 36,
                        height: opt.value === "wompi" ? 28 : 36,
                        borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                        background: paymentMethod === opt.value ? INK : "#f5f3f0",
                        color: paymentMethod === opt.value ? "#fff" : "#6b6560",
                        transition:"all .18s", flexShrink:0,
                      }}>{opt.icon}</div>
                      <div style={{ fontSize: opt.value === "wompi" ? 11 : 12, fontWeight:700, color:INK, letterSpacing:".02em" }}>{opt.label}</div>
                      {opt.sub && <div style={{ fontSize:10, color:"#9b9591", lineHeight:1.4 }}>{opt.sub}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón confirmar */}
              <button
                className="btn-pri"
                onClick={handleSubmit}
                disabled={loading || (paymentMethod === "transfer" && !proofFile)}
                style={paymentMethod === "wompi" ? { background:"#7c3aed", boxShadow:"0 4px 20px rgba(124,58,237,.3)" } : {}}
              >
                {loading
                  ? <><Spinner size={15}/> {paymentMethod === "wompi" ? "Redirigiendo a Wompi…" : "Enviando pedido..."}</>
                  : <>
                      {paymentMethod === "wompi" && (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Pagar con Wompi · {COP(total)}</>
                      )}
                      {paymentMethod !== "wompi" && (
                        paymentMethod === "cash" || proofFile
                          ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Confirmar pedido · {COP(total)}</>
                          : "Adjunta el comprobante para continuar"
                      )}
                    </>
                }
              </button>
            </div>
          )}
        </div>

        {/* ── Resumen ── */}
        <div className="co-summary">
          <div className="co-card">
            <div className="co-card-head">
              <div style={{ fontSize:9, fontWeight:700, color:"#9b9591", textTransform:"uppercase", letterSpacing:".16em" }}>
                Resumen del pedido
              </div>
            </div>
            <div style={{ padding:"clamp(14px,2vw,18px)" }}>

              {/* Colegio */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #f0ede9" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:college.primaryColor, flexShrink:0, boxShadow:`0 0 0 3px ${college.primaryColor}22` }}/>
                <span style={{ fontSize:12, fontWeight:600, color:"#4b4844" }}>{college.name}</span>
              </div>

              {/* Items */}
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:14 }}>
                {cart.map(item => (
                  <div key={item.id+item.size}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:INK, lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                        <div style={{ fontSize:10, color:"#9b9591", marginTop:2 }}>Talla {item.size} · {COP(item.price)} c/u</div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:INK, flexShrink:0 }}>{COP(item.price*item.qty)}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn"
                        onClick={() => setCart(prev => {
                          if (item.qty <= 1) return prev.filter(i => !(i.id===item.id && i.size===item.size));
                          return prev.map(i => i.id===item.id && i.size===item.size ? {...i, qty:i.qty-1} : i);
                        })}
                      >
                        {item.qty <= 1
                          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                          : "−"
                        }
                      </button>
                      <div className="qty-val">{item.qty}</div>
                      <button className="qty-btn"
                        onClick={() => setCart(prev => prev.map(i => i.id===item.id && i.size===item.size ? {...i, qty:i.qty+1} : i))}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div style={{ borderTop:"1px solid #e8e5e1", paddingTop:12, display:"flex", flexDirection:"column", gap:7 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b6560" }}>
                  <span>Subtotal</span><span>{COP(subtotal)}</span>
                </div>
                {coupon && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#16a34a", fontWeight:600 }}>
                    <span>Cupón {coupon.code} ({coupon.pct}%)</span><span>−{COP(discount)}</span>
                  </div>
                )}
                {form.deliveryType==="domicilio" && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b6560" }}>
                    <span>Domicilio</span><span>+ {COP(DELIVERY_FEE)}</span>
                  </div>
                )}
                {form.deliveryType==="domicilio_coordinado" && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#2563eb" }}>
                    <span>Envío</span><span style={{ fontWeight:600 }}>Por coordinar</span>
                  </div>
                )}
                {form.deliveryType==="recogida" && (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#16a34a" }}>
                    <span>Envío</span><span style={{ fontWeight:600 }}>Recogida en tienda</span>
                  </div>
                )}
                <div style={{
                  display:"flex", justifyContent:"space-between",
                  paddingTop:10, marginTop:3, borderTop:"1px solid #e8e5e1",
                  fontSize:16, fontWeight:700, color:INK,
                }}>
                  <span>Total</span>
                  <span style={{ fontFamily:"var(--font-display,'Cormorant Garamond',serif)", fontSize:20, fontWeight:500 }}>
                    {COP(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
