"use client";
import { useEffect, useState, useRef } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import SearchableDropdown from "../../components/SearchableDropdown";
import { logCreate, logUpdate, logDelete, RESOURCE_TYPES } from "./activityLogger";
import {
  sanitizeFilename,
  safeCompressImage,
  formatUploadError,
  safeUploadFile,
  safeDeleteFile,
  safeDeleteFiles,
} from "./uploadUtils";
import { toInputDate, calculateExhibitionStatus, toFirestoreTimestamp } from "./dateUtils";
import styles from "../../styles/uploader.module.css";

export default function EventUploader() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    startDate: "",
    endDate: "",
    location: "Sala Principal",
    curator: "",
    descriptionText: "",
    tour360Url: "",
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [initialCoverUrl, setInitialCoverUrl] = useState(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [initialPdfUrl, setInitialPdfUrl] = useState(null);

  const [galleryImages, setGalleryImages] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);

  const [isCoverDragOver, setIsCoverDragOver] = useState(false);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [isGalleryDragOver, setIsGalleryDragOver] = useState(false);

  const coverInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(firestore, "events"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(list);
    } catch (e) {
      console.error("Error fetching events:", e);
    }
  };

  const handleSelectEvent = async (id) => {
    setSelectedId(id);
    if (!id) {
      resetForm();
      return;
    }
    const eventDoc = await getDoc(doc(firestore, "events", id));
    if (eventDoc.exists()) {
      const d = eventDoc.data();
      const startStr = toInputDate(d.startDate || d.startTimestamp);
      const endStr = toInputDate(d.endDate || d.endTimestamp);

      setFormData({
        title: d.title || "",
        subtitle: d.subtitle || "",
        startDate: startStr,
        endDate: endStr,
        location: d.location || "",
        curator: d.curator || "",
        descriptionText: Array.isArray(d.description)
          ? d.description.join("\n\n")
          : d.description || "",
        tour360Url: d.tour360Url || "",
      });
      setCoverPreview(d.coverImage || null);
      setInitialCoverUrl(d.coverImage || null);
      setCoverFile(null);
      setPdfUrl(d.pdfCatalog || null);
      setInitialPdfUrl(d.pdfCatalog || null);
      setPdfFile(null);
      setExistingGallery(d.gallery || []);
      setGalleryImages([]);
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData({
      title: "",
      subtitle: "",
      startDate: "",
      endDate: "",
      location: "Sala Principal",
      curator: "",
      descriptionText: "",
      tour360Url: "",
    });
    setCoverFile(null);
    setCoverPreview(null);
    setInitialCoverUrl(null);
    setPdfFile(null);
    setPdfUrl(null);
    setInitialPdfUrl(null);
    setGalleryImages([]);
    setExistingGallery([]);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Drag & Drop for Cover Image
  const handleCoverDrop = (e) => {
    e.preventDefault();
    setIsCoverDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setCoverFile(files[0]);
      setCoverPreview(URL.createObjectURL(files[0]));
    }
  };

  // Drag & Drop for PDF Document
  const handlePdfDrop = (e) => {
    e.preventDefault();
    setIsPdfDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setPdfFile(files[0]);
    } else {
      setError("Por favor selecciona un archivo PDF válido.");
    }
  };

  // Drag & Drop for Gallery Images
  const handleGalleryDrop = (e) => {
    e.preventDefault();
    setIsGalleryDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      setGalleryImages((prev) => [...prev, ...files]);
    }
  };

  // Remove / Delete Cover Image
  const handleRemoveCover = async (e) => {
    if (e) e.stopPropagation();
    if (!coverPreview && !coverFile) return;

    if (coverPreview && !coverPreview.startsWith("blob:")) {
      if (!confirm("¿Deseas quitar la imagen de portada y eliminar el archivo de Firebase Storage?")) return;
      try {
        await safeDeleteFile(coverPreview);
        if (selectedId) {
          await updateDoc(doc(firestore, "events", selectedId), { coverImage: "" });
          await logUpdate(RESOURCE_TYPES.EVENT, selectedId, { coverImage: "eliminada" });
        }
        setSuccess("Imagen de portada eliminada de Storage.");
      } catch (err) {
        console.error(err);
        setError("Error al eliminar la imagen de portada de Storage.");
      }
    }
    setCoverFile(null);
    setCoverPreview(null);
    setInitialCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Remove / Delete PDF
  const handleRemovePdf = async (e) => {
    if (e) e.stopPropagation();
    if (!pdfUrl && !pdfFile) return;

    if (pdfUrl && !pdfUrl.startsWith("blob:")) {
      if (!confirm("¿Deseas quitar el documento PDF y eliminar el archivo de Firebase Storage?")) return;
      try {
        await safeDeleteFile(pdfUrl);
        if (selectedId) {
          await updateDoc(doc(firestore, "events", selectedId), { pdfCatalog: "" });
          await logUpdate(RESOURCE_TYPES.EVENT, selectedId, { pdfCatalog: "eliminado" });
        }
        setSuccess("Documento PDF eliminado de Storage.");
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el documento PDF de Storage.");
      }
    }
    setPdfFile(null);
    setPdfUrl(null);
    setInitialPdfUrl(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  // Remove Existing Gallery Image with Storage Deletion
  const removeExistingGalleryImage = async (index) => {
    const imgObj = existingGallery[index];
    const imgUrl = typeof imgObj === "string" ? imgObj : imgObj?.url;

    if (imgUrl && !imgUrl.startsWith("blob:")) {
      if (!confirm("¿Deseas eliminar esta foto de la galería y de Firebase Storage?")) return;
      try {
        await safeDeleteFile(imgUrl);
        const updated = existingGallery.filter((_, i) => i !== index);
        setExistingGallery(updated);
        if (selectedId) {
          await updateDoc(doc(firestore, "events", selectedId), { gallery: updated });
          await logUpdate(RESOURCE_TYPES.EVENT, selectedId, { galleryImageDeleted: imgUrl });
        }
        setSuccess("Foto eliminada de Storage y de la galería.");
      } catch (err) {
        console.error(err);
        setError("Error al eliminar la foto de Storage.");
      }
    } else {
      setExistingGallery((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const removeNewGalleryImage = (index) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.title.trim()) {
        throw new Error("El título del evento es obligatorio.");
      }

      const id = selectedId || doc(collection(firestore, "events")).id;

      // 1. Cover Image Upload
      let coverImageUrl = coverPreview;
      if (coverFile) {
        const compressed = await safeCompressImage(coverFile, {
          maxSizeMB: 4,
          maxWidthOrHeight: 2560,
          initialQuality: 0.92,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(coverFile.name);
        const primaryPath = `events/${id}/cover_${Date.now()}_${safeName}`;
        const fallbackPath = `events/${id}/images/cover_${Date.now()}_${safeName}`;
        coverImageUrl = await safeUploadFile(primaryPath, compressed, {
          contentType: compressed.type || coverFile.type || "image/jpeg",
          fallbackPath,
        });

        // Delete old replaced cover image from storage
        if (initialCoverUrl && initialCoverUrl !== coverImageUrl && !initialCoverUrl.startsWith("blob:")) {
          await safeDeleteFile(initialCoverUrl);
        }
      }

      // 2. PDF Attachment Upload
      let finalPdfUrl = pdfUrl;
      if (pdfFile) {
        const safePdfName = sanitizeFilename(pdfFile.name);
        const primaryPath = `events/${id}/pdf_${Date.now()}_${safePdfName}`;
        const fallbackPath = `events/${id}/pdf/doc_${Date.now()}_${safePdfName}`;
        finalPdfUrl = await safeUploadFile(primaryPath, pdfFile, {
          contentType: "application/pdf",
          fallbackPath,
        });

        // Delete old replaced PDF from storage
        if (initialPdfUrl && initialPdfUrl !== finalPdfUrl && !initialPdfUrl.startsWith("blob:")) {
          await safeDeleteFile(initialPdfUrl);
        }
      }

      // 3. Gallery Uploads
      const uploadedGallery = [...existingGallery];
      for (let i = 0; i < galleryImages.length; i++) {
        const file = galleryImages[i];
        const compressed = await safeCompressImage(file, {
          maxSizeMB: 4,
          maxWidthOrHeight: 2560,
          initialQuality: 0.9,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(file.name || `gallery_${i}.jpg`);
        const primaryPath = `events/${id}/gallery_${Date.now()}_${i}_${safeName}`;
        const fallbackPath = `events/${id}/gallery/gallery_${Date.now()}_${i}_${safeName}`;
        const url = await safeUploadFile(primaryPath, compressed, {
          contentType: compressed.type || file.type || "image/jpeg",
          fallbackPath,
        });
        uploadedGallery.push({ url, description: "" });
      }

      const descriptionArray = formData.descriptionText
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const startTs = toFirestoreTimestamp(formData.startDate);
      const endTs = toFirestoreTimestamp(formData.endDate);
      const autoStatus = formData.status || calculateExhibitionStatus(formData.startDate, formData.endDate);

      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        status: autoStatus,
        startDate: formData.startDate.trim(),
        endDate: formData.endDate.trim(),
        startTimestamp: startTs,
        endTimestamp: endTs,
        location: formData.location.trim(),
        curator: formData.curator.trim(),
        description: descriptionArray,
        tour360Url: formData.tour360Url.trim(),
        coverImage: coverImageUrl || "",
        pdfCatalog: finalPdfUrl || "",
        gallery: uploadedGallery,
        type: "event",
        updatedAt: new Date().toISOString(),
      };

      if (selectedId) {
        await updateDoc(doc(firestore, "events", selectedId), payload);
        await logUpdate(RESOURCE_TYPES.EVENT, selectedId, { title: payload.title });
        setSuccess("Evento actualizado con éxito.");
      } else {
        await setDoc(doc(firestore, "events", id), payload);
        await logCreate(RESOURCE_TYPES.EVENT, id, { title: payload.title });
        setSuccess("Evento creado con éxito.");
      }

      resetForm();
      fetchEvents();
    } catch (e) {
      console.error("Error en submit de evento:", e);
      setError(formatUploadError(e));
    } finally {
      setLoading(false);
    }
  };

  // Delete Event & ALL associated storage files
  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("¿Estás seguro de eliminar este evento y TODOS sus archivos asociados de Firebase Storage?")) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const filesToDelete = [];
      if (coverPreview && !coverPreview.startsWith("blob:")) {
        filesToDelete.push(coverPreview);
      }
      if (initialCoverUrl && !initialCoverUrl.startsWith("blob:")) {
        filesToDelete.push(initialCoverUrl);
      }
      if (pdfUrl && !pdfUrl.startsWith("blob:")) {
        filesToDelete.push(pdfUrl);
      }
      if (initialPdfUrl && !initialPdfUrl.startsWith("blob:")) {
        filesToDelete.push(initialPdfUrl);
      }
      existingGallery.forEach((item) => {
        const u = typeof item === "string" ? item : item?.url;
        if (u && !u.startsWith("blob:")) filesToDelete.push(u);
      });

      await safeDeleteFiles(filesToDelete);
      await deleteDoc(doc(firestore, "events", selectedId));
      await logDelete(RESOURCE_TYPES.EVENT, selectedId);
      setSuccess("Evento y sus archivos de almacenamiento fueron eliminados con éxito.");
      resetForm();
      fetchEvents();
    } catch (e) {
      console.error("Error al eliminar evento:", e);
      setError("Error al eliminar el evento o sus archivos de Storage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.subtitle}>Gestión de Eventos</h3>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {/* Live Search & Select */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className={styles.helpText}>Buscar evento por título o seleccionar de la lista:</p>
        <SearchableDropdown
          items={events}
          onSelect={(item) => handleSelectEvent(item.id)}
          placeholder="Buscar evento por título..."
          emptyMessage="No se encontraron eventos con ese título"
          getLabel={(item) => item.title}
          getSubtitle={(item) => (item.status ? `Estado: ${item.status}` : "")}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={selectedId || ""}
            onChange={(e) => handleSelectEvent(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          >
            <option value="">-- Crear Nuevo Evento --</option>
            {events.map((ev) => {
              const st = calculateExhibitionStatus(ev.startDate, ev.endDate);
              const label = st === "actual" ? "En curso" : st === "proxima" ? "Próximo" : "Pasado";
              return (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({label})
                </option>
              );
            })}
          </select>
          {selectedId && (
            <>
              <button
                onClick={resetForm}
                className={styles.loginButton}
                style={{ width: "auto", padding: "0.5rem 1rem", backgroundColor: "#666" }}
              >
                Limpiar
              </button>
              {/* <button
                onClick={handleDelete}
                className={styles.loginButton}
                style={{ width: "auto", padding: "0.5rem 1rem", backgroundColor: "#b30000", color: "#fff" }}
                title="Eliminar este evento y todos sus archivos de Storage"
              >
                🗑 Eliminar
              </button> */}
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <p className={styles.helpText}>Título del Evento *</p>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Concierto de Apertura / Charla con Artistas"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Subtítulo / Epígrafe</p>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Ej: Diálogo abierto sobre arte contemporáneo"
            className={styles.input}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Fecha de Inicio</p>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={styles.input}
            />
          </div>

          <div>
            <p className={styles.helpText}>Fecha de Cierre</p>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={styles.input}
            />
          </div>
        </div>

        {(formData.startDate || formData.endDate) && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "#666",
              marginTop: "-0.25rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              borderLeft: "3px solid #111",
            }}
          >
            Estado detectado automáticamente:{" "}
            <strong style={{ textTransform: "uppercase", color: "#000" }}>
              {calculateExhibitionStatus(formData.startDate, formData.endDate) === "actual"
                ? "En Curso (Agenda)"
                : calculateExhibitionStatus(formData.startDate, formData.endDate) === "proxima"
                  ? "Próximamente"
                  : "Pasado (Archivo)"}
            </strong>
          </div>
        )}

        <div>
          <p className={styles.helpText}>Ubicación / Sala</p>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ej: Sala Principal / Auditorio"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Curaduría / Coordinación (Opcional)</p>
          <input
            type="text"
            value={formData.curator}
            onChange={(e) => setFormData({ ...formData, curator: e.target.value })}
            placeholder="Ej: Lic. María González"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Enlace Recorrido 360° (Opcional)</p>
          <input
            type="url"
            value={formData.tour360Url}
            onChange={(e) => setFormData({ ...formData, tour360Url: e.target.value })}
            placeholder="https://my.matterport.com/show/?m=..."
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Descripción (Salto doble de línea para párrafos)</p>
          <textarea
            rows={5}
            value={formData.descriptionText}
            onChange={(e) => setFormData({ ...formData, descriptionText: e.target.value })}
            placeholder="Escribe la descripción detallada del evento..."
            className={styles.input}
          />
        </div>

        {/* Cover Image Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Imagen de Portada (Arrastrá la imagen aquí o hacé clic)</p>
          <div
            className={`${styles.profilePictureDropZone} ${isCoverDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsCoverDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsCoverDragOver(false);
            }}
            onDrop={handleCoverDrop}
            onClick={() => coverInputRef.current?.click()}
            style={{ width: "100%", padding: "2rem", minHeight: "150px" }}
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setCoverFile(file);
                  setCoverPreview(URL.createObjectURL(file));
                }
              }}
            />
            {coverPreview ? (
              <div style={{ textAlign: "center" }}>
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  style={{
                    width: "220px",
                    height: "130px",
                    objectFit: "cover",
                    marginBottom: "0.5rem",
                    borderRadius: "4px",
                  }}
                />
                <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
                  Haz clic o arrastra para reemplazar la portada
                </p>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  style={{
                    backgroundColor: "#b30000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  🗑 Quitar y eliminar portada de Storage
                </button>
              </div>
            ) : (
              <div className={styles.profilePicturePlaceholder}>
                <p>Arrastrá una imagen de portada o haz clic para subir</p>
              </div>
            )}
          </div>
        </div>

        {/* PDF Document Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>
            Folleto o Programa en PDF (Arrastrá el archivo o hacé clic)
          </p>
          <div
            className={`${styles.cvDropZone} ${isPdfDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsPdfDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsPdfDragOver(false);
            }}
            onDrop={handlePdfDrop}
            onClick={() => pdfInputRef.current?.click()}
            style={{ width: "100%", padding: "1.5rem" }}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => setPdfFile(e.target.files[0] || null)}
            />
            {pdfFile ? (
              <div className={styles.cvFileSelected}>
                <p style={{ color: "green", fontWeight: "700" }}>
                  Archivo PDF seleccionado: {pdfFile.name}
                </p>
                <span>Hacé clic para cambiar archivo</span>
              </div>
            ) : pdfUrl ? (
              <div className={styles.cvFileSelected}>
                <p style={{ color: "green", fontWeight: "700" }}>
                  ✓ Documento PDF adjunto disponible
                </p>
                <span>Hacé clic o arrastrá para reemplazar</span>
              </div>
            ) : (
              <div className={styles.cvFilePlaceholder}>
                <p>Arrastrá el archivo PDF del evento aquí o hacé clic para explorar</p>
              </div>
            )}
          </div>
          {(pdfFile || pdfUrl) && (
            <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
              <button
                type="button"
                onClick={handleRemovePdf}
                style={{
                  backgroundColor: "#b30000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🗑 Quitar y eliminar PDF de Storage
              </button>
            </div>
          )}
        </div>

        {/* Event Gallery Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>
            Imágenes de Registro / Galería del Evento (Arrastrá archivos o hacé clic)
          </p>
          <div
            className={`${styles.cvDropZone} ${isGalleryDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsGalleryDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsGalleryDragOver(false);
            }}
            onDrop={handleGalleryDrop}
            onClick={() => galleryInputRef.current?.click()}
            style={{ width: "100%", padding: "1.5rem" }}
          >
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setGalleryImages((prev) => [...prev, ...files]);
              }}
            />
            <div className={styles.cvFilePlaceholder}>
              <p>Arrastrá fotos del evento aquí</p>
            </div>
          </div>

          {(existingGallery.length > 0 || galleryImages.length > 0) && (
            <div style={{ marginTop: "1rem" }}>
              <p className={styles.helpText}>
                Imágenes de Galería ({existingGallery.length + galleryImages.length}):
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: "0.5rem",
                }}
              >
                {existingGallery.map((img, idx) => (
                  <div
                    key={`existing-${idx}`}
                    style={{
                      position: "relative",
                      borderRadius: "4px",
                      overflow: "hidden",
                      border: "1px solid #ddd",
                    }}
                  >
                    <img
                      src={typeof img === "string" ? img : img.url}
                      alt={`Gallery ${idx}`}
                      style={{ width: "100%", height: "80px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(180,0,0,0.9)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.75rem",
                        padding: "2px 6px",
                        cursor: "pointer",
                        borderRadius: "3px",
                        fontWeight: "bold",
                      }}
                      title="Eliminar foto de Storage"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {galleryImages.map((file, idx) => (
                  <div
                    key={`new-${idx}`}
                    style={{
                      position: "relative",
                      borderRadius: "4px",
                      overflow: "hidden",
                      border: "1px dashed #444",
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New gallery ${idx}`}
                      style={{ width: "100%", height: "80px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewGalleryImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.75rem",
                        padding: "2px 6px",
                        cursor: "pointer",
                        borderRadius: "3px",
                        fontWeight: "bold",
                      }}
                      title="Descartar archivo nuevo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={handleSubmit} disabled={loading} className={styles.loginButton}>
            {loading ? "Guardando..." : selectedId ? "Actualizar Evento" : "Crear Evento"}
          </button>
          {selectedId && (
            <button
              onClick={handleDelete}
              className={styles.loginButton}
              style={{ backgroundColor: "#990000", color: "#fff" }}
              title="Eliminar evento y todos sus archivos de Storage"
            >
              🗑 Eliminar Evento
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
