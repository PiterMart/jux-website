"use client";
import { useEffect, useState, useRef } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import { getDocs, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import SearchableDropdown from "../../components/SearchableDropdown";
import { syncExhibitionRelations } from "./relationalSync";
import { logCreate, logUpdate, logDelete, RESOURCE_TYPES } from "./activityLogger";
import { sanitizeFilename, safeCompressImage, formatUploadError } from "./uploadUtils";
import styles from "../../styles/uploader.module.css";

export default function ExhibitionUploader() {
  const [exhibitions, setExhibitions] = useState([]);
  const [artistsCatalog, setArtistsCatalog] = useState([]);
  const [artworksCatalog, setArtworksCatalog] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    status: "actual",
    startDate: "",
    endDate: "",
    location: "Sala Principal",
    curator: "",
    descriptionText: "",
    tour360Url: "",
    selectedArtistIds: [],
    selectedArtworkIds: [],
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [galleryImages, setGalleryImages] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);

  const [isCoverDragOver, setIsCoverDragOver] = useState(false);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const [isGalleryDragOver, setIsGalleryDragOver] = useState(false);

  const coverInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const exSnap = await getDocs(collection(firestore, "exhibitions"));
      const exList = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExhibitions(exList);

      const artistSnap = await getDocs(collection(firestore, "artists"));
      setArtistsCatalog(artistSnap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id })));

      const artSnap = await getDocs(collection(firestore, "artworks"));
      setArtworksCatalog(artSnap.docs.map((d) => ({ id: d.id, title: d.data().title || d.id, coverImage: d.data().coverImage || "" })));
    } catch (e) {
      console.error("Error fetching catalogs:", e);
    }
  };

  const handleSelectExhibition = async (id) => {
    setSelectedId(id);
    if (!id) {
      resetForm();
      return;
    }
    const exDoc = await getDoc(doc(firestore, "exhibitions", id));
    if (exDoc.exists()) {
      const d = exDoc.data();
      setFormData({
        title: d.title || "",
        subtitle: d.subtitle || "",
        status: d.status || "actual",
        startDate: d.startDate || "",
        endDate: d.endDate || "",
        location: d.location || "",
        curator: d.curator || "",
        descriptionText: Array.isArray(d.description) ? d.description.join("\n\n") : d.description || "",
        tour360Url: d.tour360Url || "",
        selectedArtistIds: Array.isArray(d.artistIds) ? d.artistIds : (d.artists || []).map((a) => a.id).filter(Boolean),
        selectedArtworkIds: Array.isArray(d.artworkIds) ? d.artworkIds : (d.artworks || []).map((a) => a.id).filter(Boolean),
      });
      setCoverPreview(d.coverImage || null);
      setCoverFile(null);
      setPdfUrl(d.pdfCatalog || null);
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
      status: "actual",
      startDate: "",
      endDate: "",
      location: "Sala Principal",
      curator: "",
      descriptionText: "",
      tour360Url: "",
      selectedArtistIds: [],
      selectedArtworkIds: [],
    });
    setCoverFile(null);
    setCoverPreview(null);
    setPdfFile(null);
    setPdfUrl(null);
    setGalleryImages([]);
    setExistingGallery([]);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const toggleArtistSelection = (artistId) => {
    setFormData((prev) => {
      const current = prev.selectedArtistIds;
      const next = current.includes(artistId)
        ? current.filter((id) => id !== artistId)
        : [...current, artistId];
      return { ...prev, selectedArtistIds: next };
    });
  };

  const toggleArtworkSelection = (artworkId) => {
    setFormData((prev) => {
      const current = prev.selectedArtworkIds;
      const next = current.includes(artworkId)
        ? current.filter((id) => id !== artworkId)
        : [...current, artworkId];
      return { ...prev, selectedArtworkIds: next };
    });
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

  // Drag & Drop for PDF Catalog
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

  const removeExistingGalleryImage = (index) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
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
        throw new Error("El título de la exhibición es obligatorio.");
      }

      const id = selectedId || doc(collection(firestore, "exhibitions")).id;

      // 1. Cover Image Upload
      let coverImageUrl = coverPreview;
      if (coverFile) {
        const compressed = await safeCompressImage(coverFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(coverFile.name);
        const imgRef = ref(storage, `exhibitions/${id}/cover_${Date.now()}_${safeName}`);
        await uploadBytes(imgRef, compressed, { contentType: coverFile.type || "image/jpeg" });
        coverImageUrl = await getDownloadURL(imgRef);
      }

      // 2. PDF Catalog Upload
      let finalPdfUrl = pdfUrl;
      if (pdfFile) {
        const safePdfName = sanitizeFilename(pdfFile.name);
        const pdfStorageRef = ref(storage, `exhibitions/${id}/catalog_${Date.now()}_${safePdfName}`);
        await uploadBytes(pdfStorageRef, pdfFile, { contentType: "application/pdf" });
        finalPdfUrl = await getDownloadURL(pdfStorageRef);
      }

      // 3. New Gallery Uploads
      const uploadedGallery = [...existingGallery];
      for (let i = 0; i < galleryImages.length; i++) {
        const file = galleryImages[i];
        const compressed = await safeCompressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(file.name || `gallery_${i}.jpg`);
        const gRef = ref(storage, `exhibitions/${id}/gallery_${Date.now()}_${i}_${safeName}`);
        await uploadBytes(gRef, compressed, { contentType: file.type || "image/jpeg" });
        const url = await getDownloadURL(gRef);
        uploadedGallery.push({ url, description: "" });
      }

      const descriptionArray = formData.descriptionText
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const linkedArtists = artistsCatalog
        .filter((a) => formData.selectedArtistIds.includes(a.id))
        .map((a) => ({ id: a.id, name: a.name }));

      const linkedArtworks = artworksCatalog
        .filter((art) => formData.selectedArtworkIds.includes(art.id))
        .map((art) => ({ id: art.id, title: art.title, image: art.coverImage }));

      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        status: formData.status,
        startDate: formData.startDate.trim(),
        endDate: formData.endDate.trim(),
        location: formData.location.trim(),
        curator: formData.curator.trim(),
        description: descriptionArray,
        tour360Url: formData.tour360Url.trim(),
        artistIds: formData.selectedArtistIds,
        artworkIds: formData.selectedArtworkIds,
        artists: linkedArtists,
        artworks: linkedArtworks,
        coverImage: coverImageUrl || "",
        pdfCatalog: finalPdfUrl || "",
        gallery: uploadedGallery,
        updatedAt: new Date().toISOString(),
      };

      if (selectedId) {
        await updateDoc(doc(firestore, "exhibitions", selectedId), payload);
        await logUpdate(RESOURCE_TYPES.EXHIBITION, selectedId, { title: payload.title });
        setSuccess("Exhibición actualizada con éxito.");
      } else {
        await setDoc(doc(firestore, "exhibitions", id), payload);
        await logCreate(RESOURCE_TYPES.EXHIBITION, id, { title: payload.title });
        setSuccess("Exhibición creada con éxito.");
      }

      // Multi-directional cross-linking
      await syncExhibitionRelations(id, payload.title, formData.selectedArtistIds, formData.selectedArtworkIds);

      resetForm();
      fetchCatalogs();
    } catch (e) {
      console.error("Error en submit de exhibición:", e);
      setError(formatUploadError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("¿Estás seguro de eliminar esta exhibición?")) return;
    try {
      await deleteDoc(doc(firestore, "exhibitions", selectedId));
      await logDelete(RESOURCE_TYPES.EXHIBITION, selectedId);
      setSuccess("Exhibición eliminada.");
      resetForm();
      fetchCatalogs();
    } catch (e) {
      setError("Error al eliminar la exhibición.");
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.subtitle}>Gestión de Exhibiciones</h3>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {/* Live Search & Select */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className={styles.helpText}>Buscar exhibición por título o seleccionar de la lista:</p>
        <SearchableDropdown
          items={exhibitions}
          onSelect={(item) => handleSelectExhibition(item.id)}
          placeholder="Buscar exhibición por título..."
          emptyMessage="No se encontraron exhibiciones con ese título"
          getLabel={(item) => item.title}
          getSubtitle={(item) => item.status ? `Estado: ${item.status}` : ""}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={selectedId || ""}
            onChange={(e) => handleSelectExhibition(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          >
            <option value="">-- Crear Nueva Exhibición --</option>
            {exhibitions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.status === "actual" ? "En curso" : ex.status === "proxima" ? "Próxima" : "Pasada"})
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
          <p className={styles.helpText}>Título de la exhibición *</p>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Geometrías del Tiempo"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Subtítulo / Bajada</p>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Ej: Retrospectiva de arte contemporáneo"
            className={styles.input}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Estado de la Exhibición</p>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={styles.input}
            >
              <option value="actual">En curso (Actual)</option>
              <option value="pasada">Pasada (Archivo)</option>
              <option value="proxima">Próxima</option>
            </select>
          </div>

          <div>
            <p className={styles.helpText}>Fecha de Inicio</p>
            <input
              type="text"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              placeholder="Ej: 15 Marzo 2025"
              className={styles.input}
            />
          </div>

          <div>
            <p className={styles.helpText}>Fecha de Cierre</p>
            <input
              type="text"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              placeholder="Ej: 30 Mayo 2025"
              className={styles.input}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className={styles.helpText}>Ubicación / Sala</p>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Sala Principal - Planta Baja"
              className={styles.input}
            />
          </div>
          <div>
            <p className={styles.helpText}>Curaduría</p>
            <input
              type="text"
              value={formData.curator}
              onChange={(e) => setFormData({ ...formData, curator: e.target.value })}
              placeholder="Ej: Equipo Curatorial Galería"
              className={styles.input}
            />
          </div>
        </div>

        <div>
          <p className={styles.helpText}>Enlace / Embed de Recorrido 360°</p>
          <input
            type="text"
            value={formData.tour360Url}
            onChange={(e) => setFormData({ ...formData, tour360Url: e.target.value })}
            placeholder="https://my.matterport.com/show/?m=... o iframe"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Texto Curatorial / Descripción (Salto doble de línea para párrafos)</p>
          <textarea
            rows={5}
            value={formData.descriptionText}
            onChange={(e) => setFormData({ ...formData, descriptionText: e.target.value })}
            className={styles.input}
          />
        </div>

        {/* Participating Artists Selector */}
        <div>
          <p className={styles.helpText}>Artistas Participantes</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {artistsCatalog.map((art) => {
              const isSelected = formData.selectedArtistIds.includes(art.id);
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => toggleArtistSelection(art.id)}
                  style={{
                    backgroundColor: isSelected ? "#000" : "#f0f0f0",
                    color: isSelected ? "#fff" : "#000",
                    borderRadius: "4px",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {art.name} {isSelected ? "✓" : "+"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Displayed Artworks Selector */}
        <div>
          <p className={styles.helpText}>Obras Exhibidas</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {artworksCatalog.map((art) => {
              const isSelected = formData.selectedArtworkIds.includes(art.id);
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => toggleArtworkSelection(art.id)}
                  style={{
                    backgroundColor: isSelected ? "#000" : "#f0f0f0",
                    color: isSelected ? "#fff" : "#000",
                    borderRadius: "4px",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {art.title} {isSelected ? "✓" : "+"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cover Image Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Imagen de Portada (Arrastrá la imagen aquí o hacé clic)</p>
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
                <img src={coverPreview} alt="Cover Preview" style={{ width: "220px", height: "130px", objectFit: "cover", marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", color: "#666" }}>Haz clic o arrastra para reemplazar la portada</p>
              </div>
            ) : (
              <div className={styles.profilePicturePlaceholder}>
                <p>🖼️ Arrastrá una imagen de portada o haz clic para subir</p>
              </div>
            )}
          </div>
        </div>

        {/* PDF Catalog Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Catálogo PDF de la Exhibición (Arrastrá el archivo o hacé clic)</p>
          <div
            className={`${styles.cvDropZone} ${isPdfDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsPdfDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsPdfDragOver(false); }}
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
                <p style={{ color: "green", fontWeight: "700" }}>📄 Archivo PDF seleccionado: {pdfFile.name}</p>
                <span>Hacé clic para cambiar archivo</span>
              </div>
            ) : pdfUrl ? (
              <div className={styles.cvFileSelected}>
                <p style={{ color: "green", fontWeight: "700" }}>✓ Catálogo PDF adjunto disponible</p>
                <span>Hacé clic o arrastrá para reemplazar</span>
              </div>
            ) : (
              <div className={styles.cvFilePlaceholder}>
                <p>📄 Arrastrá el catálogo en PDF aquí o hacé clic para explorar</p>
              </div>
            )}
          </div>
        </div>

        {/* Installation Views Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Imágenes de Registro / Galería de Vista de Sala (Arrastrá archivos o hacé clic)</p>
          <div
            className={`${styles.cvDropZone} ${isGalleryDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsGalleryDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsGalleryDragOver(false); }}
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
              <p>📸 Arrastrá fotos de la sala o del registro aquí</p>
            </div>
          </div>

          {(existingGallery.length > 0 || galleryImages.length > 0) && (
            <div style={{ marginTop: "1rem" }}>
              <p className={styles.helpText}>Imágenes de Galería ({existingGallery.length + galleryImages.length}):</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.5rem" }}>
                {existingGallery.map((img, idx) => (
                  <div key={`existing-${idx}`} style={{ position: "relative" }}>
                    <img src={img.url} alt={`Gallery ${idx}`} style={{ width: "100%", height: "80px", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(200,0,0,0.8)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.7rem",
                        padding: "2px 4px",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}

                {galleryImages.map((file, idx) => (
                  <div key={`new-${idx}`} style={{ position: "relative" }}>
                    <img src={URL.createObjectURL(file)} alt={`New gallery ${idx}`} style={{ width: "100%", height: "80px", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeNewGalleryImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(200,0,0,0.8)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.7rem",
                        padding: "2px 4px",
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
            {loading ? "Guardando..." : selectedId ? "Actualizar Exhibición" : "Crear Exhibición"}
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
