import React, { useRef } from 'react';
import { Upload, Camera } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploadProps {
  onImageSelected: (image: UploadedImage) => void;
  onCancel: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract raw base64 and mime type
      const matches = result.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        onImageSelected({
          previewUrl: result,
          mimeType: matches[1],
          base64: matches[2]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full p-6 animate-slide-up">
       <div className="flex-1 flex flex-col justify-center items-center">
          <div 
            onClick={triggerFileSelect}
            className="w-full aspect-[3/4] bg-drip-dark border-2 border-dashed border-drip-gray rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-drip-accent transition-colors group"
          >
            <div className="bg-drip-gray p-6 rounded-full group-hover:bg-drip-accent group-hover:text-black transition-colors text-white">
              <Camera size={48} />
            </div>
            <p className="font-display font-bold text-xl text-gray-400 group-hover:text-white">TAP TO UPLOAD</p>
            <p className="text-sm text-gray-500">Support JPG, PNG, WebP</p>
          </div>
       </div>

       <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

       <div className="mt-6">
         <button 
           onClick={onCancel}
           className="w-full py-4 text-gray-400 font-bold font-display hover:text-white transition-colors"
         >
           GO BACK
         </button>
       </div>
    </div>
  );
};
