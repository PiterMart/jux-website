"use client";
import { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection, doc, deleteDoc } from "firebase/firestore";
import { calculateExhibitionStatus, formatDateDisplay } from "./dateUtils";
import { safeDeleteFiles } from "./uploadUtils";
import { logDelete, RESOURCE_TYPES } from "./activityLogger";
import styles from "../../styles/uploader.module.css";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(firestore, "events"));
      const list = snap.docs.map((doc) => {
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
        const autoStatus = data.status || calculateExhibitionStatus(startStr, endStr);

        return {
          id: doc.id,
          ...data,
          startDate: startStr,
          endDate: endStr,
          status: autoStatus,
        };
      });
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setEvents(list);
    } catch (e) {
      console.error("Error fetching events:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (ev) => {
    if (!confirm(`¿Estás seguro de eliminar el evento "${ev.title}" y todos sus archivos de Storage?`)) {
      return;
    }

    setDeletingId(ev.id);
    try {
      const filesToDelete = [];
      if (ev.coverImage && typeof ev.coverImage === "string") {
        filesToDelete.push(ev.coverImage);
      }
      if (ev.pdfCatalog && typeof ev.pdfCatalog === "string") {
        filesToDelete.push(ev.pdfCatalog);
      }
      if (Array.isArray(ev.gallery)) {
        ev.gallery.forEach((g) => {
          const u = typeof g === "string" ? g : g?.url;
          if (u) filesToDelete.push(u);
        });
      }

      await safeDeleteFiles(filesToDelete);
      await deleteDoc(doc(firestore, "events", ev.id));
      await logDelete(RESOURCE_TYPES.EVENT, ev.id);

      setEvents((prev) => prev.filter((item) => item.id !== ev.id));
    } catch (err) {
      console.error("Error al eliminar evento:", err);
      alert("Ocurrió un error al eliminar el evento de Storage o base de datos.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading)
    return (
      <div className={styles.form}>
        <p>Cargando eventos...</p>
      </div>
    );

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Lista de Eventos ({events.length})</h3>
      {events.length === 0 ? (
        <p>No hay eventos registrados aún.</p>
      ) : (
        <div className={styles.artistsList}>
          {events.map((ev) => (
            <div
              key={ev.id}
              className={styles.artistCard}
              style={{ display: "flex", gap: "1rem", alignItems: "center", position: "relative" }}
            >
              {ev.coverImage && (
                <img
                  src={ev.coverImage}
                  alt={ev.title}
                  style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{ev.title}</h4>
                <p className={styles.artistOrigin} style={{ margin: "0.25rem 0 0 0" }}>
                  Estado:{" "}
                  <strong>
                    {ev.status === "actual"
                      ? "En Curso"
                      : ev.status === "proxima"
                      ? "Próximo"
                      : "Pasado (Archivo)"}
                  </strong>
                  {ev.location ? ` • ${ev.location}` : ""}
                </p>
                {(ev.startDate || ev.endDate) && (
                  <p className={styles.artistId} style={{ margin: "0.25rem 0 0 0" }}>
                    Fechas: {formatDateDisplay(ev.startDate)}{" "}
                    {ev.endDate ? `- ${formatDateDisplay(ev.endDate)}` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteEvent(ev)}
                disabled={deletingId === ev.id}
                style={{
                  backgroundColor: "#b30000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Eliminar evento y archivos de Storage"
              >
                {deletingId === ev.id ? "Eliminando..." : "🗑 Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
