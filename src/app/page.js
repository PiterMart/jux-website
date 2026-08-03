import React from "react";
import styles from "../styles/page.module.css";
import HomepageAnimationOverlay from "../components/HomepageAnimationOverlay";
import Statement from "../components/Statement";
import LatestExhibition from "../components/LatestExhibition";

export const metadata = {
  title: "Inicio",
  description: "JUX",
};

export default function Home() {
  return (
    <div className={styles.page} style={{ minHeight: "50vh" }}>
      <HomepageAnimationOverlay />
      <Statement />
      <LatestExhibition />
    </div>
  );
}