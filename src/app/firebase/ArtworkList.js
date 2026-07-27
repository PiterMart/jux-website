"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function ArtworkList() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const snap = await getDocs(collection(firestore, "artworks"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setArtworks(list);
      } catch (e) {
        console.error("Error fetching artworks:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtworks();
  }, []);

  if (loading) return <div className={styles.form}><p>Cargando obras...</p></div>;

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Lista de Obras ({artworks.length})</h3>
      {artworks.length === 0 ? (
        <p>No hay obras registradas aún.</p>
      ) : (
        <div className={styles.artistsList}>
          {artworks.map((a) => (
            <div key={a.id} className={styles.artistCard} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {a.coverImage && (
                <img src={a.coverImage} alt={a.title} style={{ width: "70px", height: "70px", objectFit: "contain", background: "#f7f7f7" }} />
              )}
              <div>
                <h4 style={{ margin: 0 }}>{a.title} {a.year ? `(${a.year})` : ""}</h4>
                <p className={styles.artistOrigin} style={{ margin: 0 }}>
                  {a.artistName ? `Artista: ${a.artistName}` : "Artista sin asignar"}
                  {a.technique ? ` • ${a.technique}` : ""}
                </p>
                {a.location && <p className={styles.artistId} style={{ margin: 0 }}>Ubicación: {a.location}</p>}
                {a.exhibitionTitle && <p className={styles.artistId} style={{ margin: 0 }}>Exhibición: {a.exhibitionTitle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
