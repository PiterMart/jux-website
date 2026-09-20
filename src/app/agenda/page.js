"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { calculateExhibitionStatus, formatDateDisplay } from "../firebase/dateUtils";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/agenda.module.css";

function getBigDateDisplay(startDateStr) {
  if (!startDateStr) return { day: "—", month: "" };
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) {
    const parts = startDateStr.split("-");
    if (parts.length >= 3) {
      const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return { day: parts[2], month: months[monthIdx] || "" };
    }
    return { day: startDateStr, month: "" };
  }
  const day = date.getDate().toString().padStart(2, "0");
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const month = months[date.getMonth()];
  return { day, month };
}

export default function AgendaPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchAgenda() {
      try {
        const snap = await getDocs(collection(firestore, "exhibitions"));
        const list = snap.docs.map((d) => {
          const data = d.data();
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
          const autoStatus = calculateExhibitionStatus(startStr, endStr);

          return {
            id: d.id,
            ...data,
            startDate: startStr,
            endDate: endStr,
            status: data.status || autoStatus,
          };
        });

        list.sort((a, b) => {
          const statusOrder = { actual: 0, proxima: 1, pasada: 2 };
          const orderDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
          if (orderDiff !== 0) return orderDiff;

          const timeA = a.startTimestamp?.seconds || (a.startDate ? new Date(a.startDate).getTime() : 0);
          const timeB = b.startTimestamp?.seconds || (b.startDate ? new Date(b.startDate).getTime() : 0);
          return timeB - timeA;
        });

        setExhibitions(list);
      } catch (err) {
        console.error("Error fetching gallery agenda:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgenda();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (status) => {
    if (status === "actual") {
      return <span className={`${styles.statusBadge} ${styles.badgeActual}`}>En Curso</span>;
    }
    if (status === "proxima") {
      return <span className={`${styles.statusBadge} ${styles.badgeProxima}`}>Próximamente</span>;
    }
    return null;
  };

  return (
    <div className={pageStyles.page}>
      <main className={styles.pageContainer}>
        {/* AGENDA SECTION HEADER */}
        <motion.h1
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          AGENDA DE ACTIVIDADES
        </motion.h1>

        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "1.1rem" }}>
            Cargando agenda...
          </p>
        ) : exhibitions.length === 0 ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "1.1rem" }}>
            No hay actividades programadas en este momento.
          </p>
        ) : (
          <motion.div
            className={styles.agendaList}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.1 },
              },
            }}
          >
            {exhibitions.map((item) => {
              const isExpanded = expandedId === item.id;
              const dateInfo = getBigDateDisplay(item.startDate);
              const fullDateRange =
                item.startDate || item.endDate
                  ? `${formatDateDisplay(item.startDate)} ${item.endDate ? `— ${formatDateDisplay(item.endDate)}` : ""}`
                  : null;

              return (
                <motion.div
                  key={item.id}
                  className={`${styles.agendaCard} ${isExpanded ? styles.agendaCardActive : ""}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  <div
                    className={styles.cardHeader}
                    onClick={() => toggleExpand(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpand(item.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    {/* Big Date Number Display */}
                    <div className={styles.bigDateBlock}>
                      <span className={styles.bigDateNumber}>{dateInfo.day}</span>
                      {dateInfo.month && <span className={styles.bigDateMonth}>{dateInfo.month}</span>}
                    </div>

                    {item.coverImage && (
                      <div className={styles.coverWrapper}>
                        <img src={item.coverImage} alt={item.title} className={styles.coverImg} />
                      </div>
                    )}

                    <div className={styles.cardMainInfo}>
                      <div className={styles.statusRow}>
                        {getStatusBadge(item.status)}
                      </div>

                      <h2 className={styles.itemTitle}>{item.title}</h2>
                      {item.subtitle && <p className={styles.itemSubtitle}>{item.subtitle}</p>}
                    </div>

                    <div
                      className={styles.toggleIcon}
                      style={{ transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className={styles.expandedContainer}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className={styles.detailGrid}>
                          {fullDateRange && (
                            <div className={styles.detailItem}>
                              <strong>Fechas:</strong> {fullDateRange}
                            </div>
                          )}

                          {item.location && (
                            <div className={styles.detailItem}>
                              <strong>Lugar:</strong> {item.location}
                            </div>
                          )}

                          {item.curator && (
                            <div className={styles.detailItem}>
                              <strong>Curaduría:</strong> {item.curator}
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <div className={styles.descriptionBox}>
                            <p style={{ margin: 0 }}>{item.description}</p>
                          </div>
                        )}

                        <div className={styles.actionRow}>
                          <Link href="/exhibiciones" className={styles.blueBtn}>
                            Ver en Exhibiciones →
                          </Link>

                          {item.tour360Url && (
                            <a
                              href={item.tour360Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.outlineBtn}
                            >
                              Recorrido 360° ↗
                            </a>
                          )}
                        </div>
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
