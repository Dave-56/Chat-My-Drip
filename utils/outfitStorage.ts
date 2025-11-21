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
 * Auto-assign outfit to collections based on vibe and score
 * NOTE: This function must be called after addOutfitToCollection and createCollection are defined
 */
const autoAssignToCollections = (outfitId: string, analysis: AnalysisResult): void => {
  const collections = getCollections();
  const collectionsToAdd: string[] = [];

  // Auto-assign based on score (Fire Fits for 8+)
  if (analysis.score >= 8) {
    const fireCollection = collections.find(c => c.id === 'default_fire' || c.name.toLowerCase().includes('fire'));
    if (fireCollection) {
      collectionsToAdd.push(fireCollection.id);
    }
  }

  // Auto-assign based on vibe keywords
  const vibeLower = analysis.vibe.toLowerCase();
  
  // Work-related vibes
  if (vibeLower.includes('work') || vibeLower.includes('business') || vibeLower.includes('office') || 
      vibeLower.includes('professional') || vibeLower.includes('corporate')) {
    const workCollection = collections.find(c => c.id === 'default_work' || c.name.toLowerCase().includes('work'));
    if (workCollection) {
      collectionsToAdd.push(workCollection.id);
    }
  }
  
  // Casual vibes
  if (vibeLower.includes('casual') || vibeLower.includes('everyday') || vibeLower.includes('street') ||
      vibeLower.includes('comfy') || vibeLower.includes('chill')) {
    const casualCollection = collections.find(c => c.id === 'default_casual' || c.name.toLowerCase().includes('casual'));
    if (casualCollection) {
      collectionsToAdd.push(casualCollection.id);
    }
  }
  
  // Date night vibes
  if (vibeLower.includes('date') || vibeLower.includes('romantic') || vibeLower.includes('dinner') ||
      vibeLower.includes('evening') || vibeLower.includes('night')) {
    const dateCollection = collections.find(c => c.id === 'default_date' || c.name.toLowerCase().includes('date'));
    if (dateCollection) {
      collectionsToAdd.push(dateCollection.id);
    }
  }
  
  // Going out vibes
  if (vibeLower.includes('going out') || vibeLower.includes('party') || vibeLower.includes('club') ||
      vibeLower.includes('night out') || vibeLower.includes('out')) {
    const goingOutCollection = collections.find(c => c.id === 'default_going_out' || c.name.toLowerCase().includes('going'));
    if (goingOutCollection) {
      collectionsToAdd.push(goingOutCollection.id);
    }
  }
  
  // Formal vibes
  if (vibeLower.includes('formal') || vibeLower.includes('elegant') || vibeLower.includes('luxury') ||
      vibeLower.includes('sophisticated') || vibeLower.includes('dress')) {
    const formalCollection = collections.find(c => c.id === 'default_formal' || c.name.toLowerCase().includes('formal'));
    if (formalCollection) {
      collectionsToAdd.push(formalCollection.id);
    }
  }

  // If vibe doesn't match any collection, create a new one based on vibe name
  const existingVibeCollection = collections.find(c => 
    c.name.toLowerCase() === analysis.vibe.toLowerCase() ||
    c.name.toLowerCase().includes(analysis.vibe.toLowerCase())
  );

  if (!existingVibeCollection && analysis.vibe && analysis.vibe.trim()) {
    // Manually create collection (to avoid forward reference issues)
    const collections = getCollections();
    const newCollection: Collection = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: analysis.vibe,
      color: '#CB6CE6',
      createdAt: Date.now(),
      outfitIds: [],
    };
    collections.push(newCollection);
    saveCollections(collections);
    collectionsToAdd.push(newCollection.id);
  } else if (existingVibeCollection) {
    collectionsToAdd.push(existingVibeCollection.id);
  }

  // Add outfit to all matched collections (manually to avoid forward reference)
  collectionsToAdd.forEach(collectionId => {
    try {
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
    } catch (e) {
      console.warn('Could not add outfit to collection:', collectionId);
    }
  });
};

/**
 * Save an outfit to LocalStorage with image compression and auto-assign to collections
 */
export const saveOutfit = async (image: UploadedImage, analysis: AnalysisResult, name?: string): Promise<SavedOutfit> => {
  try {
    // Ensure default collections exist
    getCollections();

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
      
      // Auto-assign to collections based on vibe and score (after save succeeds)
      autoAssignToCollections(outfit.id, analysis);
      
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        // Storage full - remove more old items and try again
        while (saved.length > 3) {
          saved.pop();
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
          // Try auto-assignment even if storage is tight
          try {
            autoAssignToCollections(outfit.id, analysis);
          } catch (e) {
            // Ignore collection assignment errors if storage is full
          }
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
 * Initialize default collections
 */
const initializeDefaultCollections = (): Collection[] => {
  const defaultCollections: Collection[] = [
    { id: 'default_work', name: 'Work', color: '#4A90E2', createdAt: Date.now(), outfitIds: [] },
    { id: 'default_casual', name: 'Casual', color: '#50C878', createdAt: Date.now(), outfitIds: [] },
    { id: 'default_date', name: 'Date Night', color: '#CB6CE6', createdAt: Date.now(), outfitIds: [] },
    { id: 'default_going_out', name: 'Going Out', color: '#FF6B6B', createdAt: Date.now(), outfitIds: [] },
    { id: 'default_formal', name: 'Formal', color: '#FFD700', createdAt: Date.now(), outfitIds: [] },
    { id: 'default_fire', name: 'Fire Fits 🔥', color: '#FF4500', createdAt: Date.now(), outfitIds: [] }, // For 8+ scores
  ];
  saveCollections(defaultCollections);
  return defaultCollections;
};

/**
 * Get all collections from LocalStorage, initialize defaults if empty
 */
export const getCollections = (): Collection[] => {
  try {
    const stored = localStorage.getItem(COLLECTIONS_KEY);
    if (!stored) {
      return initializeDefaultCollections();
    }
    const collections = JSON.parse(stored) as Collection[];
    // If collections exist but no defaults, ensure defaults exist
    if (collections.length === 0) {
      return initializeDefaultCollections();
    }
    return collections;
  } catch (error) {
    console.error('Error loading collections:', error);
    return initializeDefaultCollections();
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

