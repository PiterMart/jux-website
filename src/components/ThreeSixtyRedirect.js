"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "../styles/ThreeSixtyRedirect.module.css";

export default function ThreeSixtyRedirect() {
  return (
    <section className={styles.container} aria-label="Recorrido 360°">
      <Link href="/360" className={styles.redirectLink}>
        <motion.div
          className={styles.textWrapper}
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02, x: 20 }}
        >
          <span className={styles.text360}>°360</span>
        </motion.div>
      </Link>
    </section>
  );
}
