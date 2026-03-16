import express from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ── GET /api/discounts/public  — sin auth, para el catálogo ───
router.get("/public", async (req, res) => {
  try {
    const snapshot = await db.collection("discounts").get();
    const data = {};
    snapshot.docs.forEach(doc => { data[doc.id] = doc.data(); });
    // CDN cache 5 min, revalidación silenciosa hasta 10 min → reduce invocaciones ~99%
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.json({ success: true, data });
  } catch (e) {
    console.error("discounts/public:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET /api/discounts  — admin ────────────────────────────────
router.get("/", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("discounts").get();
    const data = {};
    snapshot.docs.forEach(doc => { data[doc.id] = doc.data(); });
    res.json({ success: true, data });
  } catch (e) {
    console.error("discounts GET:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/discounts  — admin: { collegeId, uniformId, pct } ─
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { collegeId, uniformId, pct } = req.body;
    if (!collegeId || !uniformId || pct === undefined)
      return res.status(400).json({ success: false, error: "Se requieren collegeId, uniformId y pct" });

    const val = parseInt(pct, 10);
    if (isNaN(val) || val < 1 || val > 90)
      return res.status(400).json({ success: false, error: "El descuento debe ser entre 1 y 90" });

    await db.collection("discounts").doc(String(collegeId)).set(
      { [String(uniformId)]: val },
      { merge: true }
    );
    res.json({ success: true, data: { collegeId, uniformId, pct: val } });
  } catch (e) {
    console.error("discounts POST:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── DELETE /api/discounts/:collegeId/:uniformId  — admin ───────
router.delete("/:collegeId/:uniformId", requireAdmin, async (req, res) => {
  try {
    const { collegeId, uniformId } = req.params;
    const ref = db.collection("discounts").doc(collegeId);
    const doc = await ref.get();

    if (!doc.exists)
      return res.status(404).json({ success: false, error: "No hay descuentos para ese colegio" });

    await ref.update({ [uniformId]: FieldValue.delete() });
    res.json({ success: true });
  } catch (e) {
    console.error("discounts DELETE:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
