import imageCompression from "browser-image-compression";
import { getAuth, signInAnonymously } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./firebaseConfig";
import { storage } from "./firebaseStorage";

let authInstance = null;

/**
 * Ensures a Firebase Auth user session exists (signing in anonymously if needed)
 * to satisfy Firebase Storage rules requiring request.auth != null.
 */
export async function ensureAuth() {
  try {
    if (typeof window !== "undefined") {
      if (!authInstance) {
        authInstance = getAuth(app);
      }
      if (!authInstance.currentUser) {
        await signInAnonymously(authInstance);
      }
    }
  } catch (err) {
    console.warn("Autenticación anónima omitida:", err?.message || err);
  }
}

/**
 * Uploads a file safely to Firebase Storage with anonymous auth check
 * and optional fallback path if storage/unauthorized is encountered.
 */
export async function safeUploadFile(primaryPath, file, options = {}) {
  await ensureAuth();
  const determinedType = options.contentType || file.type || "image/jpeg";
  const metadata = { contentType: determinedType };
  const fallbackPath = options.fallbackPath;

  try {
    const fileRef = ref(storage, primaryPath);
    await uploadBytes(fileRef, file, metadata);
    return await getDownloadURL(fileRef);
  } catch (err) {
    const errStr = String(err?.message || err?.code || err);
    if ((errStr.includes("unauthorized") || errStr.includes("permission-denied")) && fallbackPath) {
      console.warn(`Carga en ${primaryPath} no autorizada. Reintentando en ruta de respaldo ${fallbackPath}...`);
      const fallbackRef = ref(storage, fallbackPath);
      await uploadBytes(fallbackRef, file, metadata);
      return await getDownloadURL(fallbackRef);
    }
    throw err;
  }
}

/**
 * Safely deletes a file from Firebase Storage given its download URL or storage path.
 * Ignores missing files or non-storage URLs gracefully.
 */
export async function safeDeleteFile(fileUrlOrPath) {
  if (!fileUrlOrPath || typeof fileUrlOrPath !== "string") return false;
  // Ignore local blob / data URLs
  if (fileUrlOrPath.startsWith("blob:") || fileUrlOrPath.startsWith("data:")) return false;

  try {
    await ensureAuth();
    const fileRef = ref(storage, fileUrlOrPath);
    await deleteObject(fileRef);
    console.log("Archivo eliminado con éxito de Firebase Storage:", fileUrlOrPath);
    return true;
  } catch (err) {
    const code = err?.code || "";
    // If file was already deleted or doesn't exist, treat as success
    if (code === "storage/object-not-found" || String(err).includes("object-not-found")) {
      console.warn("El archivo ya no existía en Firebase Storage:", fileUrlOrPath);
      return true;
    }
    console.warn("Aviso al eliminar archivo de Firebase Storage:", err?.message || err);
    return false;
  }
}

/**
 * Safely deletes multiple files from Firebase Storage.
 */
export async function safeDeleteFiles(urlsOrPaths) {
  if (!Array.isArray(urlsOrPaths) || urlsOrPaths.length === 0) return;
  await Promise.allSettled(
    urlsOrPaths.map((item) => {
      const url = typeof item === "string" ? item : item?.url;
      return safeDeleteFile(url);
    })
  );
}

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
export async function safeCompressImage(
  file,
  options = { maxSizeMB: 4, maxWidthOrHeight: 2560, initialQuality: 0.9, useWebWorker: true }
) {
  if (!file || !(file instanceof Blob)) return file;
  if (file.type === "image/gif") return file;
  try {
    const mergedOptions = {
      maxSizeMB: 4,
      maxWidthOrHeight: 2560,
      initialQuality: 0.9,
      useWebWorker: true,
      ...options,
    };
    const compressed = await imageCompression(file, mergedOptions);
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
    return "Error de permisos en Firebase Storage (storage/unauthorized). Se intentó la autenticación y la ruta de respaldo. Verifica las reglas de seguridad en Firebase Console.";
  }
  if (msg.includes("quota-exceeded")) {
    return "Se ha superado la cuota disponible en el servidor de almacenamiento.";
  }
  return msg || "Ocurrió un error inesperado al guardar.";
}
