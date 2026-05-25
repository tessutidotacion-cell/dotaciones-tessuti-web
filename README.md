# Dotaciones Tessuti Web

Plataforma de e-commerce para venta de uniformes escolares y dotaciones empresariales. Desarrollada para **Tessuti Dotaciones**, permite a clientes seleccionar su colegio, explorar el catálogo de uniformes, realizar pedidos y hacer seguimiento al estado de su compra.

---

## Tabla de Contenidos

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Despliegue](#despliegue)
- [Documentación Adicional](#documentación-adicional)

---

## Descripción del Proyecto

### ¿Qué hace?

1. **Selección de colegio** — Página de inicio con listado de colegios o empresas disponibles.
2. **Catálogo de productos** — Cada colegio tiene su propio catálogo con uniformes por categoría (Diario, Deportivo, Gala, Complementos).
3. **Carrito de compras** — Agrega prendas con talla y cantidad seleccionada.
4. **Checkout** — Formulario de datos del cliente, opciones de entrega, cupones de descuento y múltiples métodos de pago.
5. **Seguimiento de pedido** — El cliente consulta su pedido con el número de orden.
6. **Panel de administración** — Gestión completa de pedidos, inventario, descuentos y cupones.

### Colegios/Empresas activos

| Nombre | ID |
|---|---|
| The New School | `1` |
| Colegio Cumbres | `2` |
| Liceo Francés | `liceo-frances` |
| Dotación Empresarial | `empresarial` |

---

## Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2.0 | Framework UI |
| Vite | 7.3.1 | Bundler y servidor dev |
| Lucide React | 0.577.0 | Íconos |
| XLSX | 0.18.5 | Exportar reportes Excel |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js + Express | 4.18.2 | API REST |
| Firebase Admin SDK | 12.0.0 | Base de datos Firestore |
| Firebase Storage | — | Almacenamiento de archivos |
| Cloudinary | — | Hosting de imágenes |
| JWT + bcryptjs | — | Autenticación admin |
| Nodemailer / Resend | — | Notificaciones por email |
| Wompi | — | Pasarela de pagos |
| Helmet / hpp / xss | — | Seguridad |

---

## Arquitectura

```
dotaciones-tessuti-web/
├── uniformes-tienda/       # Aplicación React (frontend)
│   ├── src/
│   │   ├── components/     # Componentes UI reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── data/           # Datos estáticos (colegios, productos)
│   │   ├── services/       # Cliente API (api.js)
│   │   ├── hooks/          # Custom hooks (useToast)
│   │   └── utils/          # Utilidades (money, exportExcel)
│   └── public/
├── backend/                # API REST (Node.js + Express)
│   ├── routes/             # Endpoints por dominio
│   ├── services/           # Lógica de negocio
│   ├── middleware/         # Auth, seguridad, validación
│   └── config/             # Firebase, variables de entorno
├── docs/                   # Documentación técnica
└── README.md
```

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para diagrama detallado.

---

## Instalación y Configuración

### Requisitos previos

- Node.js >= 18
- npm >= 9
- Cuenta Firebase con Firestore y Storage habilitados
- Cuenta Cloudinary
- Credenciales Wompi (sandbox/producción)

### Clonar repositorio

```bash
git clone https://github.com/tessutidotacion-cell/dotaciones-tessuti-web.git
cd dotaciones-tessuti-web
```

### Instalar dependencias

```bash
# Frontend
cd uniformes-tienda
npm install

# Backend
cd ../backend
npm install
```

---

## Variables de Entorno

### Backend (`backend/.env`)

```env
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# JWT
JWT_SECRET=clave-secreta-segura-minimo-32-chars

# Email
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
RESEND_API_KEY=re_xxxxxxxxxxxx

# Wompi
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxx
WOMPI_INTEGRITY_KEY=integrity_key_xxxx

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password-seguro
```

### Frontend (`uniformes-tienda/.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Ejecución

### Desarrollo

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Servidor en http://localhost:3001

# Terminal 2 — Frontend
cd uniformes-tienda
npm run dev
# App en http://localhost:5173
```

### Producción (build)

```bash
cd uniformes-tienda
npm run build
# Archivos en uniformes-tienda/dist/
```

---

## Despliegue

### Frontend — Vercel

El archivo `uniformes-tienda/vercel.json` ya está configurado para SPA con Vite.

```bash
cd uniformes-tienda
vercel deploy --prod
```

Variables de entorno requeridas en Vercel:
- `VITE_API_URL` → URL del backend desplegado
- `VITE_GA_MEASUREMENT_ID`

### Backend — Vercel / Railway / Render

```bash
cd backend
vercel deploy --prod
# o
railway up
```

Variables de entorno requeridas: todas las del archivo `.env` listadas arriba.

---

## Documentación Adicional

| Documento | Contenido |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Diagrama de arquitectura, flujos de datos, decisiones técnicas |
| [docs/API.md](docs/API.md) | Referencia completa de endpoints REST |
| [docs/INSTALACION.md](docs/INSTALACION.md) | Guía paso a paso de instalación y configuración |
| [docs/MANUAL_ADMIN.md](docs/MANUAL_ADMIN.md) | Manual de uso del panel de administración |
| [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) | Manual de uso para clientes finales |

---

## Contacto y Soporte

- **WhatsApp soporte:** configurado en `uniformes-tienda/src/constants/contact.js`
- **Email:** configurado en variables de entorno del backend

---

*Desarrollado para Tessuti Dotaciones — 2024/2025*
