#!/bin/bash

echo "============================================"
echo "   OYSTERPONDS INVOICE SYSTEM"
echo "============================================"
echo ""
echo "Starting the application... Please wait."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    read -p "Press Enter to exit..."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start the backend server in background
echo "[1/3] Starting backend server..."
cd "$SCRIPT_DIR/server"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "[2/3] Waiting for server to initialize..."
sleep 5

# Start the frontend in background
echo "[3/3] Starting frontend..."
cd "$SCRIPT_DIR/client"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 8

# Open the browser
echo ""
echo "============================================"
echo "   APPLICATION STARTED SUCCESSFULLY!"
echo "============================================"
echo ""
echo "Opening browser..."
open "http://localhost:8080"

echo ""
echo "The app is now running!"
echo ""
echo "To STOP the application, press Ctrl+C"
echo "or close this window."
echo ""
echo "============================================"
echo "   DO NOT CLOSE THIS WINDOW"
echo "============================================"
echo ""

# Wait for user to stop
wait
