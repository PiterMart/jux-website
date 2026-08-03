"use client";

import React from "react";
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

export default function QueEsJux() {
  return (
    <section className={styles.section} aria-label="¿Qué es Jux.?">
      <h1 className={styles.mainTitle}>¿QUÉ ES JUX.?</h1>
      <div className={styles.grid}>
        {JUX_PILLARS.map((pillar, index) => (
          <div key={index} className={styles.item}>
            <h2 className={styles.itemTitle}>{pillar.title}</h2>
            <p className={styles.itemText}>{pillar.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
