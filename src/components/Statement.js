import React from "react";
import styles from "../styles/Statement.module.css";

export default function Statement() {
  return (
    <section className={styles.statementSection} aria-label="Museum Statement">
      <span className={styles.sectionBadge}>STATEMENT</span>
      <h1 className={styles.title}>UNA IDENTIDAD MAS LIBRE</h1>
      <p className={styles.subtitle}>
        ES UN MUSEO QUE NO SE LIMITA A REPRESENTAR UNA COMUNIDAD. DIALOGA CON
        ELLA LA CUESTIONA Y LA REVIENTA
      </p>
      <div className={styles.decorativeLine} aria-hidden="true" />
    </section>
  );
}
