/**
 * tests/security.js — Pruebas de seguridad y resistencia del backend
 *
 * Prueba localmente con el servidor corriendo:
 *   node server.js          (en otra terminal)
 *   node tests/security.js  (en esta terminal)
 *
 * O contra producción:
 *   node tests/security.js --url https://www.tessuti.store/#home
 */

// ── Config ────────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const urlIdx = args.indexOf("--url");const BASE   = urlIdx !== -1 ? args[urlIdx + 1] : "https://www.tessuti.store/#home";

// ── Colores terminal ──────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  dim:    "\x1b[2m",
};

// ── Contador global ───────────────────────────────────────────────────────────
let passed = 0, failed = 0, warned = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function req(method, path, { body, headers = {}, origin } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (origin) opts.headers["Origin"] = origin;
  if (body !== undefined) opts.body = typeof body === "string" ? body : JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data, headers: res.headers };
  } catch (err) {
    return { status: 0, data: null, error: err.message };
  }
}

function pass(label) {
  passed++;
  console.log(`  ${C.green}✓${C.reset} ${label}`);
}

function fail(label, detail = "") {
  failed++;
  console.log(`  ${C.red}✗${C.reset} ${C.bold}${label}${C.reset}${detail ? C.dim + "  ← " + detail + C.reset : ""}`);
}

function warn(label, detail = "") {
  warned++;
  console.log(`  ${C.yellow}△${C.reset} ${label}${detail ? C.dim + "  ← " + detail + C.reset : ""}`);
}

function section(title) {
  console.log(`\n${C.cyan}${C.bold}━━ ${title} ━━${C.reset}`);
}

function expect(label, condition, detail = "") {
  condition ? pass(label) : fail(label, detail);
}

// ── Pedido de ejemplo válido ──────────────────────────────────────────────────
const validOrder = {
  collegeId:   "1",
  collegeName: "Colegio Prueba",
  items: [{ id: 1, name: "Camisa Polo", price: 60000, size: "10", qty: 1 }],
  guardian: { name: "Papa Test", email: "test@test.com", phone: "3001234567" },
  delivery: { type: "recogida" },
};

