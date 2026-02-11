#!/bin/bash

echo "============================================"
echo "   OYSTERPONDS INVOICE SYSTEM"
echo "   FIRST TIME INSTALLATION"
echo "============================================"
echo ""
echo "This will install all required dependencies."
echo "Please wait, this may take a few minutes..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "============================================"
    echo "   ERROR: Node.js is not installed!"
    echo "============================================"
    echo ""
    echo "Please download and install Node.js from:"
    echo "   https://nodejs.org"
    echo ""
    echo "After installing, run this script again."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Node.js found: $(node --version)"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install backend dependencies
echo "============================================"
echo "[1/3] Installing backend dependencies..."
echo "============================================"
cd "$SCRIPT_DIR/server"
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    read -p "Press Enter to exit..."
    exit 1
fi
echo "Backend dependencies installed successfully!"
echo ""

# Build backend TypeScript
echo "============================================"
echo "[2/3] Building backend..."
echo "============================================"
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build backend"
    read -p "Press Enter to exit..."
    exit 1
fi
echo "Backend built successfully!"
echo ""

# Install frontend dependencies
echo "============================================"
echo "[3/3] Installing frontend dependencies..."
echo "============================================"
cd "$SCRIPT_DIR/client"
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    read -p "Press Enter to exit..."
    exit 1
fi
echo "Frontend dependencies installed successfully!"
echo ""

echo "============================================"
echo "   INSTALLATION COMPLETE!"
echo "============================================"
echo ""
echo "You can now run the application by"
echo "double-clicking 'start-app.command'"
echo ""
echo "============================================"
read -p "Press Enter to exit..."
