"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { logCreate, logUpdate, RESOURCE_TYPES } from "./activityLogger";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import imageCompression from "browser-image-compression";
import styles from "../../styles/uploader.module.css";

const createEmptyForm = () => ({
  title: "",
  subtitle: "",
  date: null,
  description: "",
  links: [{ title: "", url: "" }],
  coverImage: "",
});

export default function NotasUploader() {
  const [formData, setFormData] = useState(() => createEmptyForm());
  const [notasDocs, setNotasDocs] = useState([]);
  const [selectedNotaId, setSelectedNotaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [isCoverDragOver, setIsCoverDragOver] = useState(false);
  const coverImageInputRef = useRef(null);

  const fetchNotasDocuments = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(firestore, "notas"));
      const documents = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const rawDate = data.date;
          const parsedDate =
            rawDate && typeof rawDate.toDate === "function"
              ? rawDate.toDate()
              : rawDate
              ? new Date(rawDate)
              : null;

          const linksFromData = Array.isArray(data.links)
            ? data.links.map((entry) => ({
                title: (entry?.title || "").trim(),
                url: (entry?.url || "").trim(),
              }))
            : typeof data.link === "string" && data.link.trim()
            ? [{ title: "", url: data.link.trim() }]
            : [];

          return {
            id: docSnap.id,
            title: data.title || "Sin título",
            subtitle: data.subtitle || "",
            links: linksFromData,
            link: linksFromData[0]?.url || "",
            description: data.description || "",
            date: parsedDate,
            coverImage: typeof data.coverImage === "string" ? data.coverImage : "",
          };
        })
        .sort((a, b) => {
          const timeA = a.date instanceof Date ? a.date.getTime() : 0;
          const timeB = b.date instanceof Date ? b.date.getTime() : 0;
          return timeB - timeA;
        });

      setNotasDocs(documents);
    } catch (err) {
      console.error("Error fetching notas documents:", err);
      setError("No se pudieron cargar las notas.");
    }
  }, []);

  useEffect(() => {
    fetchNotasDocuments();
  }, [fetchNotasDocuments]);

  useEffect(() => {
    return () => {
      if (coverImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview]);

  const resetForm = () => {
    if (coverImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setFormData(createEmptyForm());
    setSelectedNotaId("");
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = "";
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date || null,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleLinkChange = (index, field, value) => {
    setFormData((prev) => {
      const links = [...(prev.links || [])];
      if (!links[index]) {
        links[index] = { title: "", url: "" };
      }
      links[index] = {
        ...links[index],
        [field]: value,
      };
      return {
        ...prev,
        links,
      };
    });
    setError(null);
    setSuccess(null);
  };

  const addLinkField = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), { title: "", url: "" }],
    }));
    setError(null);
    setSuccess(null);
  };

  const removeLinkField = (index) => {
    setFormData((prev) => {
      const links = (prev.links || []).filter((_, i) => i !== index);
      return {
        ...prev,
        links: links.length > 0 ? links : createEmptyForm().links,
      };
    });
    setError(null);
    setSuccess(null);
  };

  const handleNotaSelection = async (notaId) => {
    setError(null);
    setSuccess(null);

    if (!notaId) {
      resetForm();
      setError(null);
      setSuccess(null);
      return;
    }

    setSelectedNotaId(notaId);

    try {
      const notaDoc = await getDoc(doc(firestore, "notas", notaId));

      if (!notaDoc.exists()) {
        setError("No se encontró la nota seleccionada.");
        resetForm();
        return;
      }

      const data = notaDoc.data();
      const rawDate = data.date;
      const parsedDate =
        rawDate && typeof rawDate.toDate === "function"
          ? rawDate.toDate()
          : rawDate
          ? new Date(rawDate)
          : null;

      const existingCover =
        typeof data.coverImage === "string" && data.coverImage.trim()
          ? data.coverImage.trim()
          : typeof data.image === "string" && data.image.trim()
            ? data.image.trim()
            : "";

      setFormData({
        title: data.title || "",
        subtitle: data.subtitle || "",
        date:
          parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime())
            ? parsedDate
            : null,
        description: data.description || "",
        coverImage: existingCover,
        links: (() => {
          if (Array.isArray(data.links) && data.links.length > 0) {
            return data.links.map((entry) => ({
              title: (entry?.title || "").trim(),
              url: (entry?.url || "").trim(),
            }));
          }
          if (typeof data.link === "string" && data.link.trim()) {
            return [{ title: "", url: data.link.trim() }];
          }
          return createEmptyForm().links;
        })(),
      });

      if (coverImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverImagePreview);
      }
      setCoverImageFile(null);
      setCoverImagePreview(existingCover || null);
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error loading nota document:", err);
      setError("No se pudo cargar la nota seleccionada.");
    }
  };

  const uploadCoverImage = async (notaId) => {
    if (!(coverImageFile instanceof File)) {
      return formData.coverImage || "";
    }

    const compressedFile = await imageCompression(coverImageFile, {
      maxSizeMB: 0.25,
      maxWidthOrHeight: 800,
    });

    const coverRef = ref(
      storage,
      `notas/${notaId}/coverImage/${notaId}_coverImage`
    );
    await uploadBytes(coverRef, compressedFile);
    return getDownloadURL(coverRef);
  };

  const handleCoverImageFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      if (coverImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverImagePreview);
      }
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
      setError(null);
      setSuccess(null);
    } else {
      setError("Por favor selecciona un archivo de imagen válido.");
    }
  };

  const handleCoverDragOver = (event) => {
    event.preventDefault();
    setIsCoverDragOver(true);
  };

  const handleCoverDragLeave = (event) => {
    event.preventDefault();
    setIsCoverDragOver(false);
  };

  const handleCoverDrop = (event) => {
    event.preventDefault();
    setIsCoverDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleCoverImageFile(files[0]);
    }
  };

  const handleCoverFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCoverImageFile(file);
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedTitle = formData.title.trim();
      const trimmedSubtitle = formData.subtitle.trim();
      const trimmedDescription = formData.description.trim();
      const selectedDate = formData.date instanceof Date ? formData.date : null;
      const sanitizedLinks = (formData.links || [])
        .map((entry) => ({
          title: (entry?.title || "").trim(),
          url: (entry?.url || "").trim(),
        }))
        .filter((entry) => entry.url);

      if (!trimmedTitle) {
        throw new Error("El titulo es obligatorio.");
      }

      if (!selectedDate || Number.isNaN(selectedDate.getTime())) {
        throw new Error("Selecciona una fecha valida.");
      }

      if (sanitizedLinks.length === 0) {
        throw new Error("Agrega al menos un enlace valido.");
      }

      const notaId = selectedNotaId || doc(collection(firestore, "notas")).id;

      const coverImageUrl = await uploadCoverImage(notaId);

      const payload = {
        title: trimmedTitle,
        subtitle: trimmedSubtitle,
        description: trimmedDescription,
        date: Timestamp.fromDate(selectedDate),
        links: sanitizedLinks,
        link: sanitizedLinks[0]?.url || "",
        coverImage: coverImageUrl || "",
      };

      if (selectedNotaId) {
        await updateDoc(doc(firestore, "notas", notaId), payload);
        await logUpdate(RESOURCE_TYPES.NOTA, notaId, {
          notaTitle: trimmedTitle,
          fieldsUpdated: Object.keys(payload),
        });
      } else {
        await setDoc(doc(firestore, "notas", notaId), payload);
        await logCreate(RESOURCE_TYPES.NOTA, notaId, {
          notaTitle: trimmedTitle,
        });
      }

      await fetchNotasDocuments();
      await handleNotaSelection(notaId);
      setSuccess(
        selectedNotaId
          ? "¡Nota actualizada con éxito!"
          : "¡Nota creada con éxito!"
      );
    } catch (err) {
      console.error("Error saving nota document:", err);
      setError(err.message || "No se pudo guardar la nota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div>
        <p className={styles.subtitle}>Selecciona una nota para editar</p>
        <select
          value={selectedNotaId}
          onChange={(event) => handleNotaSelection(event.target.value)}
        >
          <option value="">Crear nueva nota</option>
          {notasDocs.map((nota) => (
            <option key={nota.id} value={nota.id}>
              {nota.title}
              {nota.date
                ? ` (${nota.date.toLocaleDateString("es-ES")})`
                : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedNotaId && (
        <div className={styles.artistIdDisplay}>
          <span className={styles.artistIdLabel}>ID de la nota:</span>
          <span className={styles.artistIdValue}>{selectedNotaId}</span>
        </div>
      )}

      <div className={styles.artistInfoContainer}>
        <div className={styles.inputGroup}>
          <p className={styles.subtitle}>Titulo</p>
          <input
            name="title"
            placeholder="Titulo de la nota"
            value={formData.title}
            onChange={handleInputChange("title")}
          />
        </div>

        <div className={styles.inputGroup}>
          <p className={styles.subtitle}>Subtitulo</p>
          <input
            name="subtitle"
            placeholder="Subtitulo de la nota (opcional)"
            value={formData.subtitle}
            onChange={handleInputChange("subtitle")}
          />
        </div>

        <div className={styles.inputGroup}>
          <p className={styles.subtitle}>Fecha</p>
          <DatePicker
            selected={formData.date}
            onChange={handleDateChange}
            placeholderText="Selecciona la fecha de publicacion"
            dateFormat="dd/MM/yyyy"
            isClearable
          />
        </div>

        <div className={styles.profilePictureContainer}>
          <p className={styles.subtitle}>Imagen de portada</p>
          <div
            className={`${styles.profilePictureDropZone} ${isCoverDragOver ? styles.dragOver : ""}`}
            onDragOver={handleCoverDragOver}
            onDragLeave={handleCoverDragLeave}
            onDrop={handleCoverDrop}
            onClick={() => coverImageInputRef.current?.click()}
          >
            {coverImagePreview ? (
              <div className={styles.profilePicturePreview}>
                <img
                  src={coverImagePreview}
                  alt="Vista previa de la portada"
                  className={styles.profilePreviewImage}
                />
                <div className={styles.profilePictureOverlay}>
                  <span>Haz clic o arrastra para cambiar</span>
                </div>
              </div>
            ) : (
              <div className={styles.profilePicturePlaceholder}>
                <p>Arrastra y suelta una imagen aquí</p>
                <p>o haz clic para explorar</p>
                <small>Misma compresión que fotos de miembros (máx. 800px)</small>
              </div>
            )}
          </div>
          <input
            ref={coverImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFileInputChange}
            style={{ display: "none" }}
          />
          <p className={styles.helpText}>
            Opcional. Se comprime, se sube a Storage y la URL queda guardada en la nota.
          </p>
        </div>

        <div className={styles.inputGroup}>
          <p className={styles.subtitle}>Enlaces</p>
          {(formData.links || []).map((linkEntry, index) => (
            <div
              key={`nota-link-${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                padding: "0.75rem",
                border: "1px solid #d7d7d7",
                marginBottom: "1rem",
              }}
            >
              <input
                type="text"
                placeholder="Titulo del enlace (opcional)"
                value={linkEntry.title || ""}
                onChange={(event) =>
                  handleLinkChange(index, "title", event.target.value)
                }
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkEntry.url || ""}
                onChange={(event) =>
                  handleLinkChange(index, "url", event.target.value)
                }
                required
              />
              {(formData.links || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinkField(index)}
                  style={{
                    alignSelf: "flex-end",
                    padding: "0.25rem 0.75rem",
                    background: "transparent",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px",
                  }}
                >
                  Eliminar enlace
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLinkField}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
              fontSize: "0.85rem",
              letterSpacing: "0.5px",
            }}
          >
            Agregar otro enlace
          </button>
          <p className={styles.helpText}>
            Puedes agregar múltiples enlaces relacionados con la nota.
          </p>
        </div>

        <div className={styles.inputGroup}>
          <p className={styles.subtitle}>Descripcion</p>
          <textarea
            name="description"
            placeholder="Resumen de la nota o notas adicionales"
            value={formData.description}
            onChange={handleInputChange("description")}
            rows={4}
          />
          <p className={styles.helpText}>
            Este texto se mostrará junto a la nota en la página.
          </p>
        </div>
      </div>

      <div style={{ margin: "auto" }}>
        <p className={styles.subtitle}>¿Todo listo?</p>
        <button type="submit" disabled={loading}>
          {loading
            ? selectedNotaId
              ? "Actualizando..."
              : "Guardando..."
            : selectedNotaId
            ? "Actualizar nota"
            : "Agregar nota"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </form>
  );
}
