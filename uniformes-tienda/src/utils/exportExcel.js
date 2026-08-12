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
  const rows = orders.map(o => {
    const itemsTotal = (o.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
    const couponDiscount = o.coupon?.discount || 0;
    const itemsNetTotal = itemsTotal - couponDiscount;
    const totalSinIva = Math.round(itemsNetTotal / 1.19);
    const deliveryType = o.delivery?.type;
    const deliveryCol = deliveryType === "domicilio"
      ? 15000
      : deliveryType === "domicilio_coordinado"
      ? "Contactar al cliente"
      : "—";
    const totalConDomicilio = deliveryType === "domicilio"
      ? itemsNetTotal + 15000
      : itemsNetTotal;

    return {
      "N° Pedido":          o.id,
      "Fecha":              o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-CO") : "—",
      "Estado":             o.status,
      "Institución":        o.collegeName || "—",
      "Acudiente":          o.guardian?.name || "—",
      "Cédula Acudiente":   o.guardian?.document || "—",
      "Teléfono":           o.guardian?.phone || "—",
      "Email":              o.guardian?.email || "—",
      "Dir. Facturación":   o.guardian?.billingAddress || "—",
      "Entrega":            deliveryType === "domicilio"
                              ? "Domicilio"
                              : deliveryType === "domicilio_coordinado"
                              ? `Por coordinar${o.delivery.coordinationNote ? ": " + o.delivery.coordinationNote : ""}`
                              : "Recogida en tienda",
      "Pago":               o.paymentMethod || "—",
      "Prendas":            (o.items || []).map(i => `${i.name} T${i.size} ×${i.qty}`).join(" | "),
      "Domicilio":               deliveryCol,
      "Total sin IVA (prendas)": totalSinIva,
      "Total sin domicilio":     itemsNetTotal,
      "Total con domicilio":     totalConDomicilio,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = rows.length > 0
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.json_to_sheet([{ "N° Pedido": "Sin pedidos" }]);
  ws["!cols"] = [18, 12, 14, 22, 22, 16, 14, 24, 28, 20, 12, 50, 18, 22, 20, 20].map(w => ({ wch: w }));
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
