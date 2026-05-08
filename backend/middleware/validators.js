// ============================================================
// middleware/validators.js
// Validación y sanitización de todos los inputs
// ============================================================
import { body, query, param, validationResult } from "express-validator";
import xss from "xss";

// ── Helper: ejecutar validaciones y responder si hay errores ─
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
    // Log para depuración en el servidor
    console.warn("⚠️  Validación fallida en", req.method, req.path);
    details.forEach(e => console.warn(`   → ${e.field}: ${e.message}`));
    return res.status(422).json({ success: false, error: "Datos inválidos", details });
  }
  next();
};

// ── Helper: limpiar string de XSS ────────────────────────────
const cleanStr = (value) => xss(String(value || "").trim());

// ── Helper: rechazar caracteres de inyección ────────────────
const noInjection = (value) => {
  if (typeof value === "string" && (value.includes("$") || value.includes("{") || value.includes("}"))) {
    throw new Error("Caracteres inválidos detectados");
  }
  return true;
};

// ── Validaciones de LOGIN ─────────────────────────────────────
export const validateLogin = [
  body("email")
    .isEmail().withMessage("Correo electrónico inválido")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Correo demasiado largo"),
  body("password")
    .isLength({ min: 8, max: 128 }).withMessage("Contraseña debe tener entre 8 y 128 caracteres")
    .notEmpty().withMessage("Contraseña requerida"),
  validate,
];

// ── Validaciones de CREAR PEDIDO ──────────────────────────────
export const validateCreateOrder = [
  body("collegeId")
    .notEmpty().withMessage("ID de colegio requerido")
    .isString().withMessage("ID de colegio inválido")
    .isLength({ max: 50 }).withMessage("ID de colegio demasiado largo")
    .customSanitizer(cleanStr),

  body("collegeName")
    .notEmpty().withMessage("Nombre de colegio requerido")
    .isLength({ min: 3, max: 100 }).withMessage("Nombre de colegio inválido")
    .customSanitizer(cleanStr),

  body("items")
    .isArray({ min: 1, max: 20 }).withMessage("El carrito debe tener entre 1 y 20 items"),

  body("items.*.id")
    .notEmpty().withMessage("ID de producto requerido"),

  body("items.*.name")
    .notEmpty().withMessage("Nombre de producto requerido")
    .isLength({ max: 100 }).withMessage("Nombre de producto demasiado largo")
    .customSanitizer(cleanStr),

  body("items.*.price")
    .isInt({ min: 1, max: 10000000 }).withMessage("Precio inválido"),

  body("items.*.qty")
    .isInt({ min: 1, max: 50 }).withMessage("Cantidad debe ser entre 1 y 50"),

  body("items.*.size")
    .notEmpty().withMessage("Talla requerida")
    .isLength({ max: 10 }).withMessage("Talla inválida")
    .customSanitizer(cleanStr),

  body("student.name")
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 100 }).withMessage("Nombre del estudiante inválido (2-100 caracteres)")
    .customSanitizer(cleanStr),

  body("student.grade")
    .optional({ checkFalsy: true })
    .isLength({ max: 30 }).withMessage("Grado demasiado largo")
    .customSanitizer(cleanStr),

  body("student.document")
    .optional()
    .isLength({ max: 20 }).withMessage("Documento demasiado largo")
    .customSanitizer(cleanStr),

  body("guardian.name")
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 100 }).withMessage("Nombre del acudiente inválido (2-100 caracteres)")
    .customSanitizer(cleanStr),

  body("guardian.phone")
    .optional({ checkFalsy: true })
    .isLength({ min: 7, max: 20 }).withMessage("Teléfono inválido (7-20 dígitos)")
    .matches(/^[0-9+\-\s()ext.]{7,20}$/).withMessage("Teléfono con caracteres inválidos"),

  body("guardian.email")
    .optional({ checkFalsy: true })
    .isString().withMessage("Correo del acudiente inválido")
    .isEmail().withMessage("Correo del acudiente inválido")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Correo demasiado largo"),

  body("delivery.type")
    .notEmpty().withMessage("Tipo de entrega requerido")
    .isIn(["recogida", "domicilio", "domicilio_coordinado"]).withMessage("Tipo de entrega inválido"),

  body("delivery.address.street")
    .optional({ checkFalsy: true })
    .isString().withMessage("Dirección inválida")
    .isLength({ max: 200 }).withMessage("Dirección demasiado larga")
    .customSanitizer(cleanStr),

  validate,
];

// ── Validaciones de CAMBIO DE ESTADO ─────────────────────────
const VALID_STATUSES = [
  "Pago en validación","Pago confirmado","En producción",
  "Preparando pedido","Listo para recoger","En camino","Entregado",
];

export const validateStatusUpdate = [
  param("id")
    .matches(/^PED-\d{4}-\d{3,6}$/).withMessage("ID de pedido inválido"),
  body("status")
    .notEmpty().withMessage("Estado requerido")
    .isIn(VALID_STATUSES).withMessage(`Estado debe ser uno de: ${VALID_STATUSES.join(", ")}`),
  validate,
];

// ── Validaciones de FILTROS ADMIN ─────────────────────────────
export const validateOrderFilters = [
  query("status")
    .optional()
    .isIn([...VALID_STATUSES, ""]).withMessage("Estado inválido"),
  query("dateFrom")
    .optional()
    .isISO8601().withMessage("Fecha de inicio inválida (formato: YYYY-MM-DD)"),
  query("dateTo")
    .optional()
    .isISO8601().withMessage("Fecha de fin inválida (formato: YYYY-MM-DD)"),
  query("collegeId")
    .optional()
    .isLength({ max: 50 }).withMessage("ID de colegio demasiado largo")
    .customSanitizer(cleanStr),
  validate,
];

// ── Validaciones de CREAR/EDITAR ADMIN ───────────────────────
export const validateAdminUser = [
  body("email")
    .isEmail().withMessage("Correo inválido")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8, max: 128 }).withMessage("Contraseña debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("La contraseña debe tener mayúsculas, minúsculas y números"),
  body("name")
    .notEmpty().withMessage("Nombre requerido")
    .isLength({ min: 2, max: 80 }).withMessage("Nombre inválido")
    .customSanitizer(cleanStr),
  body("role")
    .isIn(["viewer","admin","superadmin"]).withMessage("Rol inválido"),
  validate,
];
