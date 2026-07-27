import React from "react";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import pageStyles from "../../styles/page.module.css";

export const metadata = {
  title: "El Museo",
  description: "Misión, Statement y Equipo de la Galería de Arte.",
};

export const revalidate = 60; // revalidate every 60 seconds

async function getEquipoMembers() {
  try {
    const snap = await getDocs(collection(firestore, "equipo"));
    const members = snap.docs.map((doc) => ({
      id: doc.id,
      ...JSON.parse(JSON.stringify(doc.data())),
    }));
    return members.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error("Error fetching equipo members:", error);
    return [];
  }
}

export default async function ElMuseoPage() {
  const equipo = await getEquipoMembers();

  return (
    <div className={pageStyles.page} style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "4rem", borderBottom: "1px solid #eee", paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          EL MUSEO
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#666", maxWidth: "700px" }}>
          Un espacio dedicado al desarrollo, preservación y exhibición del arte contemporáneo.
        </p>
      </header>

      {/* Misión & Statement Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", marginBottom: "5rem" }}>
        <div style={{ background: "#fafafa", padding: "2.5rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Misión
          </h2>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "#333" }}>
            Nuestra misión es cultivar un diálogo vivo entre los artistas contemporáneos y la comunidad. Buscamos promover prácticas innovadoras, la investigación estética y la democratización del acceso a las artes visuales en un espacio inclusivo y dinámico.
          </p>
        </div>

        <div style={{ background: "#fafafa", padding: "2.5rem", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Statement
          </h2>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "#333" }}>
            Entendemos la galería como un organismo en constante transformación. Cada proyecto exhibido busca desafiar fronteras disciplinarias, conectando distintas visiones del mundo a través de la experimentación y el intercambio crítico.
          </p>
        </div>
      </section>

      {/* Equipo Roster */}
      <section>
        <h2 style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "2.5rem", borderBottom: "1px solid #111", paddingBottom: "0.75rem" }}>
          EQUIPO
        </h2>

        {equipo.length === 0 ? (
          <p style={{ color: "#777" }}>Información del equipo en actualización.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "2.5rem" }}>
            {equipo.map((member) => (
              <div key={member.id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {member.profilePicture ? (
                  <img
                    src={member.profilePicture}
                    alt={member.name}
                    style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "6px" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "300px",
                      background: "#e8e8e8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      color: "#888",
                      fontSize: "2rem",
                      fontWeight: "700",
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: "700", margin: 0 }}>{member.name}</h3>
                  <p style={{ fontSize: "1rem", color: "#666", fontWeight: "600", marginTop: "0.25rem" }}>
                    {member.role || "Equipo"}
                  </p>
                  {Array.isArray(member.bio) && member.bio.length > 0 && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.95rem", color: "#444", lineHeight: "1.5" }}>
                      {member.bio.map((paragraph, idx) => (
                        <p key={idx} style={{ marginBottom: "0.5rem" }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
