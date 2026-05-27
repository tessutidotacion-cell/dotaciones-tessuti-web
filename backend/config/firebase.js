import firebaseAdmin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

// ── Cache global — sobrevive entre invocaciones en Vercel ─────
// Vercel reutiliza el mismo proceso para requests cercanos en el tiempo.
// Al guardar en variables globales, Firebase no se reinicializa en cada request.
let _db    = global._firestoreDb    || null;
let _ready = global._firestoreReady || false;

const initFirebase = () => {
  if (_ready && _db) return _db;

  if (!firebaseAdmin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    // Decode base64 if stored that way
    if (privateKey && !privateKey.includes("-----BEGIN")) {
      privateKey = Buffer.from(privateKey, "base64").toString("utf8");
    } else {
      privateKey = privateKey.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }
    // Normalize key: strip all whitespace from body and reformat with 64-char lines
    if (privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      const body = privateKey
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/[\r\n\s]/g, "");
      const lines = body.match(/.{1,64}/g) || [];
      privateKey = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
    }

    if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("Faltan variables Firebase: " + [
        !process.env.FIREBASE_PROJECT_ID  && "FIREBASE_PROJECT_ID",
        !privateKey                        && "FIREBASE_PRIVATE_KEY",
        !process.env.FIREBASE_CLIENT_EMAIL && "FIREBASE_CLIENT_EMAIL",
      ].filter(Boolean).join(", "));
    }

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId:    process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey,
        clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
        clientId:     process.env.FIREBASE_CLIENT_ID,
      }),
    });
  }

  _db = firebaseAdmin.firestore();
  _db.settings({
    ignoreUndefinedProperties: true,
    // Reduce latencia en serverless — no espera conexión persistente
    preferRest: true,
  });

  // Persistir en global para reutilizar entre invocaciones
  global._firestoreDb    = _db;
  global._firestoreReady = true;
  _ready = true;

  return _db;
};

export const db    = new Proxy({}, { get: (_, prop) => initFirebase()[prop] });
export const admin = firebaseAdmin;
export default initFirebase;