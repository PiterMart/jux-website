"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function ExhibitionList() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        const snap = await getDocs(collection(firestore, "exhibitions"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setExhibitions(list);
      } catch (e) {
        console.error("Error fetching exhibitions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchExhibitions();
  }, []);

  if (loading) return <div className={styles.form}><p>Cargando exhibiciones...</p></div>;

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Lista de Exhibiciones ({exhibitions.length})</h3>
      {exhibitions.length === 0 ? (
        <p>No hay exhibiciones registradas aún.</p>
      ) : (
        <div className={styles.artistsList}>
          {exhibitions.map((ex) => (
            <div key={ex.id} className={styles.artistCard} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {ex.coverImage && (
                <img src={ex.coverImage} alt={ex.title} style={{ width: "90px", height: "60px", objectFit: "cover" }} />
              )}
              <div>
                <h4 style={{ margin: 0 }}>{ex.title}</h4>
                <p className={styles.artistOrigin} style={{ margin: 0 }}>
                  Estado: <strong>{ex.status === "actual" ? "En Curso" : ex.status === "proxima" ? "Próxima" : "Pasada (Archivo)"}</strong>
                  {ex.location ? ` • ${ex.location}` : ""}
                </p>
                {(ex.startDate || ex.endDate) && (
                  <p className={styles.artistId} style={{ margin: 0 }}>Fechas: {ex.startDate} - {ex.endDate}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
