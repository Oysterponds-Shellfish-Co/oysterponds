#!/bin/bash

echo "============================================"
echo "   STOPPING OYSTERPONDS INVOICE SYSTEM"
echo "============================================"
echo ""

echo "Stopping Node.js processes..."

# Kill all node processes related to our app
pkill -f "npm run dev" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo ""
echo "All processes stopped successfully!"
echo ""
read -p "Press Enter to exit..."
