# Oysterponds Invoice System — Client Machine Setup Guide

This is a step-by-step guide to set up the application on a **Mac**.

---

## Prerequisites to Install

### 1. Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the big green button) — choose **macOS Installer**
3. Open the downloaded `.pkg` file
4. Follow the installer — click **Continue** through all screens, then **Install**
5. Enter your Mac password when asked, then click **Close**

#### Verify Node.js is installed:
Open **Terminal** (search "Terminal" in Spotlight / Launchpad) and type:
```
node --version
npm --version
```
Both should show a version number (e.g. `v22.x.x` and `10.x.x`).

---

### 2. Install Google Chrome (if not already installed)

The app opens in the default browser. Chrome is recommended.
Download from: **https://www.google.com/chrome**

---

## Setting Up the Application

### Step 1: Copy the Project Folder

Copy the entire `Invoice` folder to the client's Mac. A good location would be:
```
/Users/<username>/OysterpondsApp/
```
So the folder structure looks like:
```
OysterpondsApp/
├── client/
├── server/
├── start-app.command
├── stop-app.command
├── install-dependencies.command
├── USER_GUIDE.md
└── ...
```

---

### Step 2: Make the Scripts Executable

Before the scripts can be double-clicked, they need to be marked as executable.

Open **Terminal** and run:
```bash
cd /Users/<username>/OysterpondsApp
chmod +x start-app.command
chmod +x stop-app.command
chmod +x install-dependencies.command
chmod +x create-admin.command
```

> You only need to do this **once**. After this, the `.command` files can be double-clicked like regular apps.

---

### Step 3: Configure the Environment File

Open the file `server/.env` in **TextEdit** (right-click → Open With → TextEdit) and make sure these settings are correct:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection (Cloud Database - already configured)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Order Configuration
ORDER_NUMBER_START=16000

