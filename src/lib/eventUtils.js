// ─── Event Type Constants ────────────────────────────────────────────────────

export const PERFORMANCE_TYPES = [
  "Presentación",
  "Presentacion",
  "presentación",
  "presentacion",
  "performance",
];

export const TRAINING_TYPES = ["Formación", "Formacion", "training"];

export const RESIDENCY_TYPE = "Residencia";

export const FALLBACK_IMAGE =
  "https://via.placeholder.com/600x800.png?text=Event";

export const FALLBACK_IMAGE_WIDE =
  "https://via.placeholder.com/1600x900.png?text=Performance";

// ─── Normalizers ─────────────────────────────────────────────────────────────

export const normalizeEventTypes = (rawTypes) => {
  if (Array.isArray(rawTypes)) {
    return rawTypes.map((type) => String(type).trim()).filter(Boolean);
  }
  if (typeof rawTypes === "string" && rawTypes.trim()) {
    return rawTypes
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);
  }
  return [];
};

export const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
};

export const normalizeArrayOfPeople = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();
        return name ? { name } : null;
      }
      if (item && typeof item === "object") {
        const name = String(
          item.name || item.fullName || item.displayName || item.slug || ""
        ).trim();
        return name ? { ...item, name } : null;
      }
      return null;
    })
    .filter(Boolean);
};

export const normalizeDescription = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((paragraph) => (typeof paragraph === "string" ? paragraph : ""))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }
  return [];
};

export const normalizeGallery = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        return { url: item, description: "" };
      }
      if (typeof item === "object" && item.url) {
        return { url: item.url, description: item.description || "" };
      }
      return null;
    })
    .filter(Boolean);
};

// ─── Event Type Checkers ─────────────────────────────────────────────────────

export const eventContainsPerformance = (eventTypes) =>
  eventTypes.some((type) =>
    PERFORMANCE_TYPES.some(
      (performanceType) =>
        type.toLowerCase() === performanceType.toLowerCase()
    )
  );

export const eventContainsTraining = (eventTypes) =>
  eventTypes.some((type) =>
    TRAINING_TYPES.some(
      (trainingType) => type.toLowerCase() === trainingType.toLowerCase()
    )
  );

export const eventContainsResidency = (eventTypes) =>
  eventTypes.some(
    (type) => type.toLowerCase() === RESIDENCY_TYPE.toLowerCase()
  );

export const eventContainsPerformanceOrResidencyOrTraining = (eventTypes) =>
  eventContainsPerformance(eventTypes) ||
  eventContainsResidency(eventTypes) ||
  eventContainsTraining(eventTypes);

// ─── Date Parsing & Formatting ───────────────────────────────────────────────

export const parseDateEntry = (entry) => {
  if (!entry) return null;
  let dateValue = entry.date;
  let parsedDate = null;

  if (dateValue?.toDate) {
    parsedDate = dateValue.toDate();
  } else if (typeof dateValue === "string" || typeof dateValue === "number") {
    const attempt = new Date(dateValue);
    if (!Number.isNaN(attempt.getTime())) {
      parsedDate = attempt;
    }
  } else if (dateValue instanceof Date) {
    parsedDate = dateValue;
  }

  if (parsedDate && Number.isNaN(parsedDate.getTime())) {
    parsedDate = null;
  }

  // Handle serialized Firestore Timestamps (plain objects with seconds/nanoseconds)
  if (!parsedDate && dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
    const attempt = new Date((dateValue.seconds || 0) * 1000);
    if (!Number.isNaN(attempt.getTime())) {
      parsedDate = attempt;
    }
  }

  const time = typeof entry.time === "string" ? entry.time.trim() : "";

  if (!parsedDate && !time) {
    return null;
  }

  return { date: parsedDate, time };
};

export const extractYear = (dates = []) => {
  const entry = dates.find((item) => item?.date) || null;
  if (!entry) return null;
  if (entry.date?.toDate) {
    return entry.date.toDate().getFullYear();
  }
  if (entry.date instanceof Date) {
    return entry.date.getFullYear();
  }
  const parsed = new Date(entry.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
};

/**
 * Full date format: "04 de marzo de 2026" (es-ES locale).
 * Used in event detail pages and member pages.
 */
export const formatDate = (value) => {
  if (!value) return null;

  let date;
  if (value?.toDate) {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

/**
 * Short date format: "04 Mar" (en-GB locale).
 * Used in carousel / exhibition layouts.
 */
export const formatDateShort = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return "";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const eventHasDateInCurrentMonth = (dates = []) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  if (!dates.length) return false;
  return dates.some((entry) => {
    const date = entry?.date;
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime()))
      return false;
    return (
      date.getFullYear() === currentYear && date.getMonth() === currentMonth
    );
  });
};

/**
 * Returns true if the event has at least one date from today onwards.
 */
export const hasFutureDate = (dates = []) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today

  if (!dates.length) return false;

  return dates.some((entry) => {
    const date = entry?.date;
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime()))
      return false;
    
    // Compare date with now
    return date >= now;
  });
};

