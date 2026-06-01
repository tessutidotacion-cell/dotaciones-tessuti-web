// ============================================================
// scripts/seed-cumbres-stock.mjs
// Monta el inventario de Cumbres en Firestore (ids UNIFICADOS).
//
// Estructura Firestore (igual que orderService.js):
//   colección "stock" → doc "2" (collegeId de Cumbres) →
//     { collegeId, products: { [productId]: { [talla]: cantidad } }, updatedAt }
//
// USO (desde backend/, con .env válido):
//   node scripts/seed-cumbres-stock.mjs --dry   ← muestra sin escribir
//   node scripts/seed-cumbres-stock.mjs         ← escribe en Firestore
//
// Sobrescribe el doc "stock/2" (autoritativo). Ids = src/data/colleges.js.
//
// UNIFICADO: cada SKU físico tiene UN solo id canónico (los duplicados
// por sección se fusionaron en colleges.js). Sin doble conteo → un pedido
// de cualquier sección descuenta el mismo stock. Ids canónicos de SKUs
// compartidos: medias blancas=106, medias gala dama=410, camiseta física=305,
// saco CV primaria=301, falda=408, correa=310, saco HS=220, chompa gris HS=221.
// ============================================================
import { db } from "../config/firebase.js";

const COLLEGE_ID = "2";

const products = {
  // ── Bambolino ─────────────────────────────────────────────
  "100": { "0": 5, "2": 20, "4": 30, "6": 30 },                 // Camiseta Bambolino
  "101": { "2": 5, "4": 20, "6": 10, "8": 5 },                  // Chompa Bambolino
  "102": { "0": 5, "2": 20, "4": 30, "6": 20 },                 // Sudadera Bambolino
  "103": { "2": 10, "4": 15, "6": 8 },                          // Delantal Bambolino
  "104": { "Única": 5 },                                         // Pava Niña
  "105": { "Única": 5 },                                         // Gorra Niño
  "106": { "2 A 4": 15, "4 A 6": 15, "6 A 8": 15, "8 A 10": 15, "10 A 12": 20 }, // Medias Blancas Física x2 ★ compartido

  // ── Primaria Femenino ─────────────────────────────────────
  "401": { "8": 5, "10": 20, "12": 30, "14": 30, "16": 15, "XS": 10, "S": 5 },          // Blusa Gala Femenino
  "402": { "10": 5, "12": 15, "14": 15 },                        // Jumper
  "403": { "12": 10, "14": 10, "16": 10, "XS": 10, "S": 5 },     // Chaleco Dama
  "404": { "4": 8, "6": 15, "8": 15, "10": 15, "12": 20, "14": 15, "16": 10, "18": 10 }, // Chompa Blanca Femenino
  "406": { "4": 15, "6": 30, "8": 30, "10": 30, "12": 20, "14": 20, "16": 20, "S": 5 }, // Sudadera Azul Física Fem
  "407": { "4": 5, "6": 5, "8": 5 },                             // Delantal Verde Niña
  "408": { "10": 5, "12": 12, "14": 12, "16": 10, "XS": 10, "S": 10, "M": 5 },          // Falda ★ compartido
  "410": { "8 A 10": 15, "9 A 11": 10 },                         // Medias Gala Dama x3 ★ compartido

  // ── Primaria Masculino ────────────────────────────────────
  "301": { "12": 10, "14": 10, "16": 5, "S": 5 },                // Saco Tejido CV ★ compartido
  "302": { "8": 5, "10": 10, "12": 30, "14": 30, "16": 20, "18": 20, "XS": 10, "S": 10, "M": 5 }, // Camisa Gala Masc
  "303": { "10": 15, "12": 30, "14": 20, "16": 15, "18": 10, "28": 10 },                // Pantalón Gris Gala
  "304": { "4": 8, "6": 10, "8": 10, "10": 10, "12": 10, "14": 10, "16": 10, "18": 10, "S": 5, "M": 5 }, // Chompa Azul Masc
  "305": { "4": 40, "6": 60, "8": 60, "10": 60, "12": 40, "14": 50, "16": 30, "18": 20, "XS": 15, "S": 15, "M": 8 }, // Camiseta Blanca Física ★ compartido
  "306": { "4": 20, "6": 40, "8": 50, "10": 50, "12": 50, "14": 30, "16": 20, "S": 10, "M": 10 }, // Sudadera Verde Masc
  "307": { "4": 5, "6": 5, "8": 5 },                             // Delantal Azul Niño
  "309": { "8 A 10": 10, "10 A 12": 8 },                         // Medias Grises Gala x3
  "310": { "12 A 18": 10, "28 A 36": 8 },                        // Correa Negra Gala ★ compartido

  // ── High School Femenino ──────────────────────────────────
  "201": { "XS": 5, "S": 10, "M": 5, "L": 3 },                  // Blusa Gala Dama HS
  "203": { "XS": 15, "S": 15, "M": 10, "L": 5 },                // Camiseta Polo Dama HS
  "205": { "XS": 15, "S": 20, "M": 10, "L": 5, "XL": 2 },       // Camiseta Cuello V Dama HS
  "220": { "S": 8, "M": 8, "L": 8, "XL": 3 },                   // Saco Azul Tejido Unisex HS ★ compartido
  "221": { "S": 10, "M": 15, "L": 10, "XL": 5 },                // Chompa Gris Unisex HS ★ compartido

  // ── High School Masculino ─────────────────────────────────
  "200": { "S": 5, "M": 10, "L": 10, "XL": 5 },                 // Camisa Gala Hombre HS
  "202": { "S": 20, "M": 40, "L": 20, "XL": 5 },                // Camiseta Polo Hombre HS
  "204": { "S": 20, "M": 20, "L": 15, "XL": 5, "2XL": 2 },      // Camiseta Cuello Redondo Hombre HS
  "232": { "XS": 10, "S": 15, "M": 20, "L": 20, "XL": 5 },      // Sudadera Unisex HS
  "209": { "28": 10, "30": 10, "32": 15, "34": 10, "36": 5 },   // Pantalón Azul Gala HS
  "233": { "Única": 12 },                                        // Corbata
  "212": { "10 A 12": 8 },                                       // Medias Azules Gala Hombre HS x3
};

const DRY = process.argv.includes("--dry");

async function main() {
  const totalUnits = Object.values(products).flatMap(p => Object.values(p)).reduce((a, b) => a + b, 0);
  console.log(`\nInventario Cumbres (unificado) → stock/${COLLEGE_ID}`);
  console.log(`  ${Object.keys(products).length} productos · ${totalUnits} unidades (sin doble conteo)\n`);
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
