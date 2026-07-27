import React from "react";
import Link from "next/link";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "../../firebase/firebaseConfig";
import { formatDateDisplay } from "../../firebase/dateUtils";
import pageStyles from "../../../styles/page.module.css";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const snap = await getDoc(doc(firestore, "exhibitions", id));
    if (snap.exists()) {
      return { title: snap.data().title || "Exhibición" };
    }
  } catch (e) {}
  return { title: "Exhibición" };
}

export default async function ExhibitionDetailPage({ params }) {
  const { id } = await params;
  let exhibition = null;

  try {
    const snap = await getDoc(doc(firestore, "exhibitions", id));
    if (snap.exists()) {
      exhibition = { id: snap.id, ...JSON.parse(JSON.stringify(snap.data())) };
    }
  } catch (e) {
    console.error("Error fetching exhibition:", e);
  }

  if (!exhibition) {
    return (
      <div className={pageStyles.page} style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2>Exhibición no encontrada</h2>
        <Link href="/exhibiciones" style={{ textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
          ← Volver a Exhibiciones
        </Link>
      </div>
    );
  }

  return (
    <div className={pageStyles.page} style={{ padding: "3rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <Link href="/exhibiciones" style={{ fontSize: "0.9rem", fontWeight: "600", color: "#666", textDecoration: "none", marginBottom: "2rem", display: "inline-block" }}>
        ← Volver a Exhibiciones
      </Link>

      {/* Hero Banner */}
      {exhibition.coverImage && (
        <div style={{ marginBottom: "3rem" }}>
          <img
            src={exhibition.coverImage}
            alt={exhibition.title}
            style={{ width: "100%", maxHeight: "500px", objectFit: "cover", borderRadius: "8px" }}
          />
        </div>
      )}

      {/* Header Info */}
      <div style={{ borderBottom: "1px solid #eee", paddingBottom: "2rem", marginBottom: "3rem" }}>
        <span style={{ background: "#111", color: "#fff", padding: "0.38rem 0.75rem", fontSize: "0.8rem", textTransform: "uppercase", borderRadius: "4px" }}>
          {exhibition.status === "actual" ? "En curso" : exhibition.status === "proxima" ? "Próximamente" : "Exhibición Pasada"}
        </span>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "700", marginTop: "1rem", marginBottom: "0.5rem" }}>
          {exhibition.title}
        </h1>
        {exhibition.subtitle && (
          <p style={{ fontSize: "1.35rem", color: "#555", fontStyle: "italic", marginBottom: "1rem" }}>
            {exhibition.subtitle}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", color: "#666", fontSize: "1rem", marginTop: "1.5rem" }}>
          {(exhibition.startDate || exhibition.endDate) && (
            <div>
              <strong>Fechas:</strong> {formatDateDisplay(exhibition.startDate)} {exhibition.endDate ? `— ${formatDateDisplay(exhibition.endDate)}` : ""}
            </div>
          )}
          {exhibition.location && (
            <div>
              <strong>Ubicación:</strong> {exhibition.location}
            </div>
          )}
          {exhibition.curator && (
            <div>
              <strong>Curaduría:</strong> {exhibition.curator}
            </div>
          )}
        </div>

        {/* 360 Tour Button */}
        {exhibition.tour360Url && (
          <div style={{ marginTop: "2rem" }}>
            <a
              href={exhibition.tour360Url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.85rem 1.75rem",
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: "4px",
                fontWeight: "700",
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              🌐 Ver Recorrido Virtual 360° →
            </a>
          </div>
        )}
      </div>

      {/* Description Text */}
      {Array.isArray(exhibition.description) && exhibition.description.length > 0 && (
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1.5rem" }}>SOBRE LA EXHIBICIÓN</h2>
          <div style={{ fontSize: "1.15rem", lineHeight: "1.8", color: "#333" }}>
            {exhibition.description.map((paragraph, idx) => (
              <p key={idx} style={{ marginBottom: "1.25rem" }}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Participating Artists */}
      {Array.isArray(exhibition.artists) && exhibition.artists.length > 0 && (
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1.5rem", borderBottom: "1px solid #ddd", paddingBottom: "0.5rem" }}>
            ARTISTAS PARTICIPANTES
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {exhibition.artists.map((art) => (
              <Link
                key={art.id || art.name}
                href={art.id ? `/artistas/${art.id}` : "#"}
                style={{
                  background: "#f0f0f0",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  fontWeight: "600",
                  fontSize: "1rem",
                  color: "#000",
                  textDecoration: "none",
                  transition: "background-color 0.2s",
                }}
              >
                {art.name} →
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Displayed Artworks */}
      {Array.isArray(exhibition.artworks) && exhibition.artworks.length > 0 && (
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "2rem", borderBottom: "1px solid #ddd", paddingBottom: "0.5rem" }}>
            OBRAS EN EXHIBICIÓN
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "2rem" }}>
            {exhibition.artworks.map((item, idx) => (
              <Link
                key={item.id || idx}
                href={item.id ? `/obras/${item.id}` : "#"}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ border: "1px solid #eee", borderRadius: "6px", overflow: "hidden", transition: "transform 0.2s" }}>
                  {item.image && (
                    <img src={item.image} alt={item.title} style={{ width: "100%", height: "220px", objectFit: "contain", background: "#f8f8f8" }} />
                  )}
                  <div style={{ padding: "1rem" }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>{item.title}</h4>
                    {item.artistName && <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>{item.artistName}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Installation Gallery Views */}
      {Array.isArray(exhibition.gallery) && exhibition.gallery.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "2rem", borderBottom: "1px solid #ddd", paddingBottom: "0.5rem" }}>
            VISTA DE SALA / REGISTRO
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {exhibition.gallery.map((img, idx) => (
              <div key={idx}>
                <img src={img.url} alt={`Registro ${idx}`} style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "6px" }} />
                {img.description && <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>{img.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
