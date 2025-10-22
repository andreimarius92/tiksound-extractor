const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Accept all origins for now
  credentials: true
}));
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

// Real function to check original sound
async function checkOriginalSound(url) {
  return new Promise((resolve, reject) => {
    
    console.log('Checking original sound for:', url);
    
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-download',
      url
    ]);

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp output:', output);
      errorOutput += output;
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorOutput);
        reject(new Error(`Failed to run yt-dlp. Make sure it is installed.`));
        return;
      }

      try {
        const metadata = JSON.parse(output);
        console.log('Video metadata:', metadata);
        
        // Check if video has original sound (not overlayed)
        const hasOriginalSound = !metadata.title?.includes('original sound') || 
                                metadata.description?.includes('original sound');
        
        resolve({
          originalSound: hasOriginalSound,
          metadata: {
            title: metadata.title || 'TikTok Video',
            duration: metadata.duration || 30,
            uploader: metadata.uploader || 'Unknown'
          }
        });
      } catch (error) {
        console.error('Error parsing metadata:', error);
        reject(new Error('Failed to parse video metadata'));
      }
    });

    ytdlp.on('error', (error) => {
      console.error('yt-dlp spawn error:', error);
      reject(new Error(`Failed to run yt-dlp: ${error.message}`));
    });
  });
}

// Real function to download video
async function downloadVideo(url) {
  return new Promise((resolve, reject) => {
    
    const timestamp = Date.now();
    const videoPath = path.join(downloadsDir, `video_${timestamp}.mp4`);
    
    console.log('Downloading video:', url);
    console.log('Output path:', videoPath);
    
    const ytdlp = spawn('yt-dlp', [
      '-o', videoPath,
      '--format', 'best[height<=720]',
      '--no-playlist',
      url
    ]);

    let errorOutput = '';

    ytdlp.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp output:', output);
      errorOutput += output;
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorOutput);
        reject(new Error(`Video download failed: ${errorOutput}`));
        return;
      }

      console.log('Video downloaded:', videoPath);
      resolve(videoPath);
    });

    ytdlp.on('error', (error) => {
      console.error('yt-dlp spawn error:', error);
      reject(new Error(`Failed to run yt-dlp: ${error.message}`));
    });
  });
}

// Real function to extract audio
async function extractAudio(videoPath) {
  return new Promise((resolve, reject) => {
    
    const timestamp = Date.now();
    const audioPath = path.join(downloadsDir, `audio_${timestamp}.mp3`);
    
    console.log('Extracting audio from:', videoPath);
    console.log('Output path:', audioPath);
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-acodec', 'mp3',
      '-ab', '128k',
      '-ac', '2',
      '-ar', '44100',
      '-y', // Overwrite output file
      audioPath
    ]);

    let errorOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('FFmpeg output:', output);
      errorOutput += output;
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('FFmpeg error:', errorOutput);
        reject(new Error(`Audio extraction failed with code ${code}: ${errorOutput}`));
        return;
      }

      console.log('Audio extraction completed:', audioPath);
      
      // Verify the file was created and has content
      fs.stat(audioPath)
        .then(stats => {
          if (stats.size > 0) {
            resolve(audioPath);
          } else {
            reject(new Error('Extracted audio file is empty'));
          }
        })
        .catch(error => {
          reject(new Error(`Failed to verify extracted audio: ${error.message}`));
        });
    });

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg spawn error:', error);
      reject(new Error(`Failed to run FFmpeg: ${error.message}`));
    });
  });
}

// Main extraction endpoint
app.post('/extract', limiter, async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { url } = req.body;

    if (!url || !isValidTikTokUrl(url)) {
      console.log('Invalid URL:', url);
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

// Root endpoint - Landing page
app.get('/', (req, res) => {
  res.json({
    message: '🎵 TikSound Extractor Backend API',
    status: 'running',
    mode: 'cloud',
    endpoints: {
      health: '/health',
      extract: 'POST /extract',
      download: 'GET /download/:filename'
    },
    usage: {
      extract: 'POST /extract with {"url": "tiktok_url"}',
      download: 'GET /download/filename.mp3'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TikSound Extractor Backend is running (Cloud Mode)' });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  console.log('Running in CLOUD MODE - Mock implementation');
});
