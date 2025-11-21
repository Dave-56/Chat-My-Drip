/**
 * Image utility functions for validation, compression, and processing
 */

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (we'll compress anyway)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_WIDTH = 1920; // Max width after compression
const MAX_HEIGHT = 1920; // Max height after compression
const COMPRESSION_QUALITY = 0.85; // JPEG/WebP quality (0-1)

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file size and type
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload a JPG, PNG, or WebP image.`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is ${maxMB}MB. We'll compress it, but please try a smaller image.`
    };
  }

  return { valid: true };
};

/**
 * Compress and resize image while maintaining aspect ratio
 */
export const compressImage = async (
  file: File,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT,
  quality: number = COMPRESSION_QUALITY
): Promise<{ base64: string; mimeType: string; previewUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // Create canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          // Determine output format (prefer JPEG for photos, WebP if supported)
          let outputMimeType = file.type;
          if (file.type === 'image/png' && file.size > 1024 * 1024) {
            // Convert large PNGs to JPEG for better compression
            outputMimeType = 'image/jpeg';
          }

          // Convert to base64
          const compressedBase64 = canvas.toDataURL(outputMimeType, quality);
          
          // Extract raw base64 (without data URI prefix)
          const matches = compressedBase64.match(/^data:(.+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            reject(new Error('Failed to process image'));
            return;
          }

          const originalSize = (file.size / 1024).toFixed(1);
          const compressedSize = (matches[2].length * 3 / 4 / 1024).toFixed(1);
          const reduction = ((1 - matches[2].length * 3 / 4 / file.size) * 100).toFixed(0);
          
          console.log(`Image compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`);

          resolve({
            base64: matches[2], // Raw base64 for API
            mimeType: matches[1], // MIME type
            previewUrl: compressedBase64 // Full data URL for preview
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image. The file may be corrupted.'));
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file. Please try again.'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

