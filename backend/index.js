const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const rateLimit = require('express-rate-limit');
const { extractAudio } = require('./extractAudio');
const { checkOriginalSound } = require('./utils/checkOriginalSound');
const { downloadVideo } = require('./download');

// Set PATH for yt-dlp and ffmpeg
process.env.PATH = `/Users/andrei/Library/Python/3.9/bin:/Users/andrei/bin:${process.env.PATH}`;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files with proper headers for downloads
app.use('/downloads', express.static('downloads', {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes cache
    }
  }
}));

// Serve files directly from root for easier access
app.use(express.static('downloads', {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'public, max-age=600');
    }
  }
}));

// Rate limiting: 1 request per 10 seconds per IP
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1,
  message: {
    error: 'Too many requests. Please wait 10 seconds before trying again.'
  }
});

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
fs.ensureDirSync(downloadsDir);

// Clean up old files every 10 minutes
setInterval(() => {
  const files = fs.readdirSync(downloadsDir);
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(downloadsDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > tenMinutes) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up old file: ${file}`);
    }
  });
}, 10 * 60 * 1000);

// Validate TikTok URL
function isValidTikTokUrl(url) {
  const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/;
  return tiktokRegex.test(url);
}

// Main extraction endpoint
app.post('/extract', limiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !isValidTikTokUrl(url)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid TikTok URL. Please provide a valid TikTok link.'
      });
    }

    console.log(`Processing TikTok URL: ${url}`);

    // Step 1: Get video metadata
    const metadata = await checkOriginalSound(url);
    
    if (!metadata.originalSound) {
      return res.json({
        status: 'success',
        originalSound: false,
        message: 'This video has overlayed sound and cannot be extracted.'
      });
    }

    // Step 2: Download video
    const videoPath = await downloadVideo(url);
    
    // Step 3: Extract audio
    const audioPath = await extractAudio(videoPath);
    
    // Step 4: Generate download URL
    const fileName = path.basename(audioPath);
    const downloadUrl = `http://localhost:${PORT}/${fileName}`;

    // Clean up video file
    fs.unlinkSync(videoPath);

    res.json({
      status: 'success',
      originalSound: true,
      downloadUrl: downloadUrl,
      message: 'Original sound detected! You can download the MP3.'
    });

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process the video. Please try again.'
    });
  }
});

// Download endpoint with friendly filename
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadsDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set headers for download
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="tiktok_sound_${Date.now()}.mp3"`);
  res.setHeader('Cache-Control', 'public, max-age=600');
  
  // Send file
  res.sendFile(filePath);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TikSound Extractor Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
});
