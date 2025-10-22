#!/bin/bash

echo "🧪 TikSound Extractor - Test Script"
echo "==================================="

# Test if backend is running
echo "Testing backend health..."
BACKEND_RESPONSE=$(curl -s http://localhost:3001/health 2>/dev/null)
if [ $? -eq 0 ] && echo "$BACKEND_RESPONSE" | grep -q "ok"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && npm start"
    exit 1
fi

# Test if frontend is accessible
echo "Testing frontend accessibility..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible. Please start it first:"
    echo "   cd frontend && npm start"
    exit 1
fi

# Test API endpoint with a sample TikTok URL
echo "Testing API endpoint..."
API_RESPONSE=$(curl -s -X POST http://localhost:3001/extract \
    -H "Content-Type: application/json" \
    -d '{"url":"https://www.tiktok.com/@test/video/1234567890"}' 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ API endpoint is responding"
    echo "Response: $API_RESPONSE"
else
    echo "❌ API endpoint test failed"
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "To use the application:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Paste a TikTok video URL"
echo "3. Click 'Extract Sound'"
