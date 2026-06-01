// ============================================================
// scripts/seed-liceo-stock.mjs
// Monta el inventario completo del Liceo Francés en Firestore.
//
// Estructura Firestore (igual que orderService.js):
//   colección "stock" → doc "liceo-frances" →
//     { collegeId, products: { [productId]: { [talla]: cantidad } }, updatedAt }
//
// USO (desde la carpeta backend/, con .env configurado):
//   node scripts/seed-liceo-stock.mjs --dry     ← muestra sin escribir
//   node scripts/seed-liceo-stock.mjs           ← escribe en Firestore
//
// Nota: sobrescribe el doc "stock/liceo-frances" con este inventario
// (autoritativo). Los ids coinciden con src/data/colleges.js.
// ============================================================
import { db } from "../config/firebase.js";

const COLLEGE_ID = "liceo-frances";

// productId → { talla: cantidad }   (del inventario "inve liceo frances.xlsx")
const products = {
  // ── Primaria ──────────────────────────────────────────────
  "511": { "4": 64, "6": 60, "8": 22, "10": 25, "12": 5 },                                     // Camiseta Polo Kids
  "515": { "4": 15, "6": 8, "8": 10, "10": 3, "12": 0, "14": 1 },                              // Chaleco Negro Kids
  "514": { "4": 14, "6": 20, "8": 16 },                                                        // Delantal Kids
  "516": { "2": 10, "4": 35, "6": 33, "8": 33, "10": 17, "12": 41, "14": 17, "16": 10, "S": 33, "M": 28 }, // Sudadera Kids
  "512": { "4": 34, "6": 26, "8": 26, "10": 12, "12": 0, "14": 29, "16": 10, "S": 0, "M": 0 }, // Chaqueta Kids
  // ── Bachillerato ──────────────────────────────────────────
  "500": { "12": 14, "14": 17, "16": 8, "S": 13, "M": 10, "L": 5 },                            // Chaqueta HS
  "501": { "12": 5, "14": 42, "16": 29, "S": 43, "M": 40 },                                    // Camisa Polo
  "505": { "12": 20, "14": 82, "16": 108, "S": 27, "M": 22, "L": 5 },                          // Camiseta Unisex Ed. Física
  "506": { "12": 14, "14": 26, "16": 58, "S": 27, "M": 27 },                                   // Sudadera Diario
  "504": { "12": 0, "14": 75, "16": 110, "S": 22, "M": 0 },                                    // Jogger Unisex Ed. Física
  "508": { "Única": 51 },                                                                      // Bata de Laboratorio
};

const DRY = process.argv.includes("--dry");

async function main() {
  const totalUnits = Object.values(products)
    .flatMap(p => Object.values(p))
    .reduce((a, b) => a + b, 0);
  const productCount = Object.keys(products).length;

  console.log(`\nInventario Liceo Francés → stock/${COLLEGE_ID}`);
  console.log(`  ${productCount} productos · ${totalUnits} unidades totales\n`);
  for (const [id, sizes] of Object.entries(products)) {
    const sub = Object.values(sizes).reduce((a, b) => a + b, 0);
    console.log(`  ${id}: ${JSON.stringify(sizes)}  (${sub})`);
  }

  if (DRY) {
    console.log("\n[--dry] No se escribió nada. Quita --dry para subir a Firestore.");
    process.exit(0);
  }

  await db.collection("stock").doc(COLLEGE_ID).set({
    collegeId: COLLEGE_ID,
    products,
    updatedAt: new Date().toISOString(),
  });

  console.log(`\n✓ Inventario subido a Firestore: stock/${COLLEGE_ID}`);
  process.exit(0);
}

main().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
