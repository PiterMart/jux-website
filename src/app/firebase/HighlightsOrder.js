"use client";
import React, { useEffect, useState } from "react";
import { firestore } from "./firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { FALLBACK_IMAGE } from "../../lib/eventUtils";
import styles from "../../styles/uploader.module.css";

export default function HighlightsOrder() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDocs(collection(firestore, "events"));
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter events where isFeatured is true
      const filtered = documents.filter(doc => 
        doc.isFeatured === true || 
        doc.isFeatured === "true" || 
        String(doc.isFeatured).toLowerCase() === "true"
      );

      // Map to get required fields and handle sorting
      const processed = filtered.map(eventDoc => {
        let imageUrl = FALLBACK_IMAGE || "";
        if (eventDoc.banner && typeof eventDoc.banner === 'string') imageUrl = eventDoc.banner;
        else if (eventDoc.flyer && typeof eventDoc.flyer === 'string') imageUrl = eventDoc.flyer;
        else if (eventDoc.gallery?.[0]?.url) imageUrl = eventDoc.gallery[0].url;

        return {
          id: eventDoc.id,
          name: eventDoc.name || eventDoc.title || "Evento sin nombre",
          imageUrl,
          featuredOrder: typeof eventDoc.featuredOrder === "number" ? eventDoc.featuredOrder : Infinity,
        };
      });

      // Sort by featuredOrder ascending, then by name alphabetically
      processed.sort((a, b) => {
        if (a.featuredOrder !== b.featuredOrder) {
          return a.featuredOrder - b.featuredOrder;
        }
        return a.name.localeCompare(b.name);
      });

      setFeaturedEvents(processed);
    } catch (err) {
      console.error("Error fetching featured events", err);
      setError("No se pudieron cargar los eventos destacados.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.dataTransfer.effectAllowed = "move";
    setDraggingIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;

    const newItems = [...featuredEvents];
    const draggedItem = newItems[draggingIndex];
    newItems.splice(draggingIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setFeaturedEvents(newItems);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggingIndex(null);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newEvents = [...featuredEvents];
    const temp = newEvents[index];
    newEvents[index] = newEvents[index - 1];
    newEvents[index - 1] = temp;
    setFeaturedEvents(newEvents);
  };

  const moveDown = (index) => {
    if (index === featuredEvents.length - 1) return;
    const newEvents = [...featuredEvents];
    const temp = newEvents[index];
    newEvents[index] = newEvents[index + 1];
    newEvents[index + 1] = temp;
    setFeaturedEvents(newEvents);
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);

      // Save order index to each event document in Firestore
      await Promise.all(
        featuredEvents.map((event, index) => {
          const docRef = doc(firestore, "events", event.id);
          return updateDoc(docRef, { featuredOrder: index });
        })
      );

      setSuccess("¡El orden de los destacados se guardó con éxito!");
    } catch (err) {
      console.error("Error saving highlights order", err);
      setError("No se pudo guardar el orden de los destacados.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.form}>
        <p>Cargando destacados...</p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={styles.title} style={{ margin: 0, fontSize: "2rem" }}>
          Ordenar Destacados ({featuredEvents.length})
        </h2>
        <button
          onClick={handleSaveOrder}
          disabled={saving || featuredEvents.length === 0}
          className={styles.loginButton}
          style={{ width: "auto", minWidth: "150px" }}
        >
          {saving ? "Guardando..." : "Guardar Orden"}
        </button>
      </div>

      {success && <p className={styles.success}>{success}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {featuredEvents.length === 0 ? (
        <p>No hay eventos destacados para ordenar. Puedes marcar eventos como destacados en la pestaña EVENTOS.</p>
      ) : (
        <div className={styles.highlightsOrderList}>
          {featuredEvents.map((event, index) => (
            <div
              key={event.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              className={`${styles.highlightOrderItem} ${draggingIndex === index ? styles.dragging : ""}`}
            >
              <div className={styles.dragHandle}>
                {/* Drag handle icon grid */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </div>

              {event.imageUrl && (
                <div className={styles.highlightOrderThumbnail}>
                  <img src={event.imageUrl} alt={event.name} />
                </div>
              )}

              <div className={styles.highlightOrderItemDetails}>
                <span className={styles.highlightOrderIndex}>{index + 1}</span>
                <h3 className={styles.highlightOrderName}>{event.name}</h3>
                <span className={styles.highlightOrderId}>ID: {event.id}</span>
              </div>

              <div className={styles.highlightOrderActions}>
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className={styles.moveButton}
                  title="Subir"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === featuredEvents.length - 1}
                  className={styles.moveButton}
                  title="Bajar"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
