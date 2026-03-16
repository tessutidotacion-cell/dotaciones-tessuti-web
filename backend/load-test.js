/**
 * load-test.js — Prueba de carga con k6
 * Simula 3.000 pedidos reales con usuarios concurrentes
 *
 * Requisitos previos en backend/.env:
 *   FIREBASE_MOCK=true
 *   LOAD_TEST=true
 *
 * Ejecutar:
 *   k6 run load-test.js
 */

import http from "k6/http";
import { check } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ── Métricas personalizadas ──────────────────────────────────
const orderDuration = new Trend("order_duration_ms", true);
const orderSuccess  = new Rate("order_success_rate");
const totalOrders   = new Counter("total_orders");

// ── Configuración de la prueba ───────────────────────────────
export const options = {
  scenarios: {
    // 3.000 usuarios simultáneos, 1 pedido cada uno = 3.000 pedidos
    tres_mil_papas: {
      executor: "shared-iterations",
      vus:        3000,
      iterations: 3000,
      maxDuration: "10m",
    },
  },
  thresholds: {
    // La prueba FALLA si:
    http_req_duration:  ["p(95)<2000"],  // 95% de requests < 2 seg
    order_success_rate: ["rate>0.98"],   // más del 98% exitosos
  },
};

// Para producción: "https://dotaciones-tessuti.vercel.app/api"
const BASE_URL = "https://dotaciones-tessuti-m5iy.vercel.app/api";

// ── Datos de prueba ──────────────────────────────────────────
const COLLEGES = ["1", "2", "3"];
const NAMES    = ["Ana García", "Luis Martínez", "María López", "Carlos Pérez", "Sofia Rodríguez"];
const SIZES    = ["4", "6", "8", "10", "12"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildOrder() {
  return {
    collegeId:   randomItem(COLLEGES),
    collegeName: "Colegio de Prueba",
    items: [
      {
        id:    1,
        name:  "Camisa Polo",
        price: 60000,
        size:  randomItem(SIZES),
        qty:   Math.floor(1 + Math.random() * 3),
      },
    ],
    student: {
      name:  randomItem(NAMES),
      grade: "5°",
    },
    guardian: {
      name:  randomItem(NAMES),
      email: `test${Math.floor(Math.random() * 9999)}@test.com`,
      phone: "3001234567",
    },
    delivery: { type: "recogida" },
  };
}

// ── Escenario principal ──────────────────────────────────────
export default function () {
  const payload = JSON.stringify(buildOrder());
  const headers = { "Content-Type": "application/json" };

  const start = Date.now();
  const res   = http.post(`${BASE_URL}/orders`, payload, { headers, timeout: "10s" });
  const ms    = Date.now() - start;

  orderDuration.add(ms);
  totalOrders.add(1);

  const ok = check(res, {
    "status 201":        (r) => r.status === 201,
    "success: true":     (r) => {
      try { return JSON.parse(r.body).success === true; } catch { return false; }
    },
    "tiene orderId":     (r) => {
      try { return !!JSON.parse(r.body).data?.id; } catch { return false; }
    },
  });

  orderSuccess.add(ok ? 1 : 0);

  if (!ok) {
    console.error(`Error ${res.status}: ${res.body?.slice(0, 120)}`);
  }

  // Sin sleep — todos los usuarios disparan simultáneamente
}

// ── Resumen al final ─────────────────────────────────────────
export function handleSummary(data) {
  const dur    = data.metrics.order_duration_ms;
  const rate   = data.metrics.order_success_rate;
  const total  = data.metrics.total_orders;
  const rps    = data.metrics.http_reqs?.rate?.toFixed(1);

  console.log("\n════════════════════════════════════════");
  console.log("        RESULTADO PRUEBA DE CARGA       ");
  console.log("════════════════════════════════════════");
  console.log(`Pedidos totales:  ${total?.values?.count ?? "–"}`);
  console.log(`Tasa de éxito:    ${((rate?.values?.rate ?? 0) * 100).toFixed(1)}%`);
  console.log(`Req/segundo:      ${rps ?? "–"}`);
  console.log(`Tiempo p50:       ${dur?.values?.["p(50)"]?.toFixed(0) ?? "–"} ms`);
  console.log(`Tiempo p95:       ${dur?.values?.["p(95)"]?.toFixed(0) ?? "–"} ms`);
  console.log(`Tiempo p99:       ${dur?.values?.["p(99)"]?.toFixed(0) ?? "–"} ms`);
  console.log(`Tiempo máximo:    ${dur?.values?.max?.toFixed(0) ?? "–"} ms`);
  console.log("════════════════════════════════════════\n");

  return {};
}
