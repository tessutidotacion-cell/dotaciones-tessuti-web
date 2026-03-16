/**
 * GET /api/colleges
 * Retorna la lista de colegios con sus catálogos de uniformes.
 *
 * Los datos vienen de Firestore (colección "colegios").
 * Estructura esperada de cada documento:
 * {
 *   id: string,
 *   name: string,
 *   logo: string,           // emoji o URL de imagen
 *   primaryColor: string,   // hex, ej: "#1a3a6b"
 *   accentColor: string,
 *   description: string,
 *   uniforms: [
 *     { id, name, price, sizes: [], image, category }
 *   ]
 * }
 */

import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("colegios").orderBy("name").get();

    if (snapshot.empty) {
      return res.json({ success: true, data: [] });
    }

    const colleges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, count: colleges.length, data: colleges });
  } catch (error) {
    console.error("Error obteniendo colegios:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

export default router;
