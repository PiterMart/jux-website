"use client";
import { useEffect, useMemo, useState } from "react";
import { firestore } from "./firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import styles from "../../styles/uploader.module.css";

const DEFAULT_ROLE_LABEL = "Sin rol";

const getMemberRoles = (member) => {
  if (Array.isArray(member.roles)) {
    return member.roles.map((role) => String(role).trim()).filter(Boolean);
  }
  if (Array.isArray(member.role)) {
    return member.role.map((role) => String(role).trim()).filter(Boolean);
  }
  if (member.role) {
    return [String(member.role).trim()];
  }
  if (typeof member.primaryRole === "string" && member.primaryRole.trim()) {
    return [member.primaryRole.trim()];
  }
  return [];
};

const getPrimaryRole = (member) => {
  const roles = getMemberRoles(member);
  return roles.length > 0 ? roles[0] : DEFAULT_ROLE_LABEL;
};

export default function CommunityList() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortMode, setSortMode] = useState("role-asc");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const membersSnapshot = await getDocs(collection(firestore, "members"));
        const membersData = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMembers(membersData);
      } catch (fetchError) {
        console.error("Error fetching community members:", fetchError);
        setError("No se pudo cargar la lista de la comunidad.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const availableRoles = useMemo(() => {
    const roleSet = new Set();
    members.forEach((member) => {
      const roles = getMemberRoles(member);
      if (roles.length === 0) {
        roleSet.add(DEFAULT_ROLE_LABEL);
      } else {
        roles.forEach((role) => roleSet.add(role));
      }
    });
    return Array.from(roleSet).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((member) => {
        const roles = getMemberRoles(member);
        const normalizedFilter = roleFilter === DEFAULT_ROLE_LABEL ? "" : roleFilter;
        if (normalizedFilter === "") {
          return roles.length === 0;
        }
        return roles.includes(normalizedFilter);
      });
    }

    // Filter by search query (names only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((member) => {
        const name = (member.name || member.fullName || member.displayName || "").toLowerCase();
        return name.includes(query);
      });
    }

    return filtered;
  }, [members, roleFilter, searchQuery]);

  const sortedMembers = useMemo(() => {
    const comparator = (a, b) => {
      const roleComparison =
        getPrimaryRole(a).localeCompare(getPrimaryRole(b), undefined, { sensitivity: "base" });
      const nameA = String(a.name || a.fullName || a.displayName || "").toLowerCase();
      const nameB = String(b.name || b.fullName || b.displayName || "").toLowerCase();
      const nameComparison = nameA.localeCompare(nameB);

      if (sortMode === "role-asc") {
        return roleComparison || nameComparison;
      }
      if (sortMode === "role-desc") {
        return roleComparison * -1 || nameComparison;
      }
      return nameComparison || roleComparison;
    };

    return [...filteredMembers].sort(comparator);
  }, [filteredMembers, sortMode]);

  if (isLoading) {
    return (
      <div className={styles.form}>
        <p>Cargando miembros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.form}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className={styles.title} style={{ margin: 0 }}>
          Comunidad ({sortedMembers.length})
        </h2>
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p className={styles.subtitle} style={{ marginBottom: "0.25rem" }}>Buscar</p>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.input}
              style={{ minWidth: "250px" }}
            />
          </div>
          <div>
            <p className={styles.subtitle} style={{ marginBottom: "0.25rem" }}>Filtrar por rol</p>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.input}
            >
              <option value="all">Todos los roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={styles.subtitle} style={{ marginBottom: "0.25rem" }}>Ordenar por</p>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className={styles.input}
            >
              <option value="role-asc">Rol (A → Z)</option>
              <option value="role-desc">Rol (Z → A)</option>
              <option value="name">Nombre (A → Z)</option>
            </select>
          </div>
        </div>
      </div>

      {sortedMembers.length === 0 ? (
        <p>No se encontraron miembros.</p>
      ) : (
        <div className={styles.artistsList}>
          {sortedMembers.map((member) => {
            const roles = getMemberRoles(member);
            const displayRoles = roles.length > 0 ? roles.join(" • ") : DEFAULT_ROLE_LABEL;
            return (
              <div key={member.id} className={styles.artistCard}>
                <div className={styles.artistHeader}>
                  <div className={styles.artistInfo}>
                    <h3 className={styles.artistName}>
                      {member.name || member.fullName || member.displayName || "Miembro sin nombre"}
                    </h3>
                    <p className={styles.artistId}>ID: {member.id}</p>
                    <p className={styles.artistOrigin}>Rol: {displayRoles}</p>
                    {member.email && <p className={styles.artistOrigin}>Email: {member.email}</p>}
                  </div>
                  {member.profilePicture && (
                    <div className={styles.artistProfilePicture}>
                      <img
                        src={member.profilePicture}
                        alt={`${member.name || member.id} profile`}
                        className={styles.profileImage}
                      />
                    </div>
                  )}
                </div>
                {member.bio && Array.isArray(member.bio) && member.bio.length > 0 && (
                  <div className={styles.artistBio} style={{ marginTop: "1rem" }}>
                    <h4>Bio</h4>
                    {member.bio.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
