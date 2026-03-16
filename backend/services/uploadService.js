import { v2 as cloudinary } from "cloudinary";

// ⚠️ NO configurar cloudinary al nivel del módulo — en Vercel las env vars
// no están disponibles en import time, solo en runtime dentro de la función.

/**
 * Sube el comprobante de pago a Cloudinary.
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} orderId    - ID del pedido
 * @param {string} mimetype   - MIME type del archivo
 * @returns {string} URL pública segura del archivo
 */
export const uploadPaymentProof = async (fileBuffer, orderId, mimetype) => {
  // Config dentro de la función — garantiza que las env vars de Vercel estén disponibles
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error("CLOUDINARY_API_KEY no está definida en las variables de entorno de Vercel");
  }

  const resourceType = mimetype === "application/pdf" ? "raw" : "image";

  // upload() con base64 — compatible con Vercel serverless
  // upload_stream requiere un stream persistente que Vercel no soporta
  const b64     = fileBuffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder:        "comprobantes",
    public_id:     `pedido_${orderId}`,
    resource_type: resourceType,
    overwrite:     true,
    ...(resourceType === "image" && {
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    }),
  });

  return result.secure_url;
};