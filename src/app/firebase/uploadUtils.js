import imageCompression from "browser-image-compression";

/**
 * Sanitizes a file name removing non-ASCII characters, accents, spaces, and dangerous URL symbols.
 */
export function sanitizeFilename(filename) {
  if (!filename) return "file";
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop() : "";
  const name = parts.join(".");

  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9_-]/g, "_")  // replace non-alphanumeric with '_'
    .replace(/_+/g, "_")             // remove duplicated underscores
    .slice(0, 50);                   // limit name length

  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return cleanExt ? `${cleanName}.${cleanExt}` : cleanName;
}

/**
 * Safely compresses an image file. If browser-image-compression fails or is unsupported,
 * falls back gracefully to returning the original file.
 */
export async function safeCompressImage(file, options = { maxSizeMB: 1, maxWidthOrHeight: 1800, useWebWorker: true }) {
  if (!file || !(file instanceof Blob)) return file;
  try {
    const compressed = await imageCompression(file, options);
    return compressed || file;
  } catch (err) {
    console.warn("Compresión de imagen omitida, utilizando archivo original:", err);
    return file;
  }
}

/**
 * Converts Firebase error objects into clear, friendly Spanish message strings.
 */
export function formatUploadError(e) {
  const msg = e?.message || e?.code || String(e);
  if (msg.includes("retry-limit-exceeded") || msg.includes("Max retry time")) {
    return "Error al subir el archivo: El servidor de almacenamiento agotó el tiempo de espera. Verifica tu conexión a internet o intenta con una imagen en formato JPG, PNG o WEBP.";
  }
  if (msg.includes("unauthorized") || msg.includes("permission-denied")) {
    return "No tienes permisos de almacenamiento en Firebase Storage. Verifica tu sesión.";
  }
  if (msg.includes("quota-exceeded")) {
    return "Se ha superado la cuota disponible en el servidor de almacenamiento.";
  }
  return msg || "Ocurrió un error inesperado al guardar.";
}
