/**
 * Image compression utilities
 */

// Compression presets
export const COMPRESSION_PRESETS = {
  low: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.6,
    format: 'image/jpeg',
    maintainAspectRatio: true
  },
  medium: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.7,
    format: 'image/jpeg',
    maintainAspectRatio: true
  },
  high: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    format: 'image/jpeg',
    maintainAspectRatio: true
  },
  webp: {
    maxWidth: 1000,
    maxHeight: 1000,
    quality: 0.8,
    format: 'image/webp',
    maintainAspectRatio: true
  },
  png: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.9,
    format: 'image/png',
    maintainAspectRatio: true
  }
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compress an image with the given options
 * @param {string} imageDataUrl - Base64 data URL of the image
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {number} options.quality - Quality (0-1)
 * @param {string} options.format - Output format (image/jpeg, image/png, image/webp)
 * @param {boolean} options.maintainAspectRatio - Whether to maintain aspect ratio
 * @returns {Promise<Object>} Compression result with base64, stats, etc.
 */
export function compressImage(imageDataUrl, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 0.8,
        format = 'image/jpeg',
        maintainAspectRatio = true
      } = options;

      // Create an image element to load the image
      const img = new Image();
      
      img.onload = () => {
        try {
          // Get original dimensions
          const originalWidth = img.width;
          const originalHeight = img.height;
          
          // Calculate new dimensions
          let newWidth = originalWidth;
          let newHeight = originalHeight;
          
          // Only resize if dimensions exceed max dimensions (or if maxWidth/maxHeight are not extremely high)
          if (maxWidth > 0 && maxHeight > 0 && maxWidth < 9999 && maxHeight < 9999) {
            if (maintainAspectRatio) {
              const aspectRatio = originalWidth / originalHeight;
              
              if (originalWidth > maxWidth || originalHeight > maxHeight) {
                if (originalWidth > originalHeight) {
                  newWidth = Math.min(originalWidth, maxWidth);
                  newHeight = Math.round(newWidth / aspectRatio);
                  
                  if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = Math.round(newHeight * aspectRatio);
                  }
                } else {
                  newHeight = Math.min(originalHeight, maxHeight);
                  newWidth = Math.round(newHeight * aspectRatio);
                  
                  if (newWidth > maxWidth) {
                    newWidth = maxWidth;
                    newHeight = Math.round(newWidth / aspectRatio);
                  }
                }
              }
            } else {
              newWidth = Math.min(originalWidth, maxWidth);
              newHeight = Math.min(originalHeight, maxHeight);
            }
          }
          
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          const ctx = canvas.getContext('2d');
          
          // Improve image quality settings
          // Enable high-quality image smoothing for better results
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // For downscaling, use better interpolation
          // Draw image with proper quality settings
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Convert to the desired format
          // Note: PNG format doesn't support quality parameter
          let compressedDataUrl;
          if (format === 'image/png') {
            // PNG doesn't support quality, always use highest quality
            compressedDataUrl = canvas.toDataURL(format);
          } else {
            // JPEG and WebP support quality parameter
            compressedDataUrl = canvas.toDataURL(format, quality);
          }
          
          // Calculate sizes
          const originalSize = getBase64Size(imageDataUrl);
          const compressedSize = getBase64Size(compressedDataUrl);
          const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          // Resolve with result
          resolve({
            base64: compressedDataUrl,
            width: newWidth,
            height: newHeight,
            format: format,
            quality: quality,
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio,
            originalWidth: originalWidth,
            originalHeight: originalHeight
          });
        } catch (error) {
          reject(new Error(`Compression error: ${error.message}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageDataUrl;
    } catch (error) {
      reject(new Error(`Error processing image: ${error.message}`));
    }
  });
}

/**
 * Calculate the approximate size of a base64 string in bytes
 * @param {string} base64 - Base64 string
 * @returns {number} Size in bytes
 */
function getBase64Size(base64) {
  // Remove data URL prefix if present
  const base64String = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Calculate size: base64 encoding increases size by ~33%
  // Formula: (base64String.length * 3) / 4
  return Math.round((base64String.length * 3) / 4);
}
