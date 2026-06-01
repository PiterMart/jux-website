'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from '../styles/Popup.module.css';
import { TransitionLink } from './TransitionLink';

export default function Popup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (pathname === '/') {
      // Small delay on mount to allow other homepage components to load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [pathname]);

  const handleClose = (e) => {
    // Prevent the click from triggering the parent link if clicked on the close button
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  // Avoid SSR hydration issues or rendering on non-home pages
  if (!mounted || !isOpen || pathname !== '/') return null;

  return (
    <div className={styles.popupContainer}>
      <button 
        className={styles.closeButton} 
        onClick={handleClose}
        aria-label="Cerrar anuncio"
        type="button"
      >
        &times;
      </button>
      <TransitionLink 
        href="/evento/convocatoria-abierta" 
        className={styles.imageWrapper}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/popup/POP_UP_5.png" 
          alt="Popup Announcement" 
          className={styles.popupImage}
        />
      </TransitionLink>
    </div>
  );
}
