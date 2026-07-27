import "../styles/globals.css";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import LoadingProvider from "../components/LoadingProvider";
import { LanguageProvider } from "../context/LanguageContext";

export const metadata = {
  title: {
    template: "%s | Galería de Arte",
    default: "Galería de Arte | El Museo, Exhibiciones, Educación y 360",
  },
  description: "Espacio de arte contemporáneo, exhibiciones, educación y recorridos 360°.",
  keywords: ["galería de arte", "exhibiciones", "arte contemporáneo", "obras de arte", "artistas", "360"],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Galería de Arte",
    description: "Espacio de arte contemporáneo, exhibiciones, educación y recorridos 360°.",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect to Firebase Storage for faster LCP image loading */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.gstatic.com" />
      </head>
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          position: 'relative'
        }}
      >
        {/* Background Contour SVG - 90vh height, aligned right with 2rem margin, layered on top of footer */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: '2rem',
            transform: 'translateY(-50%)',
            height: '90vh',
            maxHeight: '90vh',
            width: 'auto',
            pointerEvents: 'none',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            opacity: 0.9,
          }}
        >
          <img
            src="/jux-contorno.svg"
            alt=""
            style={{
              height: '90vh',
              maxHeight: '90vh',
              width: 'auto',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        </div>

        <LoadingProvider>
          <LanguageProvider>
            <Nav />
            <div className="appGrid" style={{ position: 'relative', zIndex: 1 }}>
              <main className="mainContent">
                {children}
              </main>
              <Footer />
            </div>
          </LanguageProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
