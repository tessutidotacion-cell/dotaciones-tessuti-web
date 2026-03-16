import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { sendTestEmail, verifyEmailConnection } from "../services/emailService.js";

const router = express.Router();

// ── POST /api/email/test ─────────────────────────────────────────────────────
// Envía un correo de prueba a la dirección indicada.
// Solo accesible para administradores (requiere x-api-key).
//
// Body: { "to": "destino@ejemplo.com" }
//
router.post("/test", requireAdmin, async (req, res) => {
  const { to } = req.body;

  if (!to || typeof to !== "string") {
    return res.status(400).json({ success: false, error: "Se requiere el campo 'to' con un email válido." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to.trim())) {
    return res.status(400).json({ success: false, error: "El email de destino no es válido." });
  }

  const recipient = to.trim();
  try {
    await sendTestEmail(recipient);
    res.json({
      success: true,
      message: `Correo de prueba enviado a ${recipient}. Revisa la bandeja de entrada (y spam).`,
    });
  } catch (err) {
    console.error("Error enviando email de prueba:", err.message);
    res.status(500).json({
      success: false,
      error: `No se pudo enviar el correo: ${err.message}`,
      hint: "Verifica las variables SMTP_HOST, SMTP_USER y SMTP_PASS en el archivo .env",
    });
  }
});

// ── GET /api/email/status ────────────────────────────────────────────────────
// Verifica si la conexión SMTP está activa.
// Solo accesible para administradores.
//
router.get("/status", requireAdmin, async (req, res) => {
  const ok = await verifyEmailConnection();
  const config = {
    host:   process.env.SMTP_HOST    || "(no configurado)",
    port:   process.env.SMTP_PORT    || "465",
    user:   process.env.SMTP_USER    || "(no configurado)",
    from:   process.env.SMTP_FROM_NAME || "Dotaciones Tessuti",
    configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  };

  res.status(ok ? 200 : 503).json({
    success: ok,
    connected: ok,
    config,
    message: ok
      ? `SMTP conectado correctamente a ${config.host}`
      : `No se pudo conectar a ${config.host}. Revisa las variables de entorno SMTP_*.`,
  });
});

export default router;
