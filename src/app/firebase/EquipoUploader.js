"use client";
import { useEffect, useState, useRef } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import { getDocs, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import SearchableDropdown from "../../components/SearchableDropdown";
import { logCreate, logUpdate, logDelete, RESOURCE_TYPES } from "./activityLogger";
import { sanitizeFilename, safeCompressImage, formatUploadError } from "./uploadUtils";
import styles from "../../styles/uploader.module.css";

export default function EquipoUploader() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bioText: "",
    email: "",
    order: 0,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const snap = await getDocs(collection(firestore, "equipo"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setMembers(list);
    } catch (e) {
      console.error("Error fetching equipo:", e);
    }
  };

  const handleSelectMember = async (id) => {
    setSelectedId(id);
    if (!id) {
      resetForm();
      return;
    }
    const memberDoc = await getDoc(doc(firestore, "equipo", id));
    if (memberDoc.exists()) {
      const d = memberDoc.data();
      setFormData({
        name: d.name || "",
        role: d.role || "",
        bioText: Array.isArray(d.bio) ? d.bio.join("\n\n") : d.bio || "",
        email: d.email || "",
        order: d.order !== undefined ? d.order : 0,
      });
      setImagePreview(d.profilePicture || null);
      setImageFile(null);
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData({ name: "", role: "", bioText: "", email: "", order: 0 });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setImageFile(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.name.trim()) {
        throw new Error("El nombre es obligatorio.");
      }

      const id = selectedId || doc(collection(firestore, "equipo")).id;
      let profilePictureUrl = imagePreview;

      if (imageFile) {
        const compressed = await safeCompressImage(imageFile, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        const safeName = sanitizeFilename(imageFile.name);
        const imgRef = ref(storage, `equipo/${id}/profile_${Date.now()}_${safeName}`);
        await uploadBytes(imgRef, compressed, { contentType: imageFile.type || "image/jpeg" });
        profilePictureUrl = await getDownloadURL(imgRef);
      }

      const bioArray = formData.bioText
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        bio: bioArray,
        email: formData.email.trim(),
        order: Number(formData.order) || 0,
        profilePicture: profilePictureUrl || "",
        updatedAt: new Date().toISOString(),
      };

      if (selectedId) {
        await updateDoc(doc(firestore, "equipo", selectedId), payload);
        await logUpdate(RESOURCE_TYPES.EQUIPO, selectedId, { name: payload.name });
        setSuccess("Miembro de equipo actualizado con éxito.");
      } else {
        await setDoc(doc(firestore, "equipo", id), payload);
        await logCreate(RESOURCE_TYPES.EQUIPO, id, { name: payload.name });
        setSuccess("Miembro de equipo creado con éxito.");
      }

      resetForm();
      fetchMembers();
    } catch (e) {
      console.error("Error en submit de equipo:", e);
      setError(formatUploadError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("¿Estás seguro de eliminar este miembro del equipo?")) return;
    try {
      await deleteDoc(doc(firestore, "equipo", selectedId));
      await logDelete(RESOURCE_TYPES.EQUIPO, selectedId);
      setSuccess("Miembro eliminado.");
      resetForm();
      fetchMembers();
    } catch (e) {
      setError("Error al eliminar.");
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.subtitle}>Gestión de Equipo (El Museo)</h3>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {/* Live Search & Select */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p className={styles.helpText}>Buscar miembro por nombre o seleccionar de la lista:</p>
        <SearchableDropdown
          items={members}
          onSelect={(item) => handleSelectMember(item.id)}
          placeholder="Buscar miembro por nombre..."
          emptyMessage="No se encontraron miembros con ese nombre"
          getLabel={(item) => item.name}
          getSubtitle={(item) => item.role ? `Rol: ${item.role}` : ""}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={selectedId || ""}
            onChange={(e) => handleSelectMember(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          >
            <option value="">-- Crear Nuevo Miembro --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role || "Sin rol"})
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
          <p className={styles.helpText}>Nombre completo *</p>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Laura Gómez"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Rol / Cargo</p>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Ej: Directora Ejecutiva, Curador Principal"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Email de contacto (Opcional)</p>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ejemplo@galeria.com"
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Orden de aparición (Número)</p>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
            className={styles.input}
          />
        </div>

        <div>
          <p className={styles.helpText}>Bio / Reseña (Separa párrafos con doble salto de línea)</p>
          <textarea
            rows={5}
            value={formData.bioText}
            onChange={(e) => setFormData({ ...formData, bioText: e.target.value })}
            className={styles.input}
          />
        </div>

        {/* Profile Picture Drag & Drop Dropzone */}
        <div>
          <p className={styles.helpText}>Foto de Perfil (Arrastrá la imagen aquí o hacé clic)</p>
          <div
            className={`${styles.profilePictureDropZone} ${isDragOver ? styles.dragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
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
                <img src={imagePreview} alt="Preview" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "50%", marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", color: "#666" }}>Haz clic o arrastra para reemplazar la foto</p>
              </div>
            ) : (
              <div className={styles.profilePicturePlaceholder}>
                <p>Arrastrá una foto de perfil o haz clic para subir</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={handleSubmit} disabled={loading} className={styles.loginButton}>
            {loading ? "Guardando..." : selectedId ? "Actualizar Miembro" : "Crear Miembro"}
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
