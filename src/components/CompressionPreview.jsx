import React, { useState } from 'react';
import { compressImage, formatFileSize } from '../utils/base64ImageStorage';
import './CompressionPreview.css';

const CompressionPreview = ({ originalImage, compressionOptions, onClose }) => {
  const [compressedImage, setCompressedImage] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompress = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);

    try {
      const result = await compressImage(originalImage, compressionOptions);
      setCompressedImage(result.base64);
      setCompressionStats(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOriginal = () => {
    const link = document.createElement('a');
    link.href = originalImage;
    link.download = 'original-image.jpg';
    link.click();
  };

  const handleDownloadCompressed = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage;
    link.download = 'compressed-image.jpg';
    link.click();
  };

  return (
    <div className="compression-preview-overlay">
      <div className="compression-preview-modal">
        <div className="preview-header">
          <h3>🖼️ Compression Preview</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="preview-content">
          {error && (
            <div className="error-message">
              ❌ Error: {error}
            </div>
          )}

          <div className="images-comparison">
            {/* Original Image */}
            <div className="image-section">
              <h4>Original Image</h4>
              <div className="image-container">
                <img src={originalImage} alt="Original" />
              </div>
              {compressionStats && (
                <div className="image-stats">
                  <div className="stat-item">
                    <span className="label">Size:</span>
                    <span className="value">{formatFileSize(compressionStats.originalSize)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Dimensions:</span>
                    <span className="value">{compressionStats.originalWidth}×{compressionStats.originalHeight}px</span>
                  </div>
                  <button className="download-btn" onClick={handleDownloadOriginal}>
                    📥 Download Original
                  </button>
                </div>
              )}
            </div>

            {/* Compressed Image */}
            <div className="image-section">
              <h4>Compressed Image</h4>
              <div className="image-container">
                {loading ? (
                  <div className="loading-placeholder">
                    <div className="spinner"></div>
                    <p>Compressing...</p>
                  </div>
                ) : compressedImage ? (
                  <img src={compressedImage} alt="Compressed" />
                ) : (
                  <div className="placeholder">
                    <p>Click "Compress" to see preview</p>
                  </div>
                )}
              </div>
              {compressionStats && (
                <div className="image-stats">
                  <div className="stat-item">
                    <span className="label">Size:</span>
                    <span className="value">{formatFileSize(compressionStats.compressedSize)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Dimensions:</span>
                    <span className="value">{compressionStats.width}×{compressionStats.height}px</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Format:</span>
                    <span className="value">{compressionStats.format.split('/')[1].toUpperCase()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Quality:</span>
                    <span className="value">{Math.round(compressionStats.quality * 100)}%</span>
                  </div>
                  {compressedImage && (
                    <button className="download-btn" onClick={handleDownloadCompressed}>
                      📥 Download Compressed
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Compression Statistics */}
          {compressionStats && (
            <div className="compression-stats">
              <h4>📊 Compression Statistics</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{compressionStats.compressionRatio}%</div>
                  <div className="stat-label">Size Reduction</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatFileSize(compressionStats.originalSize - compressionStats.compressedSize)}</div>
                  <div className="stat-label">Space Saved</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{Math.round((compressionStats.compressedSize / compressionStats.originalSize) * 100)}%</div>
                  <div className="stat-label">Final Size</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="preview-actions">
            <button 
              className="compress-btn"
              onClick={handleCompress}
              disabled={loading}
            >
              {loading ? '🔄 Compressing...' : '🖼️ Compress & Preview'}
            </button>
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionPreview;
