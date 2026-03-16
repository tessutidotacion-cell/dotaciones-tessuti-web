import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/auth.js";
import { validateCreateOrder } from "../middleware/validators.js";
import {
  createOrder, getOrders, getOrderById,
  updateOrderStatus, updatePaymentProof, getStats,
  getStock, setStock, updateDeliveryNote,
} from "../services/orderService.js";
import { uploadPaymentProof } from "../services/uploadService.js";
import { sendOrderConfirmation, sendStatusUpdate } from "../services/emailService.js";

const router = express.Router();

// Rate limit para subida de comprobantes: 5 intentos por IP cada 15 min
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Demasiados intentos de subida. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",      // ← Android
      "image/png",
      "image/webp",
      "image/heic",     // ← iPhone cámara
      "image/heif",     // ← iPhone cámara
      "application/pdf",
      "application/octet-stream", // ← algunos móviles
    ];

    // También verificar por extensión si el mimetype es genérico
    const allowedExts = /\.(jpg|jpeg|png|webp|heic|heif|pdf)$/i;
    const extOk = allowedExts.test(file.originalname);

    if (allowed.includes(file.mimetype) || extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Formato no permitido: ${file.mimetype}`));
    }
  },
});

// ── Rutas específicas ANTES de /:id ───────────────────────────

// GET /api/orders  — listar (admin)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { collegeId, status, dateFrom, dateTo } = req.query;
    const orders = await getOrders({ collegeId, status, dateFrom, dateTo });
    res.json({ success:true, count:orders.length, data:orders });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/orders/admin/stats
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ success:true, data:stats });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/orders  — crear pedido + enviar email de confirmación
router.post("/", validateCreateOrder, async (req, res) => {
  try {
    const { collegeId, collegeName, items, student, guardian, delivery } = req.body;
    if (!collegeId || !collegeName)
      return res.status(400).json({ success:false, error:"Faltan datos del colegio" });
    if (!items || items.length === 0)
      return res.status(400).json({ success:false, error:"El carrito está vacío" });
    if (items.length > 30)
      return res.status(400).json({ success:false, error:"Demasiados artículos en el carrito" });
    if (!guardian?.name || !guardian?.email || !guardian?.phone)
      return res.status(400).json({ success:false, error:"Faltan datos del acudiente" });
    if (guardian.name.length > 100 || guardian.email.length > 100 || guardian.phone.length > 20)
      return res.status(400).json({ success:false, error:"Datos del acudiente demasiado largos" });
    if (student?.name && student.name.length > 100)
      return res.status(400).json({ success:false, error:"Nombre del estudiante demasiado largo" });
    if (delivery?.type === "domicilio" && !delivery?.address?.street?.trim())
      return res.status(400).json({ success:false, error:"La dirección de entrega es requerida para domicilio" });
    if (delivery?.address?.street && delivery.address.street.length > 200)
      return res.status(400).json({ success:false, error:"Dirección demasiado larga" });

    const order = await createOrder({ collegeId, collegeName, items, student, guardian, delivery });

    // Email de confirmación (no bloqueante)
    sendOrderConfirmation(order).catch(err =>
      console.error("Error enviando email de confirmación:", err.message)
    );

    res.status(201).json({ success:true, message:"Pedido creado exitosamente", data:order });
  } catch(e) {
    console.error("Error creando pedido:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});

// GET /api/orders/track?orderId=PED-2024-1234
// Búsqueda pública: solo número de pedido
router.get("/track", async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId)
      return res.status(400).json({ success:false, error:"Se requiere el número de pedido" });

    const order = await getOrderById(orderId.trim().toUpperCase());
    if (!order)
      return res.status(404).json({ success:false, error:"Pedido no encontrado" });

    // Retornar solo los datos necesarios para el cliente (sin info sensible)
    res.json({
      success: true,
      data: {
        id:          order.id,
        collegeName: order.collegeName,
        status:      order.status,
        statusHistory: order.statusHistory,
        student:     { name: order.student?.name || "", grade: order.student?.grade || "" },
        items:       order.items,
        total:       order.total,
        createdAt:   order.createdAt,
        updatedAt:   order.updatedAt,
      },
    });
  } catch(e) {
    console.error("Error buscando pedido:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});


// GET /api/orders/stock?collegeId=1  — público (lo necesita el catálogo del cliente)
router.get("/stock", async (req, res) => {
  try {
    const { collegeId } = req.query;
    if (!collegeId) return res.status(400).json({ success:false, error:"Se requiere collegeId" });
    const stock = await getStock(collegeId);
    // CDN cache 60 s, revalidación silenciosa hasta 2 min → evita leer Firestore en cada clic
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.json({ success:true, data:stock });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// PATCH /api/orders/stock
router.patch("/stock", requireAdmin, async (req, res) => {
  try {
    const { collegeId, productId, size, quantity } = req.body;
    if (!collegeId || !productId || !size || quantity === undefined)
      return res.status(400).json({ success:false, error:"Se requieren collegeId, productId, size y quantity" });
    if (quantity < 0 || quantity > 9999)
      return res.status(400).json({ success:false, error:"Cantidad debe estar entre 0 y 9999" });
    const result = await setStock(collegeId, productId, size, quantity);
    res.json({ success:true, data:result });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ── Rutas con /:id DESPUÉS ────────────────────────────────────

// GET /api/orders/:id  — solo admin
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success:false, error:"Pedido no encontrado" });
    res.json({ success:true, data:order });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/orders/:id/payment-proof
router.post("/:id/payment-proof", uploadLimiter, upload.single("file"), async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success:false, error:"Pedido no encontrado" });
    if (!req.file) return res.status(400).json({ success:false, error:"No se recibió ningún archivo" });

    const url = await uploadPaymentProof(req.file.buffer, req.params.id, req.file.mimetype);
    await updatePaymentProof(req.params.id, url);

    res.json({ success:true, message:"Comprobante subido exitosamente", data:{ paymentProofUrl:url, orderId:req.params.id } });
  } catch(e) {
    console.error("Error subiendo comprobante:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});

// PATCH /api/orders/:id/delivery-note  — guardar nota de coordinación
router.patch("/:id/delivery-note", requireAdmin, async (req, res) => {
  try {
    const { note } = req.body;
    if (typeof note !== "string" || note.length > 500)
      return res.status(400).json({ success: false, error: "Nota inválida (máx. 500 caracteres)" });
    const updated = await updateDeliveryNote(req.params.id, note.trim());
    if (!updated) return res.status(404).json({ success: false, error: "Pedido no encontrado" });
    res.json({ success: true, data: updated });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

// PATCH /api/orders/:id/status  — cambiar estado + enviar email
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success:false, error:"Se requiere el nuevo estado" });

    const updated = await updateOrderStatus(req.params.id, status, "admin");
    if (!updated) return res.status(404).json({ success:false, error:"Pedido no encontrado" });

    // Email de actualización (no bloqueante)
    sendStatusUpdate(updated, status).catch(err =>
      console.error("Error enviando email de estado:", err.message)
    );

    res.json({ success:true, message:`Estado actualizado a: ${status}`, data:updated });
  } catch(e) { res.status(400).json({ success:false, error:e.message }); }
});

export default router;