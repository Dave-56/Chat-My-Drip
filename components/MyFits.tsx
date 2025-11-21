import React, { useState } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { 
  getSavedOutfits, 
  deleteOutfit
} from '../utils/outfitStorage';
import { SavedOutfit } from '../types';
import { StatsDashboard } from './StatsDashboard';

interface MyFitsProps {
  onBack: () => void;
  onViewOutfit: (outfitId: string) => void;
}

type ViewMode = 'fits' | 'stats';

export const MyFits: React.FC<MyFitsProps> = ({ onBack, onViewOutfit }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('fits');
  const [outfits, setOutfits] = useState<SavedOutfit[]>(getSavedOutfits());

  const refreshData = () => {
    setOutfits(getSavedOutfits());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this outfit?')) {
      deleteOutfit(id);
      refreshData();
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
                  <div
                    key={outfit.id}
                    onClick={() => onViewOutfit(outfit.id)}
                    className="relative bg-drip-dark rounded-xl overflow-hidden border border-drip-gray cursor-pointer group hover:border-drip-accent transition-all hover:scale-[1.02]"
                  >
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={outfit.image.previewUrl} 
                        alt="Saved outfit" 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      
                      {/* Score overlay - color coded */}
                      {(() => {
                        const score = outfit.analysis.score;
                        const scoreColor = score >= 8 ? 'text-drip-lime' : score >= 5 ? 'text-drip-accent' : 'text-red-500';
                        const scoreBg = score >= 8 ? 'bg-drip-lime/20 border-drip-lime/50' : score >= 5 ? 'bg-drip-accent/20 border-drip-accent/50' : 'bg-red-500/20 border-red-500/50';
                        return (
                          <div className={`absolute top-2 right-2 ${scoreBg} backdrop-blur-sm px-2.5 py-1 rounded-full border`}>
                            <span className={`${scoreColor} font-display font-bold text-lg`}>{score}</span>
                            <span className="text-white/80 text-xs">/10</span>
                          </div>
                        );
                      })()}

                      {/* Gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3">
                        <p className="text-white font-display font-bold text-sm uppercase line-clamp-1">
                          {outfit.analysis.vibe}
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5">
                          {new Date(outfit.savedAt).toLocaleDateString('en-US', { 
                            month: 'numeric', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
