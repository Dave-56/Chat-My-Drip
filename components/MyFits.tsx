import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, FolderOpen, BarChart3 } from 'lucide-react';
import { 
  getSavedOutfits, 
  deleteOutfit, 
  getCollections, 
  createCollection, 
  deleteCollection,
  addOutfitToCollection,
  removeOutfitFromCollection,
  getOutfitsInCollection
} from '../utils/outfitStorage';
import { SavedOutfit, Collection } from '../types';
import { StatsDashboard } from './StatsDashboard';

interface MyFitsProps {
  onBack: () => void;
  onViewOutfit: (outfitId: string) => void;
}

type ViewMode = 'fits' | 'stats';

export const MyFits: React.FC<MyFitsProps> = ({ onBack, onViewOutfit }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('fits');
  const [outfits, setOutfits] = useState<SavedOutfit[]>(getSavedOutfits());
  const [collections, setCollections] = useState<Collection[]>(getCollections());
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null); // null = all outfits
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddToCollection, setShowAddToCollection] = useState<string | null>(null); // outfit ID

  const displayedOutfits = selectedCollection
    ? getOutfitsInCollection(selectedCollection)
    : outfits;

  const refreshData = () => {
    setOutfits(getSavedOutfits());
    setCollections(getCollections());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this outfit?')) {
      deleteOutfit(id);
      refreshData();
    }
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowCreateCollection(false);
      refreshData();
    }
  };

  const handleDeleteCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this collection? Outfits won\'t be deleted.')) {
      deleteCollection(id);
      if (selectedCollection === id) {
        setSelectedCollection(null);
      }
      refreshData();
    }
  };

  const handleAddToCollection = (outfitId: string, collectionId: string) => {
    addOutfitToCollection(outfitId, collectionId);
    refreshData();
    setShowAddToCollection(null);
  };

  const handleRemoveFromCollection = (outfitId: string, collectionId: string) => {
    removeOutfitFromCollection(outfitId, collectionId);
    refreshData();
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

  const masonryColumns = createMasonryLayout(displayedOutfits, 2);


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

      {/* Collections - Only show in fits view */}
      {viewMode === 'fits' && (
      <div className="flex gap-2 px-4 py-3 bg-drip-dark border-b border-drip-gray overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCollection(null)}
          className={`shrink-0 px-4 py-2 rounded-full font-display font-bold text-xs transition-colors ${
            selectedCollection === null
              ? 'bg-white text-black'
              : 'bg-drip-gray text-gray-400'
          }`}
        >
          ALL ({outfits.length})
        </button>
        
        {collections.map((collection) => {
          const count = collection.outfitIds.length;
          return (
            <div key={collection.id} className="relative group shrink-0">
              <button
                onClick={() => setSelectedCollection(collection.id)}
                className={`px-4 py-2 rounded-full font-display font-bold text-xs transition-colors flex items-center gap-2 ${
                  selectedCollection === collection.id
                    ? 'bg-drip-accent text-white'
                    : 'bg-drip-gray text-gray-400'
                }`}
              >
                <FolderOpen size={14} />
                {collection.name} ({count})
              </button>
              <button
                onClick={(e) => handleDeleteCollection(collection.id, e)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete collection"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setShowCreateCollection(true)}
          className="shrink-0 px-4 py-2 rounded-full font-display font-bold text-xs bg-drip-lime text-black hover:bg-drip-lime/80 transition-colors flex items-center gap-2"
        >
          <Plus size={14} />
          NEW
        </button>
      </div>
      )}

      {/* Fits View - Only show in fits mode */}
      {viewMode === 'fits' && (
        <>

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-drip-dark rounded-xl border border-drip-gray p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-white text-lg mb-4">New Collection</h3>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className="w-full bg-drip-gray border border-drip-gray rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4 outline-none focus:border-drip-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCollection();
                if (e.key === 'Escape') setShowCreateCollection(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateCollection(false)}
                className="flex-1 px-4 py-2 bg-drip-gray text-white rounded-lg font-display font-bold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 px-4 py-2 bg-drip-accent text-white rounded-lg font-display font-bold hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Collection Modal */}
      {showAddToCollection && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-drip-dark rounded-xl border border-drip-gray p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <h3 className="font-display font-bold text-white text-lg mb-4">Add to Collection</h3>
            {collections.length === 0 ? (
              <p className="text-gray-400 text-sm mb-4">No collections yet. Create one first!</p>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => {
                  const outfit = outfits.find(o => o.id === showAddToCollection);
                  const isInCollection = outfit?.collectionIds?.includes(collection.id);
                  
                  return (
                    <button
                      key={collection.id}
                      onClick={() => {
                        if (isInCollection) {
                          handleRemoveFromCollection(showAddToCollection, collection.id);
                        } else {
                          handleAddToCollection(showAddToCollection, collection.id);
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-display font-bold text-sm transition-colors text-left flex items-center justify-between ${
                        isInCollection
                          ? 'bg-drip-accent text-white'
                          : 'bg-drip-gray text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <span>{collection.name} ({collection.outfitIds.length})</span>
                      {isInCollection && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setShowAddToCollection(null)}
              className="w-full mt-4 px-4 py-2 bg-drip-gray text-white rounded-lg font-display font-bold hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayedOutfits.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FolderOpen className="text-drip-gray mb-4" size={64} />
          <h3 className="text-xl font-display font-bold text-white mb-2">
            {selectedCollection ? 'NO OUTFITS IN THIS COLLECTION' : 'NO FITS SAVED'}
          </h3>
          <p className="text-gray-400">
            {selectedCollection 
              ? 'Add outfits to this collection to see them here!' 
              : 'Save your outfits to see them here!'}
          </p>
        </div>
      )}

      {/* Pinterest-style Masonry Grid */}
      {displayedOutfits.length > 0 && (
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
                      
                      {/* Score overlay */}
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        <span className="text-drip-lime font-display font-bold text-lg">{outfit.analysis.score}</span>
                        <span className="text-white text-xs">/10</span>
                      </div>

                      {/* Collection badges */}
                      {outfit.collectionIds && outfit.collectionIds.length > 0 && (
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {outfit.collectionIds.slice(0, 2).map((collId) => {
                            const coll = collections.find(c => c.id === collId);
                            return coll ? (
                              <div
                                key={collId}
                                className="bg-drip-accent/90 backdrop-blur-sm px-2 py-0.5 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCollection(collId);
                                }}
                              >
                                <span className="text-white text-[10px] font-bold uppercase">{coll.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                        <p className="text-white font-display font-bold text-sm uppercase truncate">
                          {outfit.analysis.vibe}
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5">
                          {new Date(outfit.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddToCollection(outfit.id);
                        }}
                        className="bg-white text-black px-4 py-2 rounded-full font-display font-bold text-xs hover:bg-gray-200 transition-colors"
                      >
                        <FolderOpen size={14} className="inline mr-1" />
                        Collection
                      </button>
                      <button
                        onClick={(e) => handleDelete(outfit.id, e)}
                        className="bg-red-500 text-white px-4 py-2 rounded-full font-display font-bold text-xs hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
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
