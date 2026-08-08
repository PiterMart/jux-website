"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "../styles/HomepageAnimationOverlay.module.css";

export default function HomepageAnimationOverlay() {
  const [retractFactor, setRetractFactor] = useState(0); // 0 = closed, 1 = retracted (desktop mouse proximity)
  const [dismissedQuadrants, setDismissedQuadrants] = useState([false, false, false, false]); // [TL, TR, BL, BR]
  const [isFullyDismissed, setIsFullyDismissed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isDismissingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth <= 768
      );
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);

    return () => {
      window.removeEventListener("resize", checkTouch);
    };
  }, []);

  // Desktop mouse proximity calculation
  const handleMouseMove = useCallback(
    (e) => {
      if (isFullyDismissed || isTouchDevice || dismissedQuadrants.some(Boolean)) return;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const centerX = windowWidth / 2;
      const centerY = windowHeight / 2;

      // Distance from screen center
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.hypot(distX, distY);
      const maxDist = Math.hypot(centerX, centerY);

      // Slower & smooth proximity threshold
      const threshold = maxDist * 0.75;
      let factor = 0;
      if (dist < threshold) {
        factor = Math.pow(1 - dist / threshold, 1.4);
      }

      setRetractFactor(Math.min(1, Math.max(0, factor)));
    },
    [isFullyDismissed, isTouchDevice, dismissedQuadrants]
  );

  useEffect(() => {
    if (isFullyDismissed || isTouchDevice || dismissedQuadrants.some(Boolean)) return;

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove, isFullyDismissed, isTouchDevice, dismissedQuadrants]);

  // One-by-one staggered dismissal for mobile & click interactions
  const triggerStaggeredDismissal = useCallback((startIndex = 0) => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    const order = [0, 1, 2, 3];
    // Reorder sequence starting with the tapped quadrant index if specified
    const sequence = [
      startIndex,
      ...order.filter((idx) => idx !== startIndex),
    ];

    sequence.forEach((quadIdx, delayIndex) => {
      setTimeout(() => {
        setDismissedQuadrants((prev) => {
          const next = [...prev];
          next[quadIdx] = true;
          return next;
        });
      }, delayIndex * 240); // 240ms staggered delay between each quadrant
    });

    // After all 4 are retracted + animation completes, mark fully dismissed
    setTimeout(() => {
      setIsFullyDismissed(true);
    }, 4 * 240 + 1000);
  }, []);

  // Auto-trigger slide out after 6 seconds if user hasn't clicked yet
  useEffect(() => {
    if (!isMounted || isFullyDismissed || dismissedQuadrants.some(Boolean)) return;

    const timer = setTimeout(() => {
      triggerStaggeredDismissal(0);
    }, 6000);

    return () => clearTimeout(timer);
  }, [isMounted, isFullyDismissed, dismissedQuadrants, triggerStaggeredDismissal]);

  const handleQuadrantClick = (index, e) => {
    e.stopPropagation();
    if (!dismissedQuadrants[index]) {
      triggerStaggeredDismissal(index);
    }
  };

  const handleOverlayClick = () => {
    if (!dismissedQuadrants.every(Boolean)) {
      triggerStaggeredDismissal(0);
    }
  };

  if (!isMounted || isFullyDismissed) return null;

  // Transform calculations for desktop hover/proximity (when not dismissed)
  const getQuadrantStyle = (index, directionX, directionY) => {
    if (dismissedQuadrants[index]) {
      return undefined; // Handled by CSS retract class with custom transition
    }

    const factor = retractFactor;
    return {
      transform: `translate(${directionX * factor * 105}%, ${directionY * factor * 105}%)`,
      opacity: 1 - factor * 0.35,
    };
  };

  const anyDismissed = dismissedQuadrants.some(Boolean);
  const isPointerActive = !anyDismissed && retractFactor < 0.7;

  return (
    <div
      className={`${styles.overlayContainer} ${
        isPointerActive ? styles.overlayActive : ""
      }`}
      onClick={handleOverlayClick}
      aria-label="Interactive screen animation overlay"
    >
      {/* Top-Left Quadrant */}
      <div
        className={`${styles.quadrant} ${styles.topLeft} ${
          dismissedQuadrants[0] ? styles.retractedTL : ""
        }`}
        style={getQuadrantStyle(0, -1, -1)}
        onClick={(e) => handleQuadrantClick(0, e)}
      >
        <img
          src="/animacion/MUSEOJUXXXXOK1.png"
          alt="JUX Animation 1"
          className={styles.quadrantImage}
        />
      </div>

      {/* Top-Right Quadrant */}
      <div
        className={`${styles.quadrant} ${styles.topRight} ${
          dismissedQuadrants[1] ? styles.retractedTR : ""
        }`}
        style={getQuadrantStyle(1, 1, -1)}
        onClick={(e) => handleQuadrantClick(1, e)}
      >
        <img
          src="/animacion/MUSEOJUXXXXOK2.png"
          alt="JUX Animation 2"
          className={styles.quadrantImage}
        />
      </div>

      {/* Bottom-Left Quadrant */}
      <div
        className={`${styles.quadrant} ${styles.bottomLeft} ${
          dismissedQuadrants[2] ? styles.retractedBL : ""
        }`}
        style={getQuadrantStyle(2, -1, 1)}
        onClick={(e) => handleQuadrantClick(2, e)}
      >
        <img
          src="/animacion/MUSEOJUXXXXOK3.png"
          alt="JUX Animation 3"
          className={styles.quadrantImage}
        />
      </div>

      {/* Bottom-Right Quadrant */}
      <div
        className={`${styles.quadrant} ${styles.bottomRight} ${
          dismissedQuadrants[3] ? styles.retractedBR : ""
        }`}
        style={getQuadrantStyle(3, 1, 1)}
        onClick={(e) => handleQuadrantClick(3, e)}
      >
        <img
          src="/animacion/MUSEOJUXXXXOK4.png"
          alt="JUX Animation 4"
          className={styles.quadrantImage}
        />
      </div>
    </div>
  );
}
