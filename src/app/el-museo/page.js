import React from "react";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import QueEsJux from "../../components/QueEsJux";
import pageStyles from "../../styles/page.module.css";

export const metadata = {
  title: "El Museo | JUX",
  description: "Un museo judío contemporáneo argentino, pero expandido.",
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
    <div className={pageStyles.page} style={{ padding: "1rem 1.5rem 4rem 1.5rem", maxWidth: "1300px", margin: "0 auto" }}>
      {/* "¿QUÉ ES JUX.?" Statement & Mission Grid */}
      <QueEsJux />

      {/* Equipo Roster Section */}
      <section style={{ marginTop: "4rem", borderTop: "1px solid #ddd", paddingTop: "4rem" }}>
        <h2 style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "2.5rem", borderBottom: "1px solid #111", paddingBottom: "0.75rem", color: "#111" }}>
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
                    style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: "6px" }}
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
