const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

/**
 * Download TikTok video using yt-dlp
 * @param {string} url - TikTok video URL
 * @returns {Promise<string>} - Path to downloaded video file
 */
async function downloadVideo(url) {
  return new Promise((resolve, reject) => {
    const downloadsDir = path.join(__dirname, 'downloads');
    const timestamp = Date.now();
    const outputTemplate = path.join(downloadsDir, `video_${timestamp}.%(ext)s`);

    const ytdlp = spawn('yt-dlp', [
      '--output', outputTemplate,
      '--format', 'best[height<=720]', // Limit quality for faster processing
      '--no-playlist',
      url
    ]);

    let errorOutput = '';

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp download error:', errorOutput);
        reject(new Error(`Failed to download video: ${errorOutput}`));
        return;
      }

      // Find the downloaded file
      findDownloadedFile(downloadsDir, timestamp)
        .then(filePath => {
          if (filePath) {
            console.log(`Video downloaded: ${filePath}`);
            resolve(filePath);
          } else {
            reject(new Error('Downloaded file not found'));
          }
        })
        .catch(reject);
    });

    ytdlp.on('error', (error) => {
      console.error('yt-dlp spawn error:', error);
      reject(new Error('Failed to run yt-dlp. Make sure it is installed.'));
    });
  });
}

/**
 * Find the downloaded video file
 * @param {string} downloadsDir - Downloads directory path
 * @param {number} timestamp - Timestamp used in filename
 * @returns {Promise<string|null>} - Path to downloaded file or null
 */
async function findDownloadedFile(downloadsDir, timestamp) {
  try {
    const files = await fs.readdir(downloadsDir);
    const videoFile = files.find(file => 
      file.startsWith(`video_${timestamp}`) && 
      (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'))
    );
    
    return videoFile ? path.join(downloadsDir, videoFile) : null;
  } catch (error) {
    console.error('Error finding downloaded file:', error);
    return null;
  }
}

module.exports = { downloadVideo };
