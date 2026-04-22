import {
  LOGO_CUMBRES,
  LOGO_LICEO_FRANCES,
  LOGO_NEW_SCHOOL,
  LOGO_TESSUTI,
} from "../assets";

// ── Loaders de imágenes por colegio (dynamic import → code-split) ──
const imageLoaders = {
  "1": () => import("../assets/newschool.js"),
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
    1: { image: imgs.imgCamisaPolo, hoverImage: imgs.imgCamisaPoloNS },
    2: { image: imgs.imgConsciencia, hoverImage: imgs.imgConcienciaPrimNS },
    4: { image: imgs.imgBusoCierre, hoverImage: imgs.imgBusoKidsNS, galleryImages: [imgs.imgBusoRevesKidsNS] },
    5: { image: imgs.imgCamibusoBlanco },
    6: { image: imgs.imgSudadera, hoverImage: imgs.imgSudaderaModelo },
    7: { image: imgs.imgBusoGris },
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
    500: { image: imgs.imgBusoFondoLF, hoverImage: imgs.imgBusoLF, galleryImages: [imgs.imgBusoRevesLF] },
    501: { image: imgs.imgCamisaPoloLF, hoverImage: imgs.imgCamisaPoloModeloLF },
    503: { image: imgs.imgPantalonetaLF },
    504: { image: imgs.imgJoggerLF },
    505: { image: imgs.imgCamisetaDeportivaLF },
    506: { image: imgs.imgSudaderaLF },
    510: { image: imgs.imgBusoKidsJpgLF, hoverImage: imgs.imgBusoKidsLF },
    511: { image: imgs.imgCamisaPoloLF, hoverImage: imgs.imgCamisetaPoloKidsLF },
    514: { image: imgs.imgChalecoKidsLF, hoverImage: imgs.imgDelantalKidsLF },
    515: { image: imgs.imgChalecoNegroKidsLF, hoverImage: imgs.imgChalecoKidsModeloLF },
    516: { image: imgs.imgSudaderaKidsLF, hoverImage: imgs.imgPantalonKidsLF },
  };

  return {
    ...college,
    sections: college.sections.map(section => ({
      ...section,
      uniforms: section.uniforms.map(u => ({ ...u, ...imageMap[u.id] })),
    })),
  };
}

