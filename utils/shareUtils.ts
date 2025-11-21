/**
 * Utilities for sharing and exporting outfit results
 */

import { AnalysisResult, UploadedImage } from '../types';

/**
 * Generate a shareable image card with outfit results
 * Returns a data URL that can be used for sharing or download
 */
export const generateShareableImageCard = async (
  image: UploadedImage,
  data: AnalysisResult,
  options?: {
    width?: number;
    height?: number;
    showBranding?: boolean;
  }
): Promise<string> => {
  const cardWidth = options?.width || 1080;
  const cardHeight = options?.height || 1920; // Instagram Story size
  const showBranding = options?.showBranding !== false;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to create canvas'));
      return;
    }

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, cardHeight);
    gradient.addColorStop(0, '#050505');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Load the outfit image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Draw outfit image (top portion, cropped to square)
        const imageSize = cardWidth;
        const imageY = 0;
        ctx.drawImage(img, 0, 0, imageSize, imageSize);

        // Dark overlay on image
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, imageY, imageSize, imageSize);

        // Score badge (top right)
        const scoreSize = 120;
        const scoreX = cardWidth - scoreSize - 40;
        const scoreY = 40;
        const scoreColor = data.score >= 8 ? '#a3e635' : data.score >= 5 ? '#a855f7' : '#ef4444';
        const scoreBg = data.score >= 8 ? 'rgba(163, 230, 53, 0.2)' : data.score >= 5 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(239, 68, 68, 0.2)';

        // Score background (rounded rectangle)
        ctx.fillStyle = scoreBg;
        const radius = 20;
        ctx.beginPath();
        ctx.moveTo(scoreX + radius, scoreY);
        ctx.lineTo(scoreX + scoreSize - radius, scoreY);
        ctx.quadraticCurveTo(scoreX + scoreSize, scoreY, scoreX + scoreSize, scoreY + radius);
        ctx.lineTo(scoreX + scoreSize, scoreY + scoreSize - radius);
        ctx.quadraticCurveTo(scoreX + scoreSize, scoreY + scoreSize, scoreX + scoreSize - radius, scoreY + scoreSize);
        ctx.lineTo(scoreX + radius, scoreY + scoreSize);
        ctx.quadraticCurveTo(scoreX, scoreY + scoreSize, scoreX, scoreY + scoreSize - radius);
        ctx.lineTo(scoreX, scoreY + radius);
        ctx.quadraticCurveTo(scoreX, scoreY, scoreX + radius, scoreY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = scoreColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Score text
        ctx.fillStyle = scoreColor;
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          data.score.toString(),
          scoreX + scoreSize / 2,
          scoreY + scoreSize / 2 - 10
        );
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillText(
          'out of 10',
          scoreX + scoreSize / 2,
          scoreY + scoreSize / 2 + 20
        );

        // Vibe text (bottom left of image)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('VIBE CHECK', 40, imageSize - 100);
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillText(data.vibe.toUpperCase(), 40, imageSize - 40);

        // Content area (below image)
        let currentY = imageSize + 60;

        // Verdict
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('THE VERDICT', cardWidth / 2, currentY);
        currentY += 40;
        ctx.font = 'italic 32px Arial, sans-serif';
        const verdictLines = wrapText(ctx, `"${data.verdict}"`, cardWidth - 80, 32);
        verdictLines.forEach((line, i) => {
          ctx.fillText(line, cardWidth / 2, currentY + i * 40);
        });
        currentY += verdictLines.length * 40 + 40;

        // Hits
        ctx.fillStyle = '#a3e635';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('✓ WHAT WORKS', 40, currentY);
        currentY += 30;
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '18px Arial, sans-serif';
        data.hits.slice(0, 3).forEach((hit) => {
          ctx.fillText(`• ${hit}`, 60, currentY);
          currentY += 28;
        });
        currentY += 20;

        // Misses (if any)
        if (data.misses.length > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.fillText('✗ THE FLOPS', 40, currentY);
          currentY += 30;
          ctx.fillStyle = '#e5e7eb';
          ctx.font = '18px Arial, sans-serif';
          data.misses.slice(0, 2).forEach((miss) => {
            ctx.fillText(`• ${miss}`, 60, currentY);
            currentY += 28;
          });
          currentY += 20;
        }

        // Branding (bottom)
        if (showBranding) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '16px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('chatmydrip.com', cardWidth / 2, cardHeight - 30);
        }

        // Convert to data URL
        resolve(canvas.toDataURL('image/png', 0.95));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = image.previewUrl;
  });
};

/**
 * Helper to wrap text to fit within a width
 */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  ctx.font = `italic ${fontSize}px Arial, sans-serif`;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

/**
 * Download image as file
 */
export const downloadImage = (dataUrl: string, filename: string = 'chatmydrip-result.png') => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy image to clipboard (for modern browsers)
 */
export const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Use Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy image:', error);
    return false;
  }
};

