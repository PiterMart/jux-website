"use client";
import { useEffect, useMemo, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function ArticlesList() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortMode, setSortMode] = useState("date-desc");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const articlesSnapshot = await getDocs(collection(firestore, "articles"));
        const articlesData = articlesSnapshot.docs.map((doc) => {
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

        setArticles(articlesData);
      } catch (fetchError) {
        console.error("Error fetching articles:", fetchError);
        setError("No se pudo cargar la lista de artículos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const sortedArticles = useMemo(() => {
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

    return [...articles].sort(comparator);
  }, [articles, sortMode]);

  if (isLoading) {
    return (
      <div className={styles.form}>
        <p>Cargando artículos...</p>
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
          Artículos ({sortedArticles.length})
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

      {sortedArticles.length === 0 ? (
        <p>No se encontraron artículos.</p>
      ) : (
        <div className={styles.artistsList}>
          {sortedArticles.map((article) => {
            const formattedDate = article.date instanceof Date && !isNaN(article.date.getTime())
              ? article.date.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Sin fecha";

            return (
              <div key={article.id} className={styles.artistCard}>
                <div className={styles.artistHeader}>
                  {article.coverImage && (
                    <div style={{ flexShrink: 0, width: "96px", height: "96px" }}>
                      <img
                        src={article.coverImage}
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
                      {article.title || "Artículo sin título"}
                    </h3>
                    <p className={styles.artistId}>ID: {article.id}</p>
                    {article.subtitle && (
                      <p className={styles.artistOrigin}>Subtítulo: {article.subtitle}</p>
                    )}
                    <p className={styles.artistOrigin}>Fecha: {formattedDate}</p>
                    {article.links && article.links.length > 0 && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <p className={styles.artistOrigin}>Enlaces:</p>
                        {article.links.map((link, index) => (
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
                {article.description && (
                  <div className={styles.artistBio} style={{ marginTop: "1rem" }}>
                    <h4>Descripción</h4>
                    <p>{article.description}</p>
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

