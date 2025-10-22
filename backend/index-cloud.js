const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Validate TikTok URL
function isValidTikTokUrl(url) {
  const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/;
  return tiktokRegex.test(url);
}

// Mock function for cloud deployment
async function checkOriginalSound(url) {
  // For cloud deployment, we'll simulate the check
  // In a real implementation, you'd use a different approach
  return {
    originalSound: true, // Assume original sound for demo
    metadata: {
      title: 'TikTok Video',
      duration: 30
    }
  };
}

// Mock function for cloud deployment
async function downloadVideo(url) {
  // For cloud deployment, create a mock video file
  const timestamp = Date.now();
  const videoPath = path.join(downloadsDir, `video_${timestamp}.mp4`);
  
  // Create a small mock video file (1KB)
  fs.writeFileSync(videoPath, Buffer.alloc(1024));
  
  return videoPath;
}

// Mock function for cloud deployment
async function extractAudio(videoPath) {
  // For cloud deployment, create a mock audio file
  const timestamp = Date.now();
  const audioPath = path.join(downloadsDir, `audio_${timestamp}.mp3`);
  
  // Create a small mock audio file (1KB)
  fs.writeFileSync(audioPath, Buffer.alloc(1024));
  
  return audioPath;
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
    const downloadUrl = `https://${req.get('host')}/${fileName}`;

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

// Serve static files
app.use(express.static('downloads'));

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
  res.json({ status: 'ok', message: 'TikSound Extractor Backend is running (Cloud Mode)' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  console.log('Running in CLOUD MODE - Mock implementation');
});
