import {
  LOGO_CUMBRES,
  LOGO_LICEO_FRANCES,
  LOGO_NEW_SCHOOL,
  LOGO_TESSUTI,
} from "../assets";

// ── Loaders de imágenes por colegio (dynamic import → code-split) ──
const imageLoaders = {
  "1": () => import("../assets/newschool.js"),
  "2": () => import("../assets/cumbres.js"),
  "liceo-frances": () => import("../assets/liceofrances.js"),
  "empresarial": () => import("../assets/dotaciones.js"),
};

/**
 * Carga las imágenes de un colegio y las inyecta en sus uniformes.
 * Devuelve el college con las imágenes ya resueltas.
 */
export async function loadCollegeImages(college) {
  const loader = imageLoaders[college.id];
  if (!loader) return college;

  const imgs = await loader();

  if (college.id === "1") {
    return applyNewSchoolImages(college, imgs);
  }
  if (college.id === "2") {
    return applyCumbresImages(college, imgs);
  }
  if (college.id === "liceo-frances") {
    return applyLiceoImages(college, imgs);
  }
  if (college.id === "empresarial") {
    return applyEmpresarialImages(college, imgs);
  }
  return college;
}

function applyNewSchoolImages(college, imgs) {
  const imageMap = {
    1: { image: imgs.imgCamisaPolo, galleryImages: [imgs.imgDalidaPolo] },
    2: { image: imgs.imgCamiseta, galleryImages: [imgs.imgDalilaCamiseta] },
    4: { image: imgs.imgBusoAzul1, hoverImage: imgs.imgBusoAzul2, galleryImages: [imgs.imgDalilaBuso] },
    5: { image: imgs.imgCamibusoBlanco },
    6: { image: imgs.imgSudadera },
    7: { image: imgs.imgBusoUltimasUnidades },
    8: { image: imgs.imgPava },
  };

  return {
    ...college,
    sections: college.sections.map(section => ({
      ...section,
      uniforms: section.uniforms.map(u => ({ ...u, ...(imageMap[u.id] || {}) })),
    })),
  };
}

function applyLiceoImages(college, imgs) {
  const imageMap = {
    500: { image: imgs.imgChaquetaHS1, hoverImage: imgs.imgChaquetaHS2, galleryImages: [imgs.imgChaquetaHS3] },
    501: { image: imgs.imgPoloHS },
    503: { image: imgs.imgPantaloneta },
    504: { image: imgs.imgJogger },
    505: { image: imgs.imgCamisetaUnisex1, hoverImage: imgs.imgCamisetaUnisex2 },
    506: { image: imgs.imgSudHS1, hoverImage: imgs.imgSudHS2 },
    508: { image: imgs.imgBataLab },
    512: { image: imgs.imgChaquetaPrim1, hoverImage: imgs.imgChaquetaPrim2, galleryImages: [imgs.imgChaquetaPrim3] },
    511: { image: imgs.imgPoloPrim1, hoverImage: imgs.imgPoloPrim2 },
    514: { image: imgs.imgDelantal },
    515: { image: imgs.imgChalecoPrim1, hoverImage: imgs.imgChalecoPrim2 },
    516: { image: imgs.imgSud1, hoverImage: imgs.imgSud2 },
  };

  return {
    ...college,
    sections: college.sections.map(section => ({
      ...section,
      uniforms: section.uniforms.map(u => ({ ...u, ...(imageMap[u.id] || {}) })),
    })),
  };
}

