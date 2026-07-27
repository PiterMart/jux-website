import { Timestamp } from "firebase/firestore";

/**
 * Converts any date representation (Timestamp, ISO string, Date, or string)
 * to YYYY-MM-DD format for <input type="date" />.
 */
export function toInputDate(val) {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (typeof val === "object" && val.seconds !== undefined) {
    return new Date(val.seconds * 1000).toISOString().split("T")[0];
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return "";
}

/**
 * Formats a date value (ISO string, Timestamp, or date string) into human-readable Spanish text.
 * Example: "2025-03-15" -> "15 de marzo de 2025"
 */
export function formatDateDisplay(val) {
  if (!val) return "";
  let dateObj = null;

  if (typeof val === "object" && val.seconds !== undefined) {
    dateObj = new Date(val.seconds * 1000);
  } else if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split("-").map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (dateObj) {
    return dateObj.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return String(val);
}

/**
 * Calculates exhibition status ("actual", "proxima", "pasada") automatically based on dates.
 */
export function calculateExhibitionStatus(startDateVal, endDateVal) {
  if (!startDateVal && !endDateVal) return "actual";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = null;
  let endDate = null;

  if (startDateVal) {
    if (typeof startDateVal === "object" && startDateVal.seconds) {
      startDate = new Date(startDateVal.seconds * 1000);
    } else {
      const parsed = new Date(startDateVal);
      if (!isNaN(parsed.getTime())) startDate = parsed;
    }
  }

  if (endDateVal) {
    if (typeof endDateVal === "object" && endDateVal.seconds) {
      endDate = new Date(endDateVal.seconds * 1000);
    } else {
      const parsed = new Date(endDateVal);
      if (!isNaN(parsed.getTime())) endDate = parsed;
    }
  }

  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
    if (today < startDate) {
      return "proxima";
    }
  }

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    if (today > endDate) {
      return "pasada";
    }
  }

  return "actual";
}

/**
 * Converts a date string or Date object to a Firestore Timestamp.
 */
export function toFirestoreTimestamp(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === "object" && dateVal.seconds !== undefined) {
    return dateVal;
  }
  const parsed = new Date(dateVal);
  if (isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}
