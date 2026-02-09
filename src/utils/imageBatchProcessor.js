import JSZip from 'jszip';
import { compressImage, formatFileSize } from './base64ImageStorage';

/**
 * Process multiple images with compression
 * @param {Array<{file: File, dataUrl: string, name: string}>} images - Array of image objects
 * @param {Object} compressionOptions - Compression options
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array>} Array of compressed image results
 */
export async function processBatchImages(images, compressionOptions, onProgress) {
  const results = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    try {
      if (onProgress) {
        onProgress(i + 1, images.length);
      }

      const result = await compressImage(image.file || image.dataUrl, compressionOptions);

      // Determine file extension based on format
      const format = compressionOptions.format || 'image/jpeg';
      const extension = format === 'image/png' ? 'png' :
        format === 'image/webp' ? 'webp' : 'jpg';

      // Extract filename without extension
      const originalName = image.name || `image_${i + 1}`;
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      const compressedFileName = `${nameWithoutExt}.${extension}`;

      results.push({
        originalName: image.name,
        fileName: compressedFileName,
        dataUrl: result.base64,
        originalSize: image.size || result.originalSize,
        stats: result,
        success: true,
        error: null
      });
    } catch (error) {
      results.push({
        originalName: image.name,
        fileName: null,
        dataUrl: null,
        stats: null,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Create a ZIP file from compressed images
 * @param {Array} compressedResults - Results from processBatchImages
 * @param {string} zipFileName - Name for the ZIP file
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createZipFromImages(compressedResults, zipFileName = 'compressed_images.zip') {
  const zip = new JSZip();

  // Add successful compressions to ZIP
  for (const result of compressedResults) {
    if (result.success && result.dataUrl) {
      try {
        // Convert data URL to binary
        const base64Data = result.dataUrl.split(',')[1];

        // Convert base64 to binary string, then to bytes
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Add to ZIP with the filename
        zip.file(result.fileName, bytes);
      } catch (error) {
        console.error(`Error adding ${result.fileName} to ZIP:`, error);
      }
    }
  }

  // Generate ZIP file with compression
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return zipBlob;
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} fileName - Filename for download
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
