// ============================================================
// middleware/uploadSecurity.js
// Seguridad para archivos subidos (comprobantes de pago)
// ============================================================
import multer from "multer";
import path from "path";

// Tipos MIME permitidos y sus magic bytes (firma del archivo)
const ALLOWED_TYPES = {
  "image/jpeg": { ext: [".jpg",".jpeg"], magic: [0xFF, 0xD8, 0xFF] },
  "image/png":  { ext: [".png"],        magic: [0x89, 0x50, 0x4E, 0x47] },
  "image/webp": { ext: [".webp"],       magic: [0x52, 0x49, 0x46, 0x46] },
  "application/pdf": { ext: [".pdf"],   magic: [0x25, 0x50, 0x44, 0x46] },
};

// ── Verificar magic bytes del archivo ────────────────────────
const verifyMagicBytes = (buffer, mimeType) => {
  const info = ALLOWED_TYPES[mimeType];
  if (!info) return false;
  return info.magic.every((byte, i) => buffer[i] === byte);
};

// ── Filtro de multer ─────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  // 1. Verificar tipo MIME declarado
  if (!ALLOWED_TYPES[file.mimetype]) {
    return cb(new Error("Tipo de archivo no permitido. Solo JPG, PNG, WEBP o PDF."), false);
  }

  // 2. Verificar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_TYPES[file.mimetype].ext;
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Extensión no permitida para este tipo de archivo.`), false);
  }

  const dangerousChars = /[\/\\<>|:*?"]/;
const hasDotDot = file.originalname.includes("..");
if (dangerousChars.test(file.originalname) || hasDotDot) {
  return cb(new Error("Nombre de archivo no permitido."), false);
}

  cb(null, true);
};

// ── Configuración de multer ───────────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(), // en memoria para verificar magic bytes
  limits: {
    fileSize:  5 * 1024 * 1024, // máx 5 MB
    files:     1,               // solo 1 archivo por request
    fieldSize: 1024,            // tamaño máximo de otros campos
  },
  fileFilter,
});

// ── Verificación adicional post-multer ────────────────────────
// Verifica los magic bytes reales del buffer
export const verifyFileIntegrity = (req, res, next) => {
  if (!req.file) return next();

  if (!verifyMagicBytes(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: "El archivo no es válido o está corrupto.",
    });
  }

  // Verificar tamaño final (doble check)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      error: "El archivo excede el tamaño máximo de 5MB.",
    });
  }

  next();
};
