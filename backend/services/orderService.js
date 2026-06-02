import { db } from "../config/firebase.js";
import { createBoldPaymentLink } from "./boldService.js";

const ORDERS_COL  = "pedidos";
const STOCK_COL   = "stock";
const HISTORY_COL = "stock_historial";

// ── Mock en memoria (solo activo si FIREBASE_MOCK=true) ───────
const IS_MOCK = process.env.FIREBASE_MOCK === "true";
const _mockStore   = new Map();
const _mockHistory = [];

if (IS_MOCK) {
  console.log("⚠️  FIREBASE_MOCK activo — ninguna escritura llegará a Firestore");
}

// ── Cache en memoria para stock (TTL 60s) ─────────────────────
const stockCache = new Map();
const STOCK_TTL  = 60_000;

const COUNTER_DOC  = "counters";
const COUNTER_ID   = "orders";
const COUNTER_INIT = 3883; // próximo call → 3884

let _mockCounter = COUNTER_INIT;

const generateOrderId = async () => {
  const year = new Date().getFullYear();

  if (IS_MOCK) {
    _mockCounter += 1;
    return `PED-${year}-${_mockCounter}`;
  }

  const ref = db.collection(COUNTER_DOC).doc(COUNTER_ID);
  const seq = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const next = doc.exists ? (doc.data().seq + 1) : (COUNTER_INIT + 1);
    tx.set(ref, { seq: next }, { merge: true });
    return next;
  });

  return `PED-${year}-${seq}`;
};

const VALID_STATUSES = [
  "Pago en validación","Pago confirmado","En producción",
  "Preparando pedido","Listo para recoger","En camino","Entregado",
];

// ── CREAR PEDIDO ──────────────────────────────────────────────
export const createOrder = async (orderData) => {
  const orderId    = await generateOrderId();
  const isDelivery = orderData.delivery?.type === "domicilio";
  const itemsTotal = orderData.items.reduce((s, i) => s + i.price * i.qty, 0);

  const total = itemsTotal + (isDelivery ? 15000 : 0);

  // Genera link de pago Bold con monto exacto
  const boldPaymentUrl = await createBoldPaymentLink({
    orderId,
    amount:      total,
    description: `Pedido ${orderId} — Tessuti Dotaciones`,
  }).catch(() => null);

  const newOrder = {
    id:          orderId,
    collegeId:   orderData.collegeId,
    collegeName: orderData.collegeName,
    items:       orderData.items,
    student: {
      name:     orderData.student?.name     || "",
      grade:    orderData.student?.grade    || "",
      document: orderData.student?.document || "",
    },
    guardian: {
      name:  orderData.guardian.name,
      phone: orderData.guardian.phone,
      email: orderData.guardian.email,
    },
    delivery:        orderData.delivery || { type: "recogida" },
    total,
    itemCount:       orderData.items.reduce((s, i) => s + i.qty, 0),
    status:          "Pago en validación",
    statusHistory:   [{ status: "Pago en validación", changedAt: new Date().toISOString(), changedBy: "sistema" }],
    paymentProofUrl: null,
    boldPaymentUrl:  boldPaymentUrl || null,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };

  if (IS_MOCK) {
    // Solo guarda en RAM — cero lecturas/escrituras en Firestore
    _mockStore.set(orderId, newOrder);
    return newOrder;
  }

  // Producción normal
  const batch    = db.batch();
  const orderRef = db.collection(ORDERS_COL).doc(orderId);
  batch.set(orderRef, newOrder);
  await batch.commit();

  _decrementStock(orderData.collegeId, orderData.items, orderId).catch(err =>
    console.error("Error descontando stock:", err.message)
  );

  return newOrder;
};

