import { SavedOutfit, UploadedImage, AnalysisResult, Collection } from '../types';

const STORAGE_KEY = 'chatmydrip_saved_outfits';
const COLLECTIONS_KEY = 'chatmydrip_collections';
const MAX_SAVED_OUTFITS = 10; // Limit to prevent quota issues

/**
 * Compress image by reducing dimensions and quality
 */
const compressImage = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Reduce to max 800px on longest side
      let width = img.width;
      let height = img.height;
      const maxDimension = 800;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress with quality 0.75
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Save an outfit to LocalStorage with image compression
 */
export const saveOutfit = async (image: UploadedImage, analysis: AnalysisResult, name?: string): Promise<SavedOutfit> => {
  try {
    // Compress the image before saving
    const compressedPreviewUrl = await compressImage(image.previewUrl);

    // Create optimized image object - don't store full base64 for saved outfits
    const optimizedImage: UploadedImage = {
      base64: '', // Not needed for saved outfits (we already have analysis)
      previewUrl: compressedPreviewUrl,
      mimeType: image.mimeType,
    };

    const outfit: SavedOutfit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      image: optimizedImage,
      analysis,
      savedAt: Date.now(),
      name,
    };

    const saved = getSavedOutfits();
    saved.unshift(outfit);
    
    // Keep only the most recent N outfits (remove oldest if over limit)
    if (saved.length > MAX_SAVED_OUTFITS) {
      saved.splice(MAX_SAVED_OUTFITS);
    }

    // Try to save, handle quota errors
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        // Storage full - remove more old items and try again
        while (saved.length > 3) {
          saved.pop();
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch (e) {
          // Still failing - clear and save just this one
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([outfit]));
        }
        throw new Error('Storage almost full. Removed older outfits.');
      }
      throw error;
    }
    
    return outfit;
  } catch (error: any) {
    console.error('Error saving outfit:', error);
    throw error;
  }
};

/**
 * Get all saved outfits from LocalStorage
 */
export const getSavedOutfits = (): SavedOutfit[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedOutfit[];
  } catch (error) {
    console.error('Error loading saved outfits:', error);
    return [];
  }
};

/**
 * Get a specific outfit by ID
 */
export const getSavedOutfit = (id: string): SavedOutfit | null => {
  const outfits = getSavedOutfits();
  return outfits.find(outfit => outfit.id === id) || null;
};

/**
 * Delete an outfit by ID
 */
export const deleteOutfit = (id: string): void => {
  const outfits = getSavedOutfits();
  const filtered = outfits.filter(outfit => outfit.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * Check if an outfit is already saved (by comparing preview URL)
 */
export const isOutfitSaved = (imagePreviewUrl: string): boolean => {
  const outfits = getSavedOutfits();
  // Compare preview URLs (they should be similar even after compression)
  return outfits.some(outfit => {
    // Check if the preview URLs are similar (account for compression differences)
    const savedUrl = outfit.image.previewUrl;
    const newUrl = imagePreviewUrl;
    // Simple comparison - if they're very similar in length and start, likely same image
    return savedUrl.substring(0, 100) === newUrl.substring(0, 100);
  });
};

/**
 * Get the production URL (Vercel) or current origin
 */
const getProductionUrl = (): string => {
  // Use production Vercel URL for sharing
  const prodUrl = 'https://chatmydrip.vercel.app';
  // If we're already on production, use current origin
  if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('chatmydrip')) {
    return window.location.origin;
  }
  return prodUrl;
};

/**
 * Generate a shareable link for an outfit
 * For LocalStorage, we'll encode the outfit ID in the URL
 */
export const getShareableLink = (outfitId: string): string => {
  return `${getProductionUrl()}#/fit/${outfitId}`;
};

// ========== COLLECTIONS ==========

/**
 * Get all collections from LocalStorage
 */
export const getCollections = (): Collection[] => {
  try {
    const stored = localStorage.getItem(COLLECTIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Collection[];
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
};

/**
 * Save collections to LocalStorage
 */
const saveCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage full - cannot save collections');
    }
    throw error;
  }
};

/**
 * Create a new collection
 */
export const createCollection = (name: string, color?: string): Collection => {
  const collection: Collection = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    color,
    createdAt: Date.now(),
    outfitIds: [],
  };

  const collections = getCollections();
  collections.push(collection);
  saveCollections(collections);
  
  return collection;
};

/**
 * Update a collection
 */
export const updateCollection = (collectionId: string, updates: Partial<Collection>): void => {
  const collections = getCollections();
  const index = collections.findIndex(c => c.id === collectionId);
  if (index !== -1) {
    collections[index] = { ...collections[index], ...updates };
    saveCollections(collections);
  }
};

/**
 * Delete a collection
 */
export const deleteCollection = (collectionId: string): void => {
  const collections = getCollections();
  const filtered = collections.filter(c => c.id !== collectionId);
  saveCollections(filtered);

  // Remove collection IDs from outfits
  const outfits = getSavedOutfits();
  outfits.forEach(outfit => {
    if (outfit.collectionIds?.includes(collectionId)) {
      outfit.collectionIds = outfit.collectionIds.filter(id => id !== collectionId);
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
};

/**
 * Add outfit to collection
 */
export const addOutfitToCollection = (outfitId: string, collectionId: string): void => {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection && !collection.outfitIds.includes(outfitId)) {
    collection.outfitIds.push(outfitId);
    saveCollections(collections);
  }

  // Update outfit's collectionIds
  const outfits = getSavedOutfits();
  const outfit = outfits.find(o => o.id === outfitId);
  if (outfit) {
    if (!outfit.collectionIds) {
      outfit.collectionIds = [];
    }
    if (!outfit.collectionIds.includes(collectionId)) {
      outfit.collectionIds.push(collectionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
    }
  }
};

/**
 * Remove outfit from collection
 */
export const removeOutfitFromCollection = (outfitId: string, collectionId: string): void => {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection) {
    collection.outfitIds = collection.outfitIds.filter(id => id !== outfitId);
    saveCollections(collections);
  }

  // Update outfit's collectionIds
  const outfits = getSavedOutfits();
  const outfit = outfits.find(o => o.id === outfitId);
  if (outfit && outfit.collectionIds) {
    outfit.collectionIds = outfit.collectionIds.filter(id => id !== collectionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
  }
};

/**
 * Get outfits in a collection
 */
export const getOutfitsInCollection = (collectionId: string): SavedOutfit[] => {
  const collection = getCollections().find(c => c.id === collectionId);
  if (!collection) return [];
  
  const allOutfits = getSavedOutfits();
  return allOutfits.filter(outfit => collection.outfitIds.includes(outfit.id));
};