# Email Configuration (SMTP - for sending invoices)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<email-address>
SMTP_PASS=<app-password>
```

#### What each setting does:

| Setting | Purpose |
|---------|---------|
| `PORT` | The port the backend server runs on (keep as 5000) |
| `MONGODB_URI` | Connection to the cloud database — **already set up, don't change** |
| `ORDER_NUMBER_START` | The starting number for order IDs |
| `SMTP_USER` | The email address used to send invoices |
| `SMTP_PASS` | The app password for the email account |

> **Note:** The database is hosted on **MongoDB Atlas** (cloud). No local database installation is needed. As long as the Mac has internet, it will connect automatically.

---

### Step 4: Install Dependencies

1. **Double-click** `install-dependencies.command`
2. If Mac asks "Are you sure you want to open it?" — click **Open**
3. A Terminal window will open showing the installation progress
4. Wait for it to complete — this may take **3-5 minutes** on first run
5. You should see: `INSTALLATION COMPLETE!`
6. Press Enter to close the window

> **First-time Mac security note:** If you get a message saying the file "can't be opened because it is from an unidentified developer":
> 1. Go to **System Settings → Privacy & Security**
> 2. Scroll down and click **Open Anyway**
> 3. Or right-click the file → click **Open** instead of double-clicking

---

### Step 5: Seed the Database (First Time Only)

This loads the initial products, customers, and harvest locations into the database.

1. Open **Terminal**
2. Navigate to the server folder:
   ```bash
   cd /Users/<username>/OysterpondsApp/server
   ```
3. Run the seed command:
   ```bash
   npm run seed
   ```
4. You should see output like:
   ```
   Connected to database
   Clearing existing data...
   Seeding products...
   Created 6 products
   Seeding harvest locations...
   Created 4 harvest locations
   Seeding customers...
   Created 45 customers
   Seeding sample orders...
   Created 2 sample orders

   ✅ Database seeded successfully!
   ```

> ⚠️ **WARNING:** Running `npm run seed` again will **delete all existing data** and replace it with the starter data. Only run this once during initial setup!

#### What gets seeded:

| Data | Details |
|------|---------|
| **6 Products** | OSC Selects, OSC Grandes, OP Pearls, Torrisi Premium Pearls, Pipe's Cove Darlings, Naked Cowboy |
| **4 Harvest Locations** | P6NY GPT, P8NY OC, P8NY T-10, P8NY T-13 |
| **45 Customers** | All real customer data with custom pricing, contacts, and accounting info |
| **2 Sample Orders** | Test orders to verify everything works |

---

### Step 6: Create Admin User

You need to create the initial admin account to log in.

1. **Double-click** `create-admin.command`
2. A Terminal window will open and run the script
3. You should see:
   ```
   ✅ Admin user created successfully!
   Login credentials:
     Email: admin@oysterponds.com
     Password: admin123
   ```
4. Press Enter to close the window

---

### Step 7: Start the Application

1. **Double-click** `start-app.command`
2. If Mac asks "Are you sure?" — click **Open**
3. A Terminal window will open
4. After about 10-15 seconds, your browser will open to: **http://localhost:8080**
5. You should see the Dashboard!

> **Do not close the Terminal window** while using the app. Minimizing it is fine.

---

### Step 8: Verify Everything Works

Run through this checklist:

- [ ] Dashboard loads and shows stats
- [ ] Click **Customers** — you should see all 45 customers
- [ ] Click **New Order** — you should see the customer dropdown and products
- [ ] Click **Orders** — you should see the 2 sample orders
- [ ] Click **Invoices** — page loads (may be empty until you create invoices)
- [ ] Click **Reports** — page loads with sales data

---

### Step 9: Stop the Application

When done, either:
- **Close the Terminal window** and click **Terminate** when asked
- Or **double-click** `stop-app.command`

---

## Daily Use

After the initial setup, the client only needs to:

1. **Double-click** `start-app.command` to open the app
2. **Close the Terminal window** or double-click `stop-app.command` when done

That's it!

---

## Email Setup for Sending Invoices

The app sends invoices via email using Gmail SMTP. The current setup uses a Gmail account with an **App Password**.

### If you need to change the email account:

1. Go to the Google account: **https://myaccount.google.com/security**
2. Enable **2-Step Verification** (if not already)
3. Go to **App passwords** (search for it in Google Account settings)
4. Generate a new app password for "Mail"
5. Update `server/.env` with:
   ```
   SMTP_USER=new-email@gmail.com
   SMTP_PASS=the-generated-app-password
   ```
6. Restart the application

---

## Troubleshooting

### "Cannot connect to database"
- Make sure the Mac has **internet access** (the database is in the cloud)
- Check that `MONGODB_URI` in `server/.env` is correct

### "Port 5000 already in use"
- On Mac, AirPlay Receiver uses port 5000 by default
- Go to **System Settings → General → AirDrop & Handoff** → turn off **AirPlay Receiver**
- Or run `stop-app.command` and try again

### "Port 8080 already in use"
- Run `stop-app.command` first, then try `start-app.command` again

### "npm is not recognized" or "command not found: node"
- Node.js was not installed properly
- Re-install Node.js from https://nodejs.org and try again

### "Can't open because it is from an unidentified developer"
- Right-click the `.command` file → click **Open**
- Or go to **System Settings → Privacy & Security** → click **Open Anyway**

### "SMTP error / emails not sending"
- Check internet connection
- Verify the email and app password in `server/.env`
- Gmail may block the app — check the Gmail inbox for security alerts

### Page shows blank / won't load
- Wait 15-20 seconds after starting (servers need time)
- Try manually going to **http://localhost:8080** in the browser
- Try refreshing the page (Cmd+R)

---

## Folder Structure Reference

```
Invoice/
├── client/                           ← Frontend (React app)
│   ├── src/                          ← Source code
│   ├── package.json                  ← Frontend dependencies
│   └── vite.config.ts                ← Frontend config (port 8080)
│
├── server/                           ← Backend (Node.js API)
│   ├── src/                          ← Source code
│   │   ├── models/                   ← Database models
│   │   ├── controllers/              ← Business logic
│   │   ├── routes/                   ← API endpoints
│   │   └── utils/
│   │       └── seedData.ts           ← Database seeder
│   ├── .env                          ← Environment settings
│   └── package.json                  ← Backend dependencies
│
├── start-app.command                 ← Double-click to start (Mac)
├── stop-app.command                  ← Double-click to stop (Mac)
├── install-dependencies.command      ← Run once during setup (Mac)
├── start-app.bat                     ← Double-click to start (Windows)
├── stop-app.bat                      ← Double-click to stop (Windows)
├── USER_GUIDE.md                     ← How to use the app
└── SETUP_GUIDE.md                    ← This file
```

---

## Quick Reference — Terminal Commands (for developers)

| Command | Where | What |
|---------|-------|------|
| `npm install` | `/server` | Install backend packages |
| `npm install` | `/client` | Install frontend packages |
| `npm run dev` | `/server` | Start backend dev server (port 5000) |
| `npm run dev` | `/client` | Start frontend dev server (port 8080) |
| `npm run seed` | `/server` | Seed the database (⚠️ deletes existing data) |
| `npm run build` | `/server` | Build TypeScript to JavaScript |

---

## Summary of Setup Steps

| Step | Action | Time |
|------|--------|------|
| 1 | Install Node.js | 5 min |
| 2 | Copy project folder to client Mac | 2 min |
| 3 | Run `chmod +x` on `.command` files | 30 sec |
| 4 | Verify `.env` settings | 1 min |
| 5 | Double-click `install-dependencies.command` | 3-5 min |
| 6 | Run `npm run seed` in Terminal | 30 sec |
| 7 | Double-click `create-admin.command` | 15 sec |
| 8 | Double-click `start-app.command` | 15 sec |
| 9 | Verify everything works | 2 min |
| **Total** | | **~15 min** |
