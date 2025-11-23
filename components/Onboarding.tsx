import React, { useState, useEffect } from 'react';
import { updateUserLocation, getLocationAuto } from '../utils/climateUtils';

interface OnboardingProps {
  onComplete: () => void;
}

// Common cities for quick selection
const COMMON_CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Seattle',
  'Miami',
  'Lagos',
  'London',
  'Toronto',
  'Sydney',
  'Tokyo',
  'Paris',
  'Berlin',
  'Mumbai',
  'São Paulo',
  'Other'
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [customCity, setCustomCity] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  // Try to auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      const city = await getLocationAuto();
      if (city) {
        setDetectedCity(city);
        setSelectedCity(city);
      }
      setIsDetecting(false);
    };
    detectLocation();
  }, []);

  const handleContinue = async () => {
    const city = selectedCity === 'Other' ? customCity.trim() : selectedCity;
    if (!city) return;

    try {
      setIsSaving(true);
      await updateUserLocation(city);
      onComplete();
    } catch (error) {
      console.error('Error saving location:', error);
      setIsSaving(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save location';
      alert(`Error: ${errorMessage}. Please try again.`);
    }
  };

  const handleUseDetected = () => {
    if (detectedCity) {
      setSelectedCity(detectedCity);
    }
  };

  const showCustomInput = selectedCity === 'Other';

  if (isDetecting) {
    return (
      <div className="flex flex-col h-full p-6 animate-slide-up">
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-display font-bold text-white">
              Detecting your location...
            </h1>
            <p className="text-gray-400 text-sm">
              This helps us give you weather-appropriate outfit suggestions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 animate-slide-up">
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div className="text-center space-y-3 mb-4">
          <h1 className="text-3xl font-display font-bold text-white">
            Where are you located?
          </h1>
          <p className="text-gray-400 text-sm">
            This helps us give you weather-appropriate outfit suggestions
          </p>
        </div>

        <div className="w-full space-y-4">
          {/* Show detected city if available */}
          {detectedCity && !selectedCity && (
            <div className="bg-drip-dark border-2 border-drip-accent rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-2">We detected your location:</p>
              <p className="font-display font-bold text-white text-lg mb-3">{detectedCity}</p>
              <button
                onClick={handleUseDetected}
                className="w-full py-2 px-4 rounded-lg bg-drip-accent text-black font-display font-bold text-sm hover:bg-drip-accent/80 transition-all"
              >
                Use This Location
              </button>
            </div>
          )}

          {/* Quick select buttons */}
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {COMMON_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setSelectedCity(city);
                  if (city !== 'Other') {
                    setCustomCity('');
                  }
                }}
                className={`py-3 px-4 rounded-xl font-display font-bold text-sm transition-all text-left ${
                  selectedCity === city
                    ? 'bg-drip-accent text-black'
                    : 'bg-drip-gray text-gray-300 hover:bg-drip-gray/80'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Custom city input */}
          {showCustomInput && (
            <div className="space-y-2">
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full py-3 px-4 rounded-xl bg-drip-dark border-2 border-drip-gray text-white placeholder-gray-500 focus:border-drip-accent focus:outline-none font-display"
                autoFocus
              />
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!selectedCity || (showCustomInput && !customCity.trim()) || isSaving}
            className={`w-full py-4 px-4 rounded-xl font-display font-bold text-lg transition-all ${
              selectedCity && (!showCustomInput || customCity.trim()) && !isSaving
                ? 'bg-drip-accent text-black hover:bg-drip-accent/80'
                : 'bg-drip-gray text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};
