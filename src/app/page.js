// Removed "use client" to allow metadata export. State/effects will be moved to child components.
import styles from "../styles/page.module.css";
import React from "react";
import Hero from "../components/Hero";
import { TransitionLink } from "../components/TransitionLink";
import Highlights from "../components/Highlights";
import Video from "../components/Video";
import HomepageAgenda from "../components/HomepageAgenda";
import HomepageIntro from "../components/HomepageIntro";
import SalaRedirect from "../components/SalaRedirect";

export const metadata = {
  title: "Nos En Vera",
  description: "Nos en Vera es un espacio de convergencia y creación colectiva en el campo de la performance. Una plataforma para la investigación, la producción, la exhibición y el desarrollo de prácticas escénicas.",
  openGraph: {
    title: "Nos en Vera | Espacio de Performance",
    description: "Plataforma para la investigación, producción y exhibición de artes performáticas.",
    images: ["/NV_Logo3D_4.png"],
  },
};

export const revalidate = 3600; // revalidate every hour

export default function Home() {
  return (
    <div className={styles.page}>
      <Hero />
      <Video />
      <main className={styles.main}>
        <HomepageIntro />
        <Highlights />
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
          <HomepageAgenda />
        </div>
        <SalaRedirect />
      </main>
    </div>
  );
}