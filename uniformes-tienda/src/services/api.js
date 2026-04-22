// Normalize the API base URL.  When deploying to Vercel we typically
// expose the backend at the root, so tenant frontend must append `/api`.
// The env var may already contain `/api` or just the host; handle both.
let BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
if (!BASE_URL.endsWith("/api")) {
  BASE_URL = BASE_URL.replace(/\/+$/g, "") + "/api";
}

// ── Token JWT — sessionStorage (se limpia al cerrar el navegador) ──
const TOKEN_KEY = "ue_admin_token";
let _token = sessionStorage.getItem(TOKEN_KEY) || null;
export const setToken   = (t) => { _token = t; if(t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); };
export const getToken   = ()  => _token;
export const clearToken = ()  => { _token = null; sessionStorage.removeItem(TOKEN_KEY); };

const publicHeaders = { "Content-Type":"application/json" };
const adminHeaders  = () => ({
  "Content-Type":  "application/json",
  "Authorization": `Bearer ${_token}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || !data.success) {
    // Si hay detalles de validación (422), mostrar qué campo falla exactamente
    if (data.details?.length) {
      const msg = data.details.map(e => e.message).join(" · ");
      throw new Error(msg);
    }
    throw new Error(data.error || "Error del servidor");
  }
  return data;
};

// ── AUTH ──────────────────────────────────────────────────────

export const login = async (user, pass) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: publicHeaders,
    body: JSON.stringify({ user, pass }),
  });
  const data = await handleResponse(res);
  setToken(data.token);
  return data;
};

export const verifyToken = async () => {
  if (!_token) throw new Error("Sin token");
  const res = await fetch(`${BASE_URL}/auth/verify`, {
    headers: { "Authorization":`Bearer ${_token}` },
  });
  return handleResponse(res);
};

// ── PEDIDOS — PÚBLICO ─────────────────────────────────────────

export const createOrder = async (orderData) => {
  const res = await fetch(`${BASE_URL}/orders`, {
    method:  "POST",
    headers: publicHeaders,
    body:    JSON.stringify(orderData),
  });
  return handleResponse(res);
};

export const getOrderById = async (orderId) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, { headers:publicHeaders });
  return handleResponse(res);
};

export const uploadPaymentProof = async (orderId, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/orders/${orderId}/payment-proof`, { method:"POST", body:form });
  return handleResponse(res);
};

export const trackOrder = async (orderId) => {
  const params = new URLSearchParams({ orderId });
  const res = await fetch(`${BASE_URL}/orders/track?${params}`, { headers:publicHeaders });
  return handleResponse(res);
};

// ── PEDIDOS — ADMIN ───────────────────────────────────────────

export const getOrders = async (filters = {}) => {
  const p = new URLSearchParams();
  if (filters.collegeId) p.append("collegeId", filters.collegeId);
  if (filters.status)    p.append("status",    filters.status);
  if (filters.dateFrom)  p.append("dateFrom",  filters.dateFrom);
  if (filters.dateTo)    p.append("dateTo",    filters.dateTo);
  const res = await fetch(`${BASE_URL}/orders?${p}`, { headers:adminHeaders() });
  return handleResponse(res);
};

export const updateDeliveryNote = async (orderId, note) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/delivery-note`, {
    method:  "PATCH",
    headers: adminHeaders(),
    body:    JSON.stringify({ note }),
  });
  return handleResponse(res);
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method:  "PATCH",
    headers: adminHeaders(),
    body:    JSON.stringify({ status:newStatus }),
  });
  return handleResponse(res);
};

export const getStats = async () => {
  const res = await fetch(`${BASE_URL}/orders/admin/stats`, { headers:adminHeaders() });
  return handleResponse(res);
};

// ── STOCK — ADMIN ─────────────────────────────────────────────

export const getStock = async (collegeId) => {
  const res = await fetch(`${BASE_URL}/orders/stock?collegeId=${collegeId}`, { headers: _token ? adminHeaders() : publicHeaders });
  return handleResponse(res);
};

export const updateStock = async (collegeId, productId, size, quantity) => {
  const res = await fetch(`${BASE_URL}/orders/stock`, {
    method:  "PATCH",
    headers: adminHeaders(),
    body:    JSON.stringify({ collegeId, productId, size, quantity }),
  });
  return handleResponse(res);
};

// ── DESCUENTOS — PÚBLICO ──────────────────────────────────────
export const getPublicDiscounts = async () => {
  const res = await fetch(`${BASE_URL}/discounts/public`, { headers: publicHeaders });
  return handleResponse(res);
};

// ── DESCUENTOS — ADMIN ────────────────────────────────────────
export const getDiscounts = async () => {
  const res = await fetch(`${BASE_URL}/discounts`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const setDiscount = async (collegeId, uniformId, pct) => {
  const res = await fetch(`${BASE_URL}/discounts`, {
    method:  "POST",
    headers: adminHeaders(),
    body:    JSON.stringify({ collegeId, uniformId, pct }),
  });
  return handleResponse(res);
};

export const removeDiscount = async (collegeId, uniformId) => {
  const res = await fetch(`${BASE_URL}/discounts/${collegeId}/${uniformId}`, {
    method:  "DELETE",
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

// ── CUPONES — PÚBLICO ─────────────────────────────────────────
export const validateCoupon = async (code) => {
  const res = await fetch(`${BASE_URL}/coupons/validate`, {
    method:  "POST",
    headers: publicHeaders,
    body:    JSON.stringify({ code }),
  });
  return handleResponse(res);
};

// ── CUPONES — ADMIN ───────────────────────────────────────────
export const getCoupons = async () => {
  const res = await fetch(`${BASE_URL}/coupons`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const createCoupon = async (code, pct, description = "") => {
  const res = await fetch(`${BASE_URL}/coupons`, {
    method:  "POST",
    headers: adminHeaders(),
    body:    JSON.stringify({ code, pct, description }),
  });
  return handleResponse(res);
};

export const toggleCoupon = async (code) => {
  const res = await fetch(`${BASE_URL}/coupons/${code}/toggle`, {
    method:  "PATCH",
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const deleteCoupon = async (code) => {
  const res = await fetch(`${BASE_URL}/coupons/${code}`, {
    method:  "DELETE",
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

