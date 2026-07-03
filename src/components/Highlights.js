"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import styles from "../styles/Highlights.module.css";
import { firestore } from "../app/firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { FALLBACK_IMAGE, getFirstDateAndTime, formatDate } from "../lib/eventUtils";
import { TransitionLink } from "./TransitionLink";

function CarouselImage({ event, className }) {
  const [aspectRatio, setAspectRatio] = useState(3 / 4); // Default fallback

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  return (
    <TransitionLink 
      href={`/evento/${event.slug}`} 
      className={className}
      style={{ '--aspect-ratio': aspectRatio }}
    >
      <Image
        src={event.imageUrl}
        alt={`Evento destacado: ${event.title} - Nos Envera`}
        className={styles.carouselImage}
        fill
        sizes="(max-width: 768px) 85vw, 400px"
        onLoad={handleLoad}
      />
      <div className={styles.carouselOverlay}>
        <span className={styles.carouselItemTitle}>
          {event.title}
          {event.formattedDate && <span className={styles.carouselItemDate}> - {event.formattedDate}</span>}
        </span>
      </div>
    </TransitionLink>
  );
}

export default function Highlights() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(firestore, "events"));
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter events where isFeatured is true (handle booleans and strings)
        const filtered = documents.filter(doc => 
          doc.isFeatured === true || 
          doc.isFeatured === "true" || 
          String(doc.isFeatured).toLowerCase() === "true"
        );

        const processed = filtered.map(eventDoc => {
          // Robust image selection: try banner, flyer, then gallery
          let imageUrl = FALLBACK_IMAGE;
          if (eventDoc.banner && typeof eventDoc.banner === 'string') imageUrl = eventDoc.banner;
          else if (eventDoc.flyer && typeof eventDoc.flyer === 'string') imageUrl = eventDoc.flyer;
          else if (eventDoc.gallery?.[0]?.url) imageUrl = eventDoc.gallery[0].url;
          
          const slug = eventDoc.slug || eventDoc.id;
          const title = eventDoc.name || eventDoc.title || "Evento";

          let formattedDate = null;
          try {
            const { date } = getFirstDateAndTime(eventDoc);
            if (date) {
              formattedDate = date.getFullYear();
            }
          } catch (e) {
            // Silently fail for dates
          }

          return {
            id: eventDoc.id,
            title,
            slug,
            imageUrl,
            formattedDate,
            featuredOrder: typeof eventDoc.featuredOrder === "number" ? eventDoc.featuredOrder : Infinity,
          };
        });

        // Sort by featuredOrder ascending, then by title alphabetically
        processed.sort((a, b) => {
          if (a.featuredOrder !== b.featuredOrder) {
            return a.featuredOrder - b.featuredOrder;
          }
          return a.title.localeCompare(b.title);
        });

        setFeaturedEvents(processed);
      } catch (err) {
        console.error("Error fetching featured events", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  const trackRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const animationRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const accumulatedScroll = useRef(0);
  const isRewinding = useRef(false);
  
  // Optimized continuous slow scroll
  useEffect(() => {
    if (featuredEvents.length === 0 || isHovering) {
      cancelAnimationFrame(animationRef.current);
      return;
    }

    const scrollSpeed = 0.35; // Pixels per frame. Adjust for slower/faster.

    const playScroll = () => {
      if (!trackRef.current) return;
      
      const track = trackRef.current;
      const { scrollWidth, clientWidth } = track;
      
      if (isRewinding.current) {
        // Wait until it smoothly scrolls back near the beginning
        if (track.scrollLeft <= 10) {
          isRewinding.current = false;
          accumulatedScroll.current = track.scrollLeft;
        }
        animationRef.current = requestAnimationFrame(playScroll);
        return;
      }

      // Update our high-precision accumulator
      accumulatedScroll.current += scrollSpeed;
      
      // Sync accumulator if user manually swiped/scrolled
      if (Math.abs(accumulatedScroll.current - track.scrollLeft) > 5) {
        accumulatedScroll.current = track.scrollLeft;
      }
      
      // Apply the scroll
      track.scrollLeft = accumulatedScroll.current;
      
      // Loop back to start smoothly if at the end
      if (track.scrollLeft + clientWidth >= scrollWidth - 1) {
        isRewinding.current = true;
        track.scrollTo({ left: 0, behavior: 'smooth' });
      }

      animationRef.current = requestAnimationFrame(playScroll);
    };

    animationRef.current = requestAnimationFrame(playScroll);

    return () => cancelAnimationFrame(animationRef.current);
  }, [featuredEvents, isHovering]);

  const handleMouseMove = (e) => {
    // Desktop only
    if (window.innerWidth <= 768) return; 

    const element = e.currentTarget;
    const { left, width } = element.getBoundingClientRect();
    const x = e.clientX - left;
    
    // Hover zones: 15% from left or right edge
    const edgePercentage = 0.15;
    const scrollSpeed = 5;
    
    clearInterval(scrollIntervalRef.current);
    
    if (x < width * edgePercentage) {
      // Hovering left edge
      scrollIntervalRef.current = setInterval(() => {
        if (trackRef.current) trackRef.current.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
      }, 16);
    } else if (x > width * (1 - edgePercentage)) {
      // Hovering right edge
      scrollIntervalRef.current = setInterval(() => {
        if (trackRef.current) trackRef.current.scrollBy({ left: scrollSpeed, behavior: 'auto' });
      }, 16);
    }
  };

  const handleMouseLeave = () => {
    clearInterval(scrollIntervalRef.current);
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  if (loading) {
    return null;
  }

  if (featuredEvents.length === 0) {
    return null;
  }

  return (
    <div 
      className={styles.carouselContainer}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* <h2 className={styles.carouselTitle}>Highlights</h2> */}
      <div className={styles.carouselTrack} ref={trackRef}>
        {featuredEvents.map(event => (
          <CarouselImage key={event.id} event={event} className={styles.carouselItem} />
        ))}
      </div>
    </div>
  );
}
