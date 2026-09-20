"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/educacion.module.css";

// Dynamic import with SSR disabled for react-pdf
const PdfModalViewer = dynamic(() => import("../../components/PdfModalViewer"), {
  ssr: false,
});

export default function EducacionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePdf, setActivePdf] = useState(null); // Holds { url, title }

  useEffect(() => {
    const fetchEducacion = async () => {
      try {
        const snap = await getDocs(collection(firestore, "educacion"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        list.sort((a, b) => {
          const timeA = a.createdAt || a.updatedAt || "";
          const timeB = b.createdAt || b.updatedAt || "";
          return timeB.localeCompare(timeA);
        });
        setItems(list);
      } catch (err) {
        console.error("Error fetching educacion items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEducacion();
  }, []);

  const formatHashtags = (hashtags) => {
    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) return "";
    return hashtags
      .map((tag) => tag.replace(/^#+/, "").trim())
      .filter(Boolean)
      .join(" – ");
  };

  return (
    <div className={pageStyles.page}>
      <main className={styles.container}>
        {loading ? (
          <p className={styles.statusMessage}>Cargando textos...</p>
        ) : items.length === 0 ? (
          <p className={styles.statusMessage}>
            No hay textos publicados por el momento.
          </p>
        ) : (
          <motion.div
            className={styles.list}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {items.map((item) => (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => setActivePdf({ url: item.pdfUrl, title: item.title })}
                className={styles.itemRow}
                style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", width: "100%" }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                <h2 className={styles.itemTitle}>
                  {item.title} <span className={styles.arrow} aria-hidden="true">→</span>
                </h2>
                {item.hashtags && item.hashtags.length > 0 && (
                  <span className={styles.itemHashtags}>
                    {formatHashtags(item.hashtags)}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </main>

      {/* PDF Modal Viewer */}
      {activePdf && (
        <PdfModalViewer
          file={activePdf.url}
          title={activePdf.title}
          onClose={() => setActivePdf(null)}
        />
      )}
    </div>
  );
}