function applyCumbresImages(college, imgs) {
  const imageMap = {
    // Bambolino
    100: { image: imgs.imgCamisetaBambolino },
    101: { image: imgs.imgChompaBambolino1 },
    102: { image: imgs.imgSudaderaBambolino },
    103: { image: imgs.imgDelantalBambolino },
    104: { image: imgs.imgPavaBambolino },
    105: { image: imgs.imgGorraBambolino },
    106: { image: imgs.imgMediasBlancasFisica },
    // Cumbres Femenino
    401: { image: imgs.imgBlusaGalaFem },
    402: { image: imgs.imgJumper },
    403: { image: imgs.imgChaletoDama },
    404: { image: imgs.imgChompaBlancaFem2 },
    405: { image: imgs.imgPoloCumbres },
    406: { image: imgs.imgSudaderaAzulFem },
    407: { image: imgs.imgDelantalVerdeFem },
    408: { image: imgs.imgFaldaCuadros },
    410: { image: imgs.imgMediasCumbres },
    // Cumbres Masculino
    301: { image: imgs.imgSacoTejidoV },
    302: { image: imgs.imgCamisaGalaMasc1, hoverImage: imgs.imgCamisaGalaMasc2 },
    303: { image: imgs.imgCamisaGalaMasc2 },
    304: { image: imgs.imgChompaAzulMasc },
    305: { image: imgs.imgCamisetaFisicaMasc1 },
    306: { image: imgs.imgSudaderaVerdeMasc },
    307: { image: imgs.imgDelantalAzulNino },
    // High School Femenino
    201: { image: imgs.imgBlusaGalaHS },
    203: { image: imgs.imgPoloDamaHS },
    205: { image: imgs.imgCuelloVDamaHS },
    220: { image: imgs.imgSacoTejidoHS },
    221: { image: imgs.imgChompaGrisHS2, hoverImage: imgs.imgChompaGrisHS1 },
    // High School Masculino
    200: { image: imgs.imgCamisaGalaHombreHS },
    209: { image: imgs.imgCamisaGalaHombreHS },
    232: { image: imgs.imgSudaderaHS },
    233: { image: imgs.imgCorbata },
    309: { image: imgs.imgMediasGrises },
    310: { image: imgs.imgCorrea },
  };

  return {
    ...college,
    sections: college.sections.map(section => ({
      ...section,
      uniforms: section.uniforms.map(u => ({ ...u, ...(imageMap[u.id] || {}) })),
    })),
  };
}

function applyEmpresarialImages(college, imgs) {
  const imageMap = {
    900: { image: imgs.imgCamisaOxford },
    901: { image: imgs.imgCamisaCaqui },
    902: { image: imgs.imgJeanDrill },
  };

  return {
    ...college,
    uniforms: college.uniforms.map(u => ({ ...u, ...imageMap[u.id] })),
  };
}

