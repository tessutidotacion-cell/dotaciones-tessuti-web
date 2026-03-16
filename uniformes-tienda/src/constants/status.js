export const STATUS_ORDER = [
  "Pago en validación",
  "Pago confirmado",
  "En producción",
  "Listo para recoger",
  "Entregado",
];

export const STATUS_ORDER_DOMICILIO = [
  "Pago en validación",
  "Pago confirmado",
  "En producción",
  "En camino",
  "Entregado",
];

export const STATUS_META = {
  "Pago en validación": { bg: "#fef9ec", text: "#92400e", dot: "#d97706" },
  "Pago confirmado": { bg: "#ecfdf5", text: "#065f46", dot: "#059669" },
  "En producción": { bg: "#eff6ff", text: "#1e3a8a", dot: "#2563eb" },
  "Listo para recoger": { bg: "#f5f3ff", text: "#4c1d95", dot: "#7c3aed" },
  "En camino": { bg: "#fff7ed", text: "#9a3412", dot: "#ea580c" },
  Entregado: { bg: "#f8fafc", text: "#334155", dot: "#64748b" },
};

export const getStatusOptions = (deliveryType) =>
  deliveryType === "domicilio" ? STATUS_ORDER_DOMICILIO : STATUS_ORDER;