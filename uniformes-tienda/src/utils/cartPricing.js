// Promos tipo "N unidades por $X", aplicadas sobre el total del carrito
// sin tocar los precios originales del catálogo (colleges.js).
const BUNDLE_PROMOS = {
  10: { qty: 2, price: 140000 }, // Jogger (The New School): 2 joggers = $140.000
};

// Texto de la promo para mostrar en la card del catálogo (o null si no aplica).
export function getBundlePromoLabel(id) {
  const promo = BUNDLE_PROMOS[id];
  if (!promo) return null;
  return `${promo.qty}x $${promo.price.toLocaleString("es-CO")}`;
}

// Suma el total del carrito aplicando promos por combo (bundle) cuando aplique.
export function getCartTotal(cart) {
  const units = {}; // id -> [precios de cada unidad en el carrito]
  let total = 0;

  for (const item of cart) {
    const promo = BUNDLE_PROMOS[item.id];
    if (!promo) { total += item.price * item.qty; continue; }
    if (!units[item.id]) units[item.id] = [];
    for (let i = 0; i < item.qty; i++) units[item.id].push(item.price);
  }

  for (const id in units) {
    const promo = BUNDLE_PROMOS[id];
    const prices = units[id].sort((a, b) => b - a); // agrupa primero las unidades más caras
    let i = 0;
    while (i < prices.length) {
      if (prices.length - i >= promo.qty) {
        total += promo.price;
        i += promo.qty;
      } else {
        total += prices[i];
        i += 1;
      }
    }
  }

  return total;
}
