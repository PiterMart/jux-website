"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function EquipoList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipo = async () => {
      try {
        const snap = await getDocs(collection(firestore, "equipo"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setMembers(list);
      } catch (e) {
        console.error("Error fetching equipo:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipo();
  }, []);

  if (loading) return <div className={styles.form}><p>Cargando equipo...</p></div>;

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Lista de Equipo ({members.length})</h3>
      {members.length === 0 ? (
        <p>No hay miembros en el equipo aún.</p>
      ) : (
        <div className={styles.artistsList}>
          {members.map((m) => (
            <div key={m.id} className={styles.artistCard} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {m.profilePicture && (
                <img src={m.profilePicture} alt={m.name} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} />
              )}
              <div>
                <h4 style={{ margin: 0 }}>{m.name}</h4>
                <p className={styles.artistOrigin} style={{ margin: 0 }}>{m.role || "Sin rol"}</p>
                {m.email && <p className={styles.artistId} style={{ margin: 0 }}>{m.email}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
