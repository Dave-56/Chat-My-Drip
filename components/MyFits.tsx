import React, { useState, useRef } from 'react';
import { ArrowLeft, BarChart3, Trash2 } from 'lucide-react';
import { 
  getSavedOutfits, 
  deleteOutfit
} from '../utils/supabaseStorage';
import { SavedOutfit } from '../types';
import { StatsDashboard } from './StatsDashboard';
import { SwipeableOutfitCard } from './SwipeableOutfitCard';
import { MyFitsSkeleton } from './LoadingSkeleton';

interface MyFitsProps {
  onBack: () => void;
  onViewOutfit: (outfitId: string) => void;
}

type ViewMode = 'fits' | 'stats';

export const MyFits: React.FC<MyFitsProps> = ({ onBack, onViewOutfit }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('fits');
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadOutfits();
  }, []);

  const loadOutfits = async () => {
    setLoading(true);
    try {
      const loadedOutfits = await getSavedOutfits();
      setOutfits(loadedOutfits);
    } catch (error) {
      console.error('Error loading outfits:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadOutfits();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOutfit(id);
      await refreshData();
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  // Pinterest-style masonry layout helper
  const createMasonryLayout = (items: SavedOutfit[], columns: number = 2) => {
    const columnsArray: SavedOutfit[][] = Array.from({ length: columns }, () => []);
    
    items.forEach((item, index) => {
      const columnIndex = index % columns;
      columnsArray[columnIndex].push(item);
    });
    
    return columnsArray;
  };

  const masonryColumns = createMasonryLayout(outfits, 2);


  return (
    <div className="flex flex-col h-full w-full animate-slide-up overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 h-[72px] bg-drip-dark border-b-2 border-white/50 flex items-center gap-3 px-4">
        <button 
          onClick={onBack} 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black border-2 border-black rounded-full active:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span className="font-display font-bold text-xs uppercase">Back</span>
        </button>
        <h2 className="font-display font-bold text-white text-lg">
          {viewMode === 'stats' ? 'STATS' : 'MY FITS'}
        </h2>
        {viewMode === 'fits' && (
          <span className="ml-auto text-gray-400 text-sm">{outfits.length} saved</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 bg-drip-dark border-b border-drip-gray">
        <button
          onClick={() => setViewMode('fits')}
          className={`px-4 py-2 rounded-full font-display font-bold text-sm transition-colors ${
            viewMode === 'fits' 
              ? 'bg-drip-accent text-white' 
              : 'bg-drip-gray text-gray-400'
          }`}
        >
          MY FITS
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`px-4 py-2 rounded-full font-display font-bold text-sm transition-colors ${
            viewMode === 'stats' 
              ? 'bg-drip-accent text-white' 
              : 'bg-drip-gray text-gray-400'
          }`}
        >
          <BarChart3 size={16} className="inline mr-1" />
          STATS
        </button>
      </div>

      {/* Stats View */}
      {viewMode === 'stats' && (
        <StatsDashboard />
      )}

      {/* Fits View - Only show in fits mode */}
      {viewMode === 'fits' && (
        <>
      {/* Loading State */}
      {loading ? (
        <MyFitsSkeleton />
      ) : (
        <>
      {/* Empty State */}
      {outfits.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">
            NO FITS SAVED
          </h3>
          <p className="text-gray-400">
            Save your outfits to see them here!
          </p>
        </div>
      )}

      {/* Pinterest-style Masonry Grid */}
      {outfits.length > 0 && (
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4">
            {masonryColumns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4">
                {column.map((outfit) => (
                  <SwipeableOutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    onView={() => onViewOutfit(outfit.id)}
                    onDelete={() => handleDelete(outfit.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
        </>
      )}
    </div>
  );
};
