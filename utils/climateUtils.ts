import { ClimateContext } from '../types';
import { supabase } from './supabaseClient';

/**
 * Maps city to base climate type
 * This is a simplified mapping - you can expand this as needed
 */
const CITY_CLIMATE_MAP: Record<string, ClimateContext> = {
  // Hot/Tropical cities
  'Lagos': 'hot',
  'Lagos, Nigeria': 'hot',
  'Abuja': 'hot',
  'Accra': 'hot',
  'Nairobi': 'hot',
  'Mumbai': 'hot',
  'Delhi': 'hot',
  'Bangkok': 'hot',
  'Manila': 'hot',
  'Jakarta': 'hot',
  'Rio de Janeiro': 'hot',
  'São Paulo': 'hot',
  'Mexico City': 'hot',
  'Cairo': 'hot',
  'Dubai': 'hot',
  'Phoenix': 'hot',
  'Miami': 'hot',
  'Houston': 'hot',
  'Los Angeles': 'warm',
  'San Diego': 'warm',
  'Sydney': 'warm',
  'Barcelona': 'warm',
  'Rome': 'warm',
  'Madrid': 'warm',
  
  // Temperate cities
  'New York': 'mild',
  'Chicago': 'cool',
  'Boston': 'cool',
  'Philadelphia': 'mild',
  'Atlanta': 'warm',
  'Dallas': 'warm',
  'San Francisco': 'mild',
  'London': 'cool',
  'Paris': 'mild',
  'Berlin': 'cool',
  'Amsterdam': 'cool',
  'Tokyo': 'mild',
  'Seoul': 'mild',
  'Beijing': 'mild',
  'Shanghai': 'mild',
  'Toronto': 'cool',
  'Vancouver': 'mild',
  'Melbourne': 'mild',
  
  // Cold cities
  'Seattle': 'cool',
  'Minneapolis': 'cold',
  'Detroit': 'cold',
  'Montreal': 'cold',
  'Stockholm': 'cold',
  'Oslo': 'cold',
  'Helsinki': 'cold',
  'Moscow': 'cold',
  'Copenhagen': 'cool',
  'Reykjavik': 'cold',
};

/**
 * Seasonal adjustments based on current month
 * Adjusts climate context for seasonal variations
 */
function getSeasonalAdjustment(city: string, month: number): ClimateContext | null {
  // Cities with significant seasonal variation (mostly northern hemisphere)
  const seasonalCities = ['New York', 'Chicago', 'Boston', 'Seattle', 'Toronto', 'Vancouver',
    'London', 'Paris', 'Berlin', 'Amsterdam', 'Tokyo', 'Seoul', 'Beijing', 'Shanghai'];
  
  // Check if city name contains any seasonal city
  const hasSeasonalVariation = seasonalCities.some(seasonalCity => 
    city.toLowerCase().includes(seasonalCity.toLowerCase())
  );
  
  if (!hasSeasonalVariation) {
    return null; // No seasonal adjustment needed (tropical/hot cities)
  }
  
  // Northern hemisphere seasonal adjustments
  if (month >= 11 || month <= 2) {
    // Winter months (Dec-Feb) - make it colder
    return 'cold';
  } else if (month >= 6 && month <= 8) {
    // Summer months (Jun-Aug) - make it warmer
    return 'warm';
  }
  
  // Spring/Fall - keep as mild/cool
  return null;
}

/**
 * Gets climate context from city and current date
 * @param city - City name
 * @returns Climate context for AI prompt
 */
export function getClimateContext(city: string): ClimateContext {
  // Try exact match first, then case-insensitive
  const cityLower = city.toLowerCase();
  const matchedCity = Object.keys(CITY_CLIMATE_MAP).find(
    key => key.toLowerCase() === cityLower || cityLower.includes(key.toLowerCase())
  );
  
  const baseClimate = matchedCity ? CITY_CLIMATE_MAP[matchedCity] : 'mild'; // Default to mild if unknown
  const currentMonth = new Date().getMonth(); // 0-11
  const seasonalAdjustment = getSeasonalAdjustment(city, currentMonth);
  
  // Apply seasonal adjustment if applicable
  if (seasonalAdjustment) {
    return seasonalAdjustment;
  }
  
  return baseClimate;
}

/**
 * Gets user location from user_profiles table
 * @returns City name or null
 */
export async function getUserLocation(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('location_city')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting user location:', error);
      return null;
    }
    
    return data?.location_city || null;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}

/**
 * Updates user location in user_profiles table
 * @param city - City name to store
 */
export async function updateUserLocation(city: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        location_city: city,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('Error updating user location:', error);
      throw new Error(`Failed to save location: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating user location:', error);
    throw error;
  }
}

/**
 * Gets location using browser geolocation API
 * @returns City name or null
 */
export async function getLocationFromBrowser(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key)
          const { lat, lon } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
          );
          const data = await response.json();
          
          // Extract city name (prefer city, fallback to town, village, or state)
          const city = data.address?.city || 
                      data.address?.town || 
                      data.address?.village || 
                      data.address?.state || 
                      null;
          
          resolve(city);
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          resolve(null);
        }
      },
      () => resolve(null), // Permission denied or error
      { timeout: 5000 }
    );
  });
}

/**
 * Gets location using IP-based geolocation (fallback)
 * @returns City name or null
 */
export async function getLocationFromIP(): Promise<string | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.city || null;
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return null;
  }
}

/**
 * Attempts to get user location automatically
 * Tries browser geolocation first, then IP-based, then returns null
 * @returns City name or null
 */
export async function getLocationAuto(): Promise<string | null> {
  // Try browser geolocation first
  const browserLocation = await getLocationFromBrowser();
  if (browserLocation) return browserLocation;
  
  // Fallback to IP-based
  const ipLocation = await getLocationFromIP();
  if (ipLocation) return ipLocation;
  
  return null;
}
