import React, { useState, useRef } from 'react';
import { ArrowLeft, BarChart3, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { 
  getSavedOutfits, 
  deleteOutfit,
  deleteUserAccount
} from '../utils/supabaseStorage';
import { SavedOutfit } from '../types';
import { StatsDashboard } from './StatsDashboard';
import { SwipeableOutfitCard } from './SwipeableOutfitCard';
import { MyFitsSkeleton } from './LoadingSkeleton';
import { supabase } from '../utils/supabaseClient';

interface MyFitsProps {
  onBack: () => void;
  onViewOutfit: (outfitId: string) => void;
  onAccountDeleted?: () => void;
}

type ViewMode = 'fits' | 'stats' | 'settings';

export const MyFits: React.FC<MyFitsProps> = ({ onBack, onViewOutfit, onAccountDeleted }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('fits');
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your outfits and cannot be undone.')) {
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount();
      // Account deleted and user signed out
      // The auth state change listener in App.tsx will handle the redirect
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
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
          {viewMode === 'stats' ? 'STATS' : viewMode === 'settings' ? 'SETTINGS' : 'MY FITS'}
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
        <button
          onClick={() => setViewMode('settings')}
          className={`px-4 py-2 rounded-full font-display font-bold text-sm transition-colors ${
            viewMode === 'settings' 
              ? 'bg-drip-accent text-white' 
              : 'bg-drip-gray text-gray-400'
          }`}
        >
          <Settings size={16} className="inline mr-1" />
          SETTINGS
        </button>
      </div>

      {/* Stats View */}
      {viewMode === 'stats' && (
        <StatsDashboard />
      )}

      {/* Settings View */}
      {viewMode === 'settings' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-drip-dark rounded-xl border border-drip-gray p-6">
            <h3 className="font-display font-bold text-white text-xl mb-4">ACCOUNT SETTINGS</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Delete your account and all saved outfits</p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className={`w-full font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display transition-colors ${
                    showDeleteConfirm
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-drip-dark text-red-500 border-2 border-red-500/50 hover:bg-red-500/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <AlertTriangle size={20} />
                  {isDeletingAccount 
                    ? 'DELETING ACCOUNT...' 
                    : showDeleteConfirm 
                      ? 'CONFIRM ACCOUNT DELETION' 
                      : 'DELETE ACCOUNT'
                  }
                </button>
                {showDeleteConfirm && !isDeletingAccount && (
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full mt-3 bg-drip-gray text-white font-bold py-3 rounded-full font-display hover:bg-drip-gray/80 transition-colors text-sm"
                  >
                    CANCEL
                  </button>
                )}
                {showDeleteConfirm && (
                  <p className="text-red-500 text-xs mt-3 text-center">
                    ⚠️ This action cannot be undone. All your outfits will be permanently deleted.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-drip-dark rounded-xl border border-drip-gray p-6">
            <h3 className="font-display font-bold text-white text-xl mb-4">ABOUT</h3>
            <p className="text-gray-400 text-sm">
              ChatMyDrip helps you analyze and improve your style with AI-powered feedback.
            </p>
          </div>
        </div>
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
