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

export function exportOrdersToExcel(orders) {
  const rows = orders.map(o => ({
    "N° Pedido":      o.id,
    "Fecha":          o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-CO") : "—",
    "Estado":         o.status,
    "Institución":    o.collegeName || "—",
    "Estudiante":     o.student?.name || "—",
    "Grado":          o.student?.grade || "—",
    "Documento":      o.student?.document || "—",
    "Acudiente":      o.guardian?.name || "—",
    "Teléfono":       o.guardian?.phone || "—",
    "Email":          o.guardian?.email || "—",
    "Entrega":        o.delivery?.type === "domicilio"
                        ? `Domicilio: ${o.delivery.address?.street || ""}, ${o.delivery.address?.neighborhood || ""}`
                        : o.delivery?.type === "domicilio_coordinado"
                        ? `Por coordinar${o.delivery.coordinationNote ? ": " + o.delivery.coordinationNote : ""}`
                        : "Recogida en tienda",
    "Pago":           o.paymentMethod || "—",
    "Trans. Wompi":   o.wompiTransactionId || "—",
    "Prendas":        (o.items || []).map(i => `${i.name} T${i.size} ×${i.qty}`).join(" | "),
    "Total":          o.total || 0,
  }));

  const wb = XLSX.utils.book_new();
  const ws = rows.length > 0
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.json_to_sheet([{ "N° Pedido": "Sin pedidos" }]);
  ws["!cols"] = [18, 12, 14, 22, 22, 8, 14, 22, 14, 24, 36, 12, 18, 50, 14].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `tessuti-pedidos-${date}.xlsx`);
}

export function exportToExcel(stockData, orders) {
  const wb = XLSX.utils.book_new();

  const stockRows = buildStockRows(stockData);
  const wsStock   = XLSX.utils.json_to_sheet(stockRows);
  wsStock["!cols"] = [28, 18, 28, 10, 10].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsStock, "Stock");

  const salesRows = buildSalesRows(orders);
  const wsSales   = salesRows.length > 0
    ? XLSX.utils.json_to_sheet(salesRows)
    : XLSX.utils.json_to_sheet([{ Colegio:"Sin ventas registradas", Prenda:"", Talla:"", Unidades:0, Ingresos:0 }]);
  wsSales["!cols"] = [28, 28, 10, 12, 16].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `tessuti-reporte-${date}.xlsx`);
}
