import { firestore } from "./firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

/**
 * Syncs multi-directional references when an Exhibition is saved or updated.
 * - Updates Artists with linked exhibition info.
 * - Updates Artworks with linked exhibition info.
 */
export async function syncExhibitionRelations(exhibitionId, exhibitionTitle, artistIds = [], artworkIds = []) {
  try {
    const exhibitionRefInfo = { id: exhibitionId, title: exhibitionTitle };

    // 1. Sync Artists
    for (const artistId of artistIds) {
      if (!artistId) continue;
      const artistRef = doc(firestore, "artists", artistId);
      const artistSnap = await getDoc(artistRef);
      if (artistSnap.exists()) {
        const existingExhibitions = artistSnap.data().exhibitions || [];
        const alreadyLinked = existingExhibitions.some((ex) => ex.id === exhibitionId);
        if (!alreadyLinked) {
          await updateDoc(artistRef, {
            exhibitions: arrayUnion(exhibitionRefInfo),
          });
        }
      }
    }

    // 2. Sync Artworks
    for (const artworkId of artworkIds) {
      if (!artworkId) continue;
      const artworkRef = doc(firestore, "artworks", artworkId);
      const artworkSnap = await getDoc(artworkRef);
      if (artworkSnap.exists()) {
        await updateDoc(artworkRef, {
          exhibitionId: exhibitionId,
          exhibitionTitle: exhibitionTitle,
        });
      }
    }
  } catch (error) {
    console.error("Error in syncExhibitionRelations:", error);
  }
}

/**
 * Syncs multi-directional references when an Artwork is saved or updated.
 * - Updates Artist with linked artwork info.
 * - Updates Exhibition with linked artwork info.
 */
export async function syncArtworkRelations(artworkId, artworkData) {
  try {
    const { title, artistId, artistName, exhibitionId, coverImage } = artworkData;
    const artworkRefInfo = { id: artworkId, title: title || "", image: coverImage || "" };

    // 1. Sync Artist
    if (artistId) {
      const artistRef = doc(firestore, "artists", artistId);
      const artistSnap = await getDoc(artistRef);
      if (artistSnap.exists()) {
        const existingArtworks = artistSnap.data().artworks || [];
        const alreadyLinked = existingArtworks.some((art) => art.id === artworkId);
        if (!alreadyLinked) {
          await updateDoc(artistRef, {
            artworks: arrayUnion(artworkRefInfo),
          });
        }
      }
    }

    // 2. Sync Exhibition
    if (exhibitionId) {
      const exhibitionRef = doc(firestore, "exhibitions", exhibitionId);
      const exSnap = await getDoc(exhibitionRef);
      if (exSnap.exists()) {
        const existingArtworks = exSnap.data().artworks || [];
        const alreadyLinked = existingArtworks.some((art) => art.id === artworkId);
        if (!alreadyLinked) {
          await updateDoc(exhibitionRef, {
            artworks: arrayUnion({ ...artworkRefInfo, artistName: artistName || "" }),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in syncArtworkRelations:", error);
  }
}
