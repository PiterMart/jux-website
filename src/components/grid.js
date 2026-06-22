"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { TransitionLink } from "./TransitionLink";
import AnimatedUnderline from "./AnimatedUnderline";
import { useCursorHoverImage } from "../hooks/useCursorHoverImage";

/** Masonry grid via CSS columns - adapts to each image's aspect ratio */
const masonryGridStyles = (gap) => ({
  columnCount: 4,
  columnGap: gap,
  marginTop: "1rem",
});

const gridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
  gap: "2rem",
  justifyItems: "center",
  alignItems: "start",
};

const gridStylesTight = {
  ...gridStyles,
  gap: "0.5rem",
  alignItems: "stretch",
};

const linkStyles = {
  width: "100%",
  maxWidth: "300px",
  textDecoration: "none",
  color: "inherit",
};

const masonryLinkStyles = {
  ...linkStyles,
  maxWidth: "none",
};

const notaStyles = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  textAlign: "left",
};

const notaStylesTight = {
  ...notaStyles,
  gap: "0.35rem",
};

const imageWrapperBase = {
  width: "100%",
  overflow: "hidden",
  borderRadius: "var(--border-radius)",
  backgroundColor: "#f0f0f0",
  lineHeight: 0,
  position: "relative",
};

const imageWrapperStyles = {
  ...imageWrapperBase,
  aspectRatio: "3/4",
};

const imageWrapperStylesTight = {
  ...imageWrapperBase,
  aspectRatio: "3/4",
  flexShrink: 0,
};

const imagePlaceholderStyles = {
  width: "100%",
  aspectRatio: "3/4",
  borderRadius: "var(--border-radius)",
  backgroundColor: "#e8e8e8",
  flexShrink: 0,
};

const MASONRY_BREAKPOINTS = { sm: 640, md: 900, lg: 1200 };

const masonryItemStyles = (gap) => ({
  breakInside: "avoid",
  marginBottom: gap,
});

function getColumnCount(width) {
  if (width < MASONRY_BREAKPOINTS.sm) return 2;  /* mobile: 2 cards per line, bigger */
  if (width < MASONRY_BREAKPOINTS.md) return 3;
  if (width < MASONRY_BREAKPOINTS.lg) return 4;
  return 5;
}

const yearHeadingBase = {
  fontFamily: "var(--font-family-base)",
  margin: 0,
  marginBottom: "-1vh",
  fontSize: "3.75rem",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textAlign: "left",
};

const yearHeadingWrapperStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "0.5rem",
  width: "100%",
  marginBottom: "0.5rem",
};

const FADE_TRANSITION = "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)";

const YEAR_PLACEHOLDER = "\u2014";

function groupByYear(cards) {
  const byYear = {};
  for (const card of cards) {
    const y = card.year ?? YEAR_PLACEHOLDER;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(card);
  }
  const keys = Object.keys(byYear).sort((a, b) => {
    if (a === YEAR_PLACEHOLDER && b !== YEAR_PLACEHOLDER) return 1;
    if (a !== YEAR_PLACEHOLDER && b === YEAR_PLACEHOLDER) return -1;
    return String(b).localeCompare(String(a));
  });
  return keys.map((year) => [year, byYear[year]]);
}

const archivoLinkStyles = {
  ...linkStyles,
  maxWidth: "none",
  display: "block",
  width: "100%",
};

const archivoNotaStyles = {
  ...notaStyles,
  width: "100%",
  gap: 0,
  minHeight: "2.5rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  borderBottom: "1px solid black",
  paddingBottom: "0.35rem",
};

const CURSOR_IMAGE_WIDTH = 280;
const CURSOR_IMAGE_HEIGHT = 360;

