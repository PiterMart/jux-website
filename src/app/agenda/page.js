import React from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import styles from "../../styles/page.module.css";

export const metadata = {
  title: "Agenda | Próximas Actividades y Exhibiciones",
  description: "Consultá la agenda de la Galería de Arte: aperturas de exhibiciones, visitas guiadas, charlas curatoriales y talleres.",
};

export const revalidate = 60; // revalidate every 60 seconds

async function getGalleryAgenda() {
  try {
    const snap = await getDocs(collection(firestore, "exhibitions"));
    const list = snap.docs.map((d) => ({ id: d.id, ...JSON.parse(JSON.stringify(d.data())) }));

    // Filter active and upcoming exhibitions/events
    return list.sort((a, b) => {
      const statusOrder = { actual: 0, proxima: 1, pasada: 2 };
      return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
    });
  } catch (err) {
    console.error("Error fetching gallery agenda:", err);
    return [];
  }
}

export default async function AgendaPage() {
  const exhibitions = await getGalleryAgenda();

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ paddingTop: "12rem", maxWidth: "1200px" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1 className={styles.sectionTitle} style={{ fontSize: "3rem", fontWeight: "300" }}>
            Agenda de la Galería
          </h1>
          <p style={{ color: "#555", fontSize: "1.15rem", marginTop: "0.5rem", maxWidth: "800px", margin: "0.5rem auto 0" }}>
            Próximas actividades, inauguraciones de muestras, visitas guiadas y conversatorios de arte contemporáneo.
          </p>
        </div>

        {exhibitions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#666" }}>
            <p style={{ fontSize: "1.1rem" }}>No hay actividades programadas en este momento.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {exhibitions.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "2rem",
                  backgroundColor: "#fff",
                  padding: "2rem",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  alignItems: "center",
                }}
              >
                {item.coverImage && (
                  <div style={{ width: "100%", height: "220px", overflow: "hidden", borderRadius: "4px", backgroundColor: "#f5f5f5" }}>
                    <img src={item.coverImage} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderRadius: "3px",
                      width: "fit-content",
                      backgroundColor:
                        item.status === "actual"
                          ? "#000"
                          : item.status === "proxima"
                          ? "#333"
                          : "#777",
                      color: "#fff",
                    }}
                  >
                    {item.status === "actual" ? "En Curso" : item.status === "proxima" ? "Próximamente" : "Muestra Pasada"}
                  </span>

                  <h2 style={{ fontSize: "1.75rem", fontWeight: "400" }}>{item.title}</h2>
                  {item.subtitle && <p style={{ fontSize: "1.05rem", color: "#666", fontStyle: "italic" }}>{item.subtitle}</p>}

                  {(item.startDate || item.endDate) && (
                    <p style={{ fontSize: "0.9rem", color: "#444" }}>
                      📅 <strong>Fechas:</strong> {item.startDate} {item.endDate ? `— ${item.endDate}` : ""}
                    </p>
                  )}

                  {item.location && (
                    <p style={{ fontSize: "0.9rem", color: "#444" }}>
                      📍 <strong>Ubicación:</strong> {item.location}
                    </p>
                  )}

                  <div style={{ marginTop: "1rem" }}>
                    <Link
                      href={`/exhibiciones/${item.id}`}
                      style={{
                        display: "inline-block",
                        padding: "0.6rem 1.2rem",
                        backgroundColor: "#000",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        borderRadius: "3px",
                      }}
                    >
                      Ver Detalle →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
