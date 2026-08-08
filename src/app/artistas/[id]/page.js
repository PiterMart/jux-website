"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { firestore } from "../../firebase/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import pageStyles from "../../../styles/page.module.css";
import styles from "../../../styles/artistas.module.css";

export default function ArtistDetailPage({ params }) {
  const { id } = use(params);
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const docRef = doc(firestore, "artists", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const artistData = { id: docSnap.id, ...docSnap.data() };
          setArtist(artistData);

          // Fetch artworks by this artist
          const q = query(collection(firestore, "artworks"), where("artistId", "==", id));
          const artSnap = await getDocs(q);
          const artList = artSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setArtworks(artList);
        } else {
          setArtist(null);
        }
      } catch (err) {
        console.error("Error fetching artist details:", err);
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id]);

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <main className={styles.detailContainer} style={{ textAlign: "center" }}>
          <p style={{ color: "#888" }}>Cargando perfil de artista...</p>
        </main>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className={pageStyles.page}>
        <main className={styles.detailContainer} style={{ textAlign: "center" }}>
          <h2>Artista no encontrado</h2>
          <Link href="/artistas" style={{ color: "#000", textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
            Volver a la nómina de artistas
          </Link>
        </main>
      </div>
    );
  }

  const bios = Array.isArray(artist.bio) ? artist.bio : artist.bio ? [artist.bio] : [];
  const statements = Array.isArray(artist.statement) ? artist.statement : artist.statement ? [artist.statement] : [];

  return (
    <div className={pageStyles.page}>
      <main className={styles.detailContainer}>
        {/* Header Profile Section */}
        <div className={styles.profileGrid}>
          {/* Left Column: Image & Details */}
          <div>
            <div className={styles.profileImageWrapper}>
              {artist.profilePicture ? (
                <img src={artist.profilePicture} alt={artist.name} className={styles.profileImage} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "700", color: "var(--secondary-main, #1A2BFF)", fontFamily: "var(--font-family-base)" }}>
                  {(artist.name || "A").charAt(0)}
                </div>
              )}
            </div>

            {artist.origin && (
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                <strong>Origen / Residencia:</strong> {artist.origin}
              </p>
            )}

            {artist.birthDate && (
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                <strong>Nacimiento:</strong> {artist.birthDate}
              </p>
            )}

            {artist.website && (
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                <strong>Web:</strong>{" "}
                <a href={artist.website} target="_blank" rel="noopener noreferrer" style={{ color: "#000", textDecoration: "underline" }}>
                  {artist.website}
                </a>
              </p>
            )}

            {artist.instagram && (
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
                <strong>Instagram:</strong> {artist.instagram}
              </p>
            )}

            {artist.cvUrl && (
              <a
                href={artist.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.5rem",
                  border: "1px solid #000",
                  backgroundColor: "transparent",
                  color: "#000",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  transition: "all 0.3s ease",
                  marginTop: "1rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#000";
                }}
              >
                Descargar CV (PDF) →
              </a>
            )}
          </div>

          {/* Right Column: Name, Bio & Statement */}
          <div>
            <h1 style={{ fontSize: "3rem", fontWeight: "300", marginBottom: "1.5rem" }}>{artist.name}</h1>

            {bios.length > 0 && (
              <div style={{ marginBottom: "2.5rem" }}>
                <h3 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#888", marginBottom: "1rem" }}>
                  Biografía
                </h3>
                {bios.map((paragraph, idx) => (
                  <p key={idx} style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#333", marginBottom: "1rem" }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {statements.length > 0 && (
              <div>
                <h3 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#888", marginBottom: "1rem" }}>
                  Statement de Artista
                </h3>
                {statements.map((paragraph, idx) => (
                  <p key={idx} style={{ fontSize: "1rem", lineHeight: "1.8", color: "#555", fontStyle: "italic", marginBottom: "1rem" }}>
                    &ldquo;{paragraph}&rdquo;
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Artworks Section */}
        {artworks.length > 0 && (
          <div style={{ borderTop: "1px solid #eee", paddingTop: "4rem", marginTop: "4rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "300", marginBottom: "2.5rem", textAlign: "center" }}>
              Obras de {artist.name}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "2.5rem",
              }}
            >
              {artworks.map((art) => (
                <Link key={art.id} href={`/obras/${art.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "4px",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
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
                    <div style={{ width: "100%", aspectRatio: "1/1", backgroundColor: "#f9f9f9", overflow: "hidden" }}>
                      {art.coverImage || art.url ? (
                        <img
                          src={art.coverImage || art.url}
                          alt={art.title}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: "0.85rem" }}>
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "400", marginBottom: "0.25rem" }}>{art.title}</h4>
                      {art.year && <p style={{ fontSize: "0.85rem", color: "#777" }}>{art.year}</p>}
                      {art.technique && <p style={{ fontSize: "0.85rem", color: "#777" }}>{art.technique}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
