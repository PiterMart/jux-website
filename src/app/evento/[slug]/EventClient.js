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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxSlides = useMemo(() => {
    if (!performance) return [];
    const eventImage = performance.banner || performance.flyer;
    const slides = [];
    if (eventImage) {
      slides.push({ src: eventImage, alt: `Flyer del evento ${performance.name || "Actividad"} - Nos Envera` });
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

  const eventImage = performance.banner || performance.flyer;

  return (
    <>
      <section className={styles.responsiveSection} style={{ display: "flex", flexDirection: "row", gap: "1.5rem", alignItems: "flex-start" }}>
        {eventImage ? (
          <div
            className={styles.responsiveImageContainer}
            style={{
              width: "50%",
              flexShrink: 0,
              backgroundColor: imgLoaded ? "#f0f0f0" : "transparent",
              backgroundImage: imgLoaded ? "none" : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: imgLoaded ? "auto" : "200% 100%",
              animation: imgLoaded ? "none" : "shimmer 1.5s infinite",
              aspectRatio: imgLoaded ? "auto" : "3 / 4",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--border-radius)",
              transition: "aspect-ratio 0.3s ease",
              cursor: "pointer",
            }}
            onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
          >
            <Image
              src={eventImage}
              alt={`Flyer del evento ${performance.name || "Actividad"} - Nos Envera`}
              onLoad={() => setImgLoaded(true)}
              width={800}
              height={1000}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{
                minWidth: "5rem",
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.3s ease, transform 0.3s ease",
                transform: "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (imgLoaded) e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                if (imgLoaded) e.currentTarget.style.transform = "scale(1)";
              }}
            />
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

          {(performance.address || performance.googleMapsLink || performance.purchaseLink) ? (
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
              {performance.purchaseLink ? (
                <a
                  href={performance.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
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
                  Más Información / Entradas
                </a>
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
                onClick={() => { setLightboxIndex(index + 1); setLightboxOpen(true); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && (setLightboxIndex(index + 1), setLightboxOpen(true))}
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
