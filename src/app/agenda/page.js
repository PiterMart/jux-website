import React from "react";
import styles from "../../styles/page.module.css";
import { firestore } from "../firebase/firebaseConfig";
import AgendaList from "../../components/AgendaList";
import AnimatedPageSection from "../../components/AnimatedPageSection";
import { collection, getDocs } from "firebase/firestore";
import {
  FALLBACK_IMAGE,
  parseDateEntry,
  extractYear,
  eventHasDateInCurrentMonth,
  hasFutureDate,
  sortByYearDesc,
  normalizeArrayOfPeople,
  normalizeEventTypes
} from "../../lib/eventUtils";

export const metadata = {
  title: "Agenda | Próximas Actividades",
  description: "Consulta las próximas actividades abiertas a la comunidad en Nos en Vera: funciones, aperturas y formación.",
};

export const revalidate = 3600; // revalidate every hour

async function getAgendaEvents() {
  try {
    const snapshot = await getDocs(collection(firestore, "events"));
    const documents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return documents
      .map((eventDoc) => {
        const dates = Array.isArray(eventDoc.dates)
          ? eventDoc.dates.map(parseDateEntry).filter(Boolean)
          : [];

        const imageUrl = eventDoc.banner || eventDoc.flyer || eventDoc.gallery?.[0]?.url || FALLBACK_IMAGE;
        const slug = eventDoc.slug || eventDoc.id;
        const title = eventDoc.name || eventDoc.title || "Evento";
        const year = extractYear(dates) ?? "—";
        const type = normalizeEventTypes(eventDoc.event_type || eventDoc.eventType || eventDoc.type);
        const directors = normalizeArrayOfPeople(eventDoc.directors);

        return {
          id: eventDoc.id,
          title,
          slug,
          imageUrl,
          year,
          dates,
          type,
          directors
        };
      })
      .filter((event) => hasFutureDate(event.dates))
      .sort((a, b) => {
        const getFirstFutureDate = (dates) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const future = dates.filter(d => d.date >= now);
          if (future.length === 0) return new Date(9999, 0, 1).getTime();
          return future.sort((x, y) => x.date - y.date)[0].date.getTime();
        };
        return getFirstFutureDate(a.dates) - getFirstFutureDate(b.dates);
      });
  } catch (err) {
    console.error("Error fetching agenda on server:", err);
    return [];
  }
}

export default async function AgendaPage() {
  const events = await getAgendaEvents();

  return (
    <div className={styles.page}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .agendaPageOverride *:not(h1):not(h2):not(h3) {
              font-family: var(--font-paragraph) !important;
            }
          `,
        }}
      />
      <div className={`${styles.page_container} agendaPageOverride`}>
        <div className={styles.homepage_container} style={{ paddingTop: "2rem" }}>
          <div className={styles.contentMaxWidth} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <AnimatedPageSection
              title="AGENDA "
              subtext="Estas son las próximas actividades abiertas a la comunidad que ofrece Nos en Vera: funciones, aperturas de procesos y espacios de formación."
              loaded={true}
            />

            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
                <p>No hay actividades próximas programadas.</p>
              </div>
            ) : (
              <>
                <AgendaList events={events} basePath="/evento" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