const AdaptiveImage = React.memo(function AdaptiveImage({ src, alt, tight, priority = false, fetchPriority }) {
  const [dimensions, setDimensions] = useState(null);

  const handleLoad = useCallback((e) => {
    const img = e.target?.tagName === "IMG" ? e.target : e.target?.querySelector?.("img");
    if (img?.naturalWidth && img?.naturalHeight) {
      setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  const aspectRatio = dimensions ? `${dimensions.w} / ${dimensions.h}` : "1 / 1";
  const wrapperStyle = {
    ...(tight ? imageWrapperStylesTight : imageWrapperBase),
    aspectRatio,
  };

  return (
    <div style={wrapperStyle}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 500px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        style={{ objectFit: "contain" }}
        onLoad={handleLoad}
        priority={priority}
        {...(fetchPriority ? { fetchPriority } : {})}
      />
    </div>
  );
});

const imageWithTitleWrapperStyles = {
  position: "relative",
  width: "100%",
};

const titleSlideBaseStyles = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  overflow: "hidden",
  transition: "max-height 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
  borderRadius: "var(--border-radius)",
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
};

const titleSlideInnerStyles = {
  fontFamily: "var(--font-grid-card)",
  fontStyle: "italic",
  fontSize: "0.9rem",
  fontWeight: 500,
  letterSpacing: "0.5px",
  lineHeight: 1.3,
  textAlign: "left",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  padding: "1.5rem 1rem 0.75rem",
  backgroundColor: "black",
  color: "white",
  transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
};

const ABOVE_THE_FOLD_COUNT = 8; /* priority-load first N images */

export default function Grid({ cards, hideImages = false, tight = false, hoverOverlay = false, basePath = "/evento", yearHeadingClassName, loaded = true }) {
  const groups = useMemo(() => groupByYear(cards), [cards]);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Trigger animation on mount; parent's loaded can be true before Grid mounts */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setHasAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const animating = loaded && hasAnimated;

  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [revealedCardId, setRevealedCardId] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [columnCount, setColumnCount] = useState(4);
  const sectionRef = useRef(null);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (hideImages) return;
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0]?.contentRect ?? {};
      if (typeof width === "number") setColumnCount(getColumnCount(width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hideImages]);

  const baseGap = hideImages ? "0" : tight ? "0.5rem" : "2rem";
  const gap = !hideImages && columnCount === 2 && !tight ? "1rem" : baseGap; /* smaller gap on mobile = bigger cards */
  const useMasonry = !hideImages;

  const dynamicGridStyles = useMasonry
    ? { ...masonryGridStyles(gap), columnCount }
    : {
        ...(hideImages ? { ...gridStyles, gridTemplateColumns: "1fr", justifyItems: "stretch", alignItems: "stretch" } : tight ? gridStylesTight : gridStyles),
        gap,
      };

  const { showCursorImage, hideCursorImage, renderCursorPortal } = useCursorHoverImage({
    items: cards,
    active: hideImages,
    imageUrlKey: "imageUrl"
  });

  return (
    <>
      {renderCursorPortal()}
      <section
        ref={sectionRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        {groups.map(([year, groupCards], idx) => (
          <div key={year} style={{ width: "100%" }}>
            {yearHeadingClassName ? (
              <header
                className={yearHeadingClassName}
                style={{
                  marginTop: idx === 0 ? 0 : "1.5rem",
                  marginBottom: 0,
                  borderBottom: "none",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "0.5rem",
                  width: "100%",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    marginBottom: "-1vh",
                    opacity: animating ? 1 : 0,
                    transition: FADE_TRANSITION,
                    transitionDelay: animating ? `${idx * 0.08}s` : "0s",
                  }}
                >
                  {year}
                </h2>
                <AnimatedUnderline
                  loaded={animating}
                  transitionDelay={animating ? `${idx * 0.08}s` : undefined}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderTop: "2px solid black",
                  }}
                />
              </header>
            ) : (
              <div style={{ ...yearHeadingWrapperStyle, marginTop: idx === 0 ? 0 : "1.5rem" }}>
                <h2
                  style={{
                    ...yearHeadingBase,
                    opacity: animating ? 1 : 0,
                    transition: FADE_TRANSITION,
                    transitionDelay: animating ? `${idx * 0.08}s` : "0s",
                  }}
                >
                  {year}
                </h2>
                <AnimatedUnderline
                  loaded={animating}
                  transitionDelay={animating ? `${idx * 0.08}s` : undefined}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderTop: "2px solid black",
                  }}
                />
              </div>
            )}
            <div style={dynamicGridStyles}>
              {groupCards.map((card, cardIdx) => {
                const flatIndex = groups.slice(0, idx).reduce((sum, [, g]) => sum + g.length, 0) + cardIdx;
                const isPriority = flatIndex < ABOVE_THE_FOLD_COUNT;
                const showOverlay = hoverOverlay && (hoveredCardId === card.id || revealedCardId === card.id);
                const handleClick = (e) => {
                  if (!hoverOverlay || !isTouchDevice) return;
                  if (revealedCardId === card.id) {
                    return;
                  }
                  e.preventDefault();
                  setRevealedCardId(card.id);
                };
                const linkStyle = hideImages ? archivoLinkStyles : useMasonry ? masonryLinkStyles : linkStyles;
                const articleStyle = hideImages ? archivoNotaStyles : tight ? notaStylesTight : notaStyles;
                const cardDelay = animating ? `${0.06 + flatIndex * 0.03}s` : "0s";
                const content = (
                    <TransitionLink
                      href={`${basePath}/${card.slug}`}
                      style={linkStyle}
                      onMouseEnter={
                        hideImages && card.imageUrl
                          ? () => showCursorImage(card.imageUrl)
                          : hoverOverlay
                            ? () => setHoveredCardId(card.id)
                            : undefined
                      }
                      onMouseLeave={
                        hideImages
                          ? hideCursorImage
                          : hoverOverlay
                            ? () => setHoveredCardId(null)
                            : undefined
                      }
                      onClick={handleClick}
                    >
                      <article style={articleStyle}>
                        {!hideImages && card.imageUrl ? (
                          <div style={imageWithTitleWrapperStyles}>
                            <AdaptiveImage src={card.imageUrl} alt={`Imagen de ${card.title} - Nos Envera`} tight={tight} priority={isPriority} fetchPriority={isPriority ? "high" : undefined} />
                            {hoverOverlay && (
                              <div
                                style={{
                                  ...titleSlideBaseStyles,
                                  maxHeight: showOverlay ? "6rem" : 0,
                                }}
                              >
                                <div
                                  style={{
                                    ...titleSlideInnerStyles,
                                    opacity: showOverlay ? 1 : 0,
                                    transform: showOverlay ? "translateY(0)" : "translateY(0.5rem)",
                                  }}
                                >
                                  {card.title}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : !hideImages && tight ? (
                          <div style={imageWithTitleWrapperStyles}>
                            <div style={{ ...imagePlaceholderStyles, position: "relative" }} aria-hidden>
                              <div style={{ position: "absolute", inset: 0, borderRadius: "var(--border-radius)", backgroundColor: "#e8e8e8" }} />
                            </div>
                            {hoverOverlay && (
                              <div
                                style={{
                                  ...titleSlideBaseStyles,
                                  maxHeight: showOverlay ? "6rem" : 0,
                                }}
                              >
                                <div
                                  style={{
                                    ...titleSlideInnerStyles,
                                    opacity: showOverlay ? 1 : 0,
                                    transform: showOverlay ? "translateY(0)" : "translateY(0.5rem)",
                                  }}
                                >
                                  {card.title}
                                </div>
                              </div>
                            )}
                          </div>
                      ) : null}
                      {!hoverOverlay && (
                        <h3 style={{ fontFamily: "var(--font-grid-card)", fontStyle: "italic", fontSize: "1.1rem", fontWeight: 400, letterSpacing: "0.5px", margin: 0 }}>
                          {card.title}
                        </h3>
                      )}
                    </article>
                  </TransitionLink>
                );
                const cardWrapperStyle = {
                  opacity: animating ? 1 : 0,
                  transition: FADE_TRANSITION,
                  transitionDelay: cardDelay,
                };
                return useMasonry ? (
                  <div key={card.id} style={{ ...masonryItemStyles(gap), ...cardWrapperStyle }}>
                    {content}
                  </div>
                ) : (
                  <div key={card.id} style={cardWrapperStyle}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
