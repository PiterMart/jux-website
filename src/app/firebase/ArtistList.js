"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

export default function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const snap = await getDocs(collection(firestore, "artists"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setArtists(list);
      } catch (e) {
        console.error("Error fetching artists:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  if (loading) return <div className={styles.form}><p>Cargando artistas...</p></div>;

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Lista de Artistas ({artists.length})</h3>
      {artists.length === 0 ? (
        <p>No hay artistas en la base de datos aún.</p>
      ) : (
        <div className={styles.artistsList}>
          {artists.map((a) => (
            <div key={a.id} className={styles.artistCard} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {a.profilePicture && (
                <img src={a.profilePicture} alt={a.name} style={{ width: "60px", height: "60px", objectFit: "cover" }} />
              )}
              <div>
                <h4 style={{ margin: 0 }}>{a.name}</h4>
                {a.instagram && <p className={styles.artistOrigin} style={{ margin: 0 }}>{a.instagram}</p>}
                {a.website && <p className={styles.artistId} style={{ margin: 0 }}>{a.website}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
