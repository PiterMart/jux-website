"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDocs, collection } from "firebase/firestore";
import { motion } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import { calculateExhibitionStatus, formatDateDisplay } from "../firebase/dateUtils";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/exhibiciones.module.css";

export default function ExhibicionesPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const currentExhibitions = exhibitions.filter((ex) => ex.status === "actual");
  const pastExhibitions = exhibitions.filter((ex) => ex.status === "pasada" || !ex.status);
  const upcomingExhibitions = exhibitions.filter((ex) => ex.status === "proxima");

  const featured = currentExhibitions[0];

  return (
    <div className={pageStyles.page}>
      <main className={styles.pageContainer}>
        {/* Current Exhibition Hero (Blank if no current exhibition) */}
        {!loading && featured && (
          <motion.section
            className={styles.heroSection}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.heroImageContainer}>
              {featured.coverImage && (
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className={styles.heroImage}
                />
              )}

              {/* Blue Box Overlay to the bottom-left corner */}
              <div className={styles.blueInfoBox}>
                <span className={styles.heroTag}>
                  {featured.location || "Exhibición en Curso"}
                </span>
                <h1 className={styles.heroTitle}>{featured.title}</h1>
                {featured.subtitle && (
                  <p className={styles.heroSubtitle}>{featured.subtitle}</p>
                )}
                {(featured.startDate || featured.endDate) && (
                  <p className={styles.heroDates}>
                    {formatDateDisplay(featured.startDate)}{" "}
                    {featured.endDate ? `— ${formatDateDisplay(featured.endDate)}` : ""}
                  </p>
                )}
                {featured.curator && (
                  <p className={styles.heroCurator}>Curaduría: {featured.curator}</p>
                )}
                <Link href={`/exhibiciones/${featured.id}`} className={styles.heroCtaLink}>
                  Ver Exhibición →
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Upcoming Exhibitions */}
        {!loading && upcomingExhibitions.length > 0 && (
          <section className={styles.sectionBlock}>
            <motion.h2
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Próximamente
            </motion.h2>
            <div className={styles.archiveGrid}>
              {upcomingExhibitions.map((ex) => (
                <Link key={ex.id} href={`/exhibiciones/${ex.id}`} className={styles.archiveCard}>
                  {ex.coverImage && (
                    <div className={styles.archiveImageWrapper}>
                      <img src={ex.coverImage} alt={ex.title} className={styles.archiveImage} />
                    </div>
                  )}
                  <div>
                    <h3 className={styles.archiveTitle}>{ex.title}</h3>
                    {(ex.startDate || ex.endDate) && (
                      <p className={styles.archiveDates}>
                        {formatDateDisplay(ex.startDate)}{" "}
                        {ex.endDate ? `— ${formatDateDisplay(ex.endDate)}` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Past Exhibitions / Archive */}
        {!loading && pastExhibitions.length > 0 && (
          <section className={styles.sectionBlock}>
            <motion.h2
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Archivo de Exhibiciones
            </motion.h2>
            <motion.div
              className={styles.archiveGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.05 },
                },
              }}
            >
              {pastExhibitions.map((ex) => (
                <motion.div
                  key={ex.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  <Link href={`/exhibiciones/${ex.id}`} className={styles.archiveCard}>
                    {ex.coverImage && (
                      <div className={styles.archiveImageWrapper}>
                        <img src={ex.coverImage} alt={ex.title} className={styles.archiveImage} />
                      </div>
                    )}
                    <div>
                      <h3 className={styles.archiveTitle}>{ex.title}</h3>
                      {(ex.startDate || ex.endDate) && (
                        <p className={styles.archiveDates}>
                          {formatDateDisplay(ex.startDate)}{" "}
                          {ex.endDate ? `— ${formatDateDisplay(ex.endDate)}` : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </main>
    </div>
  );
}