/**
 * Returns true if the event has no dates in the future.
 * Events with no dates are considered past (archived) by default.
 */
export const isPastEvent = (dates = []) => {
  if (!dates.length) return true;
  return !hasFutureDate(dates);
};

export const getEarliestDate = (eventDoc) => {
  if (!Array.isArray(eventDoc.dates) || eventDoc.dates.length === 0) {
    return null;
  }

  const validDates = eventDoc.dates
    .map((entry) => parseDateEntry(entry)?.date)
    .filter((date) => date !== null);

  if (validDates.length === 0) {
    return null;
  }

  return new Date(Math.min(...validDates.map((d) => d.getTime())));
};

export const getFirstDateAndTime = (eventDoc) => {
  if (!Array.isArray(eventDoc.dates) || eventDoc.dates.length === 0) {
    return { date: null, time: null };
  }

  const firstEntry = eventDoc.dates.find((entry) => {
    const parsed = parseDateEntry(entry);
    return parsed && parsed.date !== null;
  });

  if (!firstEntry) {
    return { date: null, time: null };
  }

  const parsed = parseDateEntry(firstEntry);
  return {
    date: parsed?.date || null,
    time: parsed?.time || null,
  };
};

// ─── Event Document Normalizer ───────────────────────────────────────────────

export const normalizeEventDoc = (docData, docId) => {
  if (!docData) return null;

  const eventTypes = normalizeEventTypes(
    docData.event_type || docData.eventType || docData.type
  );
  if (!eventContainsPerformanceOrResidencyOrTraining(eventTypes)) {
    return null;
  }

  const dates = Array.isArray(docData.dates)
    ? docData.dates.map(parseDateEntry).filter(Boolean)
    : [];
  const rawPurchaseLink = docData.purchase_link || docData.purchaseLink || "";
  const purchaseLink =
    typeof rawPurchaseLink === "string" ? rawPurchaseLink.trim() : "";

  const rawVideoLink = docData.video_link || docData.videoLink || "";
  const videoLink =
    typeof rawVideoLink === "string" ? rawVideoLink.trim() : "";

  const rawPdfLink = docData.pdf_link || docData.pdfLink || "";
  const pdfLink =
    typeof rawPdfLink === "string" ? rawPdfLink.trim() : "";

  return {
    id: docId,
    name: docData.name || docData.title || "Presentación",
    subtitle: docData.subtitle || "",
    description: normalizeDescription(docData.description),
    artists: normalizeArrayOfPeople(docData.artists),
    directors: normalizeArrayOfPeople(docData.directors),
    dates,
    address: docData.address || "",
    googleMapsLink: docData.googleMapsLink || "",
    purchaseLink,
    videoLink,
    pdfLink,
    slug: docData.slug || docId,
    banner: docData.banner || "",
    flyer: docData.flyer || "",
    gallery: normalizeGallery(docData.gallery),
    eventTypes,
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const isLikelyVideo = (url = "") => {
  return (
    url.toLowerCase().endsWith(".mp4") ||
    url.toLowerCase().includes("mime=video")
  );
};

/**
 * Converts a regular YouTube or Vimeo URL into an embeddable URL.
 */
export const getVideoEmbedUrl = (url) => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
};

/**
 * Extracts director names from a raw Firestore directors array.
 */
export const getDirectorNames = (directors) => {
  if (!Array.isArray(directors) || directors.length === 0) {
    return [];
  }

  return directors
    .map((director) => {
      if (typeof director === "string") {
        return director.trim();
      }
      if (director && typeof director === "object") {
        return String(
          director.name || director.fullName || director.displayName || ""
        ).trim();
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Reads the raw event_type / eventType / type field and returns
 * a unified eventTypes array from any document shape.
 */
export const getEventTypes = (eventDoc) =>
  normalizeEventTypes(
    eventDoc.event_type || eventDoc.eventType || eventDoc.type
  );

/**
 * Builds a card-shaped object from a raw Firestore event document.
 * Useful for Grid display across agenda, archivo, member pages, etc.
 */
export const buildEventCard = (eventDoc, fallbackImage = FALLBACK_IMAGE) => {
  const eventTypes = getEventTypes(eventDoc);

  const dates = Array.isArray(eventDoc.dates)
    ? eventDoc.dates.map(parseDateEntry).filter(Boolean)
    : [];

  const imageUrl =
    eventDoc.banner ||
    eventDoc.flyer ||
    eventDoc.gallery?.[0]?.url ||
    fallbackImage;

  const slug = eventDoc.slug || eventDoc.id;
  const title = eventDoc.name || eventDoc.title || "Evento";
  const year = extractYear(dates) ?? "—";

  return { id: eventDoc.id, title, slug, imageUrl, year, eventTypes, dates };
};

/**
 * Standard year-descending sort used across Grid views.
 */
export const sortByYearDesc = (a, b) => {
  if (a.year === "—" && b.year !== "—") return 1;
  if (a.year !== "—" && b.year === "—") return -1;
  return String(b.year).localeCompare(String(a.year));
};
