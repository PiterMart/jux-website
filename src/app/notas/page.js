// Refactored to Server Component for SEO.
import React from "react";
import styles from "../../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import NotasClient from "./NotasClient";
import AnimatedPageHeader from "../../components/AnimatedPageHeader";

export const metadata = {
  title: "Notas",
  description: "Explora nuestra colección de notas, investigaciones y publicaciones sobre performance y artes escénicas en Nos en Vera.",
};

export const revalidate = 3600; // revalidate every hour

async function getNotas() {
  try {
    const snapshot = await getDocs(collection(firestore, "notas"));
    return snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        const rawDate = data.date;
        const date =
          rawDate && typeof rawDate.toDate === "function"
            ? rawDate.toDate().toISOString() // Convert to string for serialization
            : rawDate instanceof Date
              ? rawDate.toISOString()
              : rawDate;

        const links = Array.isArray(data.links)
          ? data.links
              .map((entry) => ({
                title: (entry?.title || "").trim(),
                url: (entry?.url || "").trim(),
              }))
              .filter((entry) => entry.url)
          : typeof data.link === "string" && data.link.trim()
            ? [{ title: "", url: data.link.trim() }]
            : [];

        const coverImage =
          typeof data.coverImage === "string" && data.coverImage.trim()
            ? data.coverImage.trim()
            : typeof data.image === "string" && data.image.trim()
              ? data.image.trim()
              : "";

        return {
          id: docSnap.id,
          title: data.title || "Sin título",
          subtitle: data.subtitle || "",
          description: data.description || "",
          links,
          date,
          coverImage,
        };
      })
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      });
  } catch (err) {
    console.error("Failed to load nota items on server:", err);
    return [];
  }
}

export default async function NotasPage() {
  const notas = await getNotas();

  return (
    <div className={styles.page}>
      <div className={styles.page_container}>
        <div className={styles.homepage_container} style={{ paddingTop: "2rem" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              margin: "auto",
            }}
          >
            <div style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
              <AnimatedPageHeader loaded={true}>NOTAS</AnimatedPageHeader>
            </div>
            <p className={styles.pageSubtext} style={{ marginBottom: '2rem', maxWidth: '1000px' }}>
              Investigaciones, registros y reflexiones sobre la práctica artística y performática contemporánea.
            </p>

            <NotasClient initialNotas={notas} />
          </div>
        </div>
      </div>
    </div>
  );
}
