import express from "express";
import { db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ── POST /api/coupons/validate  — público ──────────────────────
// Body: { code }
// Devuelve: { valid, pct, description } o { valid: false }
router.post("/validate", async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: "Código requerido" });

    const doc = await db.collection("coupons").doc(code).get();
    if (!doc.exists || !doc.data().active) {
      return res.json({ success: true, data: { valid: false } });
    }

    const { pct, description } = doc.data();
    return res.json({ success: true, data: { valid: true, pct, description: description || "" } });
  } catch (e) {
    console.error("coupons/validate:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET /api/coupons  — admin ──────────────────────────────────
router.get("/", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("coupons").get();
    const data = snapshot.docs.map(d => ({ code: d.id, ...d.data() }));
    res.json({ success: true, data });
  } catch (e) {
    console.error("coupons GET:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/coupons  — admin: { code, pct, description } ─────
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { code, pct, description } = req.body;
    if (!code || pct === undefined)
      return res.status(400).json({ success: false, error: "Se requieren code y pct" });

    const cleanCode = String(code).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,20}$/.test(cleanCode))
      return res.status(400).json({ success: false, error: "Código inválido. Solo letras, números, _ y - (2–20 caracteres)" });

    const val = parseInt(pct, 10);
    if (isNaN(val) || val < 1 || val > 90)
      return res.status(400).json({ success: false, error: "El descuento debe ser entre 1 y 90" });

    await db.collection("coupons").doc(cleanCode).set({
      pct: val,
      description: String(description || "").trim(),
      active: true,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, data: { code: cleanCode, pct: val } });
  } catch (e) {
    console.error("coupons POST:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── PATCH /api/coupons/:code/toggle  — admin ──────────────────
router.patch("/:code/toggle", requireAdmin, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const ref = db.collection("coupons").doc(code);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: "Cupón no encontrado" });

    const newActive = !doc.data().active;
    await ref.update({ active: newActive });
    res.json({ success: true, data: { code, active: newActive } });
  } catch (e) {
    console.error("coupons PATCH toggle:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── DELETE /api/coupons/:code  — admin ────────────────────────
router.delete("/:code", requireAdmin, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    await db.collection("coupons").doc(code).delete();
    res.json({ success: true });
  } catch (e) {
    console.error("coupons DELETE:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
