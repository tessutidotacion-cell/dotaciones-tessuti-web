import * as XLSX from "xlsx";
import { DEMO_COLLEGES } from "../data/colleges";

/**
 * getAllUniforms — aplana secciones o uniforms de un colegio
 */
function getAllUniforms(col) {
  if (col.sections?.length > 0) {
    return col.sections.flatMap(s => s.uniforms.map(u => ({ ...u, _section: s.name })));
  }
  return (col.uniforms || []).map(u => ({ ...u, _section: null }));
}

/**
 * buildStockRows — una fila por prenda+talla
 */
function buildStockRows(stockData) {
  const rows = [];
  for (const col of DEMO_COLLEGES) {
    const colStock = stockData[col.id] || {};
    const uniforms = getAllUniforms(col);
    for (const u of uniforms) {
      const sizeMap = colStock[String(u.id)] || {};
      if (u.sizes?.length > 0) {
        for (const sz of u.sizes) {
          rows.push({
            Colegio:  col.name,
            Sección:  u._section || "—",
            Prenda:   u.name,
            Talla:    sz,
            Stock:    sizeMap[sz] ?? 0,
          });
        }
      } else {
        rows.push({
          Colegio:  col.name,
          Sección:  u._section || "—",
          Prenda:   u.name,
          Talla:    "Sin tallas",
          Stock:    0,
        });
      }
    }
  }
  return rows;
}

/**
 * buildSalesRows — agrupado por colegio+prenda+talla, cuenta unidades y revenue
 * Solo incluye pedidos con status != "cancelado"
 */
function buildSalesRows(orders) {
  const map = {}; // key = "collegeId|productId|size"

  for (const order of orders) {
    if (order.status === "cancelado") continue;
    const collegeId   = order.collegeId   || order.college?.id || "?";
    const collegeName = order.collegeName || order.college?.name || collegeId;

    for (const item of order.items || []) {
      const key = `${collegeId}|${item.id}|${item.size}`;
      if (!map[key]) {
        map[key] = {
          Colegio:   collegeName,
          Prenda:    item.name,
          Talla:     item.size || "—",
          Unidades:  0,
          Ingresos:  0,
        };
      }
      map[key].Unidades += item.qty || 0;
      map[key].Ingresos += (item.price || 0) * (item.qty || 0);
    }
  }

  return Object.values(map).sort((a, b) =>
    a.Colegio.localeCompare(b.Colegio) || a.Prenda.localeCompare(b.Prenda)
  );
}

/**
 * Aplica estilos básicos al encabezado de una hoja
 */
function styleHeader(ws, cols) {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) {
      cell.s = {
        font:    { bold: true, color: { rgb: "FFFFFF" } },
        fill:    { fgColor: { rgb: "1C1C1C" } },
        alignment: { horizontal: "center" },
      };
    }
  }
  ws["!cols"] = cols.map(w => ({ wch: w }));
}

/**
 * exportToExcel — genera y descarga el archivo
 * @param {object} stockData  — { [collegeId]: { [productId]: { [size]: qty } } }
 * @param {Array}  orders     — array de pedidos del admin
 */
export function exportToExcel(stockData, orders) {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Stock ──────────────────────────────────────────
  const stockRows = buildStockRows(stockData);
  const wsStock   = XLSX.utils.json_to_sheet(stockRows);
  styleHeader(wsStock, [28, 18, 28, 10, 10]);
  XLSX.utils.book_append_sheet(wb, wsStock, "Stock");

  // ── Hoja 2: Ventas ─────────────────────────────────────────
  const salesRows = buildSalesRows(orders);
  const wsSales   = salesRows.length > 0
    ? XLSX.utils.json_to_sheet(salesRows)
    : XLSX.utils.json_to_sheet([{ Colegio:"Sin ventas registradas", Prenda:"", Talla:"", Unidades:0, Ingresos:0 }]);
  styleHeader(wsSales, [28, 28, 10, 12, 16]);
  XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");

  // ── Descarga ───────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `tessuti-reporte-${date}.xlsx`);
}
