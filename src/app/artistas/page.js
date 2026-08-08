"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/artistas.module.css";

export default function ArtistasPage() {
  const [artists, setArtists] = useState([]);
  const [artworksByArtist, setArtworksByArtist] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedArtistId, setExpandedArtistId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artistSnap, artSnap] = await Promise.all([
          getDocs(collection(firestore, "artists")),
          getDocs(collection(firestore, "artworks")),
        ]);

        const artistList = artistSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        artistList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        const artMap = {};
        artSnap.docs.forEach((doc) => {
          const art = { id: doc.id, ...doc.data() };
          if (art.artistId) {
            if (!artMap[art.artistId]) artMap[art.artistId] = [];
            artMap[art.artistId].push(art);
          }
        });

        setArtists(artistList);
        setArtworksByArtist(artMap);
      } catch (err) {
        console.error("Error fetching artists and artworks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleArtist = (id) => {
    setExpandedArtistId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={pageStyles.page}>
      <main className={styles.container}>
        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "1.1rem" }}>
            Cargando artistas...
          </p>
        ) : artists.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "1.1rem" }}>
            No hay artistas registrados por el momento.
          </p>
        ) : (
          <motion.div
            className={styles.artistList}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {artists.map((artist) => {
              const isExpanded = expandedArtistId === artist.id;
              const bios = Array.isArray(artist.bio) ? artist.bio : artist.bio ? [artist.bio] : [];
              const statements = Array.isArray(artist.statement)
                ? artist.statement
                : artist.statement
                ? [artist.statement]
                : [];
              const artistWorks = artworksByArtist[artist.id] || [];

              return (
                <motion.div
                  key={artist.id}
                  className={styles.artistRow}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  <button
                    type="button"
                    className={`${styles.artistHeader} ${isExpanded ? styles.artistHeaderActive : ""}`}
                    onClick={() => toggleArtist(artist.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.imageWrapper}>
                      {artist.profilePicture ? (
                        <img
                          src={artist.profilePicture}
                          alt={artist.name}
                          className={styles.artistImage}
                        />
                      ) : (
                        <span className={styles.monogram}>
                          {(artist.name || "A").charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className={styles.nameBlock}>
                      <h2 className={styles.artistName}>{artist.name}</h2>
                      {artist.origin && <span className={styles.artistOrigin}>{artist.origin}</span>}
                    </div>

                    <span
                      className={styles.toggleSign}
                      style={{ transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className={styles.artistDetails}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Metadata Details */}
                        <div className={styles.metadataGrid}>
                          {artist.origin && (
                            <span className={styles.metadataItem}>
                              <strong>Origen / Residencia:</strong> {artist.origin}
                            </span>
                          )}
                          {artist.birthDate && (
                            <span className={styles.metadataItem}>
                              <strong>Nacimiento:</strong> {artist.birthDate}
                            </span>
                          )}
                          {artist.instagram && (
                            <span className={styles.metadataItem}>
                              <strong>Instagram:</strong> {artist.instagram}
                            </span>
                          )}
                          {artist.website && (
                            <span className={styles.metadataItem}>
                              <strong>Web:</strong>{" "}
                              <a
                                href={artist.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: "underline" }}
                              >
                                {artist.website}
                              </a>
                            </span>
                          )}
                        </div>

                        {/* CV Button */}
                        {artist.cvUrl && (
                          <a
                            href={artist.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cvButton}
                          >
                            Descargar CV (PDF) →
                          </a>
                        )}

                        {/* Bio Section */}
                        {bios.length > 0 && (
                          <div className={styles.bioSection}>
                            <h3 className={styles.sectionHeading}>Biografía</h3>
                            {bios.map((paragraph, idx) => (
                              <p key={idx} className={styles.bioParagraph}>
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Statement Section */}
                        {statements.length > 0 && (
                          <div className={styles.bioSection}>
                            <h3 className={styles.sectionHeading}>Statement de Artista</h3>
                            {statements.map((paragraph, idx) => (
                              <p key={idx} className={styles.statementParagraph}>
                                &ldquo;{paragraph}&rdquo;
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Artworks Portfolio Preview */}
                        {artistWorks.length > 0 && (
                          <div style={{ marginTop: "2.5rem" }}>
                            <h3 className={styles.sectionHeading}>Obras</h3>
                            <div className={styles.artworksGrid}>
                              {artistWorks.map((art) => (
                                <Link
                                  key={art.id}
                                  href={`/obras/${art.id}`}
                                  className={styles.artworkThumbnailCard}
                                >
                                  {art.coverImage || art.url ? (
                                    <img
                                      src={art.coverImage || art.url}
                                      alt={art.title}
                                      className={styles.artworkThumbImg}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "100%",
                                        aspectRatio: "1/1",
                                        background: "#f0f0f0",
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
                                  <div className={styles.artworkThumbInfo}>
                                    <h4 className={styles.artworkThumbTitle}>{art.title}</h4>
                                    {art.year && (
                                      <p className={styles.artworkThumbMeta}>{art.year}</p>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
