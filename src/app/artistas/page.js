"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/artistas.module.css";

export default function ArtistasPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const snap = await getDocs(collection(firestore, "artists"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setArtists(list);
      } catch (err) {
        console.error("Error fetching artists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <div className={pageStyles.page}>
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Artistas</h1>
          <p className={styles.subtitle}>
            Nuestra nómina de artistas representados e invitados
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>
            Cargando artistas...
          </p>
        ) : artists.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>
            No hay artistas registrados por el momento.
          </p>
        ) : (
          <div className={styles.grid}>
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artistas/${artist.id}`}
                className={styles.cardLink}
              >
                <div className={styles.card}>
                  <div className={styles.imageWrapper}>
                    {artist.profilePicture ? (
                      <img
                        src={artist.profilePicture}
                        alt={artist.name}
                        className={styles.artistImage}
                      />
                    ) : (
                      <span className={styles.placeholderIcon}>👤</span>
                    )}
                  </div>
                  <h3 className={styles.artistName}>{artist.name}</h3>
                  {artist.origin && (
                    <p className={styles.artistOrigin}>{artist.origin}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