export const DEMO_COLLEGES = [
  {
    id: "1",
    name: "The New School",
    logo: LOGO_NEW_SCHOOL,
    primaryColor: "#4a2510",
    accentColor: "#8a4a28",
    description: "Educación en consciencia y bilingüe",
    sections: [
      {
        id: "ns-catalogo",
        name: "Catálogo",
        uniforms: [
          {
            id: 1,
            name: "Camisa Polo",
            price: 65000,
            sizes: ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M"],
            category: "Diario",
            description: "Kinder a Primero",
          },
          {
            id: 2,
            name: "Camiseta Consciencia",
            price: 52000,
            sizes: ["2-4", "6-8", "10-12", "14-16", "S", "M", "L", "XL"],
            category: "Deportivo",
            description: "Primaria",
          },
          {
            id: 4,
            name: "Buso Cierre",
            price: 92000,
            sizes: ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L"],
            category: "Deportivo",
            description: "Primaria",
          },
          {
            id: 5,
            name: "Camibuso Blanco",
            price: 42000,
            sizes: ["2-4", "6-8", "10"],
            category: "Diario",
            description: "Primaria",
          },
          {
            id: 6,
            name: "Sudadera",
            price: 76000,
            sizePrices: { "2":76000, "4":76000, "6":76000, "8":76000, "10":76000, "12":76000, "14":80000, "16":80000, "S":80000, "M":80000, "L":80000, "XL":80000 },
            sizes: ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
            category: "Deportivo",
            description: "Talla 2–12: $76.000 · Talla 14–XL: $80.000",
          },
          {
            id: 8,
            name: "Pava",
            price: 56000,
            sizes: ["Única"],
            category: "Complemento",
          },
          {
            id: 9,
            name: "Delantal",
            price: 0,
            sizes: ["Única"],
            category: "Complemento",
          },
        ],
      },
      {
        id: "ns-descuentos",
        name: "Descuentos",
        uniforms: [
          {
            id: 7,
            name: "Buso Gris",
            price: 75000,
            sizes: ["4", "6", "8", "10", "12", "14", "16", "S", "M", "L"],
            category: "Diario",
            description: "Primaria",
            hideWhenEmpty: true,
          },
          {
            id: 10,
            name: "Jogger",
            price: 77000,
            sizePrices: { "2":77000, "4":77000, "6":77000, "8":77000, "10":77000, "12":82000, "14":82000, "16":82000, "S":82000, "M":82000, "L":82000, "XL":82000 },
            sizes: ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
            category: "Deportivo",
            description: "Talla 2–10: $77.000 · Talla 12–XL: $82.000",
            hideWhenEmpty: true,
          },
        ],
      },
    ],
    uniforms: [],
  },
  {
    id: "2",
    disabled: false,
    name: "Colegio Cumbres Medellín",
    logo: LOGO_CUMBRES,
    primaryColor: "#1a3a5c",
    accentColor: "#2d5f8a",
    description: "Formando líderes del futuro",
    sections: [
      {
        id: "bambolino",
        name: "Bambolino",
        uniforms: [
          { id: 100, name: "Camiseta Bambolino", price: 40900, sizePrices: { "0": 40900, "2": 40900, "4": 44900, "6": 44900 }, sizes: ["0", "2", "4", "6"], category: "Diario", description: "Talla 0–2: $40.900 · Talla 4–6: $44.900" },
          { id: 101, name: "Chompa Bambolino", price: 60900, sizePrices: { "2": 60900, "4": 64900, "6": 64900, "8": 64900 }, sizes: ["2", "4", "6", "8"], category: "Diario", description: "Talla 2: $60.900 · Talla 4–8: $64.900" },
          { id: 102, name: "Sudadera Bambolino", price: 60900, sizePrices: { "0": 60900, "2": 60900, "4": 64900, "6": 64900 }, sizes: ["0", "2", "4", "6"], category: "Deportivo", description: "Talla 0–2: $60.900 · Talla 4–6: $64.900" },
          { id: 103, name: "Delantal Bambolino", price: 60900, sizePrices: { "2": 60900, "4": 64900, "6": 64900 }, sizes: ["2", "4", "6"], category: "Diario", description: "Talla 2: $60.900 · Talla 4–6: $64.900" },
          { id: 104, name: "Pava Niña Bambolino", price: 56900, sizes: ["Única"], category: "Complemento" },
          { id: 105, name: "Gorra Niño Bambolino", price: 56900, sizes: ["Única"], category: "Complemento" },
          { id: 106, name: "Medias Blancas Física Paquete por 2 Pares", price: 22000, sizePrices: { "2 A 4": 22000, "4 A 6": 23000, "6 A 8": 24000, "8 A 10": 25000, "10 A 12": 26000 }, sizes: ["2 A 4", "4 A 6", "6 A 8", "8 A 10", "10 A 12"], category: "Complemento", description: "Precio según talla" },
        ],
      },
      {
        id: "cumbres-femenino",
        name: "Primaria Femenino",
        uniforms: [
          { id: 301, name: "Saco Tejido Azul Cuello V", price: 129900, sizePrices: { "12": 129900, "14": 129900, "16": 129900, "S": 134900 }, sizes: ["12", "14", "16", "S"], category: "Gala", description: "Talla 12–16: $129.900 · Talla S: $134.900" },
          { id: 401, name: "Blusa Gala Femenino", price: 34900, sizePrices: { "8": 34900, "10": 34900, "12": 34900, "14": 34900, "16": 34900, "XS": 37900, "S": 37900 }, sizes: ["8", "10", "12", "14", "16", "XS", "S"], category: "Gala", description: "Talla 8–16: $34.900 · Talla XS–S: $37.900" },
          { id: 402, name: "Jumper", price: 126900, sizes: ["10", "12", "14"], category: "Gala" },
          { id: 403, name: "Chaleco Dama", price: 114900, sizePrices: { "12": 114900, "14": 114900, "16": 114900, "XS": 119900, "S": 119900 }, sizes: ["12", "14", "16", "XS", "S"], category: "Gala", description: "Talla 12–16: $114.900 · Talla XS–S: $119.900" },
          { id: 404, name: "Chompa Blanca Femenino", price: 73900, sizePrices: { "4": 73900, "6": 73900, "8": 73900, "10": 73900, "12": 78900, "14": 78900, "16": 78900, "18": 78900 }, sizes: ["4", "6", "8", "10", "12", "14", "16", "18"], category: "Diario", description: "Talla 4–10: $73.900 · Talla 12–18: $78.900" },
          { id: 405, name: "Camiseta Blanca Física", price: 47900, sizePrices: { "4": 47900, "6": 47900, "8": 47900, "10": 47900, "12": 51900, "14": 51900, "16": 51900, "18": 51900, "XS": 55900, "S": 55900, "M": 55900 }, sizes: ["4", "6", "8", "10", "12", "14", "16", "18", "XS", "S", "M"], category: "Deportivo", description: "Talla 4–10: $47.900 · Talla 12–18: $51.900 · Talla XS–M: $55.900" },
          { id: 406, name: "Sudadera Azul Física Femenino", price: 64900, sizePrices: { "4": 64900, "6": 64900, "8": 64900, "10": 64900, "12": 69900, "14": 69900, "16": 69900, "S": 74900 }, sizes: ["4", "6", "8", "10", "12", "14", "16", "S"], category: "Deportivo", description: "Talla 4–10: $64.900 · Talla 12–16: $69.900 · Talla S: $74.900" },
          { id: 407, name: "Delantal Verde Niña K4 – K5", price: 45900, sizes: ["4", "6", "8"], category: "Complemento" },
          { id: 408, name: "Falda Bachillerato y High School", price: 116900, sizePrices: { "10": 116900, "12": 116900, "14": 116900, "16": 116900, "XS": 125900, "S": 125900, "M": 125900 }, sizes: ["10", "12", "14", "16", "XS", "S", "M"], category: "Gala", description: "Talla 10–16: $116.900 · Talla XS–M: $125.900" },
          { id: 106, name: "Medias Blancas Física Paquete por 2 Pares", price: 22000, sizePrices: { "2 A 4": 22000, "4 A 6": 23000, "6 A 8": 24000, "8 A 10": 25000, "10 A 12": 26000 }, sizes: ["2 A 4", "4 A 6", "6 A 8", "8 A 10", "10 A 12"], category: "Complemento", description: "Precio según talla" },
          { id: 410, name: "Medias Blancas Gala Dama Paquete por 3 Pares", price: 46000, sizePrices: { "8 A 10": 46000, "9 A 11": 48000 }, sizes: ["8 A 10", "9 A 11"], category: "Complemento", description: "Talla 8–10: $46.000 · Talla 9–11: $48.000" },
        ],
      },
      {
        id: "cumbres-masculino",
        name: "Primaria Masculino",
        uniforms: [
          { id: 301, name: "Saco Tejido Azul Cuello V", price: 129900, sizePrices: { "12": 129900, "14": 129900, "16": 129900, "S": 134900 }, sizes: ["12", "14", "16", "S"], category: "Gala", description: "Talla 12–16: $129.900 · Talla S: $134.900" },
          { id: 302, name: "Camisa Gala Masculino", price: 62900, sizePrices: { "8": 62900, "10": 62900, "12": 62900, "14": 62900, "16": 62900, "18": 62900, "XS": 66900, "S": 66900, "M": 66900 }, sizes: ["8", "10", "12", "14", "16", "18", "XS", "S", "M"], category: "Gala", description: "Talla 8–18: $62.900 · Talla XS–M: $66.900" },
          { id: 303, name: "Pantalón Gris Gala", price: 86900, sizePrices: { "10": 86900, "12": 86900, "14": 86900, "16": 86900, "18": 86900, "28": 94900 }, sizes: ["10", "12", "14", "16", "18", "28"], category: "Gala", description: "Talla 10–18: $86.900 · Talla 28: $94.900" },
          { id: 304, name: "Chompa Azul Masculino", price: 73900, sizePrices: { "4": 73900, "6": 73900, "8": 73900, "10": 73900, "12": 78900, "14": 78900, "16": 78900, "18": 78900, "S": 86900, "M": 86900 }, sizes: ["4", "6", "8", "10", "12", "14", "16", "18", "S", "M"], category: "Diario", description: "Talla 4–10: $73.900 · Talla 12–18: $78.900 · Talla S–M: $86.900" },
          { id: 305, name: "Camiseta Blanca Física", price: 47900, sizePrices: { "4": 47900, "6": 47900, "8": 47900, "10": 47900, "12": 51900, "14": 51900, "16": 51900, "18": 51900, "XS": 55900, "S": 55900, "M": 55900 }, sizes: ["4", "6", "8", "10", "12", "14", "16", "18", "XS", "S", "M"], category: "Deportivo", description: "Talla 4–10: $47.900 · Talla 12–18: $51.900 · Talla XS–M: $55.900" },
          { id: 306, name: "Sudadera Verde Física Masculino", price: 64900, sizePrices: { "4": 64900, "6": 64900, "8": 64900, "10": 64900, "12": 69900, "14": 69900, "16": 69900, "S": 74900, "M": 74900 }, sizes: ["4", "6", "8", "10", "12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 4–10: $64.900 · Talla 12–16: $69.900 · Talla S–M: $74.900" },
          { id: 307, name: "Delantal Azul Niño K4 – K5", price: 45900, sizes: ["4", "6", "8"], category: "Complemento" },
          { id: 106, name: "Medias Blancas Física Paquete por 2 Pares", price: 22000, sizePrices: { "2 A 4": 22000, "4 A 6": 23000, "6 A 8": 24000, "8 A 10": 25000, "10 A 12": 26000 }, sizes: ["2 A 4", "4 A 6", "6 A 8", "8 A 10", "10 A 12"], category: "Complemento", description: "Precio según talla" },
          { id: 309, name: "Medias Grises Gala Paquete por 3 Pares", price: 38000, sizePrices: { "8 A 10": 38000, "10 A 12": 39000 }, sizes: ["8 A 10", "10 A 12"], category: "Complemento", description: "Talla 8–10: $38.000 · Talla 10–12: $39.000" },
          { id: 310, name: "Correa Negra Gala", price: 48900, sizePrices: { "12 A 18": 48900, "28 A 36": 52900 }, sizes: ["12 A 18", "28 A 36"], category: "Complemento", description: "Talla 12–18: $48.900 · Talla 28–36: $52.900" },
        ],
      },
      {
        id: "hs-femenino",
        name: "High School Femenino",
        uniforms: [
          { id: 201, name: "Blusa Gala Dama High School", price: 75900, sizes: ["XS", "S", "M", "L"], category: "Gala" },
          { id: 203, name: "Camiseta Polo Dama High School", price: 79900, sizePrices: { "XS": 79900, "S": 79900, "M": 79900, "L": 84900 }, sizes: ["XS", "S", "M", "L"], category: "Diario", description: "Talla XS–M: $79.900 · Talla L: $84.900" },
          { id: 205, name: "Camiseta Cuello V Dama High School", price: 69900, sizePrices: { "XS": 69900, "S": 69900, "M": 69900, "L": 69900, "XL": 74900 }, sizes: ["XS", "S", "M", "L", "XL"], category: "Deportivo", description: "Talla XS–L: $69.900 · Talla XL: $74.900" },
          { id: 220, name: "Saco Azul Tejido Unisex High School", price: 134900, sizePrices: { "S": 134900, "M": 134900, "L": 134900, "XL": 139900 }, sizes: ["S", "M", "L", "XL"], category: "Gala", description: "Talla S–L: $134.900 · Talla XL: $139.900" },
          { id: 221, name: "Chompa Gris Unisex High School", price: 119900, sizePrices: { "S": 119900, "M": 119900, "L": 119900, "XL": 124900 }, sizes: ["S", "M", "L", "XL"], category: "Deportivo", description: "Talla S–L: $119.900 · Talla XL: $124.900" },
          { id: 408, name: "Falda Bachillerato y High School", price: 116900, sizePrices: { "10": 116900, "12": 116900, "14": 116900, "16": 116900, "XS": 125900, "S": 125900, "M": 125900 }, sizes: ["10", "12", "14", "16", "XS", "S", "M"], category: "Gala", description: "Talla 10–16: $116.900 · Talla XS–M: $125.900" },
          { id: 410, name: "Medias Blancas Gala Dama Paquete por 3 Pares", price: 46000, sizePrices: { "8 A 10": 46000, "9 A 11": 48000 }, sizes: ["8 A 10", "9 A 11"], category: "Complemento", description: "Talla 8–10: $46.000 · Talla 9–11: $48.000" },
          { id: 106, name: "Medias Blancas Física Paquete por 2 Pares", price: 22000, sizePrices: { "2 A 4": 22000, "4 A 6": 23000, "6 A 8": 24000, "8 A 10": 25000, "10 A 12": 26000 }, sizes: ["2 A 4", "4 A 6", "6 A 8", "8 A 10", "10 A 12"], category: "Complemento", description: "Precio según talla" },
        ],
      },
      {
        id: "hs-masculino",
        name: "High School Masculino",
        uniforms: [
          { id: 200, name: "Camisa Gala Hombre High School", price: 86900, sizePrices: { "S": 86900, "M": 86900, "L": 86900, "XL": 91900 }, sizes: ["S", "M", "L", "XL"], category: "Gala", description: "Talla S–L: $86.900 · Talla XL: $91.900" },
          { id: 202, name: "Camiseta Polo Hombre High School", price: 79900, sizePrices: { "S": 79900, "M": 79900, "L": 79900, "XL": 84900 }, sizes: ["S", "M", "L", "XL"], category: "Diario", description: "Talla S–L: $79.900 · Talla XL: $84.900" },
          { id: 204, name: "Camiseta Cuello Redondo Hombre High School", price: 69900, sizePrices: { "S": 69900, "M": 69900, "L": 69900, "XL": 69900, "2XL": 74900 }, sizes: ["S", "M", "L", "XL", "2XL"], category: "Deportivo", description: "Talla S–XL: $69.900 · Talla 2XL: $74.900" },
          { id: 220, name: "Saco Azul Tejido Unisex High School", price: 134900, sizePrices: { "S": 134900, "M": 134900, "L": 134900, "XL": 139900 }, sizes: ["S", "M", "L", "XL"], category: "Gala", description: "Talla S–L: $134.900 · Talla XL: $139.900" },
          { id: 221, name: "Chompa Gris Unisex High School", price: 119900, sizePrices: { "S": 119900, "M": 119900, "L": 119900, "XL": 124900 }, sizes: ["S", "M", "L", "XL"], category: "Deportivo", description: "Talla S–L: $119.900 · Talla XL: $124.900" },
          { id: 232, name: "Sudadera Unisex High School", price: 94900, sizePrices: { "XS": 94900, "S": 94900, "M": 94900, "L": 94900, "XL": 99900 }, sizes: ["XS", "S", "M", "L", "XL"], category: "Deportivo", description: "Talla XS–L: $94.900 · Talla XL: $99.900" },
          { id: 209, name: "Pantalón Azul Gala High School", price: 126900, sizePrices: { "28": 126900, "30": 126900, "32": 126900, "34": 126900, "36": 131900 }, sizes: ["28", "30", "32", "34", "36"], category: "Gala", description: "Talla 28–34: $126.900 · Talla 36: $131.900" },
          { id: 233, name: "Corbata Bachillerato y High School", price: 49900, sizes: ["Única"], category: "Complemento" },
          { id: 212, name: "Medias Azules Gala Hombre High School Paquete por 3 Pares", price: 39000, sizes: ["10 A 12"], category: "Complemento" },
          { id: 106, name: "Medias Blancas Física Paquete por 2 Pares", price: 22000, sizePrices: { "2 A 4": 22000, "4 A 6": 23000, "6 A 8": 24000, "8 A 10": 25000, "10 A 12": 26000 }, sizes: ["2 A 4", "4 A 6", "6 A 8", "8 A 10", "10 A 12"], category: "Complemento", description: "Precio según talla" },
          { id: 310, name: "Correa Negra Gala", price: 48900, sizePrices: { "12 A 18": 48900, "28 A 36": 52900 }, sizes: ["12 A 18", "28 A 36"], category: "Complemento", description: "Talla 12–18: $48.900 · Talla 28–36: $52.900" },
        ],
      },
    ],
    uniforms: [],
  },
  {
    id: "liceo-frances",
    name: "Liceo Francés",
    logo: LOGO_LICEO_FRANCES,
    primaryColor: "#c0152a",
    accentColor: "#e01f38",
    description: "",
    sections: [
      {
        id: "lf-kids",
        name: "Primaria",
        uniforms: [
          { id: 511, name: "Camiseta Polo Diario", price: 70000, sizes: ["4", "6", "8", "10", "12"], stock: { "4": 64, "6": 60, "8": 22, "10": 25, "12": 5 }, category: "Diario" },
          { id: 515, name: "Chaleco Negro", price: 73000, sizes: ["4", "6", "8", "10", "12", "14"], stock: { "4": 15, "6": 8, "8": 10, "10": 3, "12": 0, "14": 1 }, category: "Diario" },
          { id: 514, name: "Delantal", price: 70000, sizes: ["4", "6", "8"], stock: { "4": 14, "6": 20, "8": 16 }, category: "Complemento" },
          { id: 516, name: "Sudadera", price: 73000, sizes: ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M"], stock: { "2": 10, "4": 35, "6": 33, "8": 33, "10": 17, "12": 41, "14": 17, "16": 10, "S": 33, "M": 28 }, category: "Deportivo" },
          { id: 512, name: "Chaqueta", price: 0, sizes: ["4", "6", "8", "10", "12", "14", "16", "S", "M"], stock: { "4": 34, "6": 26, "8": 26, "10": 12, "12": 0, "14": 29, "16": 10, "S": 0, "M": 0 }, category: "Diario" },
        ],
      },
      {
        id: "lf-uniforme",
        name: "Bachillerato",
        uniforms: [
          { id: 500, name: "Chaqueta", price: 130000, sizes: ["12", "14", "16", "S", "M", "L"], stock: { "12": 14, "14": 17, "16": 8, "S": 13, "M": 10, "L": 5 }, category: "Diario", description: "Nuevo diseño, forrada en su interior con capucha" },
          { id: 501, name: "Camisa Polo", price: 70000, sizes: ["12", "14", "16", "S", "M"], stock: { "12": 5, "14": 42, "16": 29, "S": 43, "M": 40 }, category: "Diario", description: "Talla 16-M: $77.000" },
          { id: 505, name: "Camiseta Unisex", price: 65000, sizes: ["12", "14", "16", "S", "M", "L"], stock: { "12": 20, "14": 82, "16": 108, "S": 27, "M": 22, "L": 5 }, category: "Deportivo", description: "Talla 16-M: $70.000" },
          { id: 506, name: "Sudadera Diario", price: 81500, sizes: ["12", "14", "16", "S", "M"], stock: { "12": 14, "14": 26, "16": 58, "S": 27, "M": 27 }, category: "Diario", description: "Pantalón sudadera diario" },
          { id: 504, name: "Jogger Unisex", price: 70000, sizes: ["12", "14", "16", "S", "M"], stock: { "12": 0, "14": 75, "16": 110, "S": 22, "M": 0 }, category: "Deportivo", description: "Talla 16-M: $75.000" },
          { id: 503, name: "Pantaloneta Niño", price: 65000, sizes: ["12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 16-M: $68.000" },
          { id: 507, name: "Short Niña", price: 65000, sizes: ["12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 16-M: $68.000" },
          { id: 508, name: "Bata de Laboratorio", price: 0, sizes: ["Única"], stock: { "Única": 51 }, category: "Complemento" },
        ],
      },
    ],
    uniforms: [],
  },
];

export const EMPRESARIAL_CATALOG = {
  id: "empresarial",
  name: "Dotación Empresarial",
  logo: LOGO_TESSUTI,
  primaryColor: "#1c1c1c",
  accentColor: "#b89a6a",
  description: "Dotaciones corporativas de alta calidad",
  uniforms: [
    { id: 900, name: "Camisa Oxford Manga Larga", price: 0, sizes: ["S", "M", "L", "XL", "XXL"], category: "Camisas" },
    { id: 901, name: "Camisa Dril Caqui", price: 0, sizes: ["S", "M", "L", "XL", "XXL"], category: "Camisas" },
    { id: 902, name: "Jean 14 Onz", price: 0, sizes: ["28", "30", "32", "34", "36", "38"], category: "Pantalones" },
  ],
};