// ══════════════════════════════════════════════════════════════════════════════
async function runAll() {
  console.log(`\n${C.bold}PRUEBAS DE SEGURIDAD — ${BASE}${C.reset}`);
  console.log(C.dim + new Date().toLocaleString("es-CO") + C.reset);

  // ── 1. SERVIDOR ACTIVO ────────────────────────────────────────────────────
  section("1. DISPONIBILIDAD");

  const health = await req("GET", "/health");
  expect("GET /health → 200", health.status === 200, `status: ${health.status}`);

  const root = await req("GET", "/");
  expect("GET / responde con status online", root.data?.status === "online");

  const secTxt = await req("GET", "/.well-known/security.txt");
  expect("GET /.well-known/security.txt → 200", secTxt.status === 200);

  // ── 2. HEADERS DE SEGURIDAD ───────────────────────────────────────────────
  section("2. HEADERS HTTP (Helmet)");

  const { headers } = health;
  expect(
    "X-Frame-Options: DENY",
    headers.get("x-frame-options")?.toUpperCase() === "DENY",
    headers.get("x-frame-options") || "ausente"
  );
  expect(
    "X-Content-Type-Options: nosniff",
    headers.get("x-content-type-options") === "nosniff",
    headers.get("x-content-type-options") || "ausente"
  );
  expect(
    "Strict-Transport-Security presente",
    !!headers.get("strict-transport-security"),
    headers.get("strict-transport-security") || "ausente"
  );
  expect(
    "X-Powered-By oculto",
    !headers.get("x-powered-by"),
    headers.get("x-powered-by") || "ok"
  );
  expect(
    "Referrer-Policy presente",
    !!headers.get("referrer-policy"),
    headers.get("referrer-policy") || "ausente"
  );

  // ── 3. CORS ───────────────────────────────────────────────────────────────
  section("3. CORS");

  const corsOk = await req("GET", "/health", { origin: "http://localhost:5173" });
  expect("Origen localhost:5173 permitido", corsOk.status === 200);

  const corsBad = await req("GET", "/health", { origin: "https://sitio-malicioso.com" });
  // CORS bloqueado = 403 o el header Access-Control-Allow-Origin no está
  const corsBlocked =
    corsBad.status === 403 ||
    corsBad.data?.error?.includes("CORS") ||
    !corsBad.headers?.get("access-control-allow-origin");
  expect("Origen desconocido bloqueado por CORS", corsBlocked, `status: ${corsBad.status}`);

  const corsVercel = await req("GET", "/health", { origin: "https://cualquier-cosa.vercel.app" });
  expect("Subdominio *.vercel.app permitido", corsVercel.status === 200);

  // ── 4. AUTENTICACIÓN ──────────────────────────────────────────────────────
  section("4. AUTENTICACIÓN Y AUTORIZACIÓN");

  const noAuth = await req("GET", "/api/orders");
  expect("GET /api/orders sin token → 401", noAuth.status === 401, `status: ${noAuth.status}`);

  const fakeToken = await req("GET", "/api/orders", {
    headers: { Authorization: "Bearer token_falso_12345" },
  });
  expect("Token JWT falso → 401", fakeToken.status === 401, `status: ${fakeToken.status}`);

  const malformed = await req("GET", "/api/orders", {
    headers: { Authorization: "NoBearerToken" },
  });
  expect("Token malformado (sin Bearer) → 401", malformed.status === 401, `status: ${malformed.status}`);

  // x-api-key legacy eliminado — ya no debe funcionar como bypass
  const apiKeyBypass = await req("GET", "/api/orders", {
    headers: { "x-api-key": "cualquier_valor" },
  });
  expect("x-api-key sin Bearer → 401 (sin bypass)", apiKeyBypass.status === 401, `status: ${apiKeyBypass.status}`);

  const noAuthDiscount = await req("GET", "/api/discounts");
  expect("GET /api/discounts sin token → 401", noAuthDiscount.status === 401, `status: ${noAuthDiscount.status}`);

  const noAuthPatch = await req("PATCH", "/api/orders/orden_inexistente/status");
  expect("PATCH /api/orders/:id/status sin token → 401", noAuthPatch.status === 401, `status: ${noAuthPatch.status}`);

  // ── 5. VALIDACIÓN DE INPUTS ───────────────────────────────────────────────
  section("5. VALIDACIÓN DE DATOS");

  const emptyOrder = await req("POST", "/api/orders", { body: {} });
  expect("Crear pedido vacío → 400/422", [400, 422].includes(emptyOrder.status), `status: ${emptyOrder.status}`);

  const noItems = await req("POST", "/api/orders", {
    body: { ...validOrder, items: [] },
  });
  expect("Pedido sin ítems → 400/422", [400, 422].includes(noItems.status), `status: ${noItems.status}`);

  const noCollege = await req("POST", "/api/orders", {
    body: { ...validOrder, collegeId: undefined },
  });
  expect("Pedido sin collegeId → 400/422", [400, 422].includes(noCollege.status), `status: ${noCollege.status}`);

  const badEmail = await req("POST", "/api/orders", {
    body: { ...validOrder, guardian: { ...validOrder.guardian, email: "no-es-email" } },
  });
  expect("Email inválido en guardian → 400/422", [400, 422].includes(badEmail.status), `status: ${badEmail.status}`);

  const badDelivery = await req("POST", "/api/orders", {
    body: { ...validOrder, delivery: { type: "TIPO_INEXISTENTE" } },
  });
  expect("Tipo de entrega inválido → 400/422", [400, 422].includes(badDelivery.status), `status: ${badDelivery.status}`);

  // ── 6. INYECCIONES ────────────────────────────────────────────────────────
  section("6. INYECCIONES (XSS / NoSQL Injection)");

  const xssPayload = await req("POST", "/api/orders", {
    body: {
      ...validOrder,
      guardian: { ...validOrder.guardian, name: "<script>alert('XSS')</script>" },
    },
  });
  // O rechaza (400) o acepta pero la respuesta NO debe contener el script sin escapar
  const xssBody = JSON.stringify(xssPayload.data);
  const xssSafe = xssPayload.status === 400 || !xssBody.includes("<script>alert");
  expect("XSS en nombre → bloqueado o sanitizado", xssSafe, `status: ${xssPayload.status}`);

  const noSqlPayload = await req("POST", "/api/orders", {
    body: {
      ...validOrder,
      guardian: {
        ...validOrder.guardian,
        email: { $gt: "" }, // operador NoSQL
      },
    },
  });
  expect(
    "Operador NoSQL ($gt) en campo email → 400/422",
    [400, 422].includes(noSqlPayload.status),
    `status: ${noSqlPayload.status}`
  );

  const longString = "A".repeat(10000);
  const longPayload = await req("POST", "/api/orders", {
    body: { ...validOrder, guardian: { ...validOrder.guardian, name: longString } },
  });
  expect(
    "String de 10.000 chars → 400/413/422",
    [400, 413, 422].includes(longPayload.status),
    `status: ${longPayload.status}`
  );

  // ── 7. JSON MALFORMADO Y BODY BOMB ────────────────────────────────────────
  section("7. PAYLOADS MALFORMADOS");

  const badJson = await req("POST", "/api/orders", { body: "{ esto no: es json válido }" });
  expect("JSON malformado → 400", badJson.status === 400, `status: ${badJson.status}`);

  // Payload grande (2MB+) — debe ser rechazado
  const bigBody = JSON.stringify({ data: "X".repeat(2.1 * 1024 * 1024) });
  const tooBig = await req("POST", "/api/orders", { body: bigBody });
  expect("Body > 2MB → 413/400", [400, 413].includes(tooBig.status), `status: ${tooBig.status}`);

  // ── 8. RUTAS INEXISTENTES ─────────────────────────────────────────────────
  section("8. MANEJO DE ERRORES");

  const notFound = await req("GET", "/api/ruta-que-no-existe");
  expect("Ruta inexistente → 404", notFound.status === 404, `status: ${notFound.status}`);

  const notFoundOrder = await req("GET", "/api/orders/orden_que_no_existe_xyz_999");
  // Sin token → 401, con invalid id → 400/404
  expect(
    "Order ID inexistente → 401/404/400",
    [400, 401, 404].includes(notFoundOrder.status),
    `status: ${notFoundOrder.status}`
  );

  // No expone stack trace
  const errBody = JSON.stringify(notFound.data);
  expect(
    "Error 404 no expone stack trace",
    !errBody.includes("at ") && !errBody.includes("Error:"),
    errBody.slice(0, 100)
  );

  // ── 9. PARAMETER POLLUTION (HPP) ──────────────────────────────────────────
  section("9. HTTP PARAMETER POLLUTION");

  const hpp = await req("GET", "/api/orders/stock?collegeId=1&collegeId=2&collegeId=3");
  expect(
    "Query params duplicados no rompen el servidor (no 500)",
    hpp.status !== 500,
    `status: ${hpp.status}`
  );

  // ── 10. MÉTODOS NO PERMITIDOS ─────────────────────────────────────────────
  section("10. MÉTODOS HTTP");

  const deleteRoot = await req("DELETE", "/");
  expect("DELETE / → 404 (no 500)", deleteRoot.status !== 500, `status: ${deleteRoot.status}`);

  const putHealth = await req("PUT", "/health");
  expect("PUT /health → 404 (no 500)", putHealth.status !== 500, `status: ${putHealth.status}`);

  // ── 11. ENDPOINTS PÚBLICOS ACCESIBLES ─────────────────────────────────────
  section("11. ENDPOINTS PÚBLICOS");

  const publicDiscounts = await req("GET", "/api/discounts/public");
  expect(
    "GET /api/discounts/public → 200 (sin auth)",
    publicDiscounts.status === 200,
    `status: ${publicDiscounts.status}`
  );

  const stock = await req("GET", "/api/orders/stock?collegeId=1");
  expect(
    "GET /api/orders/stock → 200 (sin auth)",
    stock.status === 200,
    `status: ${stock.status}`
  );

  const trackEmpty = await req("GET", "/api/orders/track/CODIGO_FALSO");
  expect(
    "GET /api/orders/track/:id → 400/404 (no 500)",
    [400, 404].includes(trackEmpty.status),
    `status: ${trackEmpty.status}`
  );

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  const total = passed + failed + warned;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`${C.bold}RESULTADO${C.reset}`);
  console.log(`  ${C.green}Pasaron:  ${passed}/${total}${C.reset}`);
  if (failed > 0)  console.log(`  ${C.red}Fallaron: ${failed}/${total}${C.reset}`);
  if (warned > 0)  console.log(`  ${C.yellow}Avisos:   ${warned}/${total}${C.reset}`);

  if (failed === 0) {
    console.log(`\n${C.green}${C.bold}  Backend seguro — todas las pruebas pasaron${C.reset}\n`);
  } else {
    console.log(`\n${C.red}${C.bold}  Hay ${failed} prueba(s) fallida(s) — revisar arriba${C.reset}\n`);
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error(`\n${C.red}Error ejecutando pruebas: ${err.message}${C.reset}\n`);
  process.exit(1);
});
