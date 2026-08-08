"use client";

import React from "react";
import { motion } from "framer-motion";
import styles from "../styles/QueEsJux.module.css";

const JUX_PILLARS = [
  {
    title: "MUSEO",
    text: "Un museo judío contemporáneo argentino, pero expandido.",
  },
  {
    title: "ARTE",
    text: "Trabaja desde las prácticas del arte contemporáneo, lo interdisciplinario y lo comunitario.",
  },
  {
    title: "AFECTIVO",
    text: "Apuesta por la transmisión horizontal, por la participación, por lo afectivo.",
  },
  {
    title: "MUTUA",
    text: "No está atado únicamente a un edificio o una colección física: se desplaza, muta.",
  },
  {
    title: "EXPANDIDO",
    text: "Porque rompe con la idea del museo como contenedor.",
  },
  {
    title: "NARRACIÓN",
    text: "Pone en juego nuevas formas de narrar lo judío.",
  },
  {
    title: "CULTURA",
    text: "Piensa la cultura judía como algo vivo, móvil, híbrido, transcultural y transgeneracional.",
  },
  {
    title: "TRADICIÓN",
    text: "Permite que lo judío suceda en múltiples soportes: obras, acciones, publicaciones, relatos familiares, intervenciones urbanas, conversaciones, desde lo educativo.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function QueEsJux() {
  return (
    <section className={styles.section} aria-label="¿Qué es Jux.?">
      <motion.h1
        className={styles.mainTitle}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        ¿QUÉ ES JUX.?
      </motion.h1>
      <motion.div
        className={styles.grid}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {JUX_PILLARS.map((pillar, index) => (
          <motion.div key={index} className={styles.item} variants={itemVariants}>
            <h2 className={styles.itemTitle}>{pillar.title}</h2>
            <p className={styles.itemText}>{pillar.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
