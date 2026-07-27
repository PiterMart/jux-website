"use client";
import { useEffect, useState, useRef } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import { getDocs, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import SearchableDropdown from "../../components/SearchableDropdown";
import { logCreate, logUpdate, logDelete, RESOURCE_TYPES } from "./activityLogger";
import { sanitizeFilename, safeCompressImage, formatUploadError, safeUploadFile } from "./uploadUtils";
import styles from "../../styles/uploader.module.css";

export default function ArtistUploader() {
  const [artists, setArtists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    birthDate: "",
    bioText: "",
    statementText: "",
    website: "",
    instagram: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isCvDragOver, setIsCvDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cvInputRef = useRef(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const snap = await getDocs(collection(firestore, "artists"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setArtists(list);
    } catch (e) {
      console.error("Error fetching artists:", e);
    }
  };

  const handleSelectArtist = async (id) => {
    setSelectedId(id);
    if (!id) {
      resetForm();
      return;
    }
    const artistDoc = await getDoc(doc(firestore, "artists", id));
    if (artistDoc.exists()) {
      const d = artistDoc.data();
      setFormData({
        name: d.name || "",
        origin: d.origin || "",
        birthDate: d.birthDate || "",
        bioText: Array.isArray(d.bio) ? d.bio.join("\n\n") : d.bio || "",
        statementText: Array.isArray(d.statement) ? d.statement.join("\n\n") : d.statement || "",
        website: d.website || d.web || "",
        instagram: d.instagram || "",
      });
      setImagePreview(d.profilePicture || null);
      setImageFile(null);
      setCvUrl(d.cvUrl || null);
      setCvFile(null);
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData({
      name: "",
      origin: "",
      birthDate: "",
      bioText: "",
      statementText: "",
      website: "",
      instagram: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setCvFile(null);
    setCvUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cvInputRef.current) cvInputRef.current.value = "";
  };

  // Image Drag & Drop Handlers
  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setImageFile(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
    }
  };

  // CV Drag & Drop Handlers
  const handleCvDrop = (e) => {
    e.preventDefault();
    setIsCvDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setCvFile(files[0]);
    } else {
      setError("Por favor selecciona un archivo PDF válido para el CV.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.name.trim()) {
        throw new Error("El nombre del artista es obligatorio.");
      }

      const id = selectedId || doc(collection(firestore, "artists")).id;
      let profilePictureUrl = imagePreview;

      // 1. Image upload
      if (imageFile) {
        const compressed = await safeCompressImage(imageFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1400,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(imageFile.name);
        profilePictureUrl = await safeUploadFile(`artists/${id}/profile_${Date.now()}_${safeName}`, compressed, {
          contentType: imageFile.type || "image/jpeg",
        });
      }

      // 2. CV PDF upload
      let finalCvUrl = cvUrl;
      if (cvFile) {
        const safeCvName = sanitizeFilename(cvFile.name);
        finalCvUrl = await safeUploadFile(`artists/${id}/cv_${Date.now()}_${safeCvName}`, cvFile, {
          contentType: "application/pdf",
        });
      }

      const bioArray = formData.bioText
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const statementArray = formData.statementText
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        origin: formData.origin.trim(),
        birthDate: formData.birthDate.trim(),
        bio: bioArray,
        statement: statementArray,
        website: formData.website.trim(),
        instagram: formData.instagram.trim(),
        profilePicture: profilePictureUrl || "",
        cvUrl: finalCvUrl || "",
        updatedAt: new Date().toISOString(),
      };

      if (selectedId) {
        await updateDoc(doc(firestore, "artists", selectedId), payload);
        await logUpdate(RESOURCE_TYPES.ARTIST, selectedId, { name: payload.name });
        setSuccess("Artista actualizado con éxito.");
      } else {
        await setDoc(doc(firestore, "artists", id), payload);
        await logCreate(RESOURCE_TYPES.ARTIST, id, { name: payload.name });
        setSuccess("Artista creado con éxito.");
      }

      resetForm();
      fetchArtists();
    } catch (e) {
      console.error("Error en submit de artista:", e);
      setError(formatUploadError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("¿Estás seguro de eliminar este artista?")) return;
    try {
      await deleteDoc(doc(firestore, "artists", selectedId));
      await logDelete(RESOURCE_TYPES.ARTIST, selectedId);
      setSuccess("Artista eliminado.");
      resetForm();
      fetchArtists();
    } catch (e) {
      setError("Error al eliminar el artista.");
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.subtitle}>Gestión de Artistas</h3>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {/* Live Search & Select */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className={styles.helpText}>Buscar artista por nombre o seleccionar de la lista:</p>
        <SearchableDropdown
          items={artists}
          onSelect={(item) => handleSelectArtist(item.id)}
          placeholder="Buscar artista por nombre..."
          emptyMessage="No se encontraron artistas con ese nombre"
          getLabel={(item) => item.name}
          getSubtitle={(item) => item.origin ? `Origen: ${item.origin}` : ""}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={selectedId || ""}
            onChange={(e) => handleSelectArtist(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          >
            <option value="">-- Crear Nuevo Artista --</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {selectedId && (
            <button onClick={resetForm} className={styles.loginButton} style={{ width: "auto", padding: "0.5rem 1rem", backgroundColor: "#666" }}>
              + Nuevo
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <p className={styles.helpText}>Nombre del artista *</p>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Marta Minujín"
            className={styles.input}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Nacionalidad / Origen</p>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder="Ej: Buenos Aires, Argentina"
              className={styles.input}
            />
          </div>
          <div>
            <p className={styles.helpText}>Año / Fecha de Nacimiento</p>
            <input
              type="text"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              placeholder="Ej: 1943"
              className={styles.input}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Sitio web</p>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
              className={styles.input}
            />
          </div>
          <div>
            <p className={styles.helpText}>Instagram</p>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@usuario"
              className={styles.input}
            />
          </div>
        </div>

        <div>
          <p className={styles.helpText}>Biografía del artista (Salto de línea doble para párrafos)</p>
          <textarea
            rows={5}
            value={formData.bioText}
            onChange={(e) => setFormData({ ...formData, bioText: e.target.value })}
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Statement de artista (Opcional)</p>
          <textarea
            rows={4}
            value={formData.statementText}
            onChange={(e) => setFormData({ ...formData, statementText: e.target.value })}
            className={styles.input}
          />
        </div>

        {/* Profile Picture Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Foto de Perfil del Artista (Arrastrá la imagen aquí o hacé clic)</p>
          <div
            className={`${styles.profilePictureDropZone} ${isDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleImageDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ width: "100%", padding: "2rem", minHeight: "150px" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
            {imagePreview ? (
              <div style={{ textAlign: "center" }}>
                <img src={imagePreview} alt="Preview" style={{ width: "130px", height: "130px", objectFit: "cover", borderRadius: "50%", marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", color: "#666" }}>Haz clic o arrastra para reemplazar la imagen</p>
              </div>
            ) : (
              <div className={styles.profilePicturePlaceholder}>
                <p>📷 Arrastrá una imagen o haz clic para subir</p>
                <small>Formatos JPG, PNG, WEBP (Máx 5MB)</small>
              </div>
            )}
          </div>
        </div>

        {/* PDF CV Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Curriculum Vitae (PDF - Arrastrá el archivo o hacé clic)</p>
          <div
            className={`${styles.cvDropZone} ${isCvDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsCvDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsCvDragOver(false); }}
            onDrop={handleCvDrop}
            onClick={() => cvInputRef.current?.click()}
            style={{ width: "100%", padding: "1.5rem" }}
          >
            <input
              ref={cvInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => setCvFile(e.target.files[0] || null)}
            />
            {cvFile ? (
              <div className={styles.cvFileSelected}>
                <p style={{ color: "green", fontWeight: "700" }}>📄 Archivo PDF seleccionado: {cvFile.name}</p>
                <span>Hacé clic para cambiar archivo</span>
              </div>
            ) : cvUrl ? (
              <div className={styles.cvFileSelected}>
                <p style={{ color: "green", fontWeight: "700" }}>✓ CV en PDF adjunto disponible</p>
                <span>Hacé clic o arrastrá para reemplazar</span>
              </div>
            ) : (
              <div className={styles.cvFilePlaceholder}>
                <p>📄 Arrastrá tu CV en PDF aquí o hacé clic para explorar</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={handleSubmit} disabled={loading} className={styles.loginButton}>
            {loading ? "Guardando..." : selectedId ? "Actualizar Artista" : "Crear Artista"}
          </button>
          {selectedId && (
            <button onClick={handleDelete} className={styles.loginButton} style={{ backgroundColor: "#990000", color: "#fff" }}>
              Eliminar
            </button>
          )}
          <button onClick={resetForm} className={styles.loginButton} style={{ backgroundColor: "#555", color: "#fff" }}>
            Cancelar / Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
