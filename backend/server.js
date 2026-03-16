import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import ordersRouter from "./routes/orders.js";
import authRouter from "./routes/auth.js";
import discountsRouter from "./routes/discounts.js";
import emailRouter from "./routes/email.js";
import { bootstrapSuperAdmin } from "./services/authService.js";
import { verifyEmailConnection } from "./services/emailService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://www.tessuti.store",
  "https://tessuti.store",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))
      return callback(null, true);
    callback(new Error(`CORS bloqueado: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true,
};

// ─── CORS (antes de Helmet para que preflight funcione) ──────────────────────
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ─── HELMET (Security Headers) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: { 
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },           // X-Frame-Options: DENY
    hidePoweredBy: true,                      // Elimina X-Powered-By
    hsts: {
      maxAge: 63072000,                       // 2 años
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,                            // X-Content-Type-Options
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,                          // X-XSS-Protection
  })
);

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

// Global: 60 req / 15 min por IP (más estricto para dificultar escaneo de rutas)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.LOAD_TEST === "true" ? 100000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Demasiadas solicitudes, intenta más tarde." },
});

// Auth: 10 intentos / 15 min por IP — bloquea fuerza bruta en login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // no penaliza logins exitosos
  message: { success: false, error: "Demasiados intentos de autenticación." },
});

// Bloqueo por 401 repetidos: 8 fallos de auth / 10 min → bloquea 30 min
const unauthorizedLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => res.statusCode !== 401, // solo cuenta respuestas 401
  message: { success: false, error: "Demasiados accesos no autorizados. Espera 30 minutos." },
  // bloquea por 30 min tras el primer exceso
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Acceso bloqueado temporalmente por múltiples intentos fallidos.",
    });
  },
});

// ─── MIDDLEWARES GLOBALES ─────────────────────────────────────────────────────
app.use(globalLimiter);
app.use(hpp());                              // Previene HTTP Parameter Pollution
app.use(express.json({ limit: "2mb" }));    // Reducido de 10mb a 2mb
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── SECURITY.TXT ─────────────────────────────────────────────────────────────
app.get("/.well-known/security.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(
    `Contact: mailto:${process.env.SECURITY_EMAIL || "security@tudominio.com"}\nExpires: 2026-12-31T00:00:00.000Z\nPreferred-Languages: es, en\n`
  );
});

// ─── RUTAS ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ message: "API Uniformes Escolares", status: "online" })
);
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/orders", unauthorizedLimiter, ordersRouter);
app.use("/api/discounts", unauthorizedLimiter, discountsRouter);
app.use("/api/email", unauthorizedLimiter, emailRouter);

// ─── MANEJO DE ERRORES ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.startsWith("CORS"))
    return res.status(403).json({ success: false, error: "Origen no permitido." });

  // JSON malformado → 400 (no 500)
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError)
    return res.status(400).json({ success: false, error: "JSON malformado." });

  // Body demasiado grande → 413
  if (err.type === "entity.too.large" || err.status === 413)
    return res.status(413).json({ success: false, error: "El cuerpo de la solicitud es demasiado grande." });

  // En producción NO exponer detalles del error
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: isProd ? "Error interno del servidor." : err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada." });
});

// ─── INICIO ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
  console.log(`🔗 Orígenes permitidos: ${allowedOrigins.join(", ")}\n`);
  try {
    await bootstrapSuperAdmin();
  } catch (e) {
    console.error("Bootstrap error:", e.message);
  }
  // Verificar conexión SMTP al iniciar (no bloquea el servidor si falla)
  verifyEmailConnection().catch(err => console.error("SMTP no disponible al iniciar:", err.message));
});

export default app;