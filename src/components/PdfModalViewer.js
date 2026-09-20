"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import styles from "../styles/pdfViewer.module.css";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function PdfModalViewer({ file, title, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // View mode defaults to 'text' (Modo Lectura) as requested
  const [viewMode, setViewMode] = useState("text");
  const [extractedPages, setExtractedPages] = useState([]);

  const viewerBodyRef = useRef(null);
  const lastTapRef = useRef(0);
  const initialTouchDistanceRef = useRef(null);
  const initialScaleRef = useRef(1);

  // Proxy remote PDFs to bypass browser CORS restrictions
  const resolvedFile = React.useMemo(() => {
    if (!file) return null;
    if (typeof file === "string" && (file.startsWith("http://") || file.startsWith("https://"))) {
      return `/api/pdf-proxy?url=${encodeURIComponent(file)}`;
    }
    return file;
  }, [file]);

  // Measure available container width & detect mobile resolution
  const updateWidth = useCallback(() => {
    if (viewerBodyRef.current) {
      const clientWidth = viewerBodyRef.current.clientWidth;
      setContainerWidth(clientWidth);
      const mobileCheck = clientWidth < 768;
      setIsMobile(mobileCheck);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    updateWidth();
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (viewMode === "pdf") {
        if (e.key === "ArrowLeft" || e.key === "PageUp") {
          setPageNumber((prev) => Math.max(prev - 1, 1));
        } else if (e.key === "ArrowRight" || e.key === "PageDown") {
          setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev + 1));
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
          e.preventDefault();
          setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
          e.preventDefault();
          setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.6));
        } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
          e.preventDefault();
          setScale(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, onClose, viewMode]);

  // Touch gesture support: Pinch to Zoom (in PDF mode)
  const handleTouchStart = (e) => {
    if (viewMode === "pdf" && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialTouchDistanceRef.current = dist;
      initialScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (viewMode === "pdf" && e.touches.length === 2 && initialTouchDistanceRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialTouchDistanceRef.current;
      const newScale = Math.min(Math.max(Number((initialScaleRef.current * factor).toFixed(2)), 0.6), 2.5);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
  };

  // Double tap to toggle zoom in PDF mode
  const handleDoubleTap = (e) => {
    if (viewMode !== "pdf") return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      setScale((prev) => (prev > 1.05 ? 1.0 : 1.4));
    }
    lastTapRef.current = now;
  };

  const onDocumentLoadSuccess = async (pdfDoc) => {
    setNumPages(pdfDoc.numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);

    // Extract text content for Responsive Reading Mode
    try {
      const pages = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        let lastY = null;
        let pageStr = "";
        for (const item of textContent.items) {
          if (!item.str) continue;
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
            pageStr += "\n\n";
          } else if (pageStr && !pageStr.endsWith(" ") && !pageStr.endsWith("\n")) {
            pageStr += " ";
          }
          pageStr += item.str;
          lastY = item.transform[5];
        }
        if (pageStr.trim()) {
          pages.push(pageStr.trim());
        }
      }
      setExtractedPages(pages);
      // If no text was extracted (e.g. image-only PDF), fall back to PDF view
      if (pages.length === 0) {
        setViewMode("pdf");
      }
    } catch (err) {
      console.warn("Could not extract text content from PDF:", err);
      setViewMode("pdf");
    }
  };

  const onDocumentLoadError = (err) => {
    console.error("Error loading PDF:", err);
    setError(err);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.6));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Calculate rendered page width adapting to screen width so it DOES NOT overflow
  const padding = isMobile ? 8 : 48;
  const baseWidth = isMobile
    ? Math.max(260, containerWidth - padding)
    : Math.max(320, Math.min(containerWidth - padding, 820));
  const renderedWidth = Math.round(baseWidth * scale);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Visor de PDF"}
    >
      {/* Header Toolbar */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.pdfBadge}>PDF</span>
          <h1 className={styles.title} title={title}>
            {title || "Documento"}
          </h1>
        </div>

        <div className={styles.toolbar}>
          {/* Mode Switcher: Lectura (default) vs PDF */}
          <div className={styles.modeToggle}>
            <button
              type="button"
              className={`${styles.modeBtn} ${viewMode === "text" ? styles.modeBtnActive : ""}`}
              onClick={() => setViewMode("text")}
              title="Modo Lectura: texto adaptado y fluido a la pantalla"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
              <span>Lectura</span>
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${viewMode === "pdf" ? styles.modeBtnActive : ""}`}
              onClick={() => setViewMode("pdf")}
              title="Ver diseño original del PDF ajustado a pantalla"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>PDF</span>
            </button>
          </div>

          {/* Controls visible in PDF mode */}
          {viewMode === "pdf" && (
            <>
              {/* Page Navigation */}
              <div className={styles.controlGroup}>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  aria-label="Página anterior"
                  title="Página anterior (←)"
                >
                  &#8592;
                </button>
                <span className={styles.pageIndicator}>
                  {pageNumber} / {numPages || "–"}
                </span>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={goToNextPage}
                  disabled={numPages ? pageNumber >= numPages : true}
                  aria-label="Página siguiente"
                  title="Página siguiente (→)"
                >
                  &#8594;
                </button>
              </div>

              {/* Zoom Controls */}
              <div className={styles.controlGroup}>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={zoomOut}
                  disabled={scale <= 0.6}
                  aria-label="Reducir zoom"
                  title="Reducir zoom"
                >
                  &#8722;
                </button>
                <span
                  className={styles.zoomIndicator}
                  onClick={resetZoom}
                  title="Ajustar 100% a pantalla sin desbordar"
                >
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={zoomIn}
                  disabled={scale >= 2.5}
                  aria-label="Aumentar zoom"
                  title="Aumentar zoom"
                >
                  &#43;
                </button>
              </div>
            </>
          )}

          {/* Desktop Direct Download Link */}
          {file && (
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              download
              className={styles.actionButton}
              title="Abrir o descargar archivo PDF original"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Descargar</span>
            </a>
          )}

          {/* Top Close Button */}
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar visor"
            title="Cerrar (Esc)"
          >
            &#10005;
          </button>
        </div>
      </header>

      {/* Body Area */}
      <div
        ref={viewerBodyRef}
        className={styles.viewerBody}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {error ? (
          <div className={styles.stateContainer}>
            <div className={styles.errorBox}>
              <h3 className={styles.errorTitle}>No se pudo cargar el visor interactivo</h3>
              <p className={styles.stateText}>
                Es posible que el archivo tenga restricciones de acceso o haya un problema temporal de red.
              </p>
              {file && (
                <a
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fallbackLink}
                >
                  Abrir PDF directamente
                </a>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 1. Responsive Text Mode (Modo Lectura: starts by default, fluid responsive text) */}
            {viewMode === "text" && (
              loading || extractedPages.length === 0 ? (
                <div className={styles.stateContainer}>
                  <div className={styles.spinner} />
                  <p className={styles.stateText}>Cargando modo lectura...</p>
                </div>
              ) : (
                <div className={styles.textModeContainer}>
                  <div className={styles.textArticle}>
                    {extractedPages.map((pageContent, idx) => (
                      <div key={idx} className={styles.textPageSection}>
                        {extractedPages.length > 1 && (
                          <div className={styles.textPageHeader}>Página {idx + 1}</div>
                        )}
                        {pageContent.split("\n\n").map((paragraph, pIdx) => (
                          <p key={pIdx} className={styles.textParagraph}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 2. PDF Page View (Always mounted so Document loads in background, hidden when in text mode) */}
            <div
              className={styles.docWrapper}
              style={{ display: viewMode === "pdf" ? "flex" : "none" }}
            >
              <Document
                file={resolvedFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className={styles.stateContainer}>
                    <div className={styles.spinner} />
                    <p className={styles.stateText}>Cargando documento PDF...</p>
                  </div>
                }
                error={null}
              >
                <div
                  className={styles.pageContainer}
                  onClick={handleDoubleTap}
                  title="Doble toque o clic para hacer zoom"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={renderedWidth}
                    devicePixelRatio={
                      typeof window !== "undefined"
                        ? Math.min(window.devicePixelRatio || 1, 3)
                        : 1
                    }
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                  />
                </div>
              </Document>
            </div>
          </>
        )}
      </div>

      {/* Bottom Action Bar with Close and Download Buttons */}
      <footer className={styles.bottomBar}>
        {/* Page Nav on Bottom for Mobile when in PDF mode */}
        {viewMode === "pdf" && numPages && numPages > 1 && (
          <div className={styles.bottomLeftGroup}>
            <div className={styles.controlGroup}>
              <button
                type="button"
                className={styles.toolButton}
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                aria-label="Página anterior"
              >
                &#8592;
              </button>
              <span className={styles.pageIndicator}>
                {pageNumber} / {numPages}
              </span>
              <button
                type="button"
                className={styles.toolButton}
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                aria-label="Página siguiente"
              >
                &#8594;
              </button>
            </div>
          </div>
        )}

        {/* Prominent Bottom Action Buttons */}
        <div className={styles.bottomRightGroup}>
          {file && (
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              download
              className={styles.bottomDownloadBtn}
              title="Descargar archivo PDF original"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Descargar</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className={styles.bottomCloseBtn}
            aria-label="Cerrar visor"
            title="Cerrar visor"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Cerrar</span>
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
