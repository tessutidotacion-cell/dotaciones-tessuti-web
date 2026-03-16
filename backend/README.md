# 🎽 Backend — Tienda de Uniformes Escolares

API REST construida con **Node.js + Express + Firebase Firestore**

---

## 📁 Estructura del proyecto

```
backend/
├── config/
│   └── firebase.js          # Conexión con Firebase Admin
├── middleware/
│   └── auth.js              # Autenticación con API Key
├── routes/
│   └── orders.js            # Rutas de pedidos
├── services/
│   ├── orderService.js      # Lógica de negocio de pedidos
│   └── uploadService.js     # Subida de archivos a Firebase Storage
├── api.js                   # (Copiar al frontend) Funciones para llamar la API
├── server.js                # Punto de entrada del servidor
├── .env.example             # Plantilla de variables de entorno
└── package.json
```

---

## ⚙️ Instalación paso a paso

### 1. Crear el proyecto de Firebase

1. Ve a **console.firebase.google.com**
2. Clic en **"Agregar proyecto"** → ponle un nombre → continuar
3. En el menú izquierdo ve a **Firestore Database** → "Crear base de datos" → modo producción
4. En el menú izquierdo ve a **Storage** → "Comenzar"
5. Ve a ⚙️ **Configuración del proyecto** → pestaña **"Cuentas de servicio"**
6. Clic en **"Generar nueva clave privada"** → se descarga un archivo `.json`

### 2. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

Abre el archivo `.env` y completa los valores con los datos del archivo JSON descargado:

```env
FIREBASE_PROJECT_ID=     # campo "project_id" del JSON
FIREBASE_PRIVATE_KEY_ID= # campo "private_key_id" del JSON
FIREBASE_PRIVATE_KEY=    # campo "private_key" del JSON (con comillas)
FIREBASE_CLIENT_EMAIL=   # campo "client_email" del JSON
FIREBASE_CLIENT_ID=      # campo "client_id" del JSON
FIREBASE_STORAGE_BUCKET= # tu-project-id.appspot.com
ADMIN_API_KEY=           # pon una contraseña segura aquí
FRONTEND_URL=            # http://localhost:5173 en desarrollo
```

### 3. Instalar dependencias y correr el servidor

```bash
npm install
npm run dev     # desarrollo (se reinicia automáticamente)
npm start       # producción
```

El servidor quedará en: **http://localhost:3001**

---

## 🔌 Endpoints disponibles

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/orders` | Crear nuevo pedido |
| `GET` | `/api/orders/:id` | Consultar pedido por ID |
| `POST` | `/api/orders/:id/payment-proof` | Subir comprobante |

### Admin (requieren header `x-api-key`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/orders` | Listar pedidos con filtros |
| `PATCH` | `/api/orders/:id/status` | Cambiar estado |
| `GET` | `/api/orders/admin/stats` | Estadísticas de ventas |

---

## 🔗 Conectar con el frontend React

1. Copia el archivo `api.js` a tu proyecto React: `src/services/api.js`

2. Crea un archivo `.env` en la raíz de tu proyecto React:
```env
VITE_API_URL=http://localhost:3001/api
VITE_ADMIN_KEY=la-misma-clave-que-pusiste-en-el-backend
```

3. Importa las funciones donde las necesites:
```js
import { createOrder, uploadPaymentProof } from "./services/api.js";

// Al confirmar pedido:
const result = await createOrder({ collegeId, collegeName, items, student, guardian });
console.log(result.data.id); // "PED-2024-1234"

// Al subir comprobante:
await uploadPaymentProof(orderId, file);

// En el panel admin para listar:
const { data } = await getOrders({ status: "Pago en validación" });
```

---

## 📦 Estados del pedido

```
Pago en validación → Pago confirmado → En producción → Listo para recoger → Entregado
```

Cada cambio queda registrado en `statusHistory` con fecha y usuario.

---

## 🚀 Despliegue en producción

Opciones recomendadas para el backend:
- **Railway** (railway.app) — muy fácil, gratis para empezar
- **Render** (render.com) — gratis con limitaciones
- **Google Cloud Run** — integración nativa con Firebase
