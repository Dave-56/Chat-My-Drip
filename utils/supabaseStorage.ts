import { SavedOutfit, UploadedImage, AnalysisResult, Collection } from '../types';
import { supabase } from './supabaseClient';

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
 * Get current user ID
 */
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Save an outfit to Supabase
 */
export const saveOutfit = async (image: UploadedImage, analysis: AnalysisResult, name?: string): Promise<SavedOutfit> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be logged in to save outfits');
  }

  try {
    // Compress the image before saving
    const compressedPreviewUrl = await compressImage(image.previewUrl);

    const outfit: SavedOutfit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      image: {
        base64: '', // Not needed for saved outfits
        previewUrl: compressedPreviewUrl,
        mimeType: image.mimeType,
      },
      analysis,
      savedAt: Date.now(),
      name,
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('outfits')
      .insert({
        id: outfit.id,
        user_id: userId,
        image_preview_url: outfit.image.previewUrl,
        mime_type: outfit.image.mimeType,
        analysis: outfit.analysis,
        name: outfit.name,
        saved_at: new Date(outfit.savedAt).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving outfit to Supabase:', error);
      throw error;
    }

    // Auto-assign to collections based on vibe and score
    await autoAssignToCollections(outfit.id, analysis);

    return outfit;
  } catch (error: any) {
    console.error('Error saving outfit:', error);
    throw error;
  }
};

/**
 * Get all saved outfits for current user
 */
export const getSavedOutfits = async (): Promise<SavedOutfit[]> => {
  const userId = await getUserId();
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error loading outfits:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      image: {
        base64: '',
        previewUrl: row.image_preview_url,
        mimeType: row.mime_type,
      },
      analysis: row.analysis,
      savedAt: new Date(row.saved_at).getTime(),
      name: row.name,
      collectionIds: row.collection_ids || [],
    }));
  } catch (error) {
    console.error('Error loading saved outfits:', error);
    return [];
  }
};

/**
 * Get a specific outfit by ID
 */
export const getSavedOutfit = async (id: string): Promise<SavedOutfit | null> => {
  const userId = await getUserId();
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      image: {
        base64: '',
        previewUrl: data.image_preview_url,
        mimeType: data.mime_type,
      },
      analysis: data.analysis,
      savedAt: new Date(data.saved_at).getTime(),
      name: data.name,
      collectionIds: data.collection_ids || [],
    };
  } catch (error) {
    console.error('Error loading outfit:', error);
    return null;
  }
};

/**
 * Delete an outfit by ID
 */
export const deleteOutfit = async (id: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be logged in to delete outfits');
  }

  const { error } = await supabase
    .from('outfits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting outfit:', error);
    throw error;
  }
};

/**
 * Check if an outfit is already saved
 */
