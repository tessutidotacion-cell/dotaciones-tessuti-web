// ============================================================
// services/authService.js
// Gestión de admins: registro, login, logout, roles
// ============================================================
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase.js";

const COLLECTION = "admins";
const SALT_ROUNDS = 12; // alto costo computacional = más seguro

// ── Generar tokens JWT ────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { uid: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    issuer:    "uniformes-app",
    audience:  "uniformes-admin",
  });

  const refreshToken = jwt.sign(
    { uid: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  return { accessToken, refreshToken };
};

// ── Crear admin inicial (bootstrap) ──────────────────────────
// Se llama al iniciar el servidor si no existe ningún superadmin
export const bootstrapSuperAdmin = async () => {
  const existing = await db.collection(COLLECTION)
    .where("role", "==", "superadmin")
    .limit(1).get();

  if (!existing.empty) return;

  const email    = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  // ← AGREGA ESTA LÍNEA TEMPORALMENTE
  console.log("🔑 Creando admin con:", email, "| pass length:", password?.length, "| pass:", password);

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const id   = `admin_${Date.now()}`;

  await db.collection(COLLECTION).doc(id).set({
    id, email, name: "Super Admin",
    password: hash,
    role:      "superadmin",
    active:    true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    loginAttempts: 0,
    lockedUntil:   null,
  });

  console.log(`✅ Super admin creado: ${email}`);
};

// ── Login ─────────────────────────────────────────────────────
export const loginAdmin = async (email, password) => {
  // Buscar usuario
  const snap = await db.collection(COLLECTION)
    .where("email", "==", email.toLowerCase())
    .limit(1).get();

  if (snap.empty) {
    // Tiempo constante para evitar timing attacks
    await bcrypt.compare(password, "$2b$12$invalidhashfortimingatack000000000000000000");
    throw new Error("Credenciales incorrectas");
  }

  const doc  = snap.docs[0];
  const user = doc.data();

  // Verificar si está activo
  if (!user.active) throw new Error("Cuenta desactivada. Contacta al administrador.");

  // Verificar bloqueo por intentos fallidos
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const mins = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
    throw new Error(`Cuenta bloqueada temporalmente. Intenta en ${mins} minuto(s).`);
  }

  // Verificar contraseña
  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    // Incrementar intentos fallidos
    const attempts = (user.loginAttempts || 0) + 1;
    const updates  = { loginAttempts: attempts };

    // Bloquear después de 5 intentos por 15 minutos
    if (attempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      updates.loginAttempts = 0;
    }

    await doc.ref.update(updates);
    throw new Error("Credenciales incorrectas");
  }

  // Login exitoso: resetear intentos
  await doc.ref.update({
    loginAttempts: 0,
    lockedUntil:   null,
    lastLogin:     new Date().toISOString(),
  });

  const tokens = generateTokens(user);

  // Guardar refresh token en Firestore
  await db.collection("refresh_tokens").doc(user.id).set({
    token:     tokens.refreshToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    ...tokens,
  };
};

// ── Logout (revocar token) ────────────────────────────────────
export const logoutAdmin = async (token, uid) => {
  // Agregar token a lista negra hasta que expire
  const payload  = jwt.decode(token);
  const expiresAt = payload?.exp ? new Date(payload.exp * 1000).toISOString() : null;

  await db.collection("token_blacklist").doc(token.slice(-20)).set({
    token: token.slice(-20), uid, revokedAt: new Date().toISOString(), expiresAt,
  });

  // Eliminar refresh token
  await db.collection("refresh_tokens").doc(uid).delete();
};

// ── Refresh token ─────────────────────────────────────────────
export const refreshAccessToken = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Refresh token inválido o expirado");
  }

  // Verificar que el refresh token coincide con el guardado
  const stored = await db.collection("refresh_tokens").doc(payload.uid).get();
  if (!stored.exists || stored.data().token !== refreshToken) {
    throw new Error("Refresh token no válido");
  }

  // Obtener usuario actualizado
  const userDoc = await db.collection(COLLECTION).doc(payload.uid).get();
  if (!userDoc.exists || !userDoc.data().active) {
    throw new Error("Usuario inactivo");
  }

  const user   = userDoc.data();
  const tokens = generateTokens(user);

  // Rotar el refresh token
  await db.collection("refresh_tokens").doc(user.id).set({
    token:     tokens.refreshToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    ...tokens,
  };
};

// ── Gestión de usuarios admin ─────────────────────────────────

export const getAdmins = async () => {
  const snap = await db.collection(COLLECTION).orderBy("createdAt","desc").get();
  return snap.docs.map(d => {
    const u = d.data();
    const { password: _, ...safe } = u; // nunca devolver el hash
    return safe;
  });
};

export const createAdmin = async (data, createdBy) => {
  // Verificar que no exista
  const existing = await db.collection(COLLECTION)
    .where("email","==", data.email.toLowerCase()).limit(1).get();
  if (!existing.empty) throw new Error("Ya existe un usuario con ese correo");

  const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const id   = `admin_${Date.now()}`;

  const newUser = {
    id, email: data.email.toLowerCase(),
    name: data.name, password: hash,
    role: data.role, active: true,
    createdAt: new Date().toISOString(),
    createdBy, lastLogin: null,
    loginAttempts: 0, lockedUntil: null,
  };

  await db.collection(COLLECTION).doc(id).set(newUser);
  const { password: _, ...safe } = newUser;
  return safe;
};

export const updateAdmin = async (id, updates, updatedBy) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) throw new Error("Usuario no encontrado");

  const allowed = {};
  if (updates.name)   allowed.name   = updates.name;
  if (updates.role)   allowed.role   = updates.role;
  if (updates.active !== undefined) allowed.active = updates.active;
  if (updates.password) {
    allowed.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    allowed.loginAttempts = 0;
    allowed.lockedUntil   = null;
  }
  allowed.updatedAt = new Date().toISOString();
  allowed.updatedBy = updatedBy;

  await doc.ref.update(allowed);
  return { id, ...allowed, password: undefined };
};

export const deleteAdmin = async (id, deletedBy) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) throw new Error("Usuario no encontrado");
  if (doc.data().role === "superadmin") throw new Error("No se puede eliminar al superadmin");

  // Soft delete: desactivar en lugar de borrar
  await doc.ref.update({
    active: false,
    deletedAt: new Date().toISOString(),
    deletedBy,
  });
};
