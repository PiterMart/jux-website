"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/page360.module.css";

export default function Page360() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch360() {
      try {
        const snap = await getDocs(collection(firestore, "exhibitions"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Filter those with 360 tour URL or fall back to exhibitions with cover
        const validTours = list.filter((ex) => Boolean(ex.tour360Url));
        setExhibitions(validTours.length > 0 ? validTours : list.filter((ex) => Boolean(ex.coverImage)));
      } catch (error) {
        console.error("Error fetching 360 exhibitions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetch360();
  }, []);

  return (
    <div className={pageStyles.page}>
      <main className={styles.container}>
        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "1.1rem" }}>
            Cargando recorridos 360°...
          </p>
        ) : exhibitions.length === 0 ? (
          <div className={styles.emptyBox}>
            <h2 className={styles.emptyTitle}>Próximamente Recorridos 360°</h2>
            <p style={{ color: "#666", maxWidth: "600px", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
              Estamos preparando las experiencias inmersivas 360° de nuestras próximas muestras.
            </p>
            <Link
              href="/exhibiciones"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.75rem",
                backgroundColor: "#111",
                color: "#fff",
                borderRadius: "4px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Ver Exhibiciones
            </Link>
          </div>
        ) : (
          <motion.div
            className={styles.tourList}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            {exhibitions.map((ex) => {
              const tourUrl = ex.tour360Url || `/exhibiciones/${ex.id}`;
              return (
                <motion.a
                  key={ex.id}
                  href={tourUrl}
                  target={ex.tour360Url ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className={styles.tourCard}
                  variants={{
                    hidden: { opacity: 0, scale: 0.96 },
                    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  {ex.coverImage && (
                    <img src={ex.coverImage} alt={ex.title} className={styles.tourImage} />
                  )}
                  <div className={styles.overlayScrim} />

                  <div className={styles.centerContent}>
                    <span className={styles.badge}>Experiencia 360°</span>
                    <h1 className={styles.title}>{ex.title}</h1>
                    {ex.subtitle && <p className={styles.subtitle}>{ex.subtitle}</p>}
                    <span className={styles.ctaText}>Iniciar Recorrido Virtual →</span>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
