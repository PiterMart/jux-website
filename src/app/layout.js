import "../styles/globals.css";
import Nav from "../components/Nav";
import RecentEvents from "../components/RecentEvents";
import Footer from "../components/Footer";
import LoadingProvider from "../components/LoadingProvider";
import PageTransitionProvider from "../components/PageTransitionProvider";
import PageTransitionWrapper from "../components/PageTransitionWrapper";
import ScrollToTop from "../components/ScrollToTop";
import Popup from "../components/Popup";

export const metadata = {
  title: {
    template: "%s | Nos en Vera",
    default: "Nos en Vera | Espacio de Performance y Creación",
  },
  description: "Espacio de arte y cultura dedicado a la promoción de artists emergentes, la investigación y la experimentación en el campo de la performance.",
  keywords: ["performance", "arte", "cultura", "investigación artística", "artistas emergentes", "Buenos Aires"],
  metadataBase: new URL("https://www.nosenvera.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Nos en Vera",
    description: "Espacio de convergencia y creación colectiva en el campo de la performance.",
    url: "https://www.nosenvera.com",
    siteName: "Nos en Vera",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nos en Vera",
    description: "Espacio de convergencia y creación colectiva en el campo de la performance.",
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

        {/* Google Fonts — loaded as <link> instead of CSS @import to avoid render-blocking */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          padding: 0
        }}
      >
        <LoadingProvider>
          <PageTransitionProvider>
            <ScrollToTop />
            <Nav />
            <div className="appGrid">
              <main className="mainContent">
                <PageTransitionWrapper>
                  {children}
                </PageTransitionWrapper>
                <div>
                  {/* <RecentEvents /> */}
                  <Footer />
                </div>
              </main>
            </div>
            <Popup />
          </PageTransitionProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
