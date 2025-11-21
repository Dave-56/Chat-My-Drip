import React, { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { UploadedImage } from '../types';
import { validateImageFile, compressImage } from '../utils/imageUtils';

interface ImageUploadProps {
  onImageSelected: (image: UploadedImage) => void;
  onCancel: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<string>('');

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
      
      // Small delay to show success state
      setTimeout(() => {
        onImageSelected({
          previewUrl: compressed.previewUrl,
          mimeType: compressed.mimeType,
          base64: compressed.base64
        });
        setIsProcessing(false);
        setProcessingProgress('');
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
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

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
