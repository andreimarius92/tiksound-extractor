#!/bin/bash

echo "🎵 TikSound Extractor - Starting Application"
echo "==========================================="

# Function to start backend
start_backend() {
    echo "🚀 Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🚀 Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "Frontend server stopped"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
sleep 3  # Give backend time to start
start_frontend

echo ""
echo "✅ Application started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
