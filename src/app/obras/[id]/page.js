"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { firestore } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Lightbox from "../../../components/Lightbox";
import AcquireDialog from "../../../components/AcquireDialog";
import styles from "../../../styles/page.module.css";

export default function ArtworkDetailPage({ params }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState(null);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isAcquireDialogOpen, setIsAcquireDialogOpen] = useState(false);

  useEffect(() => {
    const fetchArtworkData = async () => {
      try {
        const docRef = doc(firestore, "artworks", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const artData = { id: docSnap.id, ...docSnap.data() };
          setArtwork(artData);

          if (artData.artistId) {
            const artistRef = doc(firestore, "artists", artData.artistId);
            const artistSnap = await getDoc(artistRef);
            if (artistSnap.exists()) {
              setArtist({ id: artistSnap.id, ...artistSnap.data() });
            }
          }
        } else {
          setArtwork(null);
        }
      } catch (err) {
        console.error("Error fetching artwork detail:", err);
        setArtwork(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworkData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main} style={{ paddingTop: "12rem", textAlign: "center" }}>
          <p style={{ color: "#888" }}>Cargando obra...</p>
        </main>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className={styles.page}>
        <main className={styles.main} style={{ paddingTop: "12rem", textAlign: "center" }}>
          <h2>Obra no encontrada</h2>
          <Link href="/obras" style={{ color: "#000", textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
            Volver al catálogo de obras
          </Link>
        </main>
      </div>
    );
  }

  const mainImage = artwork.coverImage || artwork.url || "";
  const detailImages = Array.isArray(artwork.images) ? artwork.images : [];
  const allSlides = [mainImage, ...detailImages].filter(Boolean);

  const openLightboxAtIndex = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      DISPONIBLE: "Disponible",
      VENDIDA: "Vendida",
      EN_COLECCION: "En Colección",
      RESERVADA: "Reservada",
      NO_EN_VENTA: "No a la venta",
    };
    return labels[status] || status || "Disponible";
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ paddingTop: "12rem", maxWidth: "1300px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left Column: Images */}
          <div>
            {/* Main Image */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px",
                overflow: "hidden",
                cursor: "zoom-in",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #eee",
              }}
              onClick={() => openLightboxAtIndex(0)}
            >
              {mainImage ? (
                <img src={mainImage} alt={artwork.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: "0.95rem", color: "#888", fontWeight: "600" }}>Sin imagen</span>
              )}
            </div>

            {/* Secondary Detail Images Gallery */}
            {detailImages.length > 0 && (
              <div>
                <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}>
                  Vistas de detalle (Hacé clic para ampliar):
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.75rem" }}>
                  {detailImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightboxAtIndex(idx + 1)}
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        overflow: "hidden",
                        cursor: "zoom-in",
                        border: "1px solid #ddd",
                      }}
                    >
                      <img src={imgUrl} alt={`Detail ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Metadata & Acquisition */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "300", lineHeight: "1.2" }}>{artwork.title}</h1>

            {artist ? (
              <Link href={`/artistas/${artist.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "400", color: "#555" }}>
                  {artist.name} <span style={{ fontSize: "0.9rem", textDecoration: "underline", color: "#888" }}>(Ver perfil)</span>
                </h2>
              </Link>
            ) : artwork.artistName ? (
              <h2 style={{ fontSize: "1.3rem", fontWeight: "400", color: "#555" }}>{artwork.artistName}</h2>
            ) : null}

            <div style={{ height: "1px", backgroundColor: "#eee", margin: "0.5rem 0" }} />

            {(artwork.year || artwork.date) && (
              <p style={{ fontSize: "1rem", color: "#444" }}>
                <strong>Año:</strong> {artwork.year || artwork.date}
              </p>
            )}

            {(artwork.technique || artwork.medium) && (
              <p style={{ fontSize: "1rem", color: "#444" }}>
                <strong>Técnica:</strong> {artwork.technique || artwork.medium}
              </p>
            )}

            {(artwork.dimensions || artwork.measurements) && (
              <p style={{ fontSize: "1rem", color: "#444" }}>
                <strong>Medidas:</strong> {artwork.dimensions || artwork.measurements}
              </p>
            )}

            {artwork.location && (
              <p style={{ fontSize: "1rem", color: "#444" }}>
                <strong>Ubicación:</strong> {artwork.location}
              </p>
            )}

            {artwork.availability_status && (
              <p style={{ fontSize: "1rem", color: "#444" }}>
                <strong>Estado:</strong>{" "}
                <span
                  style={{
                    backgroundColor:
                      artwork.availability_status === "DISPONIBLE"
                        ? "#e8f5e9"
                        : artwork.availability_status === "VENDIDA"
                        ? "#ffebee"
                        : "#f5f5f5",
                    color:
                      artwork.availability_status === "DISPONIBLE"
                        ? "#2e7d32"
                        : artwork.availability_status === "VENDIDA"
                        ? "#c62828"
                        : "#616161",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  {getStatusLabel(artwork.availability_status)}
                </span>
              </p>
            )}

            {artwork.price && (
              <p style={{ fontSize: "1.3rem", fontWeight: "400", color: "#000", marginTop: "0.5rem" }}>
                {artwork.price}
              </p>
            )}

            {artwork.description && (
              <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "#555", marginTop: "1rem" }}>
                {artwork.description}
              </p>
            )}

            {/* Acquire Inquiry Button */}
            {artwork.availability_status !== "NO_EN_VENTA" && (
              <button
                onClick={() => setIsAcquireDialogOpen(true)}
                style={{
                  marginTop: "2rem",
                  padding: "1rem 2rem",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  fontSize: "0.95rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#333";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Consultar / Adquirir esta Obra →
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Zoom Component */}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        slides={allSlides}
        index={lightboxIndex}
      />

      {/* Acquire Dialog Collector Inquiry Modal */}
      <AcquireDialog
        isOpen={isAcquireDialogOpen}
        onClose={() => setIsAcquireDialogOpen(false)}
        artwork={artwork}
        artist={artist || { name: artwork.artistName }}
      />
    </div>
  );
}
