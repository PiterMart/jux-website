"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import pageStyles from "../../../styles/page.module.css";
import detailStyles from "../../../styles/equipoDetail.module.css";
import Grid from "../../../components/grid";
import BackNavLinks from "../../../components/BackNavLinks";

import {
  normalizeArray,
} from "../../../lib/eventUtils";

const Lightbox = dynamic(() => import("../../../components/Lightbox"), { ssr: false });

export default function TeamMemberClient({ member, memberEvents, memberEventImages }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const roles = useMemo(() => normalizeArray(member?.roles), [member]);
  const bioParagraphs = useMemo(() => normalizeArray(member?.bio), [member]);
  const manifestoParagraphs = useMemo(() => normalizeArray(member?.manifesto), [member]);

  return (
    <>
      <section className={detailStyles.profile}>
        <div className={detailStyles.mediaColumn}>

          <div className={detailStyles.identityCard}>
            <h1 className={detailStyles.name}>{member.name}</h1>
            {member.origin && <p className={detailStyles.origin}>{member.origin}</p>}
            {roles.length > 0 && <p className={detailStyles.roles}>{roles.join(" · ")}</p>}
          </div>
          <div className={detailStyles.imageWrapper}>
            {member.profilePicture ? (
              <Image src={member.profilePicture} alt={`Retrato de ${member.name} - Nos Envera`} className={detailStyles.image} width={400} height={400} sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            ) : (
              <div className={detailStyles.imagePlaceholder} aria-hidden>
                {member.name?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
        </div>

        <div className={detailStyles.infoColumn}>
          {bioParagraphs.length > 0 && (
            <div className={detailStyles.section}>
              <div className={detailStyles.paragraphs}>
                {bioParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {manifestoParagraphs.length > 0 && (
            <div className={detailStyles.section}>
              <h2 className={detailStyles.sectionTitle}>Manifiesto</h2>
              <div className={detailStyles.paragraphs}>
                {manifestoParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {(member.web || member.cvUrl) && (
            <div className={detailStyles.section}>
              <div className={detailStyles.links}>
                {member.web && (
                  <a href={member.web} target="_blank" rel="noopener noreferrer" className={detailStyles.link}>
                    Sitio web
                  </a>
                )}
                {member.cvUrl && (
                  <a href={member.cvUrl} target="_blank" rel="noopener noreferrer" className={detailStyles.link}>
                    Ver CV
                  </a>
                )}
              </div>
            </div>
          )}

          <div className={detailStyles.section}>
            {memberEvents.length === 0 ? (
              <p className={detailStyles.paragraphs}></p>
            ) : (
              <Grid cards={memberEvents} hideImages={true} basePath="/evento" />
            )}
          </div>
        </div>
      </section>

      {memberEventImages.length > 0 && (
        <div className={`${detailStyles.section} ${detailStyles.eventGallerySectionFullWidth}`}>
          <div className={detailStyles.eventGalleryGrid}>
            {memberEventImages.map((img, index) => (
              <figure
                key={`gallery-${index}`}
                style={{
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  cursor: "pointer",
                }}
                onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && (setLightboxIndex(index), setLightboxOpen(true))}
                aria-label={`Ver imagen ${index + 1} en galería`}
              >
                <Image
                  src={img.url}
                  alt={img.alt ? `${img.alt} - Nos Envera` : `Portfolio de ${member.name} - Nos Envera`}
                  width={600}
                  height={600}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "var(--border-radius)",
                  }}
                />
              </figure>
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && memberEventImages.length > 0 && (
        <Lightbox
          isOpen={lightboxOpen}
          slides={memberEventImages.map((img) => ({ src: img.url, alt: img.alt }))}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      <BackNavLinks links={[{ href: "/somos", label: "SOMOS" }, { href: "/comunidad", label: "COMUNIDAD" }]} />
    </>
  );
}
