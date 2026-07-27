"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import styles from "../../styles/page.module.css";

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
    <div className={styles.page}>
      <main className={styles.main} style={{ paddingTop: "12rem", maxWidth: "1400px" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1 className={styles.sectionTitle} style={{ fontSize: "3rem", fontWeight: "300" }}>
            Artistas
          </h1>
          <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "0.5rem" }}>
            Nuestra nómina de artistas representados e invitados
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>Cargando artistas...</p>
        ) : artists.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>No hay artistas registrados por el momento.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "2.5rem",
              padding: "0 1rem",
            }}
          >
            {artists.map((artist) => (
              <Link key={artist.id} href={`/artistas/${artist.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "1.5rem",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      backgroundColor: "#f5f5f5",
                      marginBottom: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {artist.profilePicture ? (
                      <img
                        src={artist.profilePicture}
                        alt={artist.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: "2.5rem", color: "#ccc" }}>👤</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "400", marginBottom: "0.25rem", textAlign: "center" }}>
                    {artist.name}
                  </h3>
                  {artist.origin && (
                    <p style={{ fontSize: "0.85rem", color: "#777", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {artist.origin}
                    </p>
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
