import { SavedOutfit, AnalysisResult } from '../types';
import { getSavedOutfits } from './supabaseStorage';

export interface StyleStats {
  totalOutfits: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  mostCommonVibe: string;
  vibeCount: Record<string, number>;
  scoreDistribution: Record<number, number>;
  improvementTrend: number; // Positive or negative trend
  recentScores: number[];
  commonHits: string[];
  commonMisses: string[];
  styleProfile: string;
}

/**
 * Calculate stats from saved outfits
 */
export const calculateStats = async (): Promise<StyleStats> => {
  const outfits = await getSavedOutfits();
  
  if (outfits.length === 0) {
    return {
      totalOutfits: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      mostCommonVibe: '',
      vibeCount: {},
      scoreDistribution: {},
      improvementTrend: 0,
      recentScores: [],
      commonHits: [],
      commonMisses: [],
      styleProfile: 'No style data yet',
    };
  }

  // Basic stats
  const scores = outfits.map(o => o.analysis.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  // Vibe counting
  const vibeCount: Record<string, number> = {};
  outfits.forEach(outfit => {
    const vibe = outfit.analysis.vibe;
    vibeCount[vibe] = (vibeCount[vibe] || 0) + 1;
  });
  const mostCommonVibe = Object.entries(vibeCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

  // Score distribution
  const scoreDistribution: Record<number, number> = {};
  scores.forEach(score => {
    scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
  });

  // Improvement trend (compare first half vs second half)
  const sortedByDate = [...outfits].sort((a, b) => a.savedAt - b.savedAt);
  const half = Math.floor(sortedByDate.length / 2);
  const firstHalf = sortedByDate.slice(0, half);
  const secondHalf = sortedByDate.slice(half);
  
  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, o) => sum + o.analysis.score, 0) / firstHalf.length
    : 0;
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, o) => sum + o.analysis.score, 0) / secondHalf.length
    : 0;
  
  const improvementTrend = secondHalfAvg - firstHalfAvg;

  // Recent scores (last 5)
  const recentScores = sortedByDate
    .slice(-5)
    .map(o => o.analysis.score);

  // Common hits and misses
  const hitCount: Record<string, number> = {};
  const missCount: Record<string, number> = {};
  
  outfits.forEach(outfit => {
    outfit.analysis.hits.forEach(hit => {
      hitCount[hit] = (hitCount[hit] || 0) + 1;
    });
    outfit.analysis.misses.forEach(miss => {
      missCount[miss] = (missCount[miss] || 0) + 1;
    });
  });

  const commonHits = Object.entries(hitCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hit]) => hit);

  const commonMisses = Object.entries(missCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([miss]) => miss);

  // Style profile
  const styleProfile = generateStyleProfile({
    averageScore,
    mostCommonVibe,
    improvementTrend,
    vibeCount,
  });

  return {
    totalOutfits: outfits.length,
    averageScore: Math.round(averageScore * 10) / 10,
    highestScore,
    lowestScore,
    mostCommonVibe,
    vibeCount,
    scoreDistribution,
    improvementTrend: Math.round(improvementTrend * 10) / 10,
    recentScores,
    commonHits,
    commonMisses,
    styleProfile,
  };
};

/**
 * Generate a style profile based on stats
 */
const generateStyleProfile = (data: {
  averageScore: number;
  mostCommonVibe: string;
  improvementTrend: number;
  vibeCount: Record<string, number>;
}): string => {
  if (data.averageScore >= 8) {
    return 'Style Master 🔥';
  } else if (data.averageScore >= 6.5) {
    return `${data.mostCommonVibe} Enthusiast`;
  } else if (data.averageScore >= 5) {
    return 'Developing Your Style';
  } else {
    return 'Style Explorer';
  }
};

