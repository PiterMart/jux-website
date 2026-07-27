"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { firestore } from "./firebaseConfig";
import { storage } from "./firebaseStorage";
import { getDocs, collection, doc, updateDoc, Timestamp, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { logCreate, logUpdate, RESOURCE_TYPES } from "./activityLogger";
import styles from "../../styles/uploader.module.css";
import imageCompression from "browser-image-compression";
import SearchableDropdown from "../../components/SearchableDropdown";

const createInitialFormData = () => ({
  name: "",
  origin: "",
  bio: [],
  manifesto: [],
  web: "",
  slug: "",
  profilePicture: "",
  cvUrl: "",
  birthDate: null,
  team: false,
  roles: [],
});

/** Firestore Timestamp, Date, ISO string, or missing — never throw */
function parseMemberBirthDate(value) {
  if (value == null) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function MemberUploader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(createInitialFormData);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCvDragOver, setIsCvDragOver] = useState(false);
  const [roleInput, setRoleInput] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const memberSnapshot = await getDocs(collection(firestore, "members"));
      const membersData = memberSnapshot.docs.map((memberDoc) => ({
        id: memberDoc.id,
        ...memberDoc.data(),
      }));
      setMembers(membersData);
    } catch (fetchError) {
      console.error("Error al obtener miembros:", fetchError);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    return () => {
      if (profilePicturePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  const resetForm = () => {
    if (profilePicturePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    setFormData(createInitialFormData());
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setCvFile(null);
    setRoleInput("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const cvInput = document.getElementById("cv-file-input");
    if (cvInput) {
      cvInput.value = "";
    }
  };

  const handleMemberSelection = async (memberId) => {
    const id = memberId || null;
    setSelectedMember(id);

    if (!id) {
      resetForm();
      return;
    }

    try {
      setError(null);
      const memberDoc = await getDoc(doc(firestore, "members", id));
      if (memberDoc.exists()) {
        const data = memberDoc.data();

        setFormData({
          name: data.name || "",
          origin: data.origin || "",
          bio: Array.isArray(data.bio) ? data.bio : [],
          manifesto: Array.isArray(data.manifesto) ? data.manifesto : [],
          web: data.web || "",
          slug: data.slug || "",
          profilePicture: data.profilePicture || "",
          cvUrl: data.cvUrl || "",
          birthDate: parseMemberBirthDate(data.birthDate),
          team: Boolean(data.team),
          roles: Array.isArray(data.roles)
            ? data.roles.filter((role) => typeof role === "string" && role.trim())
            : data.role
            ? [data.role].filter((role) => typeof role === "string" && role.trim())
            : [],
        });
        setRoleInput("");

        if (profilePicturePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(profilePicturePreview);
        }

        setProfilePictureFile(null);
        setProfilePicturePreview(data.profilePicture || null);
        setCvFile(null);

        const cvInput = document.getElementById("cv-file-input");
        if (cvInput) {
          cvInput.value = "";
        }
      }
    } catch (selectionError) {
      console.error("Error al cargar datos del miembro:", selectionError);
      setError("No se pudieron cargar los datos del miembro.");
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleProfilePictureFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      if (profilePicturePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    } else {
      setError("Por favor selecciona un archivo de imagen válido.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleProfilePictureFile(files[0]);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleProfilePictureFile(file);
    }
  };

  const handleCvFile = (file) => {
    if (file && file.type === "application/pdf") {
      setCvFile(file);
    } else {
      setError("Por favor selecciona un archivo PDF válido.");
    }
  };

  const handleCvDragOver = (event) => {
    event.preventDefault();
    setIsCvDragOver(true);
  };

  const handleCvDragLeave = (event) => {
    event.preventDefault();
    setIsCvDragOver(false);
  };

  const handleCvDrop = (event) => {
    event.preventDefault();
    setIsCvDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleCvFile(files[0]);
    }
  };

  const handleCvFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCvFile(file);
    }
  };

  const handleBirthDateChange = (event) => {
    const value = event.target.value;
    setFormData((prevData) => ({
      ...prevData,
      birthDate: value ? new Date(value) : null,
    }));
  };

  const handleTextFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleBioChange = (event) => {
    const paragraphs = event.target.value
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    setFormData((prevData) => ({
      ...prevData,
      bio: paragraphs,
    }));
  };

  const handleManifestoChange = (event) => {
    const paragraphs = event.target.value
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    setFormData((prevData) => ({
      ...prevData,
      manifesto: paragraphs,
    }));
  };

  const uploadProfilePicture = async (memberId) => {
    if (!(profilePictureFile instanceof File)) {
      return formData.profilePicture;
    }

    try {
      const compressedFile = await imageCompression(profilePictureFile, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 800,
      });

      const profilePicRef = ref(storage, `members/${memberId}/profilePicture/${memberId}_profilePicture`);
      await uploadBytes(profilePicRef, compressedFile);
      return await getDownloadURL(profilePicRef);
    } catch (uploadError) {
      console.error("Error al subir la foto de perfil:", uploadError);
      throw uploadError;
    }
  };

  const handleTeamChange = (event) => {
    const value = event.target.value;
    setFormData((prevData) => ({
      ...prevData,
      team: value === "yes",
    }));
  };

  const roleSuggestions = useMemo(() => {
    const roles = new Set();
    members.forEach((member) => {
      if (Array.isArray(member.roles)) {
        member.roles.forEach((role) => {
          if (typeof role === "string" && role.trim()) {
            roles.add(role.trim());
          }
        });
      }
      if (typeof member.role === "string" && member.role.trim()) {
        roles.add(member.role.trim());
      }
    });
    return Array.from(roles).sort((a, b) => a.localeCompare(b));
  }, [members]);

  // Sorted alphabetical list for dropdown
  const sortedAndFilteredMembers = useMemo(() => {
    // Sort alphabetically by name
    return [...members].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members]);

  const handleAddRole = () => {
    const value = roleInput.trim();
    if (!value) {
      return;
    }

    setFormData((prevData) => {
      if (prevData.roles.includes(value)) {
        return prevData;
      }
      return {
        ...prevData,
        roles: [...prevData.roles, value],
      };
    });
    setRoleInput("");
  };

  const handleRemoveRole = (roleToRemove) => {
    setFormData((prevData) => ({
      ...prevData,
      roles: prevData.roles.filter((role) => role !== roleToRemove),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { name, origin, bio, manifesto, web } = formData;
      if (!name || !origin) {
        throw new Error("El nombre y el origen son obligatorios");
      }

      const slug = generateSlug(name);
      const memberId = selectedMember || doc(collection(firestore, "members")).id;

      const profilePicUrl = await uploadProfilePicture(memberId);

      let cvUrl = formData.cvUrl || "";
      if (cvFile instanceof File) {
        const cvRef = ref(storage, `members/${memberId}/cv/${memberId}_cv`);
        await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(cvRef);
      }

      const memberData = {
        name,
        origin,
        bio,
        manifesto,
        web,
        slug,
        profilePicture: profilePicUrl,
        cvUrl,
        birthDate: formData.birthDate ? Timestamp.fromDate(formData.birthDate) : null,
        team: Boolean(formData.team),
        roles: Array.isArray(formData.roles) ? formData.roles : [],
        role: Array.isArray(formData.roles) && formData.roles.length > 0 ? formData.roles[0] : "",
      };

      if (selectedMember) {
        await updateDoc(doc(firestore, "members", memberId), memberData);
        await logUpdate(RESOURCE_TYPES.MEMBER, memberId, {
          memberName: name,
          fieldsUpdated: Object.keys(memberData),
        });
        await fetchMembers();
        await handleMemberSelection(memberId);
        setSuccess("Miembro actualizado correctamente. Por favor recarga la página para ver los cambios.");
      } else {
        const memberRef = doc(firestore, "members", memberId);
        await setDoc(memberRef, memberData);
        await logCreate(RESOURCE_TYPES.MEMBER, memberId, {
          memberName: name,
        });
        await fetchMembers();
        await handleMemberSelection(memberId);
        setSuccess("Miembro creado correctamente. Por favor recarga la página para ver el nuevo miembro.");
      }
    } catch (submitError) {
      console.error("Error al enviar el formulario:", submitError);
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.form}>
      <div>
        <p className={styles.subtitle}>SELECCIONA MIEMBRO PARA EDITAR</p>
        <SearchableDropdown
          items={members}
          onSelect={(member) => handleMemberSelection(member.id)}
          placeholder="Buscar miembro..."
          emptyMessage="No se encontraron miembros"
          getLabel={(m) => m.name || ""}
          getSubtitle={(m) => m.origin || null}
        />
        <select value={selectedMember || ""} onChange={(event) => handleMemberSelection(event.target.value)}>
          <option value="">Crear nuevo miembro (orden alfabético)</option>
          {sortedAndFilteredMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {selectedMember && (
        <div className={styles.artistIdDisplay}>
          <span className={styles.artistIdLabel}>ID del miembro:</span>
          <span className={styles.artistIdValue}>{selectedMember}</span>
        </div>
      )}

      <div className={styles.artistInfoContainer}>
        <div className={styles.profileAndBasicInfoRow}>
          <div className={styles.profilePictureContainer}>
            <p className={styles.subtitle}>FOTO DE PERFIL</p>
            <div
              className={`${styles.profilePictureDropZone} ${isDragOver ? styles.dragOver : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePicturePreview ? (
                <div className={styles.profilePicturePreview}>
                  <img src={profilePicturePreview} alt="Vista previa del perfil" className={styles.profilePreviewImage} />
                  <div className={styles.profilePictureOverlay}>
                    <span>Haz clic o arrastra para cambiar</span>
                  </div>
                </div>
              ) : (
                <div className={styles.profilePicturePlaceholder}>
                  <p>Arrastra y suelta una imagen aquí</p>
                  <p>o haz clic para explorar</p>
                  <small>Tamaño máx.: 500px de ancho</small>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />
          </div>

          <div className={styles.basicInfoContainer}>
            <div className={styles.inputGroup}>
              <p className={styles.subtitle}>NOMBRE</p>
              <input name="name" placeholder="Nombre" value={formData.name} onChange={handleTextFieldChange} />
            </div>

            <div className={styles.inputGroup}>
              <p className={styles.subtitle}>ORIGEN</p>
              <input name="origin" placeholder="Origen" value={formData.origin} onChange={handleTextFieldChange} />
            </div>

            <div className={styles.inputGroup}>
              <p className={styles.subtitle}>FECHA DE NACIMIENTO</p>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate ? formData.birthDate.toISOString().split("T")[0] : ""}
                onChange={handleBirthDateChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <p className={styles.subtitle}>SITIO WEB</p>
              <input name="web" placeholder="Sitio web" value={formData.web} onChange={handleTextFieldChange} />
            </div>

            <div className={styles.inputGroup}>
              <p className={styles.subtitle}>EQUIPO</p>
              <select value={formData.team ? "yes" : "no"} onChange={handleTeamChange}>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <p className={styles.subtitle}>ROL</p>
              <div className={styles.roleInputRow}>
                <input
                  name="roleInput"
                  placeholder="Rol"
                  value={roleInput}
                  onChange={(event) => setRoleInput(event.target.value)}
                  list="roles-list"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  disabled={!roleInput.trim()}
                  className={styles.roleAddButton}
                  aria-label="Agregar rol"
                  title="Agregar rol"
                >
                  +
                </button>
              </div>
              <datalist id="roles-list">
                {roleSuggestions.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
              {formData.roles.length > 0 && (
                <div className={styles.rolesList}>
                  {formData.roles.map((role) => (
                    <span key={role} className={styles.roleTag}>
                      {role}
                      <button type="button" onClick={() => handleRemoveRole(role)} className={styles.roleRemoveButton}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className={styles.subtitle}>BIOGRAFÍA</p>
          <textarea
            placeholder="Agrega texto de biografía (un párrafo por línea)"
            value={formData.bio.join("\n")}
            onChange={handleBioChange}
          />
          <p className={styles.helpText}>Cada línea se convertirá en un párrafo independiente. Presiona Enter para agregar más párrafos.</p>
        </div>

        <div>
          <p className={styles.subtitle}>MANIFIESTO</p>
          <textarea
            placeholder="Agrega texto del manifiesto (un párrafo por línea)"
            value={formData.manifesto.join("\n")}
            onChange={handleManifestoChange}
          />
          <p className={styles.helpText}>Cada línea se convertirá en un párrafo independiente. Presiona Enter para agregar más párrafos.</p>
        </div>

        <div>
          <p className={styles.subtitle}>CV (PDF)</p>
          <div
            className={`${styles.cvDropZone} ${isCvDragOver ? styles.dragOver : ""}`}
            onDragOver={handleCvDragOver}
            onDragLeave={handleCvDragLeave}
            onDrop={handleCvDrop}
            onClick={() => document.getElementById("cv-file-input")?.click()}
          >
            {cvFile ? (
              <div className={styles.cvFileSelected}>
                <p>{cvFile.name}</p>
                <span>Haz clic o arrastra para cambiar</span>
              </div>
            ) : formData.cvUrl ? (
              <div className={styles.cvFileSelected}>
                <p>CV existente disponible</p>
                <span>Sube un nuevo archivo para reemplazarlo</span>
              </div>
            ) : (
              <div className={styles.cvFilePlaceholder}>
                <p>Arrastra y suelta un PDF aquí</p>
                <p>o haz clic para explorar</p>
                <small>Solo archivos PDF</small>
              </div>
            )}
          </div>
          <input
            id="cv-file-input"
            type="file"
            name="cv"
            accept=".pdf"
            onChange={handleCvFileInputChange}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Procesando..." : selectedMember ? "Actualizar miembro" : "Crear miembro"}
      </button>
    </div>
  );
}

