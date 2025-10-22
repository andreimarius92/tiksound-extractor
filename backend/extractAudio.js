const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

/**
 * Extract audio from video file and convert to MP3
 * @param {string} videoPath - Path to video file
 * @returns {Promise<string>} - Path to extracted MP3 file
 */
async function extractAudio(videoPath) {
  return new Promise((resolve, reject) => {
    const downloadsDir = path.dirname(videoPath);
    const timestamp = Date.now();
    const outputPath = path.join(downloadsDir, `audio_${timestamp}.mp3`);

    console.log(`Extracting audio from: ${videoPath}`);
    console.log(`Output path: ${outputPath}`);

    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-acodec', 'mp3',
      '-ab', '128k',
      '-ac', '2',
      '-ar', '44100',
      '-y', // Overwrite output file
      outputPath
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

      console.log(`Audio extraction completed: ${outputPath}`);
      
      // Verify the file was created and has content
      fs.stat(outputPath)
        .then(stats => {
          if (stats.size > 0) {
            resolve(outputPath);
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

module.exports = { extractAudio };
