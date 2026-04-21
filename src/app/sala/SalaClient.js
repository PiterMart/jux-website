"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Lightbox from '../../components/Lightbox';
import styles from '../../styles/Sala.module.css';
import AnimatedPageHeader from '../../components/AnimatedPageHeader';

const IMAGES = [
  '/espacio/SalaNosEnvera10.jpg',
  '/espacio/SalaNosEnvera9.jpg',
  '/espacio/SalaNosEnvera4.jpg',
  '/espacio/SalaNosEnvera.jpg',
  '/espacio/SalaNosEnvera7.jpg',
  '/espacio/SalaNosEnvera8.jpg',
  '/espacio/SalaNosEnvera2.jpg',
  '/espacio/SalaNosEnvera3.jpg',
  '/espacio/SalaNosEnvera5.jpg',
  '/espacio/SalaNosEnvera6.jpg',
];

function CarouselImage({ src, alt, onClick }) {
  const [aspectRatio, setAspectRatio] = useState(3 / 4); // Default fallback

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  return (
    <div
      className={styles.carouselItem}
      style={{ '--aspect-ratio': aspectRatio }}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        className={styles.carouselImage}
        fill
        sizes="(max-width: 768px) 85vw, 400px"
        onLoad={handleLoad}
      />
    </div>
  );
}

export default function SalaClient() {
  const [loaded, setLoaded] = useState(false);
  const headerRef = useRef(null);
  const trackRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxSlides = IMAGES.map(src => ({ src, alt: `Sala foto ${src.split('/').pop()} - Nos Envera` }));

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setLoaded(true);
      },
      { threshold: 0.2 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    if (window.innerWidth <= 768) return;

    const element = e.currentTarget;
    const { left, width } = element.getBoundingClientRect();
    const x = e.clientX - left;

    const edgePercentage = 0.15;
    const scrollSpeed = 5;

    clearInterval(scrollIntervalRef.current);

    if (x < width * edgePercentage) {
      scrollIntervalRef.current = setInterval(() => {
        if (trackRef.current) trackRef.current.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
      }, 16);
    } else if (x > width * (1 - edgePercentage)) {
      scrollIntervalRef.current = setInterval(() => {
        if (trackRef.current) trackRef.current.scrollBy({ left: scrollSpeed, behavior: 'auto' });
      }, 16);
    }
  };

  const handleMouseLeave = () => {
    clearInterval(scrollIntervalRef.current);
  };

  useEffect(() => {
    return () => clearInterval(scrollIntervalRef.current);
  }, []);

  return (
    <div className={styles.container}>
      <div ref={headerRef} style={{ marginBottom: '2rem' }}>
        <AnimatedPageHeader loaded={loaded}>SALA</AnimatedPageHeader>
      </div>

      {/* Intro Section - Similar to EventClient.js */}
      <section className={styles.responsiveSection}>
        <div className={styles.responsiveImageContainer}>
          <Image
            src={IMAGES[3]}
            alt="Sala principal - Nos Envera"
            width={800}
            height={1000}
            className={styles.image}
            priority
          />
        </div>

        <div className={styles.textContainer}>
          <p className={styles.paragraph} style={{ textAlign: "justify" }}>
            La sala es el campo de prueba donde los procesos toman cuerpo. Con equipamiento técnico y capacidad para adaptarse a distintos formatos, funciona como un dispositivo abierto, que se transforma y se adapta a lo que suceda.
          </p>

          <a
            href="/NV - rider técnico sala - 2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              padding: "0.8rem 1.5rem",
              backgroundColor: "#111",
              color: "#fff",
              textDecoration: "none",
              letterSpacing: "1px",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              textAlign: "center",
              cursor: "pointer",
              alignSelf: "flex-start",
              transition: "opacity 0.2s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Descargar Rider Técnico
          </a>
          <div className={styles.footerCol}>
            <div>
              <h3 className={styles.contactTitle}>Ubicación</h3>
              <a
                href="https://maps.app.goo.gl/x3uyNJrSMe7eSQqm8"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.contactLink} ${styles.footerIndent} ${styles.footerSubtext}`}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span> → Vera 1350 - Villa Crespo - CABA</span>
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* Gallery Section - Carousel */}
      <section className={styles.carouselContainer} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className={styles.carouselTrack} ref={trackRef}>
          {IMAGES.map((src, idx) => (
            <CarouselImage
              key={idx}
              src={src}
              alt={`Sala foto ${idx + 1} - Nos Envera`}
              onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
            />
          ))}
        </div>
      </section>

      {/* Maps Section - Limited to 500px, Left aligned */}
      {/* <section className={styles.section}>
        <div className={styles.mapContainer}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1642.067332152843!2d-58.4357497!3d-34.5947387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb590740a6b71%3A0xe5469abb20188686!2sVera%20845%2C%20C1414%20Cdad.%20Aut%C3%B3noma%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1711388543210!5m2!1ses-419!2sar"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Google Maps Location"
          ></iframe>
        </div>
      </section> */}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          isOpen={lightboxOpen}
          slides={lightboxSlides}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}


