import { createHmac } from "crypto";

const BOLD_API_KEY    = process.env.BOLD_API_KEY;
const BOLD_SECRET_KEY = process.env.BOLD_SECRET_KEY;
const IS_TEST         = process.env.BOLD_ENV !== "production";

const BASE_URL = IS_TEST
  ? "https://api.bold.co"
  : "https://api.bold.co";

// ── Genera la firma requerida por Bold ───────────────────────
const generateIntegrity = (orderId, amount, currency = "COP") => {
  const raw = `${orderId}${amount}${currency}${BOLD_SECRET_KEY}`;
  return createHmac("sha256", BOLD_SECRET_KEY).update(raw).digest("hex");
};

// ── Crea un link de pago en Bold ─────────────────────────────
export const createBoldPaymentLink = async ({ orderId, amount, description }) => {
  if (!BOLD_API_KEY || !BOLD_SECRET_KEY) {
    console.warn("Bold no configurado — se omite link de pago");
    return null;
  }

  const integrity = generateIntegrity(orderId, amount);

  const body = {
    amount_type: "CLOSE",
    amount: {
      currency:     "COP",
      total_amount: amount,
    },
    description,
    reference:        orderId,
    integrity_hash:   integrity,
    expiration_date:  Date.now() + 86400000, // 24 horas
    ...(IS_TEST && { test: true }),
  };

  const res = await fetch(`${BASE_URL}/online/link/v1`, {
    method:  "POST",
    headers: {
      "Authorization": `x-api-key ${BOLD_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Bold error:", err);
    return null;
  }

  const data = await res.json();
  // Bold devuelve { payload: { url, id } }
  return data?.payload?.url || data?.url || null;
};
