"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getDocs, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import { calculateExhibitionStatus, formatDateDisplay } from "../firebase/dateUtils";
import styles from "../../styles/exhibiciones.module.css";

function Lightbox({ images, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex || 0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images, index]);

  if (!images || images.length === 0) return null;

  const currentImg = typeof images[index] === "string" ? images[index] : images[index]?.url;
  const hasMultiple = images.length > 1;

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      className={styles.lightboxOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button className={styles.lightboxCloseBtn} onClick={onClose} aria-label="Cerrar visión ampliada">
        ✕
      </button>

      <div className={styles.lightboxMain} onClick={(e) => e.stopPropagation()}>
        <img
          src={currentImg}
          alt={`Vista ampliada ${index + 1}`}
          className={styles.lightboxImage}
        />

        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className={`${styles.lightboxNavBtn} ${styles.lightboxPrevBtn}`}
              aria-label="Imagen anterior"
            >
              <svg className={styles.arrowIcon} viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className={`${styles.lightboxNavBtn} ${styles.lightboxNextBtn}`}
              aria-label="Imagen siguiente"
            >
              <svg className={styles.arrowIcon} viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className={styles.lightboxCounter}>
        {index + 1} / {images.length}
      </div>
    </motion.div>
  );
}

function GalleryCarousel({ images, onOpenLightbox }) {
  const [index, setIndex] = useState(0);
  if (!images || images.length === 0) return null;

  const currentImg = typeof images[index] === "string" ? images[index] : images[index]?.url;
  const hasMultiple = images.length > 1;

  const handlePrev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.galleryCarouselWrapper}>
      <div
        className={styles.galleryCarouselMain}
        onClick={() => onOpenLightbox(index)}
        title="Hacer clic para ampliar imagen"
      >
        <img
          src={currentImg}
          alt={`Registro ${index + 1}`}
          className={styles.galleryCarouselImg}
        />
        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className={`${styles.navButton} ${styles.prevButton}`}
              aria-label="Imagen anterior"
            >
              <svg className={styles.arrowIcon} viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className={`${styles.navButton} ${styles.nextButton}`}
              aria-label="Imagen siguiente"
            >
              <svg className={styles.arrowIcon} viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className={styles.galleryDots}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={`${styles.dot} ${i === index ? styles.activeDot : ""}`}
              aria-label={`Ver foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExhibitionCard({ exhibition, isExpanded, onToggleExpand, onOpenLightbox, cardRef }) {
  // Static main cover image for the top card
  const coverImage =
    exhibition.coverImage ||
    (Array.isArray(exhibition.images) && exhibition.images.length > 0
      ? exhibition.images[0]
      : "/animacion/MUSEOJUXXXXOK1.png");

  // Collect all gallery / registro images for the carousel at the bottom of expanded card
  const galleryImages = [];
  if (Array.isArray(exhibition.gallery) && exhibition.gallery.length > 0) {
    galleryImages.push(...exhibition.gallery);
  } else if (Array.isArray(exhibition.images) && exhibition.images.length > 0) {
    galleryImages.push(...exhibition.images);
  }

  const dateText =
    exhibition.dateDisplay ||
    (exhibition.startDate && exhibition.endDate
      ? `${formatDateDisplay(exhibition.startDate)} — ${formatDateDisplay(exhibition.endDate)}`
      : exhibition.startDate
        ? formatDateDisplay(exhibition.startDate)
        : "");

  return (
    <div ref={cardRef} className={styles.exhibitionCard}>
      {/* Static Full-Width First Image (No Carousel Arrows) */}
      <motion.div
        className={styles.imageWrapper}
        onClick={onToggleExpand}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={coverImage}
          alt={exhibition.title}
          className={styles.image}
        />
      </motion.div>

      {/* Blue Banner Bar */}
      <motion.div
        className={styles.blueBanner}
        onClick={onToggleExpand}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.1 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        <div className={styles.bannerContent}>
          <div className={styles.headerRow}>
            <h2 className={styles.title}>{exhibition.title}</h2>
            {exhibition.location && (
              <>
                <span className={styles.separator}>-</span>
                <span className={styles.location}>{exhibition.location}</span>
              </>
            )}
          </div>
          {dateText && <p className={styles.dates}>{dateText}</p>}
        </div>

        <button className={styles.expandToggleBtn} aria-label="Expandir información">
          {isExpanded ? "−" : "+"}
        </button>
      </motion.div>

      {/* In-Place Expanded Detail Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles.expandedContainer}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header tags & 360 tour */}
            <div className={styles.expandedHeader}>
              <span className={styles.statusTag}>
                {exhibition.status === "actual"
                  ? "En curso"
                  : exhibition.status === "proxima"
                    ? "Futuro"
                    : "Pasado"}
              </span>

              {exhibition.curator && (
                <span className={styles.curatorText}>
                  Curaduría: <strong>{exhibition.curator}</strong>
                </span>
              )}

              {exhibition.tour360Url && (
                <a
                  href={exhibition.tour360Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tour360Btn}
                >
                  Recorrido Virtual 360° →
                </a>
              )}
            </div>

            {/* Description */}
            {Array.isArray(exhibition.description) && exhibition.description.length > 0 && (
              <div className={styles.descriptionSection}>
                <div className={styles.descriptionBody}>
                  {exhibition.description.map((paragraph, idx) => (
                    <p key={idx} className={styles.descriptionParagraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Artists */}
            {Array.isArray(exhibition.artists) && exhibition.artists.length > 0 && (
              <div>
                <h3 className={styles.expandedSectionTitle}>Artistas Participantes</h3>
                <div className={styles.artistsFlex}>
                  {exhibition.artists.map((art) => (
                    <Link
                      key={art.id || art.name}
                      href={art.id ? `/artistas?id=${art.id}` : "/artistas"}
                      className={styles.artistTag}
                    >
                      {art.name} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Artworks */}
            {Array.isArray(exhibition.artworks) && exhibition.artworks.length > 0 && (
              <div>
                <h3 className={styles.expandedSectionTitle}>Obras en Exhibición</h3>
                <div className={styles.artworksGrid}>
                  {exhibition.artworks.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={styles.artworkCard}
                      onClick={() => item.image && onOpenLightbox([item.image], 0)}
                      style={{ cursor: item.image ? "zoom-in" : "default" }}
                    >
                      {item.image && (
                        <img src={item.image} alt={item.title} className={styles.artworkImg} />
                      )}
                      <div className={styles.artworkMeta}>
                        <h4 className={styles.artworkTitle}>{item.title}</h4>
                        {item.artistName && (
                          <p className={styles.artworkArtist}>{item.artistName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Installation / Gallery Carousel at the end of the information card (Full Page Width) */}
            {galleryImages.length > 0 && (
              <div>
                <h3 className={styles.expandedSectionTitle}>Vista de Sala / Registro</h3>
                <div className={styles.fullWidthGallerySection}>
                  <GalleryCarousel
                    images={galleryImages}
                    onOpenLightbox={(idx) => onOpenLightbox(galleryImages, idx)}
                  />
                </div>
              </div>
            )}

            <button className={styles.closeExpandedBtn} onClick={onToggleExpand}>
              CERRAR EXHIBICIÓN —
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExhibicionesPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeLightbox, setActiveLightbox] = useState(null); // { images: [], index: 0 }
  const cardRefs = useRef({});

  useEffect(() => {
    async function fetchExhibitions() {
      try {
        const snap = await getDocs(collection(firestore, "exhibitions"));
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          const startStr =
            data.startDate ||
            (data.startTimestamp?.seconds
              ? new Date(data.startTimestamp.seconds * 1000).toISOString().split("T")[0]
              : "");
          const endStr =
            data.endDate ||
            (data.endTimestamp?.seconds
              ? new Date(data.endTimestamp.seconds * 1000).toISOString().split("T")[0]
              : "");
          const autoStatus = data.status || calculateExhibitionStatus(startStr, endStr);

          return {
            id: doc.id,
            ...data,
            startDate: startStr,
            endDate: endStr,
            status: autoStatus,
          };
        });
        setExhibitions(list);
      } catch (error) {
        console.error("Error fetching exhibitions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchExhibitions();
  }, []);

  const handleToggleExpand = (id) => {
    const isCurrentlyExpanded = expandedId === id;
    const prevExpandedId = expandedId;
    const nextId = isCurrentlyExpanded ? null : id;

    setExpandedId(nextId);

    const el = cardRefs.current[id];
    if (!el) return;

    const headerEl = document.querySelector("header");
    const navbarOffset = headerEl ? headerEl.offsetHeight : (window.innerWidth <= 768 ? 70 : 85);

    // Check if an item above `id` was expanded and is now closing
    let heightToLose = 0;
    if (prevExpandedId && prevExpandedId !== id) {
      const prevIndex = exhibitions.findIndex((e) => e.id === prevExpandedId);
      const targetIndex = exhibitions.findIndex((e) => e.id === id);
      if (prevIndex !== -1 && prevIndex < targetIndex) {
        const prevEl = cardRefs.current[prevExpandedId];
        const expandedEl = prevEl?.querySelector(`.${styles.expandedContainer}`);
        heightToLose = expandedEl?.offsetHeight || 0;
      }
    }

    const rect = el.getBoundingClientRect();
    const currentTop = rect.top;
    const targetY = currentTop + window.scrollY - heightToLose - navbarOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth",
    });

    // Follow-up check after Framer Motion animation settles to guarantee exact alignment
    setTimeout(() => {
      const targetEl = cardRefs.current[id];
      if (!targetEl) return;
      const currentOffset = targetEl.getBoundingClientRect().top;
      if (Math.abs(currentOffset - navbarOffset) > 4) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + currentOffset - navbarOffset),
          behavior: "smooth",
        });
      }
    }, 650);
  };

  const handleOpenLightbox = (images, index) => {
    setActiveLightbox({ images, index });
  };

  return (
    <div style={{ width: "100%", padding: 0, margin: 0, backgroundColor: "var(--background, #D3D5CE)" }}>
      <main className={styles.pageContainer}>
        {!loading && (
          <div className={styles.exhibitionList}>
            {exhibitions.map((ex) => (
              <ExhibitionCard
                key={ex.id}
                exhibition={ex}
                isExpanded={expandedId === ex.id}
                onToggleExpand={() => handleToggleExpand(ex.id)}
                onOpenLightbox={handleOpenLightbox}
                cardRef={(node) => {
                  if (node) cardRefs.current[ex.id] = node;
                }}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {activeLightbox && (
          <Lightbox
            images={activeLightbox.images}
            initialIndex={activeLightbox.index}
            onClose={() => setActiveLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