export const isOutfitSaved = async (imagePreviewUrl: string): Promise<boolean> => {
  const userId = await getUserId();
  if (!userId) {
    return false;
  }

  try {
    const { data } = await supabase
      .from('outfits')
      .select('id')
      .eq('user_id', userId)
      .eq('image_preview_url', imagePreviewUrl)
      .limit(1);

    return (data?.length || 0) > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Generate a shareable link for an outfit
 */
export const getShareableLink = (outfitId: string): string => {
  const prodUrl = 'https://chatmydrip.vercel.app';
  if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('chatmydrip')) {
    return `${window.location.origin}#/fit/${outfitId}`;
  }
  return `${prodUrl}#/fit/${outfitId}`;
};

// ========== COLLECTIONS ==========

/**
 * Auto-assign outfit to collections based on vibe and score
 */
const autoAssignToCollections = async (outfitId: string, analysis: AnalysisResult): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  const collections = await getCollections();
  const collectionsToAdd: string[] = [];

  // Auto-assign based on score (Fire Fits for 8+)
  // Only if the collection exists (won't auto-create if deleted)
  if (analysis.score >= 8) {
    const fireCollection = collections.find(c => c.id === 'default_fire' || c.name.toLowerCase().includes('fire'));
    if (fireCollection) {
      collectionsToAdd.push(fireCollection.id);
    }
  }

  // Auto-assign based on vibe keywords
  const vibeLower = analysis.vibe.toLowerCase();
  
  if (vibeLower.includes('work') || vibeLower.includes('business') || vibeLower.includes('office') || 
      vibeLower.includes('professional') || vibeLower.includes('corporate')) {
    const workCollection = collections.find(c => c.id === 'default_work' || c.name.toLowerCase().includes('work'));
    if (workCollection) {
      collectionsToAdd.push(workCollection.id);
    }
  }
  
  if (vibeLower.includes('casual') || vibeLower.includes('everyday') || vibeLower.includes('street') ||
      vibeLower.includes('comfy') || vibeLower.includes('chill')) {
    const casualCollection = collections.find(c => c.id === 'default_casual' || c.name.toLowerCase().includes('casual'));
    if (casualCollection) {
      collectionsToAdd.push(casualCollection.id);
    }
  }
  
  if (vibeLower.includes('date') || vibeLower.includes('romantic') || vibeLower.includes('dinner') ||
      vibeLower.includes('evening') || vibeLower.includes('night')) {
    const dateCollection = collections.find(c => c.id === 'default_date' || c.name.toLowerCase().includes('date'));
    if (dateCollection) {
      collectionsToAdd.push(dateCollection.id);
    }
  }
  
  if (vibeLower.includes('going out') || vibeLower.includes('party') || vibeLower.includes('club') ||
      vibeLower.includes('night out') || vibeLower.includes('out')) {
    const goingOutCollection = collections.find(c => c.id === 'default_going_out' || c.name.toLowerCase().includes('going'));
    if (goingOutCollection) {
      collectionsToAdd.push(goingOutCollection.id);
    }
  }
  
  if (vibeLower.includes('formal') || vibeLower.includes('elegant') || vibeLower.includes('luxury') ||
      vibeLower.includes('sophisticated') || vibeLower.includes('dress')) {
    const formalCollection = collections.find(c => c.id === 'default_formal' || c.name.toLowerCase().includes('formal'));
    if (formalCollection) {
      collectionsToAdd.push(formalCollection.id);
    }
  }

  // If vibe doesn't match any collection, create a new one
  const existingVibeCollection = collections.find(c => 
    c.name.toLowerCase() === analysis.vibe.toLowerCase() ||
    c.name.toLowerCase().includes(analysis.vibe.toLowerCase())
  );

  if (!existingVibeCollection && analysis.vibe && analysis.vibe.trim()) {
    const newCollection = await createCollection(analysis.vibe, '#CB6CE6');
    collectionsToAdd.push(newCollection.id);
  } else if (existingVibeCollection) {
    collectionsToAdd.push(existingVibeCollection.id);
  }

  // Add outfit to all matched collections
  for (const collectionId of collectionsToAdd) {
    await addOutfitToCollection(outfitId, collectionId);
  }
};

/**
 * Get all collections for current user
 */
export const getCollections = async (): Promise<Collection[]> => {
  const userId = await getUserId();
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading collections:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at).getTime(),
      outfitIds: row.outfit_ids || [],
    }));
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
};

/**
 * Initialize default collections
 */
const initializeDefaultCollections = async (): Promise<Collection[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  const defaultCollections: Omit<Collection, 'createdAt'>[] = [
    { id: 'default_work', name: 'Work', color: '#4A90E2', outfitIds: [] },
    { id: 'default_casual', name: 'Casual', color: '#50C878', outfitIds: [] },
    { id: 'default_date', name: 'Date Night', color: '#CB6CE6', outfitIds: [] },
    { id: 'default_going_out', name: 'Going Out', color: '#FF6B6B', outfitIds: [] },
    { id: 'default_formal', name: 'Formal', color: '#FFD700', outfitIds: [] },
    { id: 'default_fire', name: 'Fire Fits 🔥', color: '#FF4500', outfitIds: [] },
  ];

  const collectionsToInsert = defaultCollections.map(col => ({
    id: col.id,
    user_id: userId,
    name: col.name,
    color: col.color,
    outfit_ids: [],
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('collections')
    .upsert(collectionsToInsert, { onConflict: 'id,user_id' });

  if (error) {
    console.error('Error initializing default collections:', error);
  }

  return defaultCollections.map(col => ({
    ...col,
    createdAt: Date.now(),
  }));
};

/**
 * Create a new collection
 */
export const createCollection = async (name: string, color?: string): Promise<Collection> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be logged in to create collections');
  }

  const collection: Collection = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    color,
    createdAt: Date.now(),
    outfitIds: [],
  };

  const { error } = await supabase
    .from('collections')
    .insert({
      id: collection.id,
      user_id: userId,
      name: collection.name,
      color: collection.color,
      outfit_ids: [],
      created_at: new Date(collection.createdAt).toISOString(),
    });

  if (error) {
    console.error('Error creating collection:', error);
    throw error;
  }

  return collection;
};

