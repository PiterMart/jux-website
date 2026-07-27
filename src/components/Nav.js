'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/nav.module.css';
import { NAV_PAGES } from '../constants/navigation';

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPath = usePathname();
  const { language } = useLanguage();

  const getPageName = (page) => {
    if (language === 'EN') {
      const enNames = {
        "/el-museo": "THE MUSEUM",
        "/exhibiciones": "EXHIBITIONS",
        "/artistas": "ARTISTS",
        "/obras": "ARTWORKS",
        "/educacion": "EDUCATION",
        "/360": "360°",
        "/contacto": "CONTACT",
        "/agenda": "AGENDA",
      };
      return enNames[page.path] || page.name;
    }
    return page.name;
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPath]);

  return (
    <header className={styles.navbarHeader}>
      <div className={styles.navContainer}>
        {/* LOGO ON FAR LEFT */}
        <Link href="/" className={styles.logoLink} aria-label="JUX Home">
          <Image
            src="/JUX-LOGO.svg"
            alt="JUX Logo"
            width={90}
            height={32}
            className={styles.navLogo}
            priority
          />
        </Link>

        {/* HORIZONTAL NAV MENU */}
        <nav className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuOpen : ''}`}>
          <ul>
            {NAV_PAGES.map((page) => {
              const isActive = currentPath === page.path;
              return (
                <li key={page.path}>
                  <Link
                    href={page.path}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  >
                    {getPageName(page)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* MOBILE BURGER TOGGLE */}
        <button
          type="button"
          className={`${styles.mobileToggle} ${isMenuOpen ? styles.mobileToggleActive : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
