import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "cambiar_este_secreto_en_produccion";

// Middleware para rutas admin — verifica JWT en Authorization header
export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ success: false, error: "No autorizado. Se requiere autenticación." });

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ success: false, error: "Acceso denegado." });
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: "Token inválido o expirado. Inicie sesión nuevamente." });
  }
};