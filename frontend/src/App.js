import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tiksound-extractor-1.onrender.com';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const isValidTikTokUrl = (url) => {
    const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/;
    return tiktokRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return;
    }

    if (!isValidTikTokUrl(url)) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Sending request to:', `${API_BASE_URL.replace(/\/$/, '')}/extract`);
      console.log('Request data:', { url: url.trim() });
      
      const response = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/extract`, {
        url: url.trim()
      });

      console.log('Response received:', response.data);
      setResult(response.data);
    } catch (err) {
      console.error('Request failed:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait 10 seconds before trying again.');
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Something went wrong. Please try again. Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      // Force download by creating a link with download attribute
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = `tiktok_sound_${Date.now()}.mp3`;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDirectDownload = () => {
    if (result?.downloadUrl) {
      // Direct download using fetch
      fetch(result.downloadUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `tiktok_sound_${Date.now()}.mp3`;
          link.style.display = 'none';
          
          // Force download by setting attributes
          link.setAttribute('download', `tiktok_sound_${Date.now()}.mp3`);
          link.setAttribute('type', 'audio/mpeg');
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          window.URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error('Download failed:', error);
          // Fallback to direct link
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `tiktok_sound_${Date.now()}.mp3`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    }
  };

  const resetForm = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TikSound Extractor</h1>
          <p className="text-white/80">Extract original sounds from TikTok videos</p>
        </div>

        {/* Main Card */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-white mb-2">
                TikTok Video URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username/video/..."
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Extract Sound'
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-6 space-y-4">
              {result.originalSound ? (
                <div className="p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-green-300 font-semibold">Original Sound Detected!</h3>
                  </div>
                  <p className="text-green-200 text-sm mb-4">
                    {result.message || 'You can download the MP3 file.'}
                  </p>
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <p className="text-blue-200 text-xs">
                      📱 <strong>Mobile users:</strong> Tap "Open Download Link" and then tap the download button in your browser.
                    </p>
                    <p className="text-green-200 text-xs mt-2">
                      💡 <strong>Tip:</strong> Use "Download MP3 (Direct)" for automatic download to your device.
                    </p>
                    <p className="text-yellow-200 text-xs mt-2">
                      ⚠️ <strong>Note:</strong> Cloud version provides demo functionality. For real audio extraction, run locally.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleDirectDownload}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      📥 Download MP3 (Direct)
                    </button>
                    <button
                      onClick={handleDownload}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      🔗 Download MP3 (Link)
                    </button>
                    <a
                      href={result.downloadUrl}
                      download={`tiktok_sound_${Date.now()}.mp3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-center"
                    >
                      🌐 Open Download Link
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-yellow-300 font-semibold">Overlayed Sound Detected</h3>
                  </div>
                  <p className="text-yellow-200 text-sm">
                    {result.message || 'This video has overlayed sound and cannot be extracted.'}
                  </p>
                </div>
              )}
              
              <button
                onClick={resetForm}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Extract Another Sound
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Made with ❤️ for content creators
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

