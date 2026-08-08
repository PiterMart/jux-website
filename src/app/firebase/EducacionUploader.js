"use client";
import { useEffect, useState, useRef } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import { getDocs, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SearchableDropdown from "../../components/SearchableDropdown";
import { logCreate, logUpdate, logDelete, RESOURCE_TYPES } from "./activityLogger";
import { sanitizeFilename, safeUploadFile, formatUploadError, ensureAuth } from "./uploadUtils";
import styles from "../../styles/uploader.module.css";

export default function EducacionUploader() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const snap = await getDocs(collection(firestore, "educacion"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      setItems(list);
    } catch (e) {
      console.error("Error fetching educacion texts:", e);
    }
  };

  const handleSelectItem = async (id) => {
    setSelectedId(id);
    if (!id) {
      resetForm();
      return;
    }
    try {
      const docSnap = await getDoc(doc(firestore, "educacion", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || "");
        setHashtags(Array.isArray(data.hashtags) ? data.hashtags : []);
        setPdfUrl(data.pdfUrl || "");
        setFileName(data.fileName || "");
        setFileSize(data.fileSize || 0);
        setPdfFile(null);
        setError(null);
        setSuccess(null);
      }
    } catch (e) {
      console.error("Error loading document:", e);
      setError("Error al cargar el documento seleccionado.");
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setTitle("");
    setHashtags([]);
    setHashtagInput("");
    setPdfFile(null);
    setPdfUrl("");
    setFileName("");
    setFileSize(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Tag Handling
  const addHashtag = (tagToAdd) => {
    const raw = tagToAdd || hashtagInput;
    if (!raw.trim()) return;

    // Split by comma or spaces in case user pasted multiple
    const tokens = raw
      .split(/[,;\s]+/)
      .map((t) => t.trim().replace(/^#+/, "")) // remove leading hash symbol for uniform array
      .filter((t) => t.length > 0);

    const updated = [...hashtags];
    tokens.forEach((t) => {
      if (!updated.includes(t)) {
        updated.push(t);
      }
    });

    setHashtags(updated);
    setHashtagInput("");
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter((t) => t !== tagToRemove));
  };

  const handleHashtagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHashtag();
    }
  };

  // PDF File Drop Handling
  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se admiten archivos en formato PDF.");
      return;
    }
    setPdfFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!title.trim()) {
        throw new Error("El título del texto es obligatorio.");
      }

      if (!pdfFile && !pdfUrl) {
        throw new Error("Debes subir un archivo PDF para este documento.");
      }

      const id = selectedId || doc(collection(firestore, "educacion")).id;
      let finalPdfUrl = pdfUrl;
      let finalFileName = fileName;
      let finalFileSize = fileSize;

      if (pdfFile) {
        await ensureAuth();
        const safeName = sanitizeFilename(pdfFile.name);
        const storagePath = `educacion/${id}/${Date.now()}_${safeName}`;
        
        try {
          finalPdfUrl = await safeUploadFile(storagePath, pdfFile, {
            contentType: "application/pdf",
            fallbackPath: `educacion/texts/${Date.now()}_${safeName}`,
          });
        } catch (uploadErr) {
          // Direct storage fallback
          const fileRef = ref(storage, storagePath);
          await uploadBytes(fileRef, pdfFile, { contentType: "application/pdf" });
          finalPdfUrl = await getDownloadURL(fileRef);
        }

        finalFileName = pdfFile.name;
        finalFileSize = pdfFile.size;
      }

      const payload = {
        title: title.trim(),
        hashtags: hashtags,
        pdfUrl: finalPdfUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        updatedAt: new Date().toISOString(),
      };

      if (selectedId) {
        await updateDoc(doc(firestore, "educacion", selectedId), payload);
        await logUpdate(RESOURCE_TYPES.EDUCACION, selectedId, { title: payload.title });
        setSuccess("Texto de Educación actualizado con éxito.");
      } else {
        payload.createdAt = new Date().toISOString();
        await setDoc(doc(firestore, "educacion", id), payload);
        await logCreate(RESOURCE_TYPES.EDUCACION, id, { title: payload.title });
        setSuccess("Texto de Educación guardado con éxito.");
      }

      resetForm();
      fetchItems();
    } catch (e) {
      console.error("Error en submit de educacion:", e);
      setError(formatUploadError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("¿Estás seguro de eliminar este texto educativo?")) return;
    try {
      await deleteDoc(doc(firestore, "educacion", selectedId));
      await logDelete(RESOURCE_TYPES.EDUCACION, selectedId);
      setSuccess("Texto eliminado correctamente.");
      resetForm();
      fetchItems();
    } catch (e) {
      setError("Error al eliminar el documento.");
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.subtitle}>Gestión de Textos y Documentos (Educación)</h3>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {/* Live Search & Select */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className={styles.helpText}>Buscar texto por título o seleccionar de la lista:</p>
        <SearchableDropdown
          items={items}
          onSelect={(item) => handleSelectItem(item.id)}
          placeholder="Buscar texto por título..."
          emptyMessage="No se encontraron textos con ese título"
          getLabel={(item) => item.title}
          getSubtitle={(item) => item.hashtags?.length ? `Tags: #${item.hashtags.join(" #")}` : ""}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={selectedId || ""}
            onChange={(e) => handleSelectItem(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          >
            <option value="">-- Crear Nuevo Documento --</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.title}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={resetForm}
              className={styles.loginButton}
              style={{ width: "auto", padding: "0.5rem 1rem", backgroundColor: "#666", color: "#fff" }}
            >
              + Nuevo
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Title */}
        <div>
          <p className={styles.helpText}>Título del texto / documento *</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Reflexiones sobre el Arte Latinoamericano Contemporáneo"
            className={styles.input}
          />
        </div>

        {/* Hashtags Interactive Manager */}
        <div>
          <p className={styles.helpText}>Hashtags / Temas (Escribe y presiona Enter o coma para añadir)</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleHashtagKeyDown}
              placeholder="Ej: pedagogia, arte, curaduria"
              className={styles.input}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => addHashtag()}
              className={styles.loginButton}
              style={{ width: "auto", padding: "0.5rem 1.25rem" }}
            >
              + Añadir Tag
            </button>
          </div>

          {hashtags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
              {hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "#000",
                    color: "#fff",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    letterSpacing: "0.5px",
                  }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ff6b6b",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      lineHeight: 1,
                      padding: 0,
                    }}
                    title="Eliminar etiqueta"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* PDF Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Archivo PDF del texto * (Arrastra el PDF aquí o haz clic)</p>
          <div
            className={`${styles.profilePictureDropZone} ${isDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "2.5rem 1.5rem",
              minHeight: "160px",
              border: "2px dashed #999",
              borderRadius: "6px",
              backgroundColor: isDragOver ? "#eef5ff" : "#fafafa",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            <span style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "#111" }}>PDF</span>

            {pdfFile ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "600", color: "#111", margin: "0.25rem 0" }}>
                  {pdfFile.name}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.25rem 0" }}>
                  {formatFileSize(pdfFile.size)} — Listo para subir
                </p>
                <small style={{ color: "#0066cc", textDecoration: "underline" }}>
                  Haz clic o arrastra para reemplazar el archivo
                </small>
              </div>
            ) : pdfUrl ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: "600", color: "#111", margin: "0.25rem 0" }}>
                  {fileName || "Documento PDF actual"}
                </p>
                {fileSize > 0 && (
                  <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.25rem 0" }}>
                    {formatFileSize(fileSize)}
                  </p>
                )}
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: "0.85rem",
                      color: "#000",
                      textDecoration: "underline",
                      fontWeight: "600",
                    }}
                  >
                    Ver PDF actual ↗
                  </a>
                  <span style={{ fontSize: "0.85rem", color: "#888" }}>|</span>
                  <span style={{ fontSize: "0.85rem", color: "#0066cc" }}>
                    Haz clic para reemplazar por otro PDF
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666" }}>
                <p style={{ margin: "0.25rem 0", fontSize: "1rem", fontWeight: "500" }}>
                  Arrastrá un archivo PDF aquí o hacé clic para seleccionarlo
                </p>
                <small style={{ color: "#999" }}>Formato soportado: .pdf</small>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={styles.loginButton}
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            {loading ? "Guardando..." : selectedId ? "Actualizar Documento" : "Guardar en Educación"}
          </button>
          {selectedId && (
            <button
              onClick={handleDelete}
              className={styles.loginButton}
              style={{ backgroundColor: "#990000", color: "#fff" }}
            >
              Eliminar
            </button>
          )}
          <button
            onClick={resetForm}
            className={styles.loginButton}
            style={{ backgroundColor: "#555", color: "#fff" }}
          >
            Cancelar / Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
