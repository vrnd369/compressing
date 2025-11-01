import React, { useState } from 'react';
import { COMPRESSION_PRESETS } from '../utils/base64ImageStorage';
import './CompressionSettings.css';

const CompressionSettings = ({ 
  compressionOptions, 
  onOptionsChange, 
  showPreview = false, 
  previewImage = null,
  onPreviewCompress = null 
}) => {
  // Initialize with current compression options to maintain state
  const [activePreset, setActivePreset] = useState(() => {
    // Determine which preset matches current options
    const presets = Object.entries(COMPRESSION_PRESETS);
    const matchingPreset = presets.find(([name, preset]) => 
      preset.maxWidth === compressionOptions.maxWidth &&
      preset.maxHeight === compressionOptions.maxHeight &&
      preset.quality === compressionOptions.quality &&
      preset.format === compressionOptions.format
    );
    return matchingPreset ? matchingPreset[0] : 'custom';
  });
  
  const [customOptions, setCustomOptions] = useState(() => ({
    maxWidth: compressionOptions.maxWidth || 800,
    maxHeight: compressionOptions.maxHeight || 800,
    quality: compressionOptions.quality || 0.8,
    format: compressionOptions.format || 'image/jpeg',
    maintainAspectRatio: compressionOptions.maintainAspectRatio !== false,
    preserveDimensions: compressionOptions.preserveDimensions || false
  }));

  // Don't sync state automatically - let the component maintain its own state
  // This prevents the panel from closing when parent component re-renders

  const handlePresetChange = (presetName) => {
    setActivePreset(presetName);
    const preset = { ...COMPRESSION_PRESETS[presetName], preserveDimensions: false };
    setCustomOptions(preset);
    // Use setTimeout to prevent immediate re-render issues
    setTimeout(() => {
      onOptionsChange(preset);
    }, 0);
  };

  const handleCustomOptionChange = (key, value) => {
    const newOptions = { ...customOptions, [key]: value };
    setCustomOptions(newOptions);
    setActivePreset('custom'); // Set to custom when user modifies settings
    // Use setTimeout to prevent immediate re-render issues
    setTimeout(() => {
      onOptionsChange(newOptions);
    }, 0);
  };

  const handlePreviewCompression = async () => {
    if (previewImage && onPreviewCompress) {
      await onPreviewCompress(customOptions);
    }
  };

  return (
    <div className="compression-settings">
      <h4>🖼️ Image Compression Settings</h4>
      
      {/* Preset Selection */}
      <div className="preset-section">
        <label>Compression Preset:</label>
        <div className="preset-buttons">
          {Object.entries(COMPRESSION_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              className={`preset-btn ${activePreset === name ? 'active' : ''}`}
              onClick={() => handlePresetChange(name)}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
          <button
            className={`preset-btn ${activePreset === 'custom' ? 'active' : ''}`}
            onClick={() => setActivePreset('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Settings */}
      <div className="custom-settings">
        <h5>Custom Settings</h5>
        
        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={customOptions.preserveDimensions}
              onChange={(e) => {
                const preserve = e.target.checked;
                handleCustomOptionChange('preserveDimensions', preserve);
                if (preserve) {
                  // Set very high max dimensions to preserve original size
                  handleCustomOptionChange('maxWidth', 9999);
                  handleCustomOptionChange('maxHeight', 9999);
                } else {
                  // Reset to reasonable defaults when unchecking
                  handleCustomOptionChange('maxWidth', 800);
                  handleCustomOptionChange('maxHeight', 800);
                }
              }}
            />
            Preserve Original Dimensions (Quality/Format Only)
          </label>
        </div>

        {!customOptions.preserveDimensions && (
          <>
            <div className="setting-row">
              <label>Max Width (px):</label>
              <input
                type="number"
                value={customOptions.maxWidth}
                onChange={(e) => handleCustomOptionChange('maxWidth', parseInt(e.target.value) || 800)}
                min="100"
                max="10000"
              />
            </div>

            <div className="setting-row">
              <label>Max Height (px):</label>
              <input
                type="number"
                value={customOptions.maxHeight}
                onChange={(e) => handleCustomOptionChange('maxHeight', parseInt(e.target.value) || 800)}
                min="100"
                max="10000"
              />
            </div>
          </>
        )}

        <div className="setting-row">
          <label>Quality: {Math.round(customOptions.quality * 100)}% 
            {customOptions.format === 'image/png' && (
              <span style={{fontSize: '0.8em', color: '#6c757d', marginLeft: '0.5rem'}}>
                (PNG doesn't support quality)
              </span>
            )}
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={customOptions.quality}
            onChange={(e) => handleCustomOptionChange('quality', parseFloat(e.target.value))}
            disabled={customOptions.format === 'image/png'}
          />
        </div>

        <div className="setting-row">
          <label>Format:</label>
          <select
            value={customOptions.format}
            onChange={(e) => handleCustomOptionChange('format', e.target.value)}
          >
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>

        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={customOptions.maintainAspectRatio}
              onChange={(e) => handleCustomOptionChange('maintainAspectRatio', e.target.checked)}
            />
            Maintain Aspect Ratio
          </label>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && previewImage && (
        <div className="preview-section">
          <h5>Compression Preview</h5>
          <button 
            className="preview-btn"
            onClick={handlePreviewCompression}
          >
            🔄 Preview Compression
          </button>
        </div>
      )}

      {/* Compression Info */}
      <div className="compression-info">
        <h5>Compression Info</h5>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Format:</span>
            <span className="value">{customOptions.format.split('/')[1].toUpperCase()}</span>
          </div>
          <div className="info-item">
            <span className="label">Quality:</span>
            <span className="value">{Math.round(customOptions.quality * 100)}%</span>
          </div>
          <div className="info-item">
            <span className="label">Max Size:</span>
            <span className="value">{customOptions.maxWidth}×{customOptions.maxHeight}px</span>
          </div>
          <div className="info-item">
            <span className="label">Aspect Ratio:</span>
            <span className="value">{customOptions.maintainAspectRatio ? 'Maintained' : 'Forced'}</span>
          </div>
          <div className="info-item">
            <span className="label">Resize:</span>
            <span className="value">{customOptions.preserveDimensions ? 'Disabled (Original Size)' : `Max ${customOptions.maxWidth}×${customOptions.maxHeight}px`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionSettings;
