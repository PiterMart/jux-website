"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/educacion.module.css";

export default function EducacionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducacion = async () => {
      try {
        const snap = await getDocs(collection(firestore, "educacion"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by order/creation/updatedAt if available
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
              <motion.a
                key={item.id}
                href={item.pdfUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.itemRow}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                <h2 className={styles.itemTitle}>{item.title}</h2>
                {item.hashtags && item.hashtags.length > 0 && (
                  <span className={styles.itemHashtags}>
                    {formatHashtags(item.hashtags)}
                  </span>
                )}
              </motion.a>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
