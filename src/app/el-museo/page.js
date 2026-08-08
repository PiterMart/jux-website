"use client";

import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../firebase/firebaseConfig";
import QueEsJux from "../../components/QueEsJux";
import pageStyles from "../../styles/page.module.css";
import styles from "../../styles/el-museo.module.css";

export default function ElMuseoPage() {
  const [equipo, setEquipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  useEffect(() => {
    async function fetchEquipo() {
      try {
        const snap = await getDocs(collection(firestore, "equipo"));
        const members = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        members.sort((a, b) => (a.order || 0) - (b.order || 0));
        setEquipo(members);
      } catch (error) {
        console.error("Error fetching equipo members:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEquipo();
  }, []);

  const toggleMember = (id) => {
    setExpandedMemberId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={pageStyles.page}>
      <main className={styles.pageContainer}>
        {/* "¿QUÉ ES JUX.?" Statement & Mission 2-Column Grid */}
        <QueEsJux />

        {/* Equipo Roster Section */}
        <section className={styles.equipoSection}>
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            EQUIPO
          </motion.h2>

          {loading ? (
            <p style={{ color: "#777", fontSize: "1.1rem" }}>Cargando equipo...</p>
          ) : equipo.length === 0 ? (
            <p style={{ color: "#777", fontSize: "1.1rem" }}>Información del equipo en actualización.</p>
          ) : (
            <motion.div
              className={styles.equipoList}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                },
              }}
            >
              {equipo.map((member) => {
                const isExpanded = expandedMemberId === member.id;
                const bios = Array.isArray(member.bio) ? member.bio : member.bio ? [member.bio] : [];

                return (
                  <motion.div
                    key={member.id}
                    className={`${styles.memberCard} ${isExpanded ? styles.memberCardActive : ""}`}
                    onClick={() => toggleMember(member.id)}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleMember(member.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.memberHeader}>
                      <div className={styles.avatarWrapper}>
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.name}
                            className={styles.avatarImg}
                          />
                        ) : (
                          <span className={styles.avatarFallback}>
                            {(member.name || "J").charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className={styles.memberInfo}>
                        <h3 className={styles.memberName}>{member.name}</h3>
                        <span className={styles.memberRole}>{member.role || "Equipo"}</span>
                      </div>

                      <div className={styles.toggleIcon} style={{ transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)" }}>
                        +
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && bios.length > 0 && (
                        <motion.div
                          className={styles.expandedDetails}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {bios.map((paragraph, idx) => (
                            <p key={idx} className={styles.bioParagraph}>
                              {paragraph}
                            </p>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
