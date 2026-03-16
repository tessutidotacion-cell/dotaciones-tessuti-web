// ============================================================
// middleware/rateLimiter.js
// Límites de peticiones por tipo de ruta
// ============================================================
import rateLimit from "express-rate-limit";

const message = (action) => ({
  success: false,
  error: `Demasiados intentos de ${action}. Por favor espera antes de intentar de nuevo.`,
});

// ── Login: 5 intentos por 15 minutos por IP ──────────────────
export const loginLimiter = rateLimit({
  windowMs:  15 * 60 * 1000, // 15 minutos
  max:       5,
  message:   message("inicio de sesión"),
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true, // no cuenta los logins exitosos
});

// ── Crear pedido: 10 pedidos por hora por IP ─────────────────
export const createOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max:      10,
  message:  message("creación de pedidos"),
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Subir archivo: 20 por hora por IP ────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  message:  message("subida de archivos"),
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── API general: 200 peticiones por 15 min ───────────────────
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  message("solicitudes"),
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Consulta de pedido (track): 30 por 15 min ────────────────
export const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      30,
  message:  message("consultas de pedido"),
  standardHeaders: true,
  legacyHeaders:   false,
});
