"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const CURSOR_IMAGE_WIDTH = 280;
const CURSOR_IMAGE_HEIGHT = 360;

export function useCursorHoverImage({ items, active = true, imageUrlKey = "imageUrl" }) {
  const [cursorImageUrl, setCursorImageUrl] = useState(null);
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload all item images so hover swap is instant
  useEffect(() => {
    if (!active || !items?.length) return;
    const urls = [...new Set(items.map((item) => item[imageUrlKey]).filter(Boolean))];
    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, [items, imageUrlKey, active]);

  // Update cursor position via ref (no re-renders) for instant follow
  useEffect(() => {
    if (!active) return;
    const onMove = (e) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          if (cursorRef.current) {
            cursorRef.current.style.left = `${posRef.current.x}px`;
            cursorRef.current.style.top = `${posRef.current.y}px`;
          }
          rafRef.current = null;
        });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  const showCursorImage = useCallback((url) => setCursorImageUrl(url || null), []);
  const hideCursorImage = useCallback(() => setCursorImageUrl(null), []);

  const renderCursorPortal = () => {
    if (!active || !mounted) return null;
    return createPortal(
      <div
        ref={cursorRef}
        role="presentation"
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: CURSOR_IMAGE_WIDTH,
          height: CURSOR_IMAGE_HEIGHT,
          pointerEvents: "none",
          zIndex: 999999,
          opacity: cursorImageUrl ? 1 : 0,
          visibility: cursorImageUrl ? "visible" : "hidden",
          transition: "opacity 0.12s ease-out",
          borderRadius: "var(--border-radius)",
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        }}
      >
        {cursorImageUrl && (
          <Image
            key={cursorImageUrl}
            src={cursorImageUrl}
            alt=""
            fill
            sizes={`${CURSOR_IMAGE_WIDTH}px`}
            style={{ objectFit: "cover" }}
            draggable={false}
          />
        )}
      </div>,
      document.body
    );
  };

  return {
    showCursorImage,
    hideCursorImage,
    renderCursorPortal,
  };
}
