"use client";
import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseAuth";
import { logLogin, logLogout } from "../firebase/activityLogger";
import styles from "../../styles/uploader.module.css";
import ComunidadUploader from "../firebase/ComunidadUploader";
import EventUploader from "../firebase/EventUploader";
import ArticlesUploader from "../firebase/ArticlesUploader";
import CommunityList from "../firebase/CommunityList";
import EventList from "../firebase/EventList";
import ArticlesList from "../firebase/ArticlesList";
import NotasUploader from "../firebase/NotasUploader";
import NotasList from "../firebase/NotasList";
import HighlightsOrder from "../firebase/HighlightsOrder";

export default function Home() {
  const [activeSection, setActiveSection] = useState("community");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const previousUserRef = useRef(null);

  useEffect(() => {
    console.log("Checking authentication...");
  
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("User Status:", currentUser);
      const previousUser = previousUserRef.current;
      previousUserRef.current = currentUser;
      setUser(currentUser);
      
      // Log login when user changes from null to authenticated
      if (currentUser && !previousUser) {
        await logLogin();
      }
      // Log logout when user changes from authenticated to null
      if (!currentUser && previousUser) {
        await logLogout();
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  const handleLogin = async () => {
    setError(""); // Clear previous errorsL
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login logging is handled in onAuthStateChanged
    } catch (error) {
      setError("Correo electrónico o contraseña inválidos.");
    }
  };

  const handleLogout = async () => {
    await logLogout();
    await signOut(auth);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (!user) {
    return (
      <div className={styles.loginContainer}> {/* Add CSS Module class */}
        <h2 className={styles.loginTitle}>Hola. <br></br> Inicia sesión para acceder al panel de administración.</h2>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formGroup}>
        <p className={styles.helpText}>Correo electrónico</p>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            className={styles.input}
          />
          <p className={styles.helpText}>Contraseña</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
            className={styles.input}
          />
          <p className={styles.helpText}>¿Olvidaste tu contraseña? Contacta al administrador.</p>
          <button onClick={handleLogin} className={styles.loginButton}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: "1500px", paddingTop: "10rem" }}>
        {/* Logout Button */}
        {/* <button onClick={handleLogout} style={{ position: "absolute", top: 20, right: 20 }}>
          Logout
        </button> */}

        {/* Navigation Buttons */}
        <button onClick={handleLogout} className={styles.logoutButton}>
          Cerrar sesión
        </button>
        <div style={{ margin: "auto" }}>
          <p className={styles.title}> ¿En qué estás trabajando?</p>
        </div>
        <div className={styles.navContainer}>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("community")} className={styles.navButton}>COMUNIDAD</button>
            <button onClick={() => setActiveSection("artistsList")} className={styles.navButton}>Lista de Comunidad</button>
          </div>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("events")} className={styles.navButton}>EVENTOS</button>
            <button onClick={() => setActiveSection("eventsList")} className={styles.navButton}>Lista de Eventos</button>
            <button onClick={() => setActiveSection("highlightsOrder")} className={styles.navButton}>Destacados</button>
          </div>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("features")} className={styles.navButton}>NOTAS</button>
            <button onClick={() => setActiveSection("articlesList")} className={styles.navButton}>Lista de Notas</button>
          </div>
        </div>

        {/* Events Section */}
        {activeSection === "events" && (
          <div id="events" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <p className={styles.title}>EVENTOS</p>
            <EventUploader />
          </div>
        )}

        {/* Articles Section -> Notas Section */}
        {activeSection === "features" && (
          <div id="features" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <p className={styles.title}>NOTAS</p>
            <NotasUploader />
          </div>
        )}

        {/* Community Members List Section */}
        {activeSection === "artistsList" && (
          <div id="community-list" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <p className={styles.title}>LISTA DE LA COMUNIDAD</p>
            <CommunityList />
          </div>
        )}

        {/* Events List Section */}
        {activeSection === "eventsList" && (
          <div id="events-list" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <p className={styles.title}>LISTA DE EVENTOS</p>
            <EventList />
          </div>
        )}

        {/* Highlights Order Section */}
        {activeSection === "highlightsOrder" && (
          <div id="highlights-order" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <HighlightsOrder />
          </div>
        )}

        {/* Community Section */}
        {activeSection === "community" && (
          <div id="community" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <p className={styles.title}>COMUNIDAD</p>
            <ComunidadUploader />
          </div>
        )}

        {/* Articles List Section -> Notas List Section */}
        {activeSection === "articlesList" && (
          <div id="articles-list" style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <p className={styles.title}>LISTA DE NOTAS</p>
            <NotasList />
          </div>
        )}

      </main>
    </div>
  );
}
