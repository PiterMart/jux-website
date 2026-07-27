"use client";
import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseAuth";
import { logLogin, logLogout } from "../firebase/activityLogger";
import styles from "../../styles/uploader.module.css";
import EquipoUploader from "../firebase/EquipoUploader";
import EquipoList from "../firebase/EquipoList";
import ArtistUploader from "../firebase/ArtistUploader";
import ArtistList from "../firebase/ArtistList";
import ArtworkUploader from "../firebase/ArtworkUploader";
import ArtworkList from "../firebase/ArtworkList";
import ExhibitionUploader from "../firebase/ExhibitionUploader";
import ExhibitionList from "../firebase/ExhibitionList";

export default function Home() {
  const [activeSection, setActiveSection] = useState("exhibitions");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const previousUserRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const previousUser = previousUserRef.current;
      previousUserRef.current = currentUser;
      setUser(currentUser);

      if (currentUser && !previousUser) {
        await logLogin();
      }
      if (!currentUser && previousUser) {
        await logLogout();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
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
      <div className={styles.loginContainer}>
        <h2 className={styles.loginTitle}>Panel de Administración <br /> Galería de Arte</h2>
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
          <button onClick={handleLogin} className={styles.loginButton}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ maxWidth: "1500px", paddingTop: "6rem" }}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Cerrar sesión
        </button>

        <div style={{ margin: "auto", textAlign: "center", marginBottom: "1rem" }}>
          <p className={styles.title}>Panel de Administración de la Galería</p>
        </div>

        <div className={styles.navContainer} style={{ justifyContent: "center", gap: "1.5rem" }}>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("exhibitions")} className={styles.navButton}>EXHIBICIONES</button>
            <button onClick={() => setActiveSection("exhibitionsList")} className={styles.navButton}>Lista Exhibiciones</button>
          </div>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("artworks")} className={styles.navButton}>OBRAS</button>
            <button onClick={() => setActiveSection("artworksList")} className={styles.navButton}>Lista Obras</button>
          </div>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("artists")} className={styles.navButton}>ARTISTAS</button>
            <button onClick={() => setActiveSection("artistsList")} className={styles.navButton}>Lista Artistas</button>
          </div>
          <div className={styles.navGroup}>
            <button onClick={() => setActiveSection("equipo")} className={styles.navButton}>EQUIPO</button>
            <button onClick={() => setActiveSection("equipoList")} className={styles.navButton}>Lista Equipo</button>
          </div>
        </div>

        {/* EXHIBICIONES */}
        {activeSection === "exhibitions" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <ExhibitionUploader />
          </div>
        )}
        {activeSection === "exhibitionsList" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <ExhibitionList />
          </div>
        )}

        {/* OBRAS */}
        {activeSection === "artworks" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <ArtworkUploader />
          </div>
        )}
        {activeSection === "artworksList" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <ArtworkList />
          </div>
        )}

        {/* ARTISTAS */}
        {activeSection === "artists" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <ArtistUploader />
          </div>
        )}
        {activeSection === "artistsList" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <ArtistList />
          </div>
        )}

        {/* EQUIPO */}
        {activeSection === "equipo" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <EquipoUploader />
          </div>
        )}
        {activeSection === "equipoList" && (
          <div style={{ width: "100%", padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
            <EquipoList />
          </div>
        )}
      </main>
    </div>
  );
}
