"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../app/firebase/firebaseConfig";
import { calculateExhibitionStatus, formatDateDisplay } from "../app/firebase/dateUtils";
import styles from "../styles/LatestExhibition.module.css";

// Fallback exhibition data matching the reference design
const DEFAULT_EXHIBITION = {
  id: "",
  title: "FALTA COMPARTIDA",
  location: "Museo Judio de Buenos Aires",
  dateDisplay: "Noviembre 2024",
  images: [
    "/animacion/MUSEOJUXXXXOK1.png",
    "/animacion/MUSEOJUXXXXOK2.png",
    "/animacion/MUSEOJUXXXXOK3.png",
    "/animacion/MUSEOJUXXXXOK4.png",
  ],
};

export default function LatestExhibition() {
  const [exhibition, setExhibition] = useState(DEFAULT_EXHIBITION);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchLatestExhibition() {
      try {
        const snap = await getDocs(collection(firestore, "exhibitions"));
        if (!snap.empty) {
          const list = snap.docs.map((doc) => {
            const data = doc.data();
            const startStr =
              data.startDate ||
              (data.startTimestamp?.seconds
                ? new Date(data.startTimestamp.seconds * 1000)
                    .toISOString()
                    .split("T")[0]
                : "");
            const endStr =
              data.endDate ||
              (data.endTimestamp?.seconds
                ? new Date(data.endTimestamp.seconds * 1000)
                    .toISOString()
                    .split("T")[0]
                : "");
            const status =
              data.status || calculateExhibitionStatus(startStr, endStr);

            return {
              id: doc.id,
              ...data,
              startDate: startStr,
              endDate: endStr,
              status,
            };
          });

          // Priority: 1. Current exhibition, 2. Most recent past exhibition
          const current = list.find((ex) => ex.status === "actual");
          const past = list.filter((ex) => ex.status === "pasada");
          const selected = current || past[0] || list[0];

          if (selected) {
            // Build images array
            const imgList = [];
            if (Array.isArray(selected.images) && selected.images.length > 0) {
              imgList.push(...selected.images);
            }
            if (selected.coverImage && !imgList.includes(selected.coverImage)) {
              imgList.unshift(selected.coverImage);
            }

            // Build date display string
            let dateText = selected.dateDisplay || "";
            if (!dateText) {
              if (selected.startDate && selected.endDate) {
                dateText = `${formatDateDisplay(selected.startDate)} — ${formatDateDisplay(selected.endDate)}`;
              } else if (selected.startDate) {
                dateText = formatDateDisplay(selected.startDate);
              } else {
                dateText = "Noviembre 2024";
              }
            }

            setExhibition({
              id: selected.id || "",
              title: selected.title || DEFAULT_EXHIBITION.title,
              location: selected.location || DEFAULT_EXHIBITION.location,
              dateDisplay: dateText,
              images: imgList.length > 0 ? imgList : DEFAULT_EXHIBITION.images,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching latest exhibition for homepage:", err);
      }
    }

    fetchLatestExhibition();
  }, []);

  const images = exhibition.images || DEFAULT_EXHIBITION.images;
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const exhibitionHref = exhibition.id
    ? `/exhibiciones/${exhibition.id}`
    : "/exhibiciones";

  return (
    <section className={styles.container} aria-label="Exhibición Destacada">
      <Link href={exhibitionHref} className={styles.cardLink}>
        <div className={styles.imageWrapper}>
          <img
            src={images[currentImageIndex]}
            alt={`${exhibition.title} - Imagen ${currentImageIndex + 1}`}
            className={styles.image}
          />

          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className={`${styles.navButton} ${styles.prevButton}`}
                aria-label="Imagen anterior"
              >
                <svg className={styles.arrowIcon} viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
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

        <div className={styles.details}>
          <div className={styles.headerRow}>
            <h2 className={styles.title}>{exhibition.title}</h2>
            {exhibition.location && (
              <>
                <span className={styles.separator}>-</span>
                <span className={styles.location}>{exhibition.location}</span>
              </>
            )}
          </div>
          {exhibition.dateDisplay && (
            <p className={styles.date}>{exhibition.dateDisplay}</p>
          )}
        </div>
      </Link>
    </section>
  );
}
