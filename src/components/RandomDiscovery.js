"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "../styles/RandomDiscovery.module.css";

const DEFAULT_EDUCACION_ITEMS = [
  {
    id: "default-1",
    title: "Falta Compartida",
    hashtags: ["memoria", "postmemoria", "sublimación", "exhibición"],
    pdfUrl: "/animacion/MUSEOJUXXXXOK1.png",
  },
  {
    id: "default-2",
    title: "Poéticas del Espacio",
    hashtags: ["archivo", "arquitectura", "pedagogía", "territorio"],
    pdfUrl: "/animacion/MUSEOJUXXXXOK2.png",
  },
  {
    id: "default-3",
    title: "Fronteras y Representación",
    hashtags: ["crítica", "identidad", "curaduría", "contemporáneo"],
    pdfUrl: "/animacion/MUSEOJUXXXXOK3.png",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 45, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const hashtagsVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const starVariants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -25 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const moreLinkVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function RandomDiscovery({ items = [] }) {
  const activePool = items && items.length > 0 ? items : DEFAULT_EDUCACION_ITEMS;
  const [selectedItem, setSelectedItem] = useState(activePool[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * activePool.length);
    setSelectedItem(activePool[randomIndex]);
  }, [items]);

  const current = selectedItem || activePool[0];

  const formatHashtags = (hashtags) => {
    if (!hashtags) return "";
    const list = Array.isArray(hashtags)
      ? hashtags
      : typeof hashtags === "string"
        ? hashtags.split(",").map((s) => s.trim())
        : [];

    return list
      .map((tag) => tag.replace(/^#+/, "").trim())
      .filter(Boolean)
      .join(" – ");
  };

  const pdfHref = current.pdfUrl || "#";

  return (
    <section className={styles.container} aria-label="Texto de Educación Destacado">
      <div className={styles.innerContent}>
        <motion.div
          className={styles.discoveryWrapper}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.25 }}
          variants={containerVariants}
        >
          {/* Clickable Document Link to PDF */}
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.itemRow}
          >
            <div className={styles.textColumn}>
              <motion.h2
                className={styles.itemTitle}
                variants={titleVariants}
              >
                {current.title}
              </motion.h2>

              {current.hashtags && current.hashtags.length > 0 && (
                <motion.span
                  className={styles.itemHashtags}
                  variants={hashtagsVariants}
                >
                  {formatHashtags(current.hashtags)}
                </motion.span>
              )}
            </div>

            <motion.div
              className={styles.starWrapper}
              variants={starVariants}
            >
              <svg
                className={styles.starSvg}
                viewBox="0 0 100 115.47"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <polygon
                  points="50,4 96,83.6 4,83.6"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <polygon
                  points="50,111.47 4,31.87 96,31.87"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </a>

          {/* Lecturas link to /educacion */}
          <motion.div
            className={styles.moreLinkWrapper}
            variants={moreLinkVariants}
          >
            <Link href="/educacion" className={styles.moreLink}>
              <span className={styles.plusSign}>+</span>
              <span className={styles.moreText}>LECTURAS</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
