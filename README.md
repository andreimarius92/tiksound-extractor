# TikSound Extractor

A web application that downloads TikTok videos, checks if they have original sound (not overlayed), and extracts the original sound as MP3 for download.

## Features

- ✅ TikTok URL validation
- ✅ Original sound detection
- ✅ Video download using yt-dlp
- ✅ Audio extraction using FFmpeg
- ✅ Modern React frontend with TailwindCSS
- ✅ Rate limiting and security
- ✅ Automatic file cleanup

## Prerequisites

Before running the application, make sure you have the following installed:

1. **Node.js** (v16 or higher)
2. **yt-dlp** - Install with: `pip install yt-dlp`
3. **FFmpeg** - Install with:
   - macOS: `brew install ffmpeg`
   - Ubuntu/Debian: `sudo apt install ffmpeg`
   - Windows: Download from https://ffmpeg.org/download.html

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Paste a TikTok video URL in the input field
3. Click "Extract Sound"
4. If the video has original sound, you'll get a download link for the MP3

## API Endpoints

### POST /extract
Extract audio from a TikTok video.

**Request:**
```json
{
  "url": "https://www.tiktok.com/@username/video/1234567890"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "originalSound": true,
  "downloadUrl": "http://localhost:3001/audio_1234567890.mp3",
  "message": "Original sound detected! You can download the MP3."
}
```

**Response (Overlayed Sound):**
```json
{
  "status": "success",
  "originalSound": false,
  "message": "This video has overlayed sound and cannot be extracted."
}
```

## Project Structure

```
tiktok/
├── backend/
│   ├── index.js              # Main server file
│   ├── download.js           # Video download logic
│   ├── extractAudio.js       # Audio extraction logic
│   ├── utils/
│   │   └── checkOriginalSound.js  # Original sound detection
│   ├── downloads/            # Temporary files storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── index.js         # React entry point
│   │   ├── index.css        # TailwindCSS styles
│   │   └── config.js        # Configuration
│   ├── public/
│   └── package.json
└── README.md
```

## Security Features

- Rate limiting: 1 request per 10 seconds per IP
- URL validation for TikTok links only
- Automatic cleanup of temporary files after 10 minutes
- Input sanitization

## Troubleshooting

### Common Issues

1. **"yt-dlp not found" error**
   - Make sure yt-dlp is installed: `pip install yt-dlp`
   - Verify it's in your PATH: `which yt-dlp`

2. **"FFmpeg not found" error**
   - Install FFmpeg for your operating system
   - Verify installation: `ffmpeg -version`

3. **CORS errors**
   - Make sure the backend is running on port 3001
   - Check that the frontend is configured to use the correct API URL

4. **Download fails**
   - Check your internet connection
   - Verify the TikTok URL is valid and accessible
   - Some videos may be region-locked or private

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # Starts development server with hot reload
```

## Production Deployment

### Backend
- Deploy to services like Render, Fly.io, or Heroku
- Set environment variables for production
- Configure proper CORS settings

### Frontend
- Build the production version: `npm run build`
- Deploy to Vercel, Netlify, or similar services
- Update API URL in production

## License

MIT License - feel free to use this project for your own purposes.
