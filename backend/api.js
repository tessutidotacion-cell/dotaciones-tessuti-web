const BASE_URL   = import.meta.env.VITE_API_URL  || "http://localhost:3001/api";
const ADMIN_KEY  = import.meta.env.VITE_ADMIN_KEY || "admin-secret-key-2024";

const publicHeaders = { "Content-Type": "application/json" };
const adminHeaders  = { "Content-Type": "application/json", "x-api-key": ADMIN_KEY };

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Error del servidor");
  return data;
};

// ─────────────────────────────────────────
// PEDIDOS — TIENDA PÚBLICA
// ─────────────────────────────────────────

export const createOrder = async (orderData) => {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: publicHeaders,
    body: JSON.stringify(orderData),
  });
  return handleResponse(res);
};

export const getOrderById = async (orderId) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: publicHeaders,
  });
  return handleResponse(res);
};

export const uploadPaymentProof = async (orderId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/orders/${orderId}/payment-proof`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
};

export const trackOrder = async (orderId, document) => {
  const params = new URLSearchParams({ orderId, document });
  const res = await fetch(`${BASE_URL}/orders/track?${params.toString()}`, {
    headers: publicHeaders,
  });
  return handleResponse(res);
};

// ─────────────────────────────────────────
// PEDIDOS — PANEL ADMIN
// ─────────────────────────────────────────

export const getOrders = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.collegeId) params.append("collegeId", filters.collegeId);
  if (filters.status)    params.append("status",    filters.status);
  if (filters.dateFrom)  params.append("dateFrom",  filters.dateFrom);
  if (filters.dateTo)    params.append("dateTo",    filters.dateTo);
  const res = await fetch(`${BASE_URL}/orders?${params.toString()}`, {
    headers: adminHeaders,
  });
  return handleResponse(res);
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: newStatus }),
  });
  return handleResponse(res);
};

export const getStats = async () => {
  const res = await fetch(`${BASE_URL}/orders/admin/stats`, {
    headers: adminHeaders,
  });
  return handleResponse(res);
};
