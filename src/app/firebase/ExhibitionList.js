"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import { calculateExhibitionStatus, formatDateDisplay } from "./dateUtils";
import styles from "../../styles/uploader.module.css";

export default function ExhibitionList() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        const snap = await getDocs(collection(firestore, "exhibitions"));
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          const startStr = data.startDate || (data.startTimestamp?.seconds ? new Date(data.startTimestamp.seconds * 1000).toISOString().split('T')[0] : '');
          const endStr = data.endDate || (data.endTimestamp?.seconds ? new Date(data.endTimestamp.seconds * 1000).toISOString().split('T')[0] : '');
          const autoStatus = data.status || calculateExhibitionStatus(startStr, endStr);

          return {
            id: doc.id,
            ...data,
            startDate: startStr,
            endDate: endStr,
            status: autoStatus,
          };
        });
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
                  <p className={styles.artistId} style={{ margin: 0 }}>
                    Fechas: {formatDateDisplay(ex.startDate)} {ex.endDate ? `- ${formatDateDisplay(ex.endDate)}` : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
