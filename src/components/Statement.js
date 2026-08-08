"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "../styles/Statement.module.css";

// Initial JUX Logo scroll window: fully visible at scroll 0, fades out on start of scroll
const LOGO_WINDOW = [0.00, 0.00, 0.05, 0.09];

// Scroll windows: [fadeInStart, fullyVisible, fadeOutStart, fullyGone]
// Calibrated with generous breathing space so the final line stays showcased before LatestExhibition arrives
const PHRASES = [
  {
    text: "ES UN MUSEO QUE NO SE LIMITA",
    window: [0.10, 0.14, 0.18, 0.22],
  },
  {
    text: "A REPRESENTAR UNA COMUNIDAD",
    window: [0.23, 0.27, 0.31, 0.35],
  },
  {
    text: "DIALOGA CON ELLA",
    window: [0.36, 0.40, 0.44, 0.48],
  },
  {
    text: "LA CUESTIONA",
    window: [0.49, 0.53, 0.57, 0.61],
  },
  {
    text: "Y LA REINVENTA",
    window: [0.62, 0.65, 0.68, 0.71],
  },
];

// Final climax phrase: finishes revealing by 0.79 and stays comfortably in place
const FINAL_PHRASE = {
  text: "UNA IDENTIDAD MAS LIBRE",
  window: [0.73, 0.76],
};

function JuxLogo({ scrollYProgress }) {
  const opacity = useTransform(
    scrollYProgress,
    LOGO_WINDOW,
    [1, 1, 0, 0]
  );
  const y = useTransform(
    scrollYProgress,
    LOGO_WINDOW,
    [0, 0, -20, -20]
  );

  return (
    <motion.div
      className={styles.logoBox}
      style={{ opacity, y }}
      aria-hidden="true"
    >
      <svg
        className={styles.juxLogoSvg}
        viewBox="0 0 68.68 31.15"
        fill="var(--background, #D3D5CE)"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="JUX."
      >
        <path d="m58.02,28.22h-4.84c-1.09,0-4.37-7.05-5.58-7.05-1,0-3.52,5.86-5.02,6.72-1.43.82-4.05.91-5.38-.11.9-2.95,6.77-8.44,6.77-11.14s-5.68-7.86-6.47-10.85c1.33-.82,4.01-.64,5.37.2,1.64,1.01,3.95,5.83,4.74,5.82,1.17,0,4.11-6.46,5.28-6.46h4.4l.32.6c-.19.31-.35.64-.52.96-1.23,2.25-4.54,6.02-5.29,7.9-1.27,3.16,2.99,7.26,4.59,9.91.64,1.07,1.57,2.24,1.64,3.49" strokeWidth="0"/>
        <path d="m19.78,5.44c.63-.04,2.11-.03,2.36.7.63,4.55-1.5,13.82,2.24,17.1,2.83,2.48,6.84.95,7.64-2.62l.58-14.37c.63-1.43,3.24-.91,4.41-.32-.3,5.26,1.39,13.53-1.21,18.17-3.59,6.4-14.92,5.67-17.23-1.51-1.03-3.19-1.24-12.51-.81-15.92.04-.32-.03-.66.3-.88.54-.08,1.2-.32,1.72-.36" strokeWidth="0"/>
        <path d="m16.11,23.1c-.8,5.89-9.05,6.67-13.12,3.73-1.19-.86-1.12-1.41-.43-2.61,1.97-3.42,3.52.34,6.07.22,3.64-.17,2.75-6.22,2.78-8.68.02-1.61.72-3.94-.26-5.51-.07-.12-1.27-.78-1.35-.78h-4.69c-.76-.8-.74-3.65.41-3.97l9.86.16.73.44v17Z" strokeWidth="0"/>
        <path d="m65.25,23.35c2.81,2.81-1.76,6.87-4.2,4.2-2.63-2.88,1.69-6.71,4.2-4.2" strokeWidth="0"/>
      </svg>
    </motion.div>
  );
}

function ScrollPhrase({ text, window: w, scrollYProgress }) {
  const opacity = useTransform(
    scrollYProgress,
    [w[0], w[1], w[2], w[3]],
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [w[0], w[1], w[2], w[3]],
    [24, 0, 0, -24]
  );

  return (
    <motion.div
      className={styles.phraseBox}
      style={{ opacity, y }}
      aria-hidden="true"
    >
      <p className={styles.phraseText}>{text}</p>
    </motion.div>
  );
}

function FinalPhrase({ scrollYProgress }) {
  // Fades in at 0.73-0.76 and remains at opacity 1 for the rest of the scroll
  const opacity = useTransform(
    scrollYProgress,
    [FINAL_PHRASE.window[0], FINAL_PHRASE.window[1]],
    [0, 1]
  );
  const y = useTransform(
    scrollYProgress,
    [FINAL_PHRASE.window[0], FINAL_PHRASE.window[1]],
    [30, 0]
  );
  const lineScale = useTransform(
    scrollYProgress,
    [FINAL_PHRASE.window[1], 0.79],
    [0, 1]
  );

  return (
    <motion.div
      className={styles.finalBox}
      style={{ opacity, y }}
      aria-hidden="true"
    >
      <h1 className={styles.finalText}>{FINAL_PHRASE.text}</h1>
      <motion.div
        className={styles.decorativeLine}
        style={{ scaleX: lineScale, transformOrigin: "center" }}
      />
    </motion.div>
  );
}

export default function Statement() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={containerRef}
      className={styles.scrollSection}
      aria-label="Museum Statement"
    >
      <div className={styles.stickyContainer}>
        {/* Accessible live text for screen readers */}
        <p className={styles.srOnly}>
          JUX. ES UN MUSEO QUE NO SE LIMITA A REPRESENTAR UNA COMUNIDAD. DIALOGA CON
          ELLA LA CUESTIONA Y LA REINVENTA. UNA IDENTIDAD MAS LIBRE.
        </p>

        <div className={styles.stage}>
          <JuxLogo scrollYProgress={scrollYProgress} />

          {PHRASES.map((p, i) => (
            <ScrollPhrase
              key={i}
              text={p.text}
              window={p.window}
              scrollYProgress={scrollYProgress}
            />
          ))}

          <FinalPhrase scrollYProgress={scrollYProgress} />
        </div>
      </div>
    </section>
  );
}
