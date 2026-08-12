import { db } from "../config/firebase.js";
import { createBoldPaymentLink } from "./boldService.js";
import { sendReservedItemAvailable } from "./emailService.js";

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

// ── Tallas de stock físico compartido entre prendas ────────────
// Liceo Francés: Polo Primaria (511) y Polo Bachillerato (501) talla 12
// es la misma prenda física — se mantiene sincronizada entre ambas.
const SHARED_STOCK_LINKS = {
  "liceo-frances": [
    { size: "12", productIds: ["511", "501"] },
  ],
};

const _sharedGroup = (collegeId, productId, size) => {
  const groups = SHARED_STOCK_LINKS[String(collegeId)];
  if (!groups) return null;
  const group = groups.find(g => g.size === String(size) && g.productIds.includes(String(productId)));
  return group ? group.productIds : null;
};

const COUNTER_DOC  = "counters";
const COUNTER_ID   = "orders";
const COUNTER_INIT = 3834; // próximo call → 3835

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
  "Preparando pedido","Listo para recoger","En camino","Entregado","Anulado",
];

// ── CREAR PEDIDO ──────────────────────────────────────────────
export const createOrder = async (orderData) => {
  const orderId    = await generateOrderId();
  const isDelivery = orderData.delivery?.type === "domicilio";
  const itemsTotal = orderData.items.reduce((s, i) => s + i.price * i.qty, 0);
  const couponDiscount = orderData.coupon?.pct ? Math.round(itemsTotal * orderData.coupon.pct / 100) : 0;

  const total = itemsTotal + (isDelivery ? 15000 : 0) - couponDiscount;

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
      name:           orderData.guardian.name,
      phone:          orderData.guardian.phone,
      email:          orderData.guardian.email,
      document:       orderData.guardian.document       || "",
      billingAddress: orderData.guardian.billingAddress || "",
    },
    delivery:        orderData.delivery || { type: "recogida" },
    paymentMethod:   orderData.paymentMethod || "transfer",
    total,
    itemCount:       orderData.items.reduce((s, i) => s + i.qty, 0),
    status:          "Pago en validación",
    statusHistory:   [{ status: "Pago en validación", changedAt: new Date().toISOString(), changedBy: "sistema" }],
    coupon:          orderData.coupon?.code ? { code: orderData.coupon.code, pct: orderData.coupon.pct, discount: couponDiscount } : null,
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

// Restaura stock al anular un pedido (inverso de _decrementStock)
const _restoreStock = async (collegeId, items, orderId) => {
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
      sizes[item.size] = prevQty + item.qty;
      movements.push({
        timestamp:   new Date().toISOString(),
        collegeId:   String(collegeId),
        productId:   pid,
        productName: item.name || "",
        size:        item.size,
        delta:       item.qty,
        prevQty,
        newQty:      sizes[item.size],
        source:      "anulacion",
        orderId:     orderId || null,
      });
      updated[pid] = sizes;

      const sharedIds = _sharedGroup(collegeId, pid, item.size);
      if (sharedIds) {
        for (const sibPid of sharedIds) {
          if (sibPid === pid) continue;
          const sibSizes   = updated[sibPid] ? { ...updated[sibPid] } : {};
          const sibPrevQty = sibSizes[item.size] ?? 0;
          sibSizes[item.size] = sibPrevQty + item.qty;
          movements.push({
            timestamp:   new Date().toISOString(),
            collegeId:   String(collegeId),
            productId:   sibPid,
            productName: "",
            size:        item.size,
            delta:       item.qty,
            prevQty:     sibPrevQty,
            newQty:      sibSizes[item.size],
            source:      "anulacion_compartido",
            orderId:     orderId || null,
          });
          updated[sibPid] = sibSizes;
        }
      }
    }
    tx.set(stockRef, {
      collegeId: String(collegeId),
      products:  updated,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });

  stockCache.delete(String(collegeId));

  const batch = db.batch();
  for (const mv of movements) {
    batch.set(db.collection(HISTORY_COL).doc(), mv);
  }
  await batch.commit();
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

      // Descontar también en las prendas que comparten esta talla físicamente
      const sharedIds = _sharedGroup(collegeId, pid, item.size);
      if (sharedIds) {
        for (const sibPid of sharedIds) {
          if (sibPid === pid) continue;
          const sibSizes   = updated[sibPid] ? { ...updated[sibPid] } : {};
          const sibPrevQty = sibSizes[item.size] ?? 0;
          if (sibSizes[item.size] !== undefined) {
            sibSizes[item.size] = Math.max(0, sibPrevQty - item.qty);
            movements.push({
              timestamp:   new Date().toISOString(),
              collegeId:   String(collegeId),
              productId:   sibPid,
              productName: "",
              size:        item.size,
              delta:       -(item.qty),
              prevQty:     sibPrevQty,
              newQty:      sibSizes[item.size],
              source:      "pedido_compartido",
              orderId:     orderId || null,
            });
          }
          updated[sibPid] = sibSizes;
        }
      }
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
    return Array.from(_mockStore.values());
  }
  let query = db.collection(ORDERS_COL).orderBy("createdAt", "desc");
  if (filters.collegeId) query = query.where("collegeId", "==", filters.collegeId);
  if (filters.status)    query = query.where("status",    "==", filters.status);
  const snapshot = await query.get();
  let orders = snapshot.docs.map(d => d.data());
  if (filters.dateFrom) orders = orders.filter(o => o.createdAt >= filters.dateFrom);
  if (filters.dateTo)   orders = orders.filter(o => o.createdAt <= filters.dateTo + "T23:59:59.999Z");
  return orders;
};

