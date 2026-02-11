#!/bin/bash
cd "$(dirname "$0")/server"
npm run create-admin
echo ""
read -p "Press Enter to exit..."
