import React from "react";
import Link from "next/link";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import pageStyles from "../../styles/page.module.css";

export const metadata = {
  title: "Exhibiciones",
  description: "Exhibiciones actuales y pasadas de la galería de arte.",
};

export const revalidate = 60; // revalidate every 60 seconds

async function getExhibitions() {
  try {
    const snap = await getDocs(collection(firestore, "exhibitions"));
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...JSON.parse(JSON.stringify(doc.data())),
    }));
    return list;
  } catch (error) {
    console.error("Error fetching exhibitions:", error);
    return [];
  }
}

export default async function ExhibicionesPage() {
  const exhibitions = await getExhibitions();

  const currentExhibitions = exhibitions.filter((ex) => ex.status === "actual");
  const pastExhibitions = exhibitions.filter((ex) => ex.status === "pasada" || !ex.status);
  const upcomingExhibitions = exhibitions.filter((ex) => ex.status === "proxima");

  return (
    <div className={pageStyles.page} style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "4rem", borderBottom: "1px solid #eee", paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          EXHIBICIONES
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#666", maxWidth: "700px" }}>
          Programa de exhibiciones temporales, retrospectivas y proyectos especiales.
        </p>
      </header>

      {/* Current Exhibition */}
      <section style={{ marginBottom: "5rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #111", paddingBottom: "0.5rem" }}>
          Exhibición En Curso
        </h2>

        {currentExhibitions.length === 0 ? (
          <p style={{ color: "#777", fontSize: "1.1rem" }}>No hay exhibición activa en este momento.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "3rem" }}>
            {currentExhibitions.map((ex) => (
              <div key={ex.id} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: "1px solid #eee", padding: "1.5rem", borderRadius: "8px" }}>
                {ex.coverImage && (
                  <img
                    src={ex.coverImage}
                    alt={ex.title}
                    style={{ width: "100%", height: "350px", objectFit: "cover", borderRadius: "6px" }}
                  />
                )}
                <div>
                  <span style={{ background: "#000", color: "#fff", padding: "0.25rem 0.75rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "4px" }}>
                    {ex.location || "En Curso"}
                  </span>
                  <h3 style={{ fontSize: "2rem", fontWeight: "700", marginTop: "0.75rem", marginBottom: "0.25rem" }}>
                    {ex.title}
                  </h3>
                  {ex.subtitle && <p style={{ fontSize: "1.1rem", color: "#555", fontStyle: "italic", marginBottom: "0.5rem" }}>{ex.subtitle}</p>}
                  {(ex.startDate || ex.endDate) && (
                    <p style={{ fontSize: "0.95rem", color: "#777", fontWeight: "600" }}>
                      {ex.startDate} {ex.endDate ? `— ${ex.endDate}` : ""}
                    </p>
                  )}
                  {ex.curator && <p style={{ fontSize: "0.95rem", color: "#444", marginTop: "0.25rem" }}>Curaduría: {ex.curator}</p>}

                  <div style={{ marginTop: "1.5rem" }}>
                    <Link
                      href={`/exhibiciones/${ex.id}`}
                      style={{
                        display: "inline-block",
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#111",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: "4px",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                      }}
                    >
                      Ver Exhibición →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Exhibitions (if any) */}
      {upcomingExhibitions.length > 0 && (
        <section style={{ marginBottom: "5rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #111", paddingBottom: "0.5rem" }}>
            Próximamente
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {upcomingExhibitions.map((ex) => (
              <div key={ex.id} style={{ border: "1px solid #eee", padding: "1.5rem", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{ex.title}</h3>
                {(ex.startDate || ex.endDate) && (
                  <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>{ex.startDate} — {ex.endDate}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past Exhibitions / Archive */}
      <section>
        <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #111", paddingBottom: "0.5rem" }}>
          Archivo de Exhibiciones
        </h2>

        {pastExhibitions.length === 0 ? (
          <p style={{ color: "#777" }}>No hay exhibiciones pasadas en el archivo aún.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2.5rem" }}>
            {pastExhibitions.map((ex) => (
              <div key={ex.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {ex.coverImage && (
                  <img
                    src={ex.coverImage}
                    alt={ex.title}
                    style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "6px" }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: "700", margin: 0 }}>{ex.title}</h3>
                  {(ex.startDate || ex.endDate) && (
                    <p style={{ fontSize: "0.85rem", color: "#777", marginTop: "0.25rem" }}>
                      {ex.startDate} {ex.endDate ? `— ${ex.endDate}` : ""}
                    </p>
                  )}
                  <div style={{ marginTop: "1rem" }}>
                    <Link
                      href={`/exhibiciones/${ex.id}`}
                      style={{ fontSize: "0.9rem", fontWeight: "700", color: "#111", textDecoration: "underline" }}
                    >
                      Ver Detalle →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
