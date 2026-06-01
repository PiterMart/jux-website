"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import styles from "../../../styles/page.module.css";
import BackNavLinks from "../../../components/BackNavLinks";
import { TransitionLink } from "../../../components/TransitionLink";

const Lightbox = dynamic(() => import("../../../components/Lightbox"), { ssr: false });

import {
  FALLBACK_IMAGE_WIDE as FALLBACK_IMAGE,
  formatDate,
  eventContainsPerformance,
  eventContainsTraining,
  eventContainsResidency,
  getVideoEmbedUrl,
  isLikelyVideo,
} from "../../../lib/eventUtils";

export default function EventClient({ performance }) {
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [flyerLoaded, setFlyerLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxSlides = useMemo(() => {
    if (!performance) return [];
    const slides = [];
    if (performance.banner) {
      slides.push({ src: performance.banner, alt: `Banner del evento ${performance.name || "Actividad"} - Nos Envera` });
    }
    if (performance.flyer && performance.flyer !== performance.banner) {
      slides.push({ src: performance.flyer, alt: `Flyer del evento ${performance.name || "Actividad"} - Nos Envera` });
    }
    if (performance.gallery?.length) {
      performance.gallery.forEach((item, i) => {
        slides.push({ src: item.url, alt: item.description ? `${item.description} - Nos Envera` : `Imagen de galería ${i + 1} del evento ${performance.name || "Actividad"} - Nos Envera` });
      });
    }
    return slides;
  }, [performance]);

  const enriched = useMemo(() => {
    if (!performance) return null;

    const firstDate = performance?.dates?.find?.((entry) => entry?.date) || null;
    const formattedDates = (performance?.dates || [])
      .map((entry) => {
        const dateValue = entry?.date;
        let dateObj;
        if (dateValue?.toDate) {
          dateObj = dateValue.toDate();
        } else {
          dateObj = new Date(dateValue);
        }

        let dateLabel = "";
        if (dateObj instanceof Date && !Number.isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          if (year <= 2025) {
            dateLabel = new Intl.DateTimeFormat("es-ES", {
              month: "long",
              year: "numeric",
            }).format(dateObj);
          } else {
            dateLabel = formatDate(dateValue);
          }
        }

        const time = entry?.time;
        if (!dateLabel && !time) return null;
        return {
          dateLabel,
          time,
        };
      })
      .filter(Boolean);

    const year = formatDate(firstDate?.date)?.split(" ").pop() || null;

    return {
      ...performance,
      formattedDates,
      year,
    };
  }, [performance]);

  const backNavLinks = useMemo(() => {
    if (!performance) return [];
    const links = [];
    if (performance.eventTypes?.length) {
      if (eventContainsPerformance(performance.eventTypes)) links.push({ href: "/performances", label: "Perfos" });
      if (eventContainsTraining(performance.eventTypes)) links.push({ href: "/formaciones", label: "Formación" });
      if (eventContainsResidency(performance.eventTypes)) links.push({ href: "/residencias", label: "Residencias" });
    }
    links.push({ href: "/archivo", label: "archivo" });
    links.push({ href: "/agenda", label: "agenda" });
    return links;
  }, [performance]);

  if (!performance) return null;

  return (
    <>
      <section className={styles.responsiveSection} style={{ display: "flex", flexDirection: "row", gap: "1.5rem", alignItems: "flex-start" }}>
        {performance.banner || performance.flyer ? (
          <div
            className={styles.responsiveImageContainer}
            style={{
              width: "50%",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {performance.banner ? (
              <div
                style={{
                  width: "100%",
                  backgroundColor: bannerLoaded ? "#f0f0f0" : "transparent",
                  backgroundImage: bannerLoaded ? "none" : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                  backgroundSize: bannerLoaded ? "auto" : "200% 100%",
                  animation: bannerLoaded ? "none" : "shimmer 1.5s infinite",
                  aspectRatio: bannerLoaded ? "auto" : "3 / 4",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--border-radius)",
                  transition: "aspect-ratio 0.3s ease",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const bannerIdx = lightboxSlides.findIndex(slide => slide.src === performance.banner);
                  setLightboxIndex(bannerIdx >= 0 ? bannerIdx : 0);
                  setLightboxOpen(true);
                }}
              >
                <Image
                  src={performance.banner}
                  alt={`Banner del evento ${performance.name || "Actividad"} - Nos Envera`}
                  onLoad={() => setBannerLoaded(true)}
                  width={800}
                  height={1000}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{
                    minWidth: "5rem",
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                    opacity: bannerLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    transform: "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    if (bannerLoaded) e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    if (bannerLoaded) e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              </div>
            ) : null}

            {performance.flyer && performance.flyer !== performance.banner ? (
              <div
                style={{
                  width: "100%",
                  backgroundColor: flyerLoaded ? "#f0f0f0" : "transparent",
                  backgroundImage: flyerLoaded ? "none" : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                  backgroundSize: flyerLoaded ? "auto" : "200% 100%",
                  animation: flyerLoaded ? "none" : "shimmer 1.5s infinite",
                  aspectRatio: flyerLoaded ? "auto" : "3 / 4",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--border-radius)",
                  transition: "aspect-ratio 0.3s ease",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const flyerIdx = lightboxSlides.findIndex(slide => slide.src === performance.flyer);
                  setLightboxIndex(flyerIdx >= 0 ? flyerIdx : 0);
                  setLightboxOpen(true);
                }}
              >
                <Image
                  src={performance.flyer}
                  alt={`Flyer del evento ${performance.name || "Actividad"} - Nos Envera`}
                  onLoad={() => setFlyerLoaded(true)}
                  width={800}
                  height={1000}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{
                    minWidth: "5rem",
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                    opacity: flyerLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    transform: "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    if (flyerLoaded) e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    if (flyerLoaded) e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flex: 1, textAlign: "left", alignItems: "flex-start" }}>
          {performance.subtitle ? (
            <p style={{ fontSize: "2rem", lineHeight: "1", color: "#444", margin: 0, textAlign: "left" }}>{performance.subtitle}</p>
          ) : null}

          {performance.description?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", lineHeight: "1.7", textAlign: "left" }}>
              {performance.description.map((paragraph, index) => (
                <p key={`desc-${index}`} style={{ margin: 0, textAlign: "left" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {performance.artists?.length ? (
            <div style={{ textAlign: "left", alignSelf: "flex-start" }}>
              <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>Artistas</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0 0", display: "flex", flexDirection: "column", gap: "0.35rem", textAlign: "left" }}>
                {performance.artists.map((artist, index) => (
                  <li key={`artist-${index}`} style={{ color: "#444", textAlign: "left" }}>
                    {artist.memberId ? (
                      <TransitionLink
                        href={`/comunidad/${artist.memberId}`}
                        style={{ color: "#444", textDecoration: "none", borderBottom: "1px solid #444" }}
                      >
                        {artist.name}
                      </TransitionLink>
                    ) : (
                      artist.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {performance.directors?.length ? (
            <div style={{ textAlign: "left", alignSelf: "flex-start" }}>
              <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>Directores</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0 0", display: "flex", flexDirection: "column", gap: "0.35rem", textAlign: "left" }}>
                {performance.directors.map((director, index) => (
                  <li key={`director-${index}`} style={{ color: "#444", textAlign: "left" }}>
                    {director.memberId ? (
                      <TransitionLink
                        href={`/comunidad/${director.memberId}`}
                        style={{ color: "#444", textDecoration: "none", borderBottom: "1px solid #444" }}
                      >
                        {director.name}
                      </TransitionLink>
                    ) : (
                      director.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {enriched?.formattedDates?.length ? (
            <div style={{ textAlign: "left", alignSelf: "flex-start" }}>
              <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>Fechas</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0 0", display: "flex", flexDirection: "column", gap: "0.35rem", textAlign: "left" }}>
                {enriched.formattedDates.map((entry, index) => (
                  <li key={`date-${index}`} style={{ color: "#444", textAlign: "left" }}>
                    {entry.dateLabel || "Fecha por confirmar"}
                    {entry.time ? ` · ${entry.time}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {(performance.address || performance.googleMapsLink || performance.purchaseLink || performance.pdfLink) ? (
            <div style={{ textAlign: "left", alignSelf: "flex-start" }}>
              <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>Ubicación</h2>
              {performance.address ? (
                <p style={{ color: "#444", marginTop: "0.5rem", textAlign: "left" }}>{performance.address}</p>
              ) : null}
              {performance.googleMapsLink ? (
                <a
                  href={performance.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
                    paddingBottom: "0.2rem",
                    borderBottom: "1px solid #222",
                    fontSize: "0.9rem",
                    letterSpacing: "0.5px",
                    color: "#222",
                    textDecoration: "none",
                    textAlign: "left",
                  }}
                >
                  Ver en Google Maps
                </a>
              ) : null}
              {(performance.purchaseLink || performance.pdfLink) ? (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {performance.purchaseLink ? (
                    <a
                      href={performance.purchaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "0.6rem 1.2rem",
                        backgroundColor: "#111",
                        color: "#fff",
                        textDecoration: "none",
                        letterSpacing: "0.5px",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        textAlign: "left",
                      }}
                    >
                      FORMULARIO DE INSCRIPCION
                    </a>
                  ) : null}
                  {performance.pdfLink ? (
                    <a
                      href={performance.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "0.6rem 1.2rem",
                        border: "1px solid #111",
                        color: "#111",
                        backgroundColor: "transparent",
                        textDecoration: "none",
                        letterSpacing: "0.5px",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        textAlign: "left",
                      }}
                    >
                      BASES Y CONDICIONES
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {performance.videoLink ? (
            <div style={{ width: "100%", maxWidth: "350px" }}>
              {isLikelyVideo(performance.videoLink) ? (
                <video
                  src={performance.videoLink}
                  controls
                  className={styles.directVideo}
                />
              ) : (
                <div className={styles.videoWrapper}>
                  <iframe
                    src={getVideoEmbedUrl(performance.videoLink)}
                    className={styles.videoIframe}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Video del evento ${performance.name || "Actividad"} - Nos Envera`}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {performance.gallery?.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              display: "grid",
              gap: "1.5rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {performance.gallery.map((item, index) => (
              <figure
                key={`gallery-${index}`}
                style={{
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const imgIdx = lightboxSlides.findIndex(slide => slide.src === item.url);
                  setLightboxIndex(imgIdx >= 0 ? imgIdx : 0);
                  setLightboxOpen(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const imgIdx = lightboxSlides.findIndex(slide => slide.src === item.url);
                    setLightboxIndex(imgIdx >= 0 ? imgIdx : 0);
                    setLightboxOpen(true);
                  }
                }}
                aria-label={`Ver imagen ${index + 1} en galería`}
              >
                <Image
                  src={item.url}
                  alt={item.description ? `${item.description} - Nos Envera` : `Imagen de galería ${index + 1} del evento ${performance.name || "Actividad"} - Nos Envera`}
                  width={600}
                  height={600}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", objectFit: "cover", backgroundColor: "#f0f0f0", borderRadius: "var(--border-radius)" }}
                />
                {item.description ? (
                  <figcaption style={{ fontSize: "0.85rem", color: "#666" }}>{item.description}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <BackNavLinks links={backNavLinks} />

      {lightboxOpen && lightboxSlides.length > 0 && (
        <Lightbox
          isOpen={lightboxOpen}
          slides={lightboxSlides}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
