import express from "express";
import crypto  from "crypto";

const router = express.Router();

/**
 * POST /api/payments/wompi-sign
 * Público — genera la firma de integridad para Wompi Checkout
 * Body: { reference, amountInCents }
 */
router.post("/wompi-sign", async (req, res) => {
  try {
    const { reference, amountInCents } = req.body;
    const currency = "COP";

    if (!reference || amountInCents === undefined)
      return res.status(400).json({ success: false, error: "Se requieren reference y amountInCents" });

    const secret    = process.env.WOMPI_INTEGRITY_SECRET;
    const publicKey = process.env.WOMPI_PUBLIC_KEY;

    if (!secret || !publicKey)
      return res.status(503).json({ success: false, error: "Pago con Wompi no configurado" });

    // Firma: SHA256(reference + amountInCents + currency + integritySecret)
    const signature = crypto
      .createHash("sha256")
      .update(`${reference}${amountInCents}${currency}${secret}`)
      .digest("hex");

    res.json({ success: true, data: { signature, publicKey, currency } });
  } catch (e) {
    console.error("payments/wompi-sign:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
