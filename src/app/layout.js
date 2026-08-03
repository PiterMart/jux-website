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
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/JUX-LOGO.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/JUX-LOGO.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
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
        {/* Background Contour SVG - 90vh on desktop, 30vh (1/3rd size) stuck top-right on mobile */}
        <div className="bgContourContainer">
          <img
            src="/jux-contorno.svg"
            alt=""
            className="bgContourImage"
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