/**
 * Update a collection
 */
export const updateCollection = async (collectionId: string, updates: Partial<Collection>): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be logged in to update collections');
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.outfitIds !== undefined) updateData.outfit_ids = updates.outfitIds;

  const { error } = await supabase
    .from('collections')
    .update(updateData)
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};

/**
 * Delete a collection
 */
export const deleteCollection = async (collectionId: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be logged in to delete collections');
  }

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }

  // Remove collection IDs from outfits
  const { data: outfits } = await supabase
    .from('outfits')
    .select('id, collection_ids')
    .eq('user_id', userId);

  if (outfits) {
    for (const outfit of outfits) {
      if (outfit.collection_ids?.includes(collectionId)) {
        const updatedIds = outfit.collection_ids.filter((id: string) => id !== collectionId);
        await supabase
          .from('outfits')
          .update({ collection_ids: updatedIds })
          .eq('id', outfit.id);
      }
    }
  }
};

/**
 * Add outfit to collection
 */
export const addOutfitToCollection = async (outfitId: string, collectionId: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // Add to collection's outfit_ids
  const { data: collection } = await supabase
    .from('collections')
    .select('outfit_ids')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collection && !collection.outfit_ids?.includes(outfitId)) {
    const updatedIds = [...(collection.outfit_ids || []), outfitId];
    await supabase
      .from('collections')
      .update({ outfit_ids: updatedIds })
      .eq('id', collectionId)
      .eq('user_id', userId);
  }

  // Add to outfit's collection_ids
  const { data: outfit } = await supabase
    .from('outfits')
    .select('collection_ids')
    .eq('id', outfitId)
    .eq('user_id', userId)
    .single();

  if (outfit) {
    const updatedIds = outfit.collection_ids?.includes(collectionId)
      ? outfit.collection_ids
      : [...(outfit.collection_ids || []), collectionId];
    
    await supabase
      .from('outfits')
      .update({ collection_ids: updatedIds })
      .eq('id', outfitId);
  }
};

/**
 * Remove outfit from collection
 */
export const removeOutfitFromCollection = async (outfitId: string, collectionId: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // Remove from collection's outfit_ids
  const { data: collection } = await supabase
    .from('collections')
    .select('outfit_ids')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collection?.outfit_ids) {
    const updatedIds = collection.outfit_ids.filter((id: string) => id !== outfitId);
    await supabase
      .from('collections')
      .update({ outfit_ids: updatedIds })
      .eq('id', collectionId)
      .eq('user_id', userId);
  }

  // Remove from outfit's collection_ids
  const { data: outfit } = await supabase
    .from('outfits')
    .select('collection_ids')
    .eq('id', outfitId)
    .eq('user_id', userId)
    .single();

  if (outfit?.collection_ids) {
    const updatedIds = outfit.collection_ids.filter((id: string) => id !== collectionId);
    await supabase
      .from('outfits')
      .update({ collection_ids: updatedIds })
      .eq('id', outfitId);
  }
};

/**
 * Get outfits in a collection
 */
export const getOutfitsInCollection = async (collectionId: string): Promise<SavedOutfit[]> => {
  const collection = (await getCollections()).find(c => c.id === collectionId);
  if (!collection) return [];
  
  const allOutfits = await getSavedOutfits();
  return allOutfits.filter(outfit => collection.outfitIds.includes(outfit.id));
};

/**
 * Delete user account and all associated data
 * Note: This deletes all user data and signs out the user.
 * The auth user record in Supabase will remain but will have no associated data.
 * To fully delete the auth user, use Supabase dashboard or a server-side function.
 */
export const deleteUserAccount = async (): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be logged in to delete account');
  }

  try {
    // Delete all collections first
    const { error: collectionsError } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', userId);

    if (collectionsError) {
      console.error('Error deleting collections:', collectionsError);
      throw collectionsError;
    }

    // Delete all outfits
    const { error: outfitsError } = await supabase
      .from('outfits')
      .delete()
      .eq('user_id', userId);

    if (outfitsError) {
      console.error('Error deleting outfits:', outfitsError);
      throw outfitsError;
    }

    // Sign out the user (this effectively removes them from the app)
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out:', signOutError);
      // Don't throw - data is already deleted
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

