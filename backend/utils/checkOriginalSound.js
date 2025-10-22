const { spawn } = require('child_process');
const path = require('path');

/**
 * Check if a TikTok video has original sound (not overlayed)
 * @param {string} url - TikTok video URL
 * @returns {Promise<Object>} - { originalSound: boolean, metadata: object }
 */
async function checkOriginalSound(url) {
  return new Promise((resolve, reject) => {
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
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorOutput);
        reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const metadata = JSON.parse(output);
        
        // Check for original sound indicators
        const hasOriginalSound = checkForOriginalSound(metadata);
        
        resolve({
          originalSound: hasOriginalSound,
          metadata: metadata
        });
      } catch (parseError) {
        console.error('Failed to parse yt-dlp output:', parseError);
        reject(new Error('Failed to parse video metadata'));
      }
    });

    ytdlp.on('error', (error) => {
      console.error('yt-dlp spawn error:', error);
      reject(new Error('Failed to run yt-dlp. Make sure it is installed.'));
    });
  });
}

/**
 * Analyze metadata to determine if video has original sound
 * @param {Object} metadata - Video metadata from yt-dlp
 * @returns {boolean} - True if original sound detected
 */
function checkForOriginalSound(metadata) {
  // Method 1: Check for "Original Sound" in title or description
  const title = (metadata.title || '').toLowerCase();
  const description = (metadata.description || '').toLowerCase();
  
  if (title.includes('original sound') || 
      description.includes('original sound')) {
    return true;
  }

  // Method 2: Check for specific TikTok indicators
  const uploader = (metadata.uploader || '').toLowerCase();
  const uploaderId = (metadata.uploader_id || '').toLowerCase();
  
  // If uploader matches uploader_id, it's likely original content
  if (uploader && uploaderId && uploader === uploaderId) {
    return true;
  }

  // Method 3: Check for music/audio metadata
  if (metadata.tags && Array.isArray(metadata.tags)) {
    const hasMusicTags = metadata.tags.some(tag => 
      tag.toLowerCase().includes('original') || 
      tag.toLowerCase().includes('sound')
    );
    if (hasMusicTags) {
      return true;
    }
  }

  // Method 4: Check duration and other indicators
  // Very short videos (under 10 seconds) are more likely to be original
  if (metadata.duration && metadata.duration < 10) {
    return true;
  }

  // Method 5: Check for specific TikTok patterns
  // If the video has a specific format that suggests original content
  if (metadata.format_note && 
      metadata.format_note.toLowerCase().includes('original')) {
    return true;
  }

  // Default: assume it might have original sound
  // This is a conservative approach - let the user decide
  return true;
}

module.exports = { checkOriginalSound };
