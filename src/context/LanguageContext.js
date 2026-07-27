'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const DICTIONARY = {
  ESP: {
    elMuseo: "EL MUSEO",
    exhibiciones: "EXHIBICIONES",
    artistas: "ARTISTAS",
    obras: "OBRAS",
    educacion: "EDUCACIÓN",
    experiencias360: "360°",
    contacto: "CONTACTO",
    agenda: "AGENDA",
    verDetalle: "Ver Detalle →",
    adquirirObra: "Consultar / Adquirir esta Obra",
    disponible: "DISPONIBLE",
    enColeccion: "EN COLECCIÓN",
    vendida: "VENDIDA",
    reservada: "RESERVADA",
    museoJudioExpandido: "MUSEO JUDIO EXPANDIDO",
    inauguraciones: "Próximas Actividades y Muestras",
    sinActividades: "No hay actividades programadas en este momento.",
  },
  EN: {
    elMuseo: "THE MUSEUM",
    exhibiciones: "EXHIBITIONS",
    artistas: "ARTISTS",
    obras: "ARTWORKS",
    educacion: "EDUCATION",
    experiencias360: "360°",
    contacto: "CONTACT",
    agenda: "AGENDA",
    verDetalle: "View Details →",
    adquirirObra: "Inquire / Acquire this Artwork",
    disponible: "AVAILABLE",
    enColeccion: "IN COLLECTION",
    vendida: "SOLD",
    reservada: "RESERVED",
    museoJudioExpandido: "MUSEO JUDIO EXPANDIDO",
    inauguraciones: "Upcoming Activities and Exhibitions",
    sinActividades: "No activities scheduled at this time.",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('ESP');

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'ESP' || saved === 'EN') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
    }
  };

  const t = (esText, enText) => {
    return language === 'ESP' ? esText : (enText || esText);
  };

  const dict = DICTIONARY[language] || DICTIONARY.ESP;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'ESP',
      setLanguage: () => {},
      t: (es, en) => es,
      dict: DICTIONARY.ESP,
    };
  }
  return context;
}
