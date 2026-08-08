"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function EducacionList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducacion = async () => {
      try {
        const snap = await getDocs(collection(firestore, "educacion"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
        setItems(list);
      } catch (e) {
        console.error("Error fetching educacion list:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEducacion();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className={styles.form}>
        <p>Cargando documentos de educación...</p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h3 className={styles.title} style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Textos de Educación ({items.length})
      </h3>

      {items.length === 0 ? (
        <p style={{ color: "#666" }}>No hay documentos registrados en la sección de Educación aún.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "1.5rem",
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "600" }}>{item.title}</h4>
                  {item.fileName && (
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#666" }}>
                      Archivo: {item.fileName} {item.fileSize ? `(${formatFileSize(item.fileSize)})` : ""}
                    </p>
                  )}
                </div>

                {item.pdfUrl && (
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.6rem 1.2rem",
                      backgroundColor: "#000",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      borderRadius: "4px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Abrir PDF ↗
                  </a>
                )}
              </div>

              {/* Hashtags */}
              {Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {item.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.8rem",
                        backgroundColor: "#f0f0f0",
                        color: "#333",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "12px",
                        fontWeight: "500",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              {(item.updatedAt || item.createdAt) && (
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#999" }}>
                  Última actualización: {new Date(item.updatedAt || item.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