// ── OBTENER POR ID ────────────────────────────────────────────
export const lookupCustomer = async (document) => {
  if (IS_MOCK) {
    for (const order of _mockStore.values()) {
      if (order.guardian?.document === document) return order.guardian;
    }
    return null;
  }
  const snapshot = await db.collection(ORDERS_COL)
    .where("guardian.document", "==", document)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().guardian || null;
};

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

  // Restaurar stock si se anula y no estaba ya anulado
  if (newStatus === "Anulado" && order.status !== "Anulado" && order.collegeId && order.items?.length) {
    _restoreStock(order.collegeId, order.items, orderId).catch(err =>
      console.error("Error restaurando stock al anular:", err.message)
    );
  }

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

// ── ACTUALIZAR MÉTODO DE PAGO ─────────────────────────────────
const VALID_PAYMENT_METHODS = ["transfer", "cash", "wompi"];
export const updatePaymentMethod = async (orderId, paymentMethod) => {
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod))
    throw new Error(`Método de pago inválido: ${paymentMethod}`);
  if (IS_MOCK) {
    const order = _mockStore.get(orderId);
    if (!order) return null;
    const updated = { ...order, paymentMethod, updatedAt: new Date().toISOString() };
    _mockStore.set(orderId, updated);
    return updated;
  }
  const ref = db.collection(ORDERS_COL).doc(orderId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ paymentMethod, updatedAt: new Date().toISOString() });
  return { ...doc.data(), paymentMethod };
};

// ── ACTUALIZAR CÉDULA ACUDIENTE ───────────────────────────────
export const updateGuardianDocument = async (orderId, document) => {
  const clean = String(document || "").trim().replace(/[^0-9\-]/g, "").slice(0, 20);
  if (IS_MOCK) {
    const order = _mockStore.get(orderId);
    if (!order) return null;
    const updated = { ...order, guardian: { ...order.guardian, document: clean }, updatedAt: new Date().toISOString() };
    _mockStore.set(orderId, updated);
    return updated;
  }
  const ref = db.collection(ORDERS_COL).doc(orderId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ "guardian.document": clean, updatedAt: new Date().toISOString() });
  return { ...doc.data(), guardian: { ...doc.data().guardian, document: clean } };
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
      if (o.status === "Entregado") {
        stats.byCollege[o.collegeName].revenue += o.total || 0;
        stats.totalRevenue   += o.total || 0;
        stats.confirmedRevenue += o.total || 0;
      }
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
    if (o.status === "Entregado") {
      stats.byCollege[o.collegeName].revenue += o.total || 0;
      stats.totalRevenue   += o.total || 0;
      stats.confirmedRevenue += o.total || 0;
    }
  });
  return stats;
};

