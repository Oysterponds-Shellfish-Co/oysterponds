# Oysterponds Invoice System

## Quick Start Guide (For Non-Technical Users)

### First Time Setup
1. Make sure **Node.js** is installed on your computer
   - Download from: https://nodejs.org (choose the LTS version)
   - Run the installer and follow the prompts

2. Double-click **`install-dependencies.bat`**
   - Wait for all dependencies to install
   - This only needs to be done once

### Starting the Application
1. Double-click **`start-app.bat`**
2. Wait for the browser to open automatically
3. The app will be running at: http://localhost:5173

### Stopping the Application
1. Double-click **`stop-app.bat`**
   - This will close all running processes

### Troubleshooting

**"Node.js is not installed" error:**
- Download and install Node.js from https://nodejs.org
- Restart your computer after installation
- Try running `install-dependencies.bat` again

**App doesn't open in browser:**
- Wait a bit longer (10-15 seconds)
- Manually open your browser and go to: http://localhost:5173

**"Port already in use" error:**
- Run `stop-app.bat` first
- Then try `start-app.bat` again

### Important Files
- `start-app.bat` - Starts the application
- `stop-app.bat` - Stops the application
- `install-dependencies.bat` - First-time setup (run once)

---

## For Developers

### Manual Start
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

### Environment Variables
Backend environment variables are in `server/.env`

### MongoDB
This application requires MongoDB to be running. Make sure your MongoDB connection string is correctly configured in `server/.env`
