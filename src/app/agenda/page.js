"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { calculateExhibitionStatus, formatDateDisplay } from "../firebase/dateUtils";
import styles from "../../styles/page.module.css";

export default function AgendaPage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ paddingTop: "8rem", maxWidth: "1200px" }}>
        <motion.h1
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: "800",
            marginBottom: "3rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Agenda de Actividades
        </motion.h1>

        {loading ? (
          <p style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "1.1rem" }}>
            Cargando agenda...
          </p>
        ) : exhibitions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#666" }}>
            <p style={{ fontSize: "1.1rem" }}>No hay actividades programadas en este momento.</p>
          </div>
        ) : (
          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            {exhibitions.map((item) => (
              <motion.div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "2rem",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  padding: "2rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(17, 17, 17, 0.12)",
                  alignItems: "center",
                }}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                {item.coverImage && (
                  <div
                    style={{
                      width: "100%",
                      height: "220px",
                      overflow: "hidden",
                      borderRadius: "4px",
                      backgroundColor: "#e0e0e0",
                    }}
                  >
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.3rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      borderRadius: "3px",
                      width: "fit-content",
                      backgroundColor:
                        item.status === "actual"
                          ? "var(--secondary-main, #1A2BFF)"
                          : item.status === "proxima"
                          ? "#111111"
                          : "#666666",
                      color: "#ffffff",
                    }}
                  >
                    {item.status === "actual"
                      ? "En Curso"
                      : item.status === "proxima"
                      ? "Próximamente"
                      : "Muestra Pasada"}
                  </span>

                  <h2
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "700",
                      fontFamily: "var(--font-family-base)",
                      margin: 0,
                    }}
                  >
                    {item.title}
                  </h2>
                  {item.subtitle && (
                    <p style={{ fontSize: "1.05rem", color: "#555", fontStyle: "italic", margin: 0 }}>
                      {item.subtitle}
                    </p>
                  )}

                  {(item.startDate || item.endDate) && (
                    <p style={{ fontSize: "0.95rem", color: "#333", margin: "0.25rem 0" }}>
                      <strong>Fechas:</strong> {formatDateDisplay(item.startDate)}{" "}
                      {item.endDate ? `— ${formatDateDisplay(item.endDate)}` : ""}
                    </p>
                  )}

                  {item.location && (
                    <p style={{ fontSize: "0.95rem", color: "#333", margin: "0.25rem 0" }}>
                      <strong>Ubicación:</strong> {item.location}
                    </p>
                  )}

                  <div style={{ marginTop: "0.75rem" }}>
                    <Link
                      href={`/exhibiciones/${item.id}`}
                      style={{
                        display: "inline-block",
                        padding: "0.6rem 1.4rem",
                        backgroundColor: "#111111",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderRadius: "3px",
                        transition: "background-color 0.25s ease",
                      }}
                    >
                      Ver Detalle →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