function applyEmpresarialImages(college, imgs) {
  const imageMap = {
    900: { image: imgs.imgCamisaOxford },
    901: { image: imgs.imgCamisaDril },
    902: { image: imgs.imgJeanFrente, hoverImage: imgs.imgJeanReves },
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
            price: 60000,
            sizes: ["4", "6", "8", "10", "12"],
            category: "Diario",
            description: "Kinder a Primero",
          },
          {
            id: 2,
            name: "Camiseta Consciencia",
            price: 47000,
            sizes: ["4", "6", "8", "10", "12"],
            category: "Deportivo",
            description: "Primaria",
          },
          {
            id: 4,
            name: "Buso Cierre",
            price: 85000,
            sizes: ["2", "4", "6", "8", "10", "12"],
            category: "Deportivo",
            description: "Primaria",
          },
          {
            id: 5,
            name: "Camibuso Blanco",
            price: 40000,
            sizes: ["4", "6", "8", "10", "12"],
            category: "Diario",
            description: "Primaria",
          },
          {
            id: 6,
            name: "Sudadera",
            price: 73000,
            sizePrices: { "2":73000, "4":73000, "6":73000, "8":73000, "10":73000, "12":73000, "14":77000, "XS":77000, "S":77000, "M":77000, "L":77000, "XL":77000 },
            sizes: ["2", "4", "6", "8", "10", "12", "14", "XS", "S", "M", "L", "XL"],
            category: "Deportivo",
            description: "Talla 2–12: $73.000 · Talla 14–XL: $77.000",
          },
          {
            id: 8,
            name: "Pava",
            price: 0,
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
            price: 70000,
            sizes: ["4", "6", "8", "10", "12"],
            category: "Diario",
            description: "Primaria",
            hideWhenEmpty: true,
          },
          {
            id: 10,
            name: "Jogger",
            price: 0,
            sizes: ["4", "6", "8", "10", "12"],
            category: "Deportivo",
            hideWhenEmpty: true,
          },
        ],
      },
    ],
    uniforms: [],
  },
  {
    id: "2",
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
          { id: 100, name: "Camiseta Bambolino", price: 39900, sizes: [], category: "Diario" },
          { id: 101, name: "Chompa Bambolino", price: 59900, sizes: [], category: "Diario" },
          { id: 102, name: "Sudadera Bambolino", price: 59900, sizes: [], category: "Deportivo" },
          { id: 103, name: "Delantal Bambolino", price: 59900, sizes: [], category: "Diario" },
          { id: 104, name: "Pava Niña Bambolino", price: 54900, sizes: ["Única"], category: "Complemento" },
          { id: 105, name: "Gorra Niño Bambolino", price: 54900, sizes: ["Única"], category: "Complemento" },
          { id: 106, name: "Medias Blancas Física Paquete por 2 Pares", price: 21000, sizes: [], category: "Complemento" },
        ],
      },
      {
        id: "cumbres-femenino",
        name: "Cumbres Femenino",
        uniforms: [
          { id: 400, name: "Saco Tejido Azul Cuello V", price: 119900, sizes: [], category: "Gala" },
          { id: 401, name: "Blusa Gala Femenino", price: 82900, sizes: [], category: "Gala" },
          { id: 402, name: "Jumper", price: 124900, sizes: [], category: "Gala" },
          { id: 403, name: "Chaleco Dama", price: 109900, sizes: [], category: "Gala" },
          { id: 404, name: "Chompa Blanca Femenino", price: 89900, sizes: [], category: "Diario" },
          { id: 405, name: "Camiseta Blanca Física", price: 45900, sizes: [], category: "Deportivo" },
          { id: 406, name: "Sudadera Azul Física Femenino", price: 69900, sizes: [], category: "Deportivo" },
          { id: 407, name: "Delantal Verde Niña K4 – K5", price: 44900, sizes: ["Única"], category: "Complemento" },
          { id: 408, name: "Falda Bachillerato y High School", price: 114900, sizes: [], category: "Gala" },
          { id: 409, name: "Medias Blancas Física Paquete por 2 Pares", price: 21000, sizes: [], category: "Complemento" },
          { id: 410, name: "Medias Blancas Gala Dama Paquete por 3 Pares", price: 45000, sizes: [], category: "Complemento" },
        ],
      },
      {
        id: "cumbres-masculino",
        name: "Cumbres Masculino",
        uniforms: [
          { id: 300, name: "Corbata Bachillerato y High School", price: 49900, sizes: ["Única"], category: "Gala" },
          { id: 301, name: "Saco Tejido Azul Cuello V", price: 119900, sizes: [], category: "Gala" },
          { id: 302, name: "Camisa Gala Masculino", price: 59900, sizes: [], category: "Gala" },
          { id: 303, name: "Pantalón Gris Gala", price: 84900, sizes: [], category: "Gala" },
          { id: 304, name: "Chompa Azul Masculino", price: 89900, sizes: [], category: "Diario" },
          { id: 305, name: "Camiseta Blanca Física", price: 45900, sizes: [], category: "Deportivo" },
          { id: 306, name: "Sudadera Verde Física Masculino", price: 69900, sizes: [], category: "Deportivo" },
          { id: 307, name: "Delantal Azul Niño K4 – K5", price: 44900, sizes: ["Única"], category: "Complemento" },
          { id: 308, name: "Medias Blancas Física Paquete por 2 Pares", price: 21000, sizes: [], category: "Complemento" },
          { id: 309, name: "Medias Grises Gala Paquete por 3 Pares", price: 37000, sizes: [], category: "Complemento" },
          { id: 310, name: "Correa Negra Gala", price: 48900, sizes: [], category: "Complemento" },
        ],
      },
      {
        id: "hs-femenino",
        name: "High School Femenino",
        uniforms: [
          { id: 201, name: "Blusa Gala Dama High School", price: 74900, sizes: [], category: "Gala" },
          { id: 203, name: "Camiseta Polo Dama High School", price: 74900, sizes: [], category: "Diario" },
          { id: 205, name: "Camiseta Cuello V Dama High School", price: 64900, sizes: [], category: "Deportivo" },
          { id: 220, name: "Saco Azul Tejido Unisex High School", price: 129900, sizes: [], category: "Gala" },
          { id: 221, name: "Chompa Gris Unisex High School", price: 114900, sizes: [], category: "Deportivo" },
          { id: 222, name: "Sudadera Unisex High School", price: 89900, sizes: [], category: "Deportivo" },
          { id: 210, name: "Falda Bachillerato y High School", price: 114900, sizes: [], category: "Gala" },
          { id: 223, name: "Corbata Bachillerato y High School", price: 49900, sizes: ["Única"], category: "Complemento" },
          { id: 214, name: "Medias Blancas Gala Dama Paquete por 3 Pares", price: 45000, sizes: [], category: "Complemento" },
          { id: 224, name: "Medias Blancas Física Paquete por 2 Pares", price: 21000, sizes: [], category: "Complemento" },
          { id: 225, name: "Correa Negra Gala", price: 48900, sizes: [], category: "Complemento" },
        ],
      },
      {
        id: "hs-masculino",
        name: "High School Masculino",
        uniforms: [
          { id: 200, name: "Camisa Gala Hombre High School", price: 84900, sizes: [], category: "Gala" },
          { id: 202, name: "Camiseta Polo Hombre High School", price: 74900, sizes: [], category: "Diario" },
          { id: 204, name: "Camiseta Cuello Redondo Hombre High School", price: 64900, sizes: [], category: "Deportivo" },
          { id: 230, name: "Saco Azul Tejido Unisex High School", price: 129900, sizes: [], category: "Gala" },
          { id: 231, name: "Chompa Gris Unisex High School", price: 114900, sizes: [], category: "Deportivo" },
          { id: 232, name: "Sudadera Unisex High School", price: 89900, sizes: [], category: "Deportivo" },
          { id: 209, name: "Pantalón Azul Gala High School", price: 124900, sizes: [], category: "Gala" },
          { id: 233, name: "Corbata Bachillerato y High School", price: 49900, sizes: ["Única"], category: "Complemento" },
          { id: 212, name: "Medias Azules Gala Hombre High School Paquete por 3 Pares", price: 39000, sizes: ["Única"], category: "Complemento" },
          { id: 234, name: "Medias Blancas Física Paquete por 2 Pares", price: 21000, sizes: [], category: "Complemento" },
          { id: 235, name: "Correa Negra Gala", price: 48900, sizes: [], category: "Complemento" },
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
        id: "lf-uniforme",
        name: "Uniforme",
        uniforms: [
          { id: 500, name: "Chaqueta", price: 130000, sizes: ["12", "14", "16", "S", "M"], category: "Diario", description: "Nuevo diseño, forrada en su interior con capucha" },
          { id: 501, name: "Camisa Polo", price: 70000, sizes: ["12", "14", "16", "S", "M"], category: "Diario", description: "Talla 16-M: $77.000" },
          { id: 505, name: "Camiseta Unisex", price: 65000, sizes: ["12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 16-M: $70.000" },
          { id: 506, name: "Sudadera Diario", price: 81500, sizes: ["12", "14", "16", "S", "M"], category: "Diario", description: "Pantalón sudadera diario" },
          { id: 504, name: "Jogger Unisex", price: 70000, sizes: ["12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 16-M: $75.000" },
          { id: 503, name: "Pantaloneta Niño", price: 65000, sizes: ["12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 16-M: $68.000" },
          { id: 507, name: "Short Niña", price: 65000, sizes: ["12", "14", "16", "S", "M"], category: "Deportivo", description: "Talla 16-M: $68.000" },
        ],
      },
      {
        id: "lf-kids",
        name: "Primaria",
        uniforms: [
          { id: 510, name: "Buso Kids", price: 0, sizes: ["4", "6", "8", "10", "12"], category: "Diario" },
          { id: 511, name: "Camiseta Polo Kids", price: 0, sizes: ["4", "6", "8", "10", "12"], category: "Diario" },
          { id: 515, name: "Chaleco Negro Kids", price: 0, sizes: ["4", "6", "8", "10", "12"], category: "Diario" },
          { id: 514, name: "Delantal Kids", price: 0, sizes: ["4", "6", "8", "10", "12"], category: "Complemento" },
          { id: 516, name: "Sudadera Kids", price: 0, sizes: ["4", "6", "8", "10", "12"], category: "Deportivo" },
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
