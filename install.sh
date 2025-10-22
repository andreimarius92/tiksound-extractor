#!/bin/bash

echo "🎵 TikSound Extractor - Installation Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ yt-dlp is not installed. Installing..."
    pip install yt-dlp
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install yt-dlp. Please install manually:"
        echo "   pip install yt-dlp"
        exit 1
    fi
else
    echo "✅ yt-dlp is already installed"
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg:"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu/Debian: sudo apt install ffmpeg"
    echo "   Windows: Download from https://ffmpeg.org/download.html"
    exit 1
else
    echo "✅ FFmpeg is already installed"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"

# Create downloads directory
cd ../backend
mkdir -p downloads
echo "✅ Downloads directory created"

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "To start the application:"
echo "1. Start backend: cd backend && npm start"
echo "2. Start frontend: cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
