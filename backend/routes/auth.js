import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || "cambiar_este_secreto_en_produccion";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { user, pass } = req.body;
    if (!user || !pass)
      return res.status(400).json({ success:false, error:"Usuario y contraseña requeridos" });

    const validUser = process.env.ADMIN_USER;
    const validPass = process.env.ADMIN_PASS;

    if (!validUser || !validPass)
      return res.status(500).json({ success:false, error:"Credenciales de admin no configuradas en el servidor" });

    if (user.trim() !== validUser.trim() || pass !== validPass)
      return res.status(401).json({ success:false, error:"Credenciales incorrectas" });

    const token = jwt.sign({ user, role:"admin" }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({ success:true, token, expiresIn: JWT_EXPIRES });
  } catch(e) {
    console.error("Error en login:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});

// GET /api/auth/verify  — verificar token activo
router.get("/verify", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ success:false, error:"Token no proporcionado" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success:true, data:{ user:decoded.user, role:decoded.role } });
  } catch(e) {
    res.status(401).json({ success:false, error:"Token inválido o expirado" });
  }
});

export default router;