import React from "react";
import pageStyles from "../../styles/page.module.css";

export const metadata = {
  title: "Educación",
  description: "Programas educativos, visitas guiadas y talleres de la galería.",
};

export default function EducacionPage() {
  return (
    <div className={pageStyles.page} style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "4rem", borderBottom: "1px solid #eee", paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          EDUCACIÓN
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#666", maxWidth: "750px" }}>
          Propuestas pedagógicas, talleres, charlas con artistas y visitas guiadas para escuelas, universidades y público general.
        </p>
      </header>

      {/* Grid of Programs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", marginBottom: "5rem" }}>
        <div style={{ background: "#fafafa", padding: "2.5rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", textTransform: "uppercase" }}>
            Visitas Guiadas y Mediadas
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: "1.7", color: "#444" }}>
            Recorridos participativos orientados a promover la reflexión crítica y la apreciación estética a partir de las exhibiciones vigentes.
          </p>
        </div>

        <div style={{ background: "#fafafa", padding: "2.5rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", textTransform: "uppercase" }}>
            Talleres & Seminars
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: "1.7", color: "#444" }}>
            Espacios prácticos y teóricos dictados por artistas e investigadores invitados, enfocados en técnicas contemporáneas y teoría del arte.
          </p>
        </div>

        <div style={{ background: "#fafafa", padding: "2.5rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", textTransform: "uppercase" }}>
            Encuentros con Artistas
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: "1.7", color: "#444" }}>
            Conversatorios de entrada libre y gratuita para conocer de cerca los procesos creativos y los trasfondos de las obras.
          </p>
        </div>
      </section>

      {/* Contact Banner for Educational Visits */}
      <section style={{ border: "2px solid #111", padding: "3rem", borderRadius: "8px", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "1rem" }}>
          ¿Querés coordinar una visita educativa?
        </h2>
        <p style={{ fontSize: "1.15rem", color: "#555", marginBottom: "1.5rem" }}>
          Escribinos para agendar recorridos para instituciones educativas y grupos numerosos.
        </p>
        <a
          href="mailto:educacion@galeria.com"
          style={{
            display: "inline-block",
            padding: "0.85rem 2rem",
            backgroundColor: "#111",
            color: "#fff",
            borderRadius: "4px",
            fontWeight: "700",
            textDecoration: "none",
          }}
        >
          Consultar por Visitas
        </a>
      </section>
    </div>
  );
}
