export const STATUS_ORDER = [
  "Pago en validación",
  "Pago confirmado",
  "Preparando pedido",
  "Listo para recoger",
  "Entregado",
];

export const STATUS_ORDER_DOMICILIO = [
  "Pago en validación",
  "Pago confirmado",
  "Preparando pedido",
  "En camino",
  "Entregado",
];

export const STATUS_META = {
  "Pago en validación": { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
  "Pago confirmado":    { bg: "#dbeafe", color: "#1e3a8a", dot: "#3b82f6" },
  "Preparando pedido":  { bg: "#f3e8ff", color: "#581c87", dot: "#a855f7" },
  "Listo para recoger": { bg: "#dcfce7", color: "#14532d", dot: "#22c55e" },
  "En camino":          { bg: "#ffedd5", color: "#7c2d12", dot: "#f97316" },
  "Entregado":          { bg: "#f0fdf4", color: "#065f46", dot: "#10b981" },
  "Anulado":            { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
};

export const getStatusOptions = (deliveryType) =>
  (deliveryType === "domicilio" || deliveryType === "domicilio_coordinado")
    ? STATUS_ORDER_DOMICILIO
    : STATUS_ORDER;
