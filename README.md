# Image Compression Admin

A React application for compressing images with customizable settings and preview functionality.

## Features

- 🖼️ Upload and preview images
- ⚙️ Adjustable compression settings (quality, dimensions, format)
- 🎯 Compression presets (Low, Medium, High, WebP, PNG)
- 📊 Real-time compression statistics
- 💾 Download original and compressed images
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`

### Building for Production

Build the production-ready files:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── CompressionPreview.jsx
│   │   ├── CompressionPreview.css
│   │   ├── CompressionSettings.jsx
│   │   └── CompressionSettings.css
│   ├── utils/
│   │   └── base64ImageStorage.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Usage

1. Click "Choose Image" to upload an image
2. Adjust compression settings using presets or custom options
3. Click "Open Compression Preview" to see the compression result
4. Compare original and compressed images side by side
5. Download either the original or compressed version

## Compression Settings

- **Max Width/Height**: Maximum dimensions for the compressed image
- **Quality**: Compression quality (0.1 - 1.0)
- **Format**: Output format (JPEG, PNG, WebP)
- **Maintain Aspect Ratio**: Keep original image proportions

## Technologies Used

- React 18
- Vite
- CSS3