// ── STOCK ─────────────────────────────────────────────────────
export const getStock = async (collegeId) => {
  if (IS_MOCK) {
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

// Busca pedidos con items reservados para product/size, notifica y descuenta
const _fulfillReservations = async (collegeId, productId, size, availableQty) => {
  if (availableQty <= 0) return 0;

  const TERMINAL = ["Anulado", "Entregado"];
  const snapshot = await db.collection(ORDERS_COL)
    .where("collegeId", "==", String(collegeId))
    .orderBy("createdAt", "asc")
    .get();

  let consumed = 0;
  const batch = db.batch();

  for (const docSnap of snapshot.docs) {
    if (consumed >= availableQty) break;
    const order = docSnap.data();
    if (TERMINAL.includes(order.status)) continue;

    const updatedItems = order.items?.map(item => ({ ...item })) || [];
    let orderChanged = false;

    for (const item of updatedItems) {
      if (consumed >= availableQty) break;
      if (!item.reserved) continue;
      if (String(item.id) !== String(productId)) continue;
      if (item.size !== size) continue;

      const fulfill = Math.min(item.qty, availableQty - consumed);
      consumed += fulfill;
      item.reserved = false;
      orderChanged = true;

      sendReservedItemAvailable(order, item.name, size, fulfill).catch(err =>
        console.error("Error enviando email reserva:", err.message)
      );
    }

    if (orderChanged) {
      batch.update(docSnap.ref, { items: updatedItems, updatedAt: new Date().toISOString() });
    }
  }

  if (consumed > 0) await batch.commit();
  return consumed;
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

  // Espejar a las prendas que comparten stock físico para esta talla
  const sharedIds = _sharedGroup(key, productId, size);
  const movements = [];
  if (sharedIds) {
    for (const pid of sharedIds) {
      if (pid === String(productId)) continue;
      const sibling    = updated[pid] || {};
      const siblingPrev = sibling[String(size)] ?? 0;
      updated[pid] = { ...sibling, [String(size)]: quantity };
      if (siblingPrev !== quantity) {
        movements.push({
          timestamp: new Date().toISOString(), collegeId: key, productId: pid, productName: "",
          size, delta: quantity - siblingPrev, prevQty: siblingPrev, newQty: quantity,
          source: "admin_manual_shared", orderId: null,
        });
      }
    }
  }

  await ref.set({ collegeId: key, products: updated, updatedAt: new Date().toISOString() }, { merge: true });
  stockCache.delete(key);

  // Cumplir reservas si el nuevo stock es > 0
  if (quantity > 0) {
    _fulfillReservations(collegeId, productId, size, quantity).then(async (consumed) => {
      if (consumed > 0) {
        // Descontar del stock lo que se asignó a reservas
        const ref2 = db.collection(STOCK_COL).doc(key);
        const doc2 = await ref2.get();
        const cur  = doc2.exists ? (doc2.data().products || {}) : {};
        const pid  = String(productId);
        const prev = cur[pid]?.[size] ?? 0;
        const next = Math.max(0, prev - consumed);
        const updProd = { ...(cur[pid] || {}), [size]: next };
        await ref2.set({ products: { ...cur, [pid]: updProd }, updatedAt: new Date().toISOString() }, { merge: true });
        stockCache.delete(key);
        console.log(`[reservas] ${consumed} ud(s) de ${productId} talla ${size} asignadas a pedidos reservados`);
      }
    }).catch(err => console.error("Error cumpliendo reservas:", err.message));
  }

  // Registrar movimiento solo si hubo cambio real
  const delta = quantity - prevQty;
  if (delta !== 0) {
    movements.push({
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
  if (movements.length > 0) {
    const batch = db.batch();
    for (const mv of movements) batch.set(db.collection(HISTORY_COL).doc(), mv);
    await batch.commit();
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