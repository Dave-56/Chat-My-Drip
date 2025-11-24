import React, { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle, X } from 'lucide-react';
import { UploadedImage, DestinationContext } from '../types';
import { validateImageFile, compressImage } from '../utils/imageUtils';

interface ImageUploadProps {
  onImageSelected: (image: UploadedImage, destination: DestinationContext) => void;
  onCancel: () => void;
}

const DESTINATION_OPTIONS: { value: DestinationContext; label: string }[] = [
  { value: 'just-checking', label: 'Just Checking' },
  { value: 'work-office', label: 'Work / Office' },
  { value: 'date-night-out', label: 'Date / Night Out' },
  { value: 'casual-hangout', label: 'Casual Hangout' },
];

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<DestinationContext>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDestination, setCustomDestination] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setError(null);
    setIsProcessing(true);
    setProcessingProgress('Validating image...');

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setIsProcessing(false);
      setProcessingProgress('');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setProcessingProgress('Compressing image...');
      
      // Compress and process image
      const compressed = await compressImage(file);
      
      setProcessingProgress('Processing...');
      
      // Store preview image and show preview state
      const processedImage: UploadedImage = {
          previewUrl: compressed.previewUrl,
          mimeType: compressed.mimeType,
          base64: compressed.base64
        };
      
      setTimeout(() => {
        setPreviewImage(processedImage);
        setIsProcessing(false);
        setProcessingProgress('');
        console.log('Preview image set, should show destination question');
      }, 300);

    } catch (err) {
      console.error('Image processing error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to process image. Please try again with a different image.'
      );
      setIsProcessing(false);
      setProcessingProgress('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    if (!isProcessing && !previewImage) {
      fileInputRef.current?.click();
    }
  };


  const handleReset = () => {
    setPreviewImage(null);
    setSelectedDestination(null);
    setShowCustomInput(false);
    setCustomDestination('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDestinationSelect = (value: DestinationContext) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      setSelectedDestination(null);
      setCustomDestination('');
    } else {
      setShowCustomInput(false);
      setSelectedDestination(value);
      setCustomDestination('');
    }
  };

  const handleAnalyzeWithDestination = () => {
    if (previewImage) {
      // Use custom destination if text input is shown and has value, otherwise use selected destination
      const destination: DestinationContext = showCustomInput && customDestination.trim() 
        ? customDestination.trim() 
        : selectedDestination;
      onImageSelected(previewImage, destination);
    }
  };

  // Show preview state if image is selected
  if (previewImage) {
    return (
      <div className="flex flex-col h-full p-6 animate-slide-up overflow-y-auto">
        {/* Image Preview */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-4 border-2 border-drip-gray">
          <img 
            src={previewImage.previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleReset}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-colors"
          >
            <X className="text-white" size={20} />
          </button>
        </div>

        {/* Optional Destination Question */}
        <div className="space-y-3 mb-6">
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">Where are you heading? <span className="text-gray-500">(optional)</span></p>
            <p className="text-gray-500 text-xs">This helps us give you better recommendations</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {DESTINATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  if (selectedDestination === option.value) {
                    setSelectedDestination(null);
                  } else {
                    handleDestinationSelect(option.value);
                  }
                }}
                className={`py-2.5 px-3 rounded-xl font-display font-bold text-sm transition-all text-left ${
                  selectedDestination === option.value
                    ? 'bg-drip-accent text-black'
                    : 'bg-drip-dark border border-drip-gray text-gray-300 hover:bg-drip-gray/50'
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => handleDestinationSelect('custom')}
              className={`py-2.5 px-3 rounded-xl font-display font-bold text-sm transition-all text-left ${
                showCustomInput
                  ? 'bg-drip-accent text-black'
                  : 'bg-drip-dark border border-drip-gray text-gray-300 hover:bg-drip-gray/50'
              }`}
            >
              Other
            </button>
          </div>
          
          {showCustomInput && (
            <div className="mt-2">
              <input
                type="text"
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                placeholder="where you headed?"
                className="w-full py-2.5 px-4 rounded-xl bg-drip-dark border border-drip-gray text-white placeholder-gray-500 font-display focus:outline-none focus:border-drip-accent transition-colors"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyzeWithDestination}
          className="w-full py-4 bg-drip-accent text-black font-display font-bold text-lg rounded-xl hover:bg-drip-accent/80 transition-colors mb-3"
        >
          ANALYZE FIT
        </button>

        {/* Back Button */}
        <button 
          onClick={onCancel}
          className="w-full py-4 font-bold font-display transition-colors text-gray-400 hover:text-white"
        >
          GO BACK
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 animate-slide-up">
       <div className="flex-1 flex flex-col justify-center items-center">
          <div 
            onClick={triggerFileSelect}
            className={`w-full aspect-[3/4] bg-drip-dark border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${
              isProcessing 
                ? 'border-drip-accent cursor-wait opacity-75' 
                : error
                ? 'border-red-500 cursor-pointer hover:border-red-400'
                : 'border-drip-gray cursor-pointer hover:border-drip-accent group'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="bg-drip-accent/20 p-6 rounded-full">
                  <Loader2 className="text-drip-accent animate-spin" size={48} />
                </div>
                <p className="font-display font-bold text-xl text-drip-accent animate-pulse">
                  {processingProgress}
                </p>
                <p className="text-sm text-gray-400">Please wait...</p>
              </>
            ) : error ? (
              <>
                <div className="bg-red-500/20 p-6 rounded-full">
                  <AlertCircle className="text-red-500" size={48} />
                </div>
                <p className="font-display font-bold text-xl text-red-500 mb-2">
                  ERROR
                </p>
                <p className="text-sm text-gray-300 text-center px-4 max-w-xs">
                  {error}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(null);
                    triggerFileSelect();
                  }}
                  className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full font-display font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  TRY AGAIN
                </button>
              </>
            ) : (
              <>
                <div className="bg-drip-gray p-6 rounded-full group-hover:bg-drip-accent group-hover:text-black transition-colors text-white">
                  <Camera size={48} />
                </div>
                <p className="font-display font-bold text-xl text-gray-400 group-hover:text-white">TAP TO UPLOAD</p>
                <p className="text-sm text-gray-500">JPG, PNG, WebP • Max 20MB</p>
              </>
            )}
          </div>
       </div>

       <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/jpeg,image/jpg,image/png,image/webp" 
          className="hidden"
          disabled={isProcessing}
        />

       <div className="mt-6">
         <button 
           onClick={onCancel}
           disabled={isProcessing}
           className={`w-full py-4 font-bold font-display transition-colors ${
             isProcessing
               ? 'text-gray-600 cursor-not-allowed'
               : 'text-gray-400 hover:text-white'
           }`}
         >
           GO BACK
         </button>
       </div>
    </div>
  );
};
