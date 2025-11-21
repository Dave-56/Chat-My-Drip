import React from 'react';
import { TrendingUp, TrendingDown, Award, Target, BarChart3 } from 'lucide-react';
import { calculateStats } from '../utils/statsUtils';

export const StatsDashboard: React.FC = () => {
  const stats = calculateStats();

  if (stats.totalOutfits === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <BarChart3 className="text-drip-gray mb-4" size={64} />
        <h3 className="text-xl font-display font-bold text-white mb-2">NO STATS YET</h3>
        <p className="text-gray-400">Save some outfits to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Style Profile */}
      <div className="bg-gradient-to-br from-drip-accent/20 to-drip-lime/20 rounded-xl border border-drip-accent/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Award className="text-drip-accent" size={24} />
          <h3 className="font-display font-bold text-white text-xl">YOUR STYLE PROFILE</h3>
        </div>
        <p className="text-2xl font-display font-bold text-drip-lime">{stats.styleProfile}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-drip-dark rounded-xl border border-drip-gray p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Total Outfits</p>
          <p className="text-3xl font-display font-bold text-white">{stats.totalOutfits}</p>
        </div>
        <div className="bg-drip-dark rounded-xl border border-drip-gray p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Average Score</p>
          <p className="text-3xl font-display font-bold text-drip-lime">{stats.averageScore}/10</p>
        </div>
        <div className="bg-drip-dark rounded-xl border border-drip-gray p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Highest Score</p>
          <p className="text-3xl font-display font-bold text-drip-accent">{stats.highestScore}/10</p>
        </div>
        <div className="bg-drip-dark rounded-xl border border-drip-gray p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Most Common Vibe</p>
          <p className="text-lg font-display font-bold text-white uppercase truncate">{stats.mostCommonVibe}</p>
        </div>
      </div>

      {/* Improvement Trend */}
      <div className={`bg-drip-dark rounded-xl border p-4 ${
        stats.improvementTrend >= 0 ? 'border-drip-lime/30' : 'border-red-500/30'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {stats.improvementTrend >= 0 ? (
            <TrendingUp className="text-drip-lime" size={20} />
          ) : (
            <TrendingDown className="text-red-500" size={20} />
          )}
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">IMPROVEMENT TREND</p>
        </div>
        <p className={`text-2xl font-display font-bold ${
          stats.improvementTrend >= 0 ? 'text-drip-lime' : 'text-red-500'
        }`}>
          {stats.improvementTrend >= 0 ? '+' : ''}{stats.improvementTrend} points
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {stats.improvementTrend >= 0 
            ? 'Your style is improving! 🔥' 
            : 'Keep experimenting to improve!'}
        </p>
      </div>

      {/* Common Hits */}
      {stats.commonHits.length > 0 && (
        <div className="bg-drip-dark rounded-xl border border-drip-gray p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-drip-lime" size={20} />
            <h3 className="font-display font-bold text-white text-lg">MOST COMMON HITS</h3>
          </div>
          <ul className="space-y-2">
            {stats.commonHits.map((hit, i) => (
              <li key={i} className="text-gray-300 text-sm pl-2 border-l-2 border-drip-lime/30">
                {hit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Misses */}
      {stats.commonMisses.length > 0 && (
        <div className="bg-drip-dark rounded-xl border border-drip-gray p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-red-500" size={20} />
            <h3 className="font-display font-bold text-white text-lg">MOST COMMON MISSES</h3>
          </div>
          <ul className="space-y-2">
            {stats.commonMisses.map((miss, i) => (
              <li key={i} className="text-gray-300 text-sm pl-2 border-l-2 border-red-500/30">
                {miss}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pb-6" />
    </div>
  );
};

