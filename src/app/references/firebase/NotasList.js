"use client";
import { useEffect, useMemo, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function NotasList() {
  const [notas, setNotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortMode, setSortMode] = useState("date-desc");

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const notasSnapshot = await getDocs(collection(firestore, "notas"));
        const notasData = notasSnapshot.docs.map((doc) => {
          const data = doc.data();
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

          const coverImage =
            typeof data.coverImage === "string" && data.coverImage.trim()
              ? data.coverImage.trim()
              : typeof data.image === "string" && data.image.trim()
                ? data.image.trim()
                : "";

          return {
            id: doc.id,
            title: data.title || "Sin título",
            subtitle: data.subtitle || "",
            links: linksFromData,
            description: data.description || "",
            date: parsedDate,
            coverImage,
          };
        });

        setNotas(notasData);
      } catch (fetchError) {
        console.error("Error fetching notas:", fetchError);
        setError("No se pudo cargar la lista de notas.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotas();
  }, []);

  const sortedNotas = useMemo(() => {
    const comparator = (a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : 0;
      const dateB = b.date instanceof Date ? b.date.getTime() : 0;
      const titleA = String(a.title || "").toLowerCase();
      const titleB = String(b.title || "").toLowerCase();
      const titleComparison = titleA.localeCompare(titleB);

      if (sortMode === "date-desc") {
        return dateB - dateA || titleComparison;
      }
      if (sortMode === "date-asc") {
        return dateA - dateB || titleComparison;
      }
      return titleComparison || (dateB - dateA);
    };

    return [...notas].sort(comparator);
  }, [notas, sortMode]);

  if (isLoading) {
    return (
      <div className={styles.form}>
        <p>Cargando notas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.form}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={styles.title} style={{ margin: 0 }}>
          Notas ({sortedNotas.length})
        </h2>
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p className={styles.subtitle} style={{ marginBottom: "0.25rem" }}>Ordenar por</p>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className={styles.input}
            >
              <option value="date-desc">Fecha (más reciente primero)</option>
              <option value="date-asc">Fecha (más antiguo primero)</option>
              <option value="title">Título (A → Z)</option>
            </select>
          </div>
        </div>
      </div>

      {sortedNotas.length === 0 ? (
        <p>No se encontraron notas.</p>
      ) : (
        <div className={styles.artistsList}>
          {sortedNotas.map((nota) => {
            const formattedDate = nota.date instanceof Date && !isNaN(nota.date.getTime())
              ? nota.date.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Sin fecha";

            return (
              <div key={nota.id} className={styles.artistCard}>
                <div className={styles.artistHeader}>
                  {nota.coverImage && (
                    <div style={{ flexShrink: 0, width: "96px", height: "96px" }}>
                      <img
                        src={nota.coverImage}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          border: "1px solid #e0e0e0",
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.artistInfo}>
                    <h3 className={styles.artistName}>
                      {nota.title || "Nota sin título"}
                    </h3>
                    <p className={styles.artistId}>ID: {nota.id}</p>
                    {nota.subtitle && (
                      <p className={styles.artistOrigin}>Subtítulo: {nota.subtitle}</p>
                    )}
                    <p className={styles.artistOrigin}>Fecha: {formattedDate}</p>
                    {nota.links && nota.links.length > 0 && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <p className={styles.artistOrigin}>Enlaces:</p>
                        {nota.links.map((link, index) => (
                          <p key={index} className={styles.artistOrigin}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#0066cc", textDecoration: "underline" }}
                            >
                              {link.title || link.url}
                            </a>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {nota.description && (
                  <div className={styles.artistBio} style={{ marginTop: "1rem" }}>
                    <h4>Descripción</h4>
                    <p>{nota.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
