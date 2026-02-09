import imageCompression from 'browser-image-compression';

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
 * Helper to convert Data URL to File object
 */
async function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Helper to convert File to Data URL
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Helper to load image
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Compress an image with the given options using browser-image-compression
 * @param {string|File} imageInput - Base64 data URL or File object of the image
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} Compression result with base64, stats, etc.
 */
export async function compressImage(imageInput, options = {}) {
  try {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      format = 'image/jpeg',
      maintainAspectRatio = true
    } = options;

    let imageFile;
    let originalWidth, originalHeight;

    // Handle input type and get original dimensions
    if (typeof imageInput === 'string') {
      // Input is base64 string
      const img = await loadImage(imageInput);
      originalWidth = img.width;
      originalHeight = img.height;

      // Convert to File for browser-image-compression
      imageFile = await dataURLtoFile(imageInput, 'image.' + (format.split('/')[1] || 'jpg'));
    } else {
      // Input is File object
      const objectUrl = URL.createObjectURL(imageInput);
      try {
        const img = await loadImage(objectUrl);
        originalWidth = img.width;
        originalHeight = img.height;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
      imageFile = imageInput;
    }

    // Prepare options for browser-image-compression
    // Note: browser-image-compression uses maxWidthOrHeight, so we take the larger dimension
    // to ensure neither exceeds the limit while maintaining aspect ratio.
    const compressionConfig = {
      maxSizeMB: 100, // Effectively unlimited size, controlled by quality/resolution
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      fileType: format,
      initialQuality: quality,
      alwaysKeepResolution: false // Allow downscaling
    };

    // Compress
    const compressedFile = await imageCompression(imageFile, compressionConfig);

    // Convert result back to Data URL for compatibility
    const compressedDataUrl = await fileToDataURL(compressedFile);

    // Get dimensions of compressed image (needs loading)
    const compressedImg = await loadImage(compressedDataUrl);

    // Calculate sizes
    const originalSize = imageFile.size;
    const compressedSize = compressedFile.size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    return {
      base64: compressedDataUrl,
      width: compressedImg.width,
      height: compressedImg.height,
      format: format,
      quality: quality,
      originalSize: originalSize,
      compressedSize: compressedSize,
      compressionRatio: compressionRatio,
      originalWidth: originalWidth,
      originalHeight: originalHeight
    };

  } catch (error) {
    console.error('Compression details:', error);
    throw new Error(`Compression error: ${error.message}`);
  }
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
