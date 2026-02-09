import React, { useState } from 'react';
import CompressionSettings from './components/CompressionSettings';
import CompressionPreview from './components/CompressionPreview';
import { COMPRESSION_PRESETS, formatFileSize } from './utils/base64ImageStorage';
import { processBatchImages, createZipFromImages, downloadBlob } from './utils/imageBatchProcessor';
import './App.css';

function App() {
  const [compressionOptions, setCompressionOptions] = useState(COMPRESSION_PRESETS.medium);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // For single preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [compressedResults, setCompressedResults] = useState([]);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please select valid image files');
      return;
    }

    // Read all selected images
    const imagePromises = imageFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file: file,
            name: file.name,
            dataUrl: e.target.result,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setSelectedImages(images);
      // Set first image as preview
      if (images.length > 0) {
        setSelectedImage(images[0].dataUrl);
      }
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    if (newImages.length > 0 && index === 0) {
      setSelectedImage(newImages[0].dataUrl);
    } else if (newImages.length > 0) {
      setSelectedImage(newImages[0].dataUrl);
    } else {
      setSelectedImage(null);
    }
  };

  const handleBatchCompress = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: selectedImages.length });
    setCompressedResults([]);

    try {
      const results = await processBatchImages(
        selectedImages,
        compressionOptions,
        (current, total) => {
          setProcessingProgress({ current, total });
        }
      );

      setCompressedResults(results);
    } catch (error) {
      alert('Error processing images: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    const successfulResults = compressedResults.filter(r => r.success);
    if (successfulResults.length === 0) {
      alert('No successfully compressed images to download');
      return;
    }

    try {
      if (successfulResults.length === 1) {
        // Download single file directly
        const result = successfulResults[0];
        const res = await fetch(result.dataUrl);
        const blob = await res.blob();
        downloadBlob(blob, result.fileName);
      } else {
        // Download as ZIP
        const zipBlob = await createZipFromImages(compressedResults);
        downloadBlob(zipBlob, `compressed_images_${Date.now()}.zip`);
      }
    } catch (error) {
      alert('Error creating download: ' + error.message);
    }
  };

  const handleOptionsChange = (newOptions) => {
    setCompressionOptions(newOptions);
  };

  const handleShowPreview = (imageDataUrl = null) => {
    const imageToPreview = imageDataUrl || selectedImage;
    if (imageToPreview) {
      setSelectedImage(imageToPreview);
      setShowPreviewModal(true);
    } else {
      alert('Please select an image first');
    }
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
  };

  const getSuccessCount = () => {
    return compressedResults.filter(r => r.success).length;
  };

  const getTotalOriginalSize = () => {
    return selectedImages.reduce((sum, img) => sum + (img.size || 0), 0);
  };

  const getTotalCompressedSize = () => {
    return compressedResults
      .filter(r => r.success && r.stats)
      .reduce((sum, r) => sum + r.stats.compressedSize, 0);
  };

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>🖼️ Image Compression Admin</h1>
          <p>Upload multiple images, compress them, and download as ZIP</p>
        </header>

        <main className="app-main">
          {/* Image Upload Section */}
          <section className="upload-section">
            <h2>📤 Upload Images</h2>
            <div className="upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="file-input"
              />
              <label htmlFor="image-upload" className="upload-label">
                {selectedImages.length > 0
                  ? `📁 ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''} Selected`
                  : '📁 Choose Images (Multiple)'}
              </label>

              {selectedImages.length > 0 && (
                <div className="images-list">
                  <h3>Selected Images ({selectedImages.length})</h3>
                  <div className="images-grid">
                    {selectedImages.map((img, index) => (
                      <div key={index} className="image-item">
                        <div className="image-item-preview">
                          <img src={img.dataUrl} alt={img.name} />
                          <button
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(index)}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                        <div className="image-item-info">
                          <p className="image-name" title={img.name}>{img.name}</p>
                          <button
                            className="preview-single-btn"
                            onClick={() => handleShowPreview(img.dataUrl)}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="batch-actions">
                    <button
                      className="compress-all-btn"
                      onClick={handleBatchCompress}
                      disabled={isProcessing || selectedImages.length === 0}
                    >
                      {isProcessing
                        ? `🔄 Processing... (${processingProgress.current}/${processingProgress.total})`
                        : `🗜️ Compress All Images`}
                    </button>

                    {compressedResults.length > 0 && (
                      <div className="compression-results">
                        <div className="results-summary">
                          <p>✅ Successfully compressed: {getSuccessCount()} of {compressedResults.length}</p>
                          {getSuccessCount() > 0 && (
                            <button
                              className="download-zip-btn"
                              onClick={handleDownloadZip}
                            >
                              {getSuccessCount() === 1 ? '📦 Download Image' : '📦 Download All as ZIP'}
                            </button>
                          )}
                        </div>

                        {/* Individual Image Stats */}
                        {compressedResults.filter(r => r.success).length > 0 && (
                          <div className="image-stats-list">
                            <h4>📊 Compression Details</h4>
                            <div className="stats-table">
                              <div className="stats-header">
                                <div className="stats-col-name">Image</div>
                                <div className="stats-col-size">Original Size</div>
                                <div className="stats-col-size">Compressed Size</div>
                                <div className="stats-col-saved">Saved</div>
                                <div className="stats-col-ratio">Ratio</div>
                              </div>
                              {compressedResults
                                .filter(r => r.success && r.stats)
                                .map((result, index) => {
                                  const originalSize = result.originalSize || (result.stats?.originalSize || 0);
                                  const compressedSize = result.stats?.compressedSize || 0;
                                  const saved = originalSize - compressedSize;
                                  const ratio = originalSize > 0
                                    ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
                                    : 0;

                                  return (
                                    <div key={index} className="stats-row">
                                      <div className="stats-col-name" title={result.originalName}>
                                        <span className="filename">{result.originalName}</span>
                                      </div>
                                      <div className="stats-col-size">
                                        {formatFileSize(originalSize)}
                                      </div>
                                      <div className="stats-col-size">
                                        {formatFileSize(compressedSize)}
                                      </div>
                                      <div className="stats-col-saved">
                                        <span className="saved-amount">-{formatFileSize(saved)}</span>
                                      </div>
                                      <div className="stats-col-ratio">
                                        <span className={`ratio-badge ${parseFloat(ratio) >= 50 ? 'high' : parseFloat(ratio) >= 25 ? 'medium' : 'low'}`}>
                                          {ratio}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {compressedResults.some(r => !r.success) && (
                          <div className="error-summary">
                            <p>❌ Failed images:</p>
                            <ul>
                              {compressedResults
                                .filter(r => !r.success)
                                .map((r, i) => (
                                  <li key={i}>{r.originalName}: {r.error}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Compression Settings Section */}
          <section className="settings-section">
            <CompressionSettings
              compressionOptions={compressionOptions}
              onOptionsChange={handleOptionsChange}
              showPreview={false}
            />
          </section>
        </main>

        {/* Compression Preview Modal */}
        {showPreviewModal && selectedImage && (
          <CompressionPreview
            originalImage={selectedImage}
            compressionOptions={compressionOptions}
            onClose={handleClosePreview}
          />
        )}
      </div>
    </div>
  );
}

export default App;
