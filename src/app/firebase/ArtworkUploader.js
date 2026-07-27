"use client";
import { useEffect, useState, useRef } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import { getDocs, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import SearchableDropdown from "../../components/SearchableDropdown";
import { syncArtworkRelations } from "./relationalSync";
import { logCreate, logUpdate, logDelete, RESOURCE_TYPES } from "./activityLogger";
import { sanitizeFilename, safeCompressImage, formatUploadError, safeUploadFile } from "./uploadUtils";
import styles from "../../styles/uploader.module.css";

const AVAILABILITY_OPTIONS = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "VENDIDA", label: "Vendida" },
  { value: "EN_COLECCION", label: "En Colección" },
  { value: "RESERVADA", label: "Reservada" },
  { value: "NO_EN_VENTA", label: "No a la venta" },
];

export default function ArtworkUploader() {
  const [artworks, setArtworks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    year: "",
    technique: "",
    dimensions: "",
    artistId: "",
    artistName: "",
    exhibitionId: "",
    exhibitionTitle: "",
    location: "",
    description: "",
    price: "",
    availability_status: "DISPONIBLE",
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  const [existingDetailUrls, setExistingDetailUrls] = useState([]);

  const [isCoverDragOver, setIsCoverDragOver] = useState(false);
  const [isDetailDragOver, setIsDetailDragOver] = useState(false);

  const coverInputRef = useRef(null);
  const detailInputRef = useRef(null);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const artSnap = await getDocs(collection(firestore, "artworks"));
      const artList = artSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      artList.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setArtworks(artList);

      const artistSnap = await getDocs(collection(firestore, "artists"));
      setArtists(artistSnap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id })));

      const exSnap = await getDocs(collection(firestore, "exhibitions"));
      setExhibitions(exSnap.docs.map((d) => ({ id: d.id, title: d.data().title || d.id })));
    } catch (e) {
      console.error("Error fetching catalogs:", e);
    }
  };

  const handleSelectArtwork = async (id) => {
    setSelectedId(id);
    if (!id) {
      resetForm();
      return;
    }
    const artDoc = await getDoc(doc(firestore, "artworks", id));
    if (artDoc.exists()) {
      const d = artDoc.data();
      setFormData({
        title: d.title || "",
        year: d.year || d.date || "",
        technique: d.technique || d.medium || "",
        dimensions: d.dimensions || d.measurements || "",
        artistId: d.artistId || "",
        artistName: d.artistName || "",
        exhibitionId: d.exhibitionId || "",
        exhibitionTitle: d.exhibitionTitle || "",
        location: d.location || "",
        description: d.description || "",
        price: d.price ? String(d.price) : "",
        availability_status: d.availability_status || "DISPONIBLE",
      });
      setCoverPreview(d.coverImage || d.url || null);
      setCoverFile(null);
      setExistingDetailUrls(d.images || d.detailImages || []);
      setDetailFiles([]);
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData({
      title: "",
      year: "",
      technique: "",
      dimensions: "",
      artistId: "",
      artistName: "",
      exhibitionId: "",
      exhibitionTitle: "",
      location: "",
      description: "",
      price: "",
      availability_status: "DISPONIBLE",
    });
    setCoverFile(null);
    setCoverPreview(null);
    setDetailFiles([]);
    setExistingDetailUrls([]);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (detailInputRef.current) detailInputRef.current.value = "";
  };

  const handleArtistSelect = (artistId) => {
    const found = artists.find((a) => a.id === artistId);
    setFormData((prev) => ({
      ...prev,
      artistId: artistId || "",
      artistName: found ? found.name : "",
    }));
  };

  const handleExhibitionSelect = (exhibitionId) => {
    const found = exhibitions.find((ex) => ex.id === exhibitionId);
    setFormData((prev) => ({
      ...prev,
      exhibitionId: exhibitionId || "",
      exhibitionTitle: found ? found.title : "",
    }));
  };

  // Drag & Drop Handlers for Cover Image
  const handleCoverDrop = (e) => {
    e.preventDefault();
    setIsCoverDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setCoverFile(files[0]);
      setCoverPreview(URL.createObjectURL(files[0]));
    }
  };

  // Drag & Drop Handlers for Detail Images
  const handleDetailDrop = (e) => {
    e.preventDefault();
    setIsDetailDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      setDetailFiles((prev) => [...prev, ...files]);
    }
  };

  const removeDetailFile = (index) => {
    setDetailFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDetailUrl = (index) => {
    setExistingDetailUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.title.trim()) {
        throw new Error("El título de la obra es obligatorio.");
      }

      const id = selectedId || doc(collection(firestore, "artworks")).id;

      // 1. Upload Cover Image
      let coverImageUrl = coverPreview;
      if (coverFile) {
        const compressed = await safeCompressImage(coverFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(coverFile.name);
        coverImageUrl = await safeUploadFile(`artworks/${id}/cover_${Date.now()}_${safeName}`, compressed, {
          contentType: coverFile.type || "image/jpeg",
        });
      }

      // 2. Upload New Detail Images
      const finalDetailUrls = [...existingDetailUrls];
      for (let i = 0; i < detailFiles.length; i++) {
        const file = detailFiles[i];
        const compressed = await safeCompressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(file.name || `detail_${i}.jpg`);
        const url = await safeUploadFile(`artworks/${id}/detail_${Date.now()}_${i}_${safeName}`, compressed, {
          contentType: file.type || "image/jpeg",
        });
        finalDetailUrls.push(url);
      }

      const payload = {
        title: formData.title.trim(),
        year: formData.year.trim(),
        date: formData.year.trim(),
        technique: formData.technique.trim(),
        medium: formData.technique.trim(),
        dimensions: formData.dimensions.trim(),
        measurements: formData.dimensions.trim(),
        artistId: formData.artistId,
        artistName: formData.artistName,
        exhibitionId: formData.exhibitionId,
        exhibitionTitle: formData.exhibitionTitle,
        location: formData.location.trim(),
        description: formData.description.trim(),
        price: formData.price.trim(),
        availability_status: formData.availability_status,
        coverImage: coverImageUrl || "",
        url: coverImageUrl || "",
        images: finalDetailUrls,
        updatedAt: new Date().toISOString(),
      };

      if (selectedId) {
        await updateDoc(doc(firestore, "artworks", selectedId), payload);
        await logUpdate(RESOURCE_TYPES.ARTWORK, selectedId, { title: payload.title });
        setSuccess("Obra actualizada con éxito.");
      } else {
        await setDoc(doc(firestore, "artworks", id), payload);
        await logCreate(RESOURCE_TYPES.ARTWORK, id, { title: payload.title });
        setSuccess("Obra creada con éxito.");
      }

      // Multi-directional reference sync
      await syncArtworkRelations(id, payload);

      resetForm();
      fetchCatalogs();
    } catch (e) {
      console.error("Error en submit de obra:", e);
      setError(formatUploadError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("¿Estás seguro de eliminar esta obra?")) return;
    try {
      await deleteDoc(doc(firestore, "artworks", selectedId));
      await logDelete(RESOURCE_TYPES.ARTWORK, selectedId);
      setSuccess("Obra eliminada.");
      resetForm();
      fetchCatalogs();
    } catch (e) {
      setError("Error al eliminar la obra.");
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.subtitle}>Gestión de Obras (Artworks)</h3>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {/* Live Search & Select */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className={styles.helpText}>Buscar obra por título o seleccionar de la lista:</p>
        <SearchableDropdown
          items={artworks}
          onSelect={(item) => handleSelectArtwork(item.id)}
          placeholder="Buscar obra por título..."
          emptyMessage="No se encontraron obras con ese título"
          getLabel={(item) => item.title}
          getSubtitle={(item) => item.artistName ? `Artista: ${item.artistName}` : ""}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={selectedId || ""}
            onChange={(e) => handleSelectArtwork(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          >
            <option value="">-- Crear Nueva Obra --</option>
            {artworks.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} {a.artistName ? `(${a.artistName})` : ""}
              </option>
            ))}
          </select>
          {selectedId && (
            <button onClick={resetForm} className={styles.loginButton} style={{ width: "auto", padding: "0.5rem 1rem", backgroundColor: "#666" }}>
              + Nueva
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <p className={styles.helpText}>Título de la obra *</p>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Sin Título N° 4"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Artista de la obra</p>
          <select
            value={formData.artistId}
            onChange={(e) => handleArtistSelect(e.target.value)}
            className={styles.input}
          >
            <option value="">-- Seleccionar Artista --</option>
            {artists.map((art) => (
              <option key={art.id} value={art.id}>
                {art.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className={styles.helpText}>Exhibición asociada (Opcional)</p>
          <select
            value={formData.exhibitionId}
            onChange={(e) => handleExhibitionSelect(e.target.value)}
            className={styles.input}
          >
            <option value="">-- Ninguna / Colección --</option>
            {exhibitions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Año</p>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              placeholder="Ej: 2024"
              className={styles.input}
            />
          </div>
          <div>
            <p className={styles.helpText}>Ubicación / Sala</p>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Sala Principal, Depósito"
              className={styles.input}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Técnica / Soporte</p>
            <input
              type="text"
              value={formData.technique}
              onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
              placeholder="Ej: Óleo sobre lienzo"
              className={styles.input}
            />
          </div>
          <div>
            <p className={styles.helpText}>Medidas</p>
            <input
              type="text"
              value={formData.dimensions}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              placeholder="Ej: 150 x 120 cm"
              className={styles.input}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Precio</p>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ej: USD 3.500"
              className={styles.input}
            />
          </div>
          <div>
            <p className={styles.helpText}>Estado de Disponibilidad</p>
            <select
              value={formData.availability_status}
              onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
              className={styles.input}
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className={styles.helpText}>Descripción de la obra</p>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={styles.input}
          />
        </div>

        {/* Cover Image Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Imagen Principal de la Obra (Arrastrá la imagen aquí o hacé clic)</p>
          <div
            className={`${styles.profilePictureDropZone} ${isCoverDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsCoverDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsCoverDragOver(false); }}
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
                <img src={coverPreview} alt="Preview" style={{ width: "150px", height: "150px", objectFit: "contain", background: "#f5f5f5", marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", color: "#666" }}>Haz clic o arrastra para reemplazar la imagen principal</p>
              </div>
            ) : (
              <div className={styles.profilePicturePlaceholder}>
                <p>🖼️ Arrastrá la imagen principal o haz clic para subir</p>
              </div>
            )}
          </div>
        </div>

        {/* Multiple Detail Images Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Imágenes de Detalle / Vistas Adicionales (Arrastrá archivos o hacé clic)</p>
          <div
            className={`${styles.cvDropZone} ${isDetailDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDetailDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDetailDragOver(false); }}
            onDrop={handleDetailDrop}
            onClick={() => detailInputRef.current?.click()}
            style={{ width: "100%", padding: "1.5rem" }}
          >
            <input
              ref={detailInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setDetailFiles((prev) => [...prev, ...files]);
              }}
            />
            <div className={styles.cvFilePlaceholder}>
              <p>📸 Arrastrá imágenes de detalle aquí o hacé clic para explorar</p>
            </div>
          </div>

          {/* Existing & New Detail Images Previews */}
          {(existingDetailUrls.length > 0 || detailFiles.length > 0) && (
            <div style={{ marginTop: "1rem" }}>
              <p className={styles.helpText}>Vistas de Detalle ({existingDetailUrls.length + detailFiles.length}):</p>
              <div className={styles.detailImagesContainer}>
                {existingDetailUrls.map((url, idx) => (
                  <div key={`existing-${idx}`} style={{ position: "relative" }}>
                    <img src={url} alt={`Detail ${idx}`} className={styles.detailPreviewImage} />
                    <button
                      type="button"
                      onClick={() => removeExistingDetailUrl(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(200,0,0,0.8)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.7rem",
                        padding: "2px 5px",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}

                {detailFiles.map((file, idx) => (
                  <div key={`file-${idx}`} style={{ position: "relative" }}>
                    <img src={URL.createObjectURL(file)} alt={`New detail ${idx}`} className={styles.detailPreviewImage} />
                    <button
                      type="button"
                      onClick={() => removeDetailFile(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(200,0,0,0.8)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.7rem",
                        padding: "2px 5px",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={handleSubmit} disabled={loading} className={styles.loginButton}>
            {loading ? "Guardando..." : selectedId ? "Actualizar Obra" : "Crear Obra"}
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
