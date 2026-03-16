import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN SMTP — variables de entorno requeridas en .env:
//
//   SMTP_HOST        → servidor SMTP  (ej: smtp.gmail.com)
//   SMTP_PORT        → puerto         (465 = SSL, 587 = STARTTLS)
//   SMTP_SECURE      → "true" para puerto 465 | "false" para 587
//   SMTP_USER        → tu correo      (ej: tienda@tessuti.com)
//   SMTP_PASS        → contraseña de aplicación (NO tu contraseña normal)
//   SMTP_FROM_NAME   → nombre visible (ej: Dotaciones Tessuti)  [opcional]
//
// ── Gmail (más común) ────────────────────────────────────────────────────────
//   SMTP_HOST=smtp.gmail.com  |  SMTP_PORT=465  |  SMTP_SECURE=true
//   SMTP_USER=tucorreo@gmail.com
//   SMTP_PASS=xxxx xxxx xxxx xxxx   ← contraseña de aplicación de 16 dígitos
//
//   Obtenerla: myaccount.google.com → Seguridad → Contraseñas de aplicaciones
//
// ── Outlook / Hotmail ────────────────────────────────────────────────────────
//   SMTP_HOST=smtp.office365.com  |  SMTP_PORT=587  |  SMTP_SECURE=false
//
// ── Brevo (Sendinblue) — alto volumen ────────────────────────────────────────
//   SMTP_HOST=smtp-relay.brevo.com  |  SMTP_PORT=587  |  SMTP_SECURE=false
//
// ─────────────────────────────────────────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  const missing = [
    !SMTP_HOST && "SMTP_HOST",
    !SMTP_USER && "SMTP_USER",
    !SMTP_PASS && "SMTP_PASS",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Faltan variables SMTP en .env: ${missing.join(", ")}`);
  }

  _transporter = nodemailer.createTransport({
    host:    SMTP_HOST,
    port:    parseInt(SMTP_PORT || "465", 10),
    secure:  SMTP_SECURE !== "false",
    auth:    { user: SMTP_USER, pass: SMTP_PASS },
    pool:           true,
    maxConnections: 3,
    maxMessages:    50,
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     15_000,
  });

  return _transporter;
}

export const verifyEmailConnection = async () => {
  try {
    await getTransporter().verify();
    console.log("SMTP conectado —", process.env.SMTP_HOST);
    return true;
  } catch (err) {
    console.warn("SMTP no disponible:", err.message);
    return false;
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const FROM = () =>
  `"${process.env.SMTP_FROM_NAME || "Dotaciones Tessuti"}" <${process.env.SMTP_USER}>`;

const COP = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const BRAND = () => process.env.SMTP_FROM_NAME || "Dotaciones Tessuti";

// ── Plantilla HTML base ───────────────────────────────────────────────────────
const baseHtml = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${BRAND()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f0f0f0;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .outer { padding: 36px 16px; }
    .wrap {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
    }
    /* Header */
    .hdr {
      background: #1a1a1a;
      padding: 24px 36px;
      border-bottom: 3px solid #2d2d2d;
    }
    .hdr-brand {
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .hdr-tagline {
      color: #888888;
      font-size: 10px;
      font-weight: 400;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    /* Body */
    .bdy { padding: 32px 36px; }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #888888;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8e8e8;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -.01em;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    p {
      font-size: 14px;
      line-height: 1.7;
      color: #555555;
    }
    /* Order number block */
    .order-block {
      background: #f7f7f7;
      border: 1px solid #e0e0e0;
      border-left: 3px solid #1a1a1a;
      padding: 14px 18px;
      margin: 22px 0;
    }
    .order-block-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: #999999;
      margin-bottom: 5px;
    }
    .order-num {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 3px;
    }
    /* Data table */
    .data-block {
      border: 1px solid #e8e8e8;
      margin: 18px 0;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 10px 16px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    }
    .data-row:last-child { border-bottom: none; }
    .data-label { color: #888888; }
    .data-value { font-weight: 500; color: #1a1a1a; text-align: right; max-width: 58%; }
    .data-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f7f7f7;
      border-top: 2px solid #e0e0e0;
    }
    .data-total-label { font-size: 12px; font-weight: 700; color: #1a1a1a; letter-spacing: .04em; text-transform: uppercase; }
    .data-total-val   { font-size: 16px; font-weight: 700; color: #1a1a1a; }
    /* Status badge */
    .status-block {
      border: 1px solid #e8e8e8;
      margin: 18px 0;
      overflow: hidden;
    }
    .status-bar {
      padding: 9px 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .status-desc {
      padding: 12px 16px;
      font-size: 13px;
      color: #555555;
      line-height: 1.6;
      border-top: 1px solid #f0f0f0;
      background: #fafafa;
    }
    /* Notice box */
    .notice {
      background: #f7f7f7;
      border: 1px solid #e0e0e0;
      border-left: 3px solid #555555;
      padding: 12px 16px;
      font-size: 13px;
      color: #444444;
      line-height: 1.6;
      margin: 20px 0;
    }
    /* Divider */
    .divider { border: none; border-top: 1px solid #eeeeee; margin: 24px 0; }
    /* Footer */
    .ftr {
      padding: 18px 36px;
      background: #f7f7f7;
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #aaaaaa;
      text-align: center;
      line-height: 1.7;
    }
    @media (max-width: 600px) {
      .bdy, .hdr, .ftr { padding-left: 20px; padding-right: 20px; }
      .order-num { font-size: 17px; letter-spacing: 2px; }
    }
  </style>
</head>
<body>
  <div class="outer">
    <div class="wrap">
      <div class="hdr">
        <div class="hdr-brand">${BRAND()}</div>
        <div class="hdr-tagline">Uniformes escolares institucionales</div>
      </div>
      <div class="bdy">${content}</div>
      <div class="ftr">
        Este correo es generado automáticamente por el sistema de pedidos.<br>
        Por favor no responda a este mensaje.<br><br>
        ${BRAND()} &mdash; Sistema de uniformes escolares
      </div>
    </div>
  </div>
</body>
</html>`;

