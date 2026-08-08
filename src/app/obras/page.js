"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import styles from "../../styles/page.module.css";

export default function ObrasCatalogPage() {
  const [artworks, setArtworks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedArtistFilter, setSelectedArtistFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const artSnap = await getDocs(collection(firestore, "artworks"));
        const artList = artSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setArtworks(artList);

        const artistSnap = await getDocs(collection(firestore, "artists"));
        const artistList = artistSnap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id }));
        setArtists(artistList);
      } catch (err) {
        console.error("Error fetching artworks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredArtworks = artworks.filter((art) => {
    if (selectedArtistFilter !== "all" && art.artistId !== selectedArtistFilter) return false;
    if (selectedStatusFilter !== "all" && art.availability_status !== selectedStatusFilter) return false;
    return true;
  });

  const getStatusBadge = (status) => {
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
      <main className={styles.main} style={{ paddingTop: "8rem", maxWidth: "1400px" }}>
        {/* Filter Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            marginBottom: "4rem",
            flexWrap: "wrap",
            padding: "0 1rem",
          }}
        >
          {/* Artist Filter */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
              Filtrar por Artista:
            </label>
            <select
              value={selectedArtistFilter}
              onChange={(e) => setSelectedArtistFilter(e.target.value)}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "0.95rem",
                backgroundColor: "#fff",
              }}
            >
              <option value="all">Todos los Artistas</option>
              {artists.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
              Filtrar por Disponibilidad:
            </label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "0.95rem",
                backgroundColor: "#fff",
              }}
            >
              <option value="all">Todos los Estados</option>
              <option value="DISPONIBLE">Disponibles</option>
              <option value="EN_COLECCION">En Colección</option>
              <option value="VENDIDA">Vendidas</option>
              <option value="RESERVADA">Reservadas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>Cargando catálogo...</p>
        ) : filteredArtworks.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>
            No se encontraron obras con los filtros seleccionados.
          </p>
        ) : (
          <motion.div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "2.5rem",
              padding: "0 1rem",
            }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
          >
            {filteredArtworks.map((art) => (
              <motion.div
                key={art.id}
                style={{
                  border: "1px solid rgba(17, 17, 17, 0.12)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  display: "flex",
                  flexDirection: "column",
                }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              >
                <Link href={`/obras/${art.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      backgroundColor: "#f9f9f9",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {art.coverImage || art.url ? (
                      <img
                        src={art.coverImage || art.url}
                        alt={art.title}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#888",
                          fontSize: "0.85rem",
                        }}
                      >
                        Sin imagen
                      </div>
                    )}
                    {art.availability_status && (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          backgroundColor:
                            art.availability_status === "DISPONIBLE"
                              ? "rgba(0, 128, 0, 0.85)"
                              : art.availability_status === "VENDIDA"
                              ? "rgba(180, 0, 0, 0.85)"
                              : "rgba(100, 100, 100, 0.85)",
                          color: "#fff",
                          padding: "0.25rem 0.6rem",
                          fontSize: "0.75rem",
                          borderRadius: "3px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {getStatusBadge(art.availability_status)}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "700", fontFamily: "var(--font-family-base)", marginBottom: "0.25rem" }}>
                      {art.title}
                    </h3>
                    {art.artistName && (
                      <p style={{ fontSize: "0.95rem", color: "#555", marginBottom: "0.25rem" }}>{art.artistName}</p>
                    )}
                    {art.year && <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>{art.year}</p>}
                    {art.technique && <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>{art.technique}</p>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