// Descuenta stock (solo en producción real)
const _decrementStock = async (collegeId, items, orderId) => {
  if (IS_MOCK) return;

  const stockRef = db.collection(STOCK_COL).doc(String(collegeId));
  const movements = [];

  await db.runTransaction(async (tx) => {
    const stockDoc = await tx.get(stockRef);
    const current  = stockDoc.exists ? (stockDoc.data().products || {}) : {};
    const updated  = { ...current };
    for (const item of items) {
      const pid     = String(item.id);
      const sizes   = updated[pid] ? { ...updated[pid] } : {};
      const prevQty = sizes[item.size] ?? 0;
      if (sizes[item.size] !== undefined) {
        sizes[item.size] = Math.max(0, prevQty - item.qty);
        movements.push({
          timestamp:   new Date().toISOString(),
          collegeId:   String(collegeId),
          productId:   pid,
          productName: item.name || "",
          size:        item.size,
          delta:       -(item.qty),
          prevQty,
          newQty:      sizes[item.size],
          source:      "pedido",
          orderId:     orderId || null,
        });
      }
      updated[pid] = sizes;
    }
    tx.set(stockRef, {
      collegeId: String(collegeId),
      products:  updated,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });

  stockCache.delete(String(collegeId));

  // Escribir movimientos fuera de la transacción (no bloqueante)
  const batch = db.batch();
  for (const mv of movements) {
    batch.set(db.collection(HISTORY_COL).doc(), mv);
  }
  await batch.commit();
};

// ── LISTAR PEDIDOS ────────────────────────────────────────────
export const getOrders = async (filters = {}) => {
  if (IS_MOCK) {
    return Array.from(_mockStore.values()).slice(0, 200);
  }
  let query = db.collection(ORDERS_COL).orderBy("createdAt", "desc");
  if (filters.collegeId) query = query.where("collegeId", "==", filters.collegeId);
  if (filters.status)    query = query.where("status",    "==", filters.status);
  query = query.limit(200);
  const snapshot = await query.get();
  let orders = snapshot.docs.map(d => d.data());
  if (filters.dateFrom) orders = orders.filter(o => o.createdAt >= filters.dateFrom);
  if (filters.dateTo)   orders = orders.filter(o => o.createdAt <= filters.dateTo + "T23:59:59.999Z");
  return orders;
};

// ── OBTENER POR ID ────────────────────────────────────────────
export const getOrderById = async (orderId) => {
  if (IS_MOCK) {
    return _mockStore.get(orderId) || null;
  }
  const doc = await db.collection(ORDERS_COL).doc(orderId).get();
  return doc.exists ? doc.data() : null;
};

// ── ACTUALIZAR ESTADO ─────────────────────────────────────────
export const updateOrderStatus = async (orderId, newStatus, changedBy = "admin") => {
  if (!VALID_STATUSES.includes(newStatus))
    throw new Error(`Estado inválido: ${newStatus}`);

  if (IS_MOCK) {
    const order = _mockStore.get(orderId);
    if (!order) return null;
    const updated = {
      ...order,
      status: newStatus,
      statusHistory: [...(order.statusHistory || []), { status: newStatus, changedAt: new Date().toISOString(), changedBy }],
      updatedAt: new Date().toISOString(),
    };
    _mockStore.set(orderId, updated);
    return updated;
  }

  const ref = db.collection(ORDERS_COL).doc(orderId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const order = doc.data();
  const statusHistory = [
    ...(order.statusHistory || []),
    { status: newStatus, changedAt: new Date().toISOString(), changedBy },
  ];
  await ref.update({ status: newStatus, statusHistory, updatedAt: new Date().toISOString() });
  return { ...order, status: newStatus, statusHistory };
};

// ── NOTA DE COORDINACIÓN DE ENTREGA ──────────────────────────
export const updateDeliveryNote = async (orderId, note) => {
  if (IS_MOCK) {
    const order = _mockStore.get(orderId);
    if (!order) return null;
    const updated = { ...order, delivery: { ...order.delivery, coordinationNote: note }, updatedAt: new Date().toISOString() };
    _mockStore.set(orderId, updated);
    return updated;
  }
  const ref = db.collection(ORDERS_COL).doc(orderId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ "delivery.coordinationNote": note, updatedAt: new Date().toISOString() });
  return { ...doc.data(), delivery: { ...doc.data().delivery, coordinationNote: note } };
};

// ── ACTUALIZAR COMPROBANTE ────────────────────────────────────
export const updatePaymentProof = async (orderId, paymentProofUrl) => {
  if (IS_MOCK) {
    const order = _mockStore.get(orderId);
    if (!order) return null;
    const updated = { ...order, paymentProofUrl, updatedAt: new Date().toISOString() };
    _mockStore.set(orderId, updated);
    return updated;
  }
  const ref = db.collection(ORDERS_COL).doc(orderId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ paymentProofUrl, updatedAt: new Date().toISOString() });
  return { ...doc.data(), paymentProofUrl };
};

// ── ESTADÍSTICAS ──────────────────────────────────────────────
export const getStats = async () => {
  if (IS_MOCK) {
    const orders = Array.from(_mockStore.values());
    const stats  = { total: orders.length, byStatus: {}, byCollege: {}, totalRevenue: 0, confirmedRevenue: 0 };
    VALID_STATUSES.forEach(s => (stats.byStatus[s] = 0));
    orders.forEach(o => {
      if (stats.byStatus[o.status] !== undefined) stats.byStatus[o.status]++;
      if (!stats.byCollege[o.collegeName]) stats.byCollege[o.collegeName] = { count: 0, revenue: 0 };
      stats.byCollege[o.collegeName].count++;
      stats.byCollege[o.collegeName].revenue += o.total || 0;
      stats.totalRevenue += o.total || 0;
      if (o.status !== "Pago en validación") stats.confirmedRevenue += o.total || 0;
    });
    return stats;
  }
  const snapshot = await db.collection(ORDERS_COL).select("status", "collegeName", "total").get();
  const orders   = snapshot.docs.map(d => d.data());
  const stats    = { total: orders.length, byStatus: {}, byCollege: {}, totalRevenue: 0, confirmedRevenue: 0 };
  VALID_STATUSES.forEach(s => (stats.byStatus[s] = 0));
  orders.forEach(o => {
    if (stats.byStatus[o.status] !== undefined) stats.byStatus[o.status]++;
    if (!stats.byCollege[o.collegeName]) stats.byCollege[o.collegeName] = { count: 0, revenue: 0 };
    stats.byCollege[o.collegeName].count++;
    stats.byCollege[o.collegeName].revenue += o.total || 0;
    stats.totalRevenue += o.total || 0;
    if (o.status !== "Pago en validación") stats.confirmedRevenue += o.total || 0;
  });
  return stats;
};

// ── STOCK ─────────────────────────────────────────────────────
export const getStock = async (collegeId) => {
  if (IS_MOCK) {
    // Devuelve stock ficticio para no bloquear el catálogo en pruebas
    return {
      "1": { "S": 100, "M": 100, "L": 100, "XL": 100 },
      "2": { "S": 100, "M": 100, "L": 100, "XL": 100 },
    };
  }
  const key    = String(collegeId);
  const cached = stockCache.get(key);
  if (cached && Date.now() - cached.ts < STOCK_TTL) return cached.data;
  const doc  = await db.collection(STOCK_COL).doc(key).get();
  const data = doc.exists ? (doc.data().products || {}) : {};
  stockCache.set(key, { data, ts: Date.now() });
  return data;
};

export const setStock = async (collegeId, productId, size, quantity) => {
  if (IS_MOCK) {
    _mockHistory.push({
      id:          `mock-${Date.now()}`,
      timestamp:   new Date().toISOString(),
      collegeId:   String(collegeId),
      productId:   String(productId),
      productName: "",
      size,
      delta:       quantity,
      prevQty:     0,
      newQty:      quantity,
      source:      "admin_manual",
      orderId:     null,
    });
    return { [String(productId)]: { [String(size)]: quantity } };
  }

  const key            = String(collegeId);
  const ref            = db.collection(STOCK_COL).doc(key);
  const doc            = await ref.get();
  const current        = doc.exists ? (doc.data().products || {}) : {};
  const currentProduct = current[String(productId)] || {};
  const prevQty        = currentProduct[String(size)] ?? 0;
  const updatedProduct = { ...currentProduct, [String(size)]: quantity };
  const updated        = { ...current, [String(productId)]: updatedProduct };

  await ref.set({ collegeId: key, products: updated, updatedAt: new Date().toISOString() }, { merge: true });
  stockCache.delete(key);

  // Registrar movimiento solo si hubo cambio real
  const delta = quantity - prevQty;
  if (delta !== 0) {
    await db.collection(HISTORY_COL).add({
      timestamp:   new Date().toISOString(),
      collegeId:   key,
      productId:   String(productId),
      productName: "",
      size,
      delta,
      prevQty,
      newQty:      quantity,
      source:      "admin_manual",
      orderId:     null,
    });
  }

  return updated;
};

// ── HISTORIAL DE STOCK ────────────────────────────────────────
export const getStockHistory = async ({ collegeId, limit = 200 } = {}) => {
  if (IS_MOCK) {
    return [..._mockHistory].reverse().slice(0, limit);
  }
  let query = db.collection(HISTORY_COL).orderBy("timestamp", "desc").limit(limit);
  if (collegeId) query = query.where("collegeId", "==", String(collegeId));
  const snapshot = await query.get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};