// ── Estados: colores y textos ─────────────────────────────────────────────────
const STATUS_META = {
  "Pago en validación": {
    barBg: "#fffbeb", barColor: "#92400e", barBorder: "#fcd34d",
    label: "Pago en validación",
    msg: "Hemos recibido su pedido y estamos verificando el comprobante de pago. Le notificaremos una vez que sea confirmado.",
  },
  "Pago confirmado": {
    barBg: "#ecfdf5", barColor: "#065f46", barBorder: "#6ee7b7",
    label: "Pago confirmado",
    msg: "Su pago ha sido verificado y aceptado. Procederemos con la preparación de los uniformes.",
  },
  "En producción": {
    barBg: "#eff6ff", barColor: "#1e3a8a", barBorder: "#93c5fd",
    label: "En producción",
    msg: "Sus uniformes se encuentran en proceso de fabricación y alistamiento.",
  },
  "Preparando pedido": {
    barBg: "#eff6ff", barColor: "#1e3a8a", barBorder: "#93c5fd",
    label: "Preparando pedido",
    msg: "Sus uniformes están siendo preparados y alistados para la entrega.",
  },
  "Listo para recoger": {
    barBg: "#f5f3ff", barColor: "#4c1d95", barBorder: "#c4b5fd",
    label: "Listo para recoger",
    msg: "Sus uniformes están listos. Puede pasar a recogerlos en el punto de entrega indicado por la institución.",
  },
  "En camino": {
    barBg: "#fff7ed", barColor: "#9a3412", barBorder: "#fdba74",
    label: "En camino",
    msg: "Su pedido está en camino y será entregado próximamente en la dirección indicada.",
  },
  "Entregado": {
    barBg: "#f0fdf4", barColor: "#14532d", barBorder: "#86efac",
    label: "Entregado",
    msg: "Su pedido ha sido entregado satisfactoriamente. Gracias por confiar en Dotaciones Tessuti.",
  },
};

// ── 1. Confirmación de pedido ─────────────────────────────────────────────────
export const sendOrderConfirmation = async (order) => {
  const meta = STATUS_META["Pago en validación"];

  const itemRows = order.items.map(i => `
    <div class="data-row">
      <span class="data-label">${i.name} &nbsp;·&nbsp; Talla ${i.size} &nbsp;&times;&nbsp; ${i.qty}</span>
      <span class="data-value">${COP(i.price * i.qty)}</span>
    </div>`).join("");

  const deliveryText = order.delivery?.type === "domicilio" && order.delivery?.address?.street
    ? `Domicilio &mdash; ${order.delivery.address.street}`
    : order.delivery?.type === "domicilio_coordinado"
    ? "Domicilio por coordinar"
    : "Retiro en punto institucional";

  const content = `
    <h2>Pedido recibido</h2>
    <p>Estimado/a <strong>${order.guardian.name}</strong>, hemos recibido correctamente su pedido de uniformes. A continuación encontrará los detalles.</p>

    <div class="order-block">
      <div class="order-block-label">Número de pedido</div>
      <div class="order-num">${order.id}</div>
    </div>

    <div class="section-title">Información del pedido</div>
    <div class="data-block">
      <div class="data-row"><span class="data-label">Institución</span><span class="data-value">${order.collegeName}</span></div>
      ${order.student?.name  ? `<div class="data-row"><span class="data-label">Estudiante</span><span class="data-value">${order.student.name}</span></div>` : ""}
      ${order.student?.grade ? `<div class="data-row"><span class="data-label">Grado</span><span class="data-value">${order.student.grade}</span></div>` : ""}
      <div class="data-row"><span class="data-label">Modalidad de entrega</span><span class="data-value">${deliveryText}</span></div>
    </div>

    <div class="section-title">Artículos del pedido</div>
    <div class="data-block">
      ${itemRows}
      <div class="data-total">
        <span class="data-total-label">Total</span>
        <span class="data-total-val">${COP(order.total)}</span>
      </div>
    </div>

    <div class="section-title">Estado actual</div>
    <div class="status-block">
      <div class="status-bar" style="background:${meta.barBg};color:${meta.barColor};border-bottom:1px solid ${meta.barBorder}">
        ${meta.label}
      </div>
      <div class="status-desc">${meta.msg}</div>
    </div>

    <hr class="divider"/>

    <div class="notice">
      Conserve el número de pedido <strong>${order.id}</strong> para consultar el estado en cualquier momento desde nuestra plataforma.
    </div>
  `;

  return getTransporter().sendMail({
    from:    FROM(),
    to:      order.guardian.email,
    subject: `Pedido ${order.id} recibido — ${order.collegeName}`,
    html:    baseHtml(content),
  });
};

// ── 2. Actualización de estado ────────────────────────────────────────────────
export const sendStatusUpdate = async (order, newStatus) => {
  const meta = STATUS_META[newStatus] || STATUS_META["Pago en validación"];

  const content = `
    <h2>Actualización de su pedido</h2>
    <p>Estimado/a <strong>${order.guardian.name}</strong>, le informamos que el estado de su pedido ha sido actualizado.</p>

    <div class="order-block">
      <div class="order-block-label">Número de pedido</div>
      <div class="order-num">${order.id}</div>
    </div>

    <div class="section-title">Nuevo estado</div>
    <div class="status-block">
      <div class="status-bar" style="background:${meta.barBg};color:${meta.barColor};border-bottom:1px solid ${meta.barBorder}">
        ${meta.label}
      </div>
      <div class="status-desc">${meta.msg}</div>
    </div>

    <div class="section-title">Resumen del pedido</div>
    <div class="data-block">
      <div class="data-row"><span class="data-label">Institución</span><span class="data-value">${order.collegeName}</span></div>
      ${order.student?.name ? `<div class="data-row"><span class="data-label">Estudiante</span><span class="data-value">${order.student.name}</span></div>` : ""}
      <div class="data-row"><span class="data-label">Total del pedido</span><span class="data-value">${COP(order.total)}</span></div>
    </div>

    <hr class="divider"/>

    <div class="notice">
      Puede consultar el estado actualizado de su pedido utilizando el número <strong>${order.id}</strong> en nuestra plataforma.
    </div>
  `;

  return getTransporter().sendMail({
    from:    FROM(),
    to:      order.guardian.email,
    subject: `Pedido ${order.id} — ${newStatus}`,
    html:    baseHtml(content),
  });
};

// ── 3. Correo de prueba ───────────────────────────────────────────────────────
export const sendTestEmail = async (to) => {
  const content = `
    <h2>Verificacion de configuracion SMTP</h2>
    <p>Este correo confirma que el servidor de envio de ${BRAND()} esta operando correctamente.</p>

    <div class="section-title">Parametros del servidor</div>
    <div class="data-block">
      <div class="data-row"><span class="data-label">Puerto</span><span class="data-value">${process.env.SMTP_PORT || 465}</span></div>
      <div class="data-row"><span class="data-label">Fecha y hora</span><span class="data-value">${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}</span></div>
    </div>

    <div class="notice">
      La configuracion SMTP es correcta. Los correos de pedidos se enviaran sin inconvenientes.
    </div>
  `;

  return getTransporter().sendMail({
    from:    FROM(),
    to,
    subject: `Verificacion de correo — ${BRAND()}`,
    html:    baseHtml(content),
  });
};
