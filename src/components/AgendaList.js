"use client";

import React, { useMemo } from "react";
import { TransitionLink } from "./TransitionLink";
import AnimatedUnderline from "./AnimatedUnderline";
import { formatDate } from "../lib/eventUtils";

const MONTH_PLACEHOLDER = "—";

function groupByMonth(cards) {
  const groups = [];
  
  for (const card of cards) {
    if (!card.dates || card.dates.length === 0) continue;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const futureDates = card.dates.filter(d => {
      const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
      const dDate = new Date(dateObj);
      dDate.setHours(0, 0, 0, 0);
      return dDate.getTime() >= now.getTime();
    });

    if (futureDates.length === 0) continue;

    const datesByMonth = {};
    for (const d of futureDates) {
      const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
      const formatted = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(dateObj);
      const monthString = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      
      if (!datesByMonth[monthString]) datesByMonth[monthString] = [];
      datesByMonth[monthString].push(d);
    }

    for (const [monthString, monthDates] of Object.entries(datesByMonth)) {
      let group = groups.find(g => g.month === monthString);
      if (!group) {
        group = { month: monthString, events: [] };
        groups.push(group);
      }
      group.events.push({ ...card, dates: monthDates });
    }
  }

  groups.forEach(group => {
    group.sortDate = Math.min(...group.events.flatMap(e => 
      e.dates.map(d => {
        const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
        return dateObj.getTime();
      })
    ));
    
    group.events.sort((a, b) => {
      const aMin = Math.min(...a.dates.map(d => {
        const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
        return dateObj.getTime();
      }));
      const bMin = Math.min(...b.dates.map(d => {
        const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
        return dateObj.getTime();
      }));
      return aMin - bMin;
    });
  });

  groups.sort((a, b) => a.sortDate - b.sortDate);

  return groups.map(g => [g.month, g.events]);
}

const listContainerStyles = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  width: "100%",
};

const agendaItemStyles = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  borderBottom: "1px solid black",
  paddingBottom: "0.75rem",
  paddingTop: "0.75rem",
  width: "100%",
  transition: "opacity 0.2s ease",
};

const titleStyles = {
  fontFamily: "var(--font-family-base)",
  fontStyle: "normal",
  fontSize: "2rem",
  lineHeight: "2rem",
  fontWeight: 600,
  letterSpacing: "1px",
  textTransform: "uppercase",
  margin: 0,
  marginLeft: "15vw",
  color: "black",
  textAlign: "left",
};

const dateStyles = {
  fontFamily: "var(--font-family-base)",
  fontSize: "0.95rem",
  color: "#555",
  margin: 0,
  padding: '0'
};

export default function AgendaList({ events, basePath = "/evento" }) {
  const groups = useMemo(() => groupByMonth(events), [events]);

  return (
    <section style={listContainerStyles}>
      {groups.map(([month, groupEvents], idx) => (
        <div key={month} style={{ width: "100%", marginTop: idx === 0 ? 0 : "2rem" }}>

          <header
            style={{
              marginBottom: "1rem",
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              width: "100%",
            }}
          >

            <h2
              style={{
                fontFamily: "var(--font-family-base)",
                margin: 0,
                marginBottom: "-1vh",
                fontSize: "3.75rem",
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                textAlign: "left",
              }}
            >
              {month}
            </h2>
            <AnimatedUnderline
              loaded={true}
              style={{
                flex: 1,
                minWidth: 0,
                borderTop: "2px solid black",
              }}
            />
          </header>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {groupEvents.map((event, index) => {
              const dateInfo = (event.dates || [])
                .map((d) => {
                  if (!d.date) return null;
                  const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
                  if (isNaN(dateObj.getTime())) return null;
                  const day = new Intl.DateTimeFormat('es-ES', { day: 'numeric' }).format(dateObj);
                  return { day, time: d.time, dateObj };
                })
                .filter(Boolean)
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

              const timeString = dateInfo
                .map((d) => (d.time ? `${d.time}hs` : null))
                .filter(Boolean)
                .join(" | ");

              const isLastItem = index === groupEvents.length - 1;

              return (
                <TransitionLink
                  key={event.id}
                  href={`${basePath}/${event.slug}`}
                  style={{ textDecoration: "none", width: "100%" }}
                  className="agendaLinkHover"
                >
                  <article style={{ ...agendaItemStyles, borderBottom: isLastItem ? "none" : "1px solid black" }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "1.5rem", width: "100%" }}>

                      <div style={{ display: "flex", flexDirection: "column", marginBottom: "0.25rem" }}>
                        {dateInfo.map((d, i) => (
                          <h2 key={i} style={{ ...titleStyles, marginLeft: 0, fontSize: "3rem", lineHeight: "1" }}>
                            {d.day}
                          </h2>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <h3 style={{ ...titleStyles, marginLeft: 0 }}>
                          {event.title}
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", marginBottom: "0.15rem", marginTop: "0.25rem" }}>
                          {timeString && <p style={{ ...dateStyles, marginLeft: 0, fontSize: "1.25rem" }}>{timeString}</p>}

                          {(event.type?.length > 0 || event.directors?.length > 0) && (
                            <p style={{ ...dateStyles, fontStyle: "italic", fontSize: "1.25rem", lineHeight: '20px' }}>
                              {[
                                event.type?.length > 0 ? event.type.join(", ") : null,
                                event.directors?.length > 0
                                  ? `Dir: ${event.directors.map((dir) => dir.name).join(", ")}`
                                  : null,
                              ].filter(Boolean).join(" | ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </TransitionLink>
              );
            })}
          </div>
          {idx === groups.length - 1 && (
            <header
              style={{
                marginTop: "-2rem",
                display: "flex",
                alignItems: "flex-end",
                gap: "0.5rem",
                width: "100%",
              }}
            >
              <AnimatedUnderline
                loaded={true}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderTop: "2px solid black",
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-family-base)",
                  margin: 0,
                  marginBottom: "-1vh",
                  fontSize: "3.75rem",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  textAlign: "right",
                }}
              >
                2026
              </h2>
            </header>
          )}
        </div>
      ))}
    </section>
  );
}
