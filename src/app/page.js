import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "./firebase/firebaseConfig";
import { calculateExhibitionStatus, formatDateDisplay } from "./firebase/dateUtils";
import styles from "../styles/page.module.css";
import HomepageAnimationOverlay from "../components/HomepageAnimationOverlay";
import Statement from "../components/Statement";
import LatestExhibition from "../components/LatestExhibition";
import RandomDiscovery from "../components/RandomDiscovery";

export const metadata = {
  title: "Inicio",
  description: "JUX",
};

// Revalidate once a day (24 hours) so the server keeps data and ongoing event dates updated
export const revalidate = 86400;

async function getHomepageData() {
  try {
    // 1. Fetch Exhibitions
    const exSnap = await getDocs(collection(firestore, "exhibitions"));
    const exList = exSnap.docs.map((doc) => {
      const data = doc.data();
      const startStr =
        data.startDate ||
        (data.startTimestamp?.seconds
          ? new Date(data.startTimestamp.seconds * 1000).toISOString().split("T")[0]
          : "");
      const endStr =
        data.endDate ||
        (data.endTimestamp?.seconds
          ? new Date(data.endTimestamp.seconds * 1000).toISOString().split("T")[0]
          : "");
      const status = data.status || calculateExhibitionStatus(startStr, endStr);

      return {
        id: doc.id,
        ...JSON.parse(JSON.stringify(data)),
        startDate: startStr,
        endDate: endStr,
        status,
      };
    });

    const currentEx = exList.find((ex) => ex.status === "actual");
    const pastEx = exList.filter((ex) => ex.status === "pasada");
    const selectedEx = currentEx || pastEx[0] || exList[0] || null;

    let featuredExhibition = null;
    if (selectedEx) {
      const imgList = [];
      if (Array.isArray(selectedEx.images) && selectedEx.images.length > 0) {
        imgList.push(...selectedEx.images);
      }
      if (selectedEx.coverImage && !imgList.includes(selectedEx.coverImage)) {
        imgList.unshift(selectedEx.coverImage);
      }

      let dateText = selectedEx.dateDisplay || "";
      if (!dateText) {
        if (selectedEx.startDate && selectedEx.endDate) {
          dateText = `${formatDateDisplay(selectedEx.startDate)} — ${formatDateDisplay(selectedEx.endDate)}`;
        } else if (selectedEx.startDate) {
          dateText = formatDateDisplay(selectedEx.startDate);
        } else {
          dateText = "Noviembre 2024";
        }
      }

      featuredExhibition = {
        id: selectedEx.id || "",
        title: selectedEx.title || "FALTA COMPARTIDA",
        location: selectedEx.location || "Museo Judio de Buenos Aires",
        dateDisplay: dateText,
        images: imgList.length > 0 ? imgList : [
          "/animacion/MUSEOJUXXXXOK1.png",
          "/animacion/MUSEOJUXXXXOK2.png",
          "/animacion/MUSEOJUXXXXOK3.png",
          "/animacion/MUSEOJUXXXXOK4.png",
        ],
      };
    }

    // 2. Fetch Educacion collection for the random education text discovery
    const eduSnap = await getDocs(collection(firestore, "educacion"));
    const educacionItems = eduSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...JSON.parse(JSON.stringify(data)),
      };
    });

    return {
      featuredExhibition,
      educacionItems,
    };
  } catch (err) {
    console.error("Error prefetching homepage data on server:", err);
    return {
      featuredExhibition: null,
      educacionItems: [],
    };
  }
}

export default async function Home() {
  const { featuredExhibition, educacionItems } = await getHomepageData();

  return (
    <div className={styles.page} style={{ minHeight: "50vh" }}>
      <HomepageAnimationOverlay />
      <Statement />
      <LatestExhibition initialExhibition={featuredExhibition} />
      <RandomDiscovery items={educacionItems} />
    </div>
  );
}