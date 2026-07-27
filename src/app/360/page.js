import React from "react";
import Link from "next/link";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import pageStyles from "../../styles/page.module.css";

export const metadata = {
  title: "Recorridos 360°",
  description: "Experiencias de exhibición inmersivas y recorridos virtuales 360°.",
};

export const revalidate = 60; // revalidate every 60 seconds

async function get360Exhibitions() {
  try {
    const snap = await getDocs(collection(firestore, "exhibitions"));
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...JSON.parse(JSON.stringify(doc.data())),
    }));
    return list.filter((ex) => Boolean(ex.tour360Url));
  } catch (error) {
    console.error("Error fetching 360 exhibitions:", error);
    return [];
  }
}

export default async function Page360() {
  const exhibitions = await get360Exhibitions();

  return (
    <div className={pageStyles.page} style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "4rem", borderBottom: "1px solid #eee", paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          EXPERIENCIAS 360°
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#666", maxWidth: "750px" }}>
          Recorridos inmersivos virtuales para explorar nuestras exhibiciones desde cualquier lugar del mundo.
        </p>
      </header>

      {exhibitions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fafafa", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1rem" }}>
            Próximamente Recorridos 360°
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#666", maxWidth: "600px", margin: "0 auto 2rem" }}>
            Estamos preparando las experiencias inmersivas 360° de nuestras próximas muestras.
          </p>
          <Link
            href="/exhibiciones"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.75rem",
              backgroundColor: "#111",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "600",
            }}
          >
            Ver Exhibiciones Vigentes
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "3rem" }}>
          {exhibitions.map((ex) => (
            <div key={ex.id} style={{ border: "1px solid #eee", padding: "1.5rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {ex.coverImage && (
                <img src={ex.coverImage} alt={ex.title} style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "6px" }} />
              )}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", background: "#000", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "4px", textTransform: "uppercase" }}>
                  Vista 360°
                </span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "700", marginTop: "0.5rem" }}>{ex.title}</h3>
                {ex.subtitle && <p style={{ fontSize: "1rem", color: "#555", fontStyle: "italic" }}>{ex.subtitle}</p>}
                
                <div style={{ marginTop: "1.5rem" }}>
                  <a
                    href={ex.tour360Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#111",
                      color: "#fff",
                      borderRadius: "4px",
                      fontWeight: "700",
                      textDecoration: "none",
                      fontSize: "0.95rem",
                    }}
                  >
                    🌐 Iniciar Recorrido 360° →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
