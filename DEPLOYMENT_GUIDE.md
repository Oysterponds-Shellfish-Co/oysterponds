# Oysterponds Invoice System — Cloud Deployment Guide

Deploy your app online: **Railway** (backend) + **Vercel** (frontend).

---

## Overview

| Component | Service | Cost |
|-----------|---------|------|
| **Backend (API)** | [Railway](https://railway.app) | $5 free trial credit, then $5/month + usage |
| **Frontend (React)** | [Vercel](https://vercel.com) | Free (Hobby plan) |
| **Database** | [MongoDB Atlas](https://cloud.mongodb.com) | Already set up ✅ |

> **Railway Advantage over Render:** No cold starts — your backend is always running and responds instantly. Railway charges based on usage but gives $5 free credit to start.

---

## PREREQUISITES

Before starting, make sure:
- [ ] You have a **GitHub** account
- [ ] Your code is pushed to a **GitHub repository**

### Push Code to GitHub (if not already done):

1. Go to **https://github.com** → Sign in
2. Click **+** (top right) → **New repository**
3. Name: `oysterponds-invoice` → Select **Private** → Click **Create repository**
4. Open a terminal in your project root and run:

```bash
cd "D:\FIVERR CLIENT PROJECTS, ZAID\Invoice"
```

5. Create a `.gitignore` file in the project root (if not exists):

```
node_modules/
dist/
.env
uploads/
```

6. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/oysterponds-invoice.git
git push -u origin main
```

---

## STEP 1: Deploy Backend on Railway

### 1.1 — Create a Railway Account

1. Go to **https://railway.app**
2. Click **Login** → Sign in with **GitHub**
3. You'll get **$5 free trial credit** (no credit card needed)

### 1.2 — Create a New Project

1. Click **New Project** on the Railway dashboard
2. Select **Deploy from GitHub repo**
3. Select your `oysterponds-invoice` repository
4. Railway will ask which folder — we need to configure this

### 1.3 — Configure the Service

After connecting the repo:

1. Click on the service that was created
2. Go to the **Settings** tab
3. Set these values:

| Setting | Value |
|---------|-------|
| **Root Directory** | `/server` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

> **Note:** If Railway auto-detects a Dockerfile in the server folder, it will use Docker automatically. This is fine — it will install Chromium for PDF generation.

### 1.4 — Add Environment Variables

1. Click on the service → go to **Variables** tab
2. Click **New Variable** and add each of these:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://arslan:arslanbtw123@cluster0.zch7zc8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `JWT_SECRET` | `generate-a-long-random-string-here` |
| `CLIENT_URL` | _(leave blank for now — we'll add after deploying frontend)_ |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` |

> **Tip:** You can also click **RAW Editor** and paste all variables at once in `KEY=VALUE` format.

### 1.5 — Generate a Public Domain

By default Railway services don't have a public URL. You need to generate one:

1. Click on the service → **Settings** tab
2. Scroll to **Networking** section
3. Click **Generate Domain**
4. Railway will give you a URL like: `https://oysterponds-invoice-production.up.railway.app`

**Copy this URL** — you'll need it for the frontend.

### 1.6 — Wait for Deployment

1. Go to the **Deployments** tab
2. Watch the build logs — first build takes about **5-8 minutes** (Docker + Chromium install)
3. Once you see "Deployment succeeded" ✅, test it:
   - Open: `https://YOUR-RAILWAY-URL.up.railway.app/api/products`
   - You should see JSON data (or an empty array if not seeded yet)

---

## STEP 2: Deploy Frontend on Vercel

### 2.1 — Create a Vercel Account

1. Go to **https://vercel.com**
2. Click **Sign Up** → Sign in with **GitHub**
3. Select the **Hobby** plan (free)

### 2.2 — Import the Project

1. From the Vercel dashboard, click **Add New...** → **Project**
2. Find and select your `oysterponds-invoice` repository
3. Click **Import**

### 2.3 — Configure the Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | Click **Edit** → type `client` → click **Continue** |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |

### 2.4 — Add Environment Variable

Expand **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api` |

> ⚠️ Replace with your **actual Railway URL** from Step 1.5. Make sure it ends with `/api`.

### 2.5 — Deploy

1. Click **Deploy**
2. Wait for the build — takes about **1-2 minutes**
3. Vercel will give you a URL like: `https://oysterponds-invoice.vercel.app`
4. Click it — you should see your Dashboard! 🎉

---

## STEP 3: Connect Backend CORS to Frontend

Now go back to **Railway** and update the CORS setting:

1. Open your Railway project
2. Click on the backend service
3. Go to **Variables** tab
4. Update or add:

| Variable | Value |
|----------|-------|
| `CLIENT_URL` | `https://oysterponds-invoice.vercel.app` |

> ⚠️ Use your **actual Vercel URL**. No trailing slash.

5. Railway will auto-redeploy with the new variable

---

## STEP 4: Seed the Database & Create Admin

Run these commands from your **local machine** (make sure your `.env` connects to the cloud DB):

```bash
cd "D:\FIVERR CLIENT PROJECTS, ZAID\Invoice\server"

# 1. Seed products/customers
npm run seed

# 2. Create admin user
npm run create-admin
```

You should see:
```
✅ Admin user created successfully!
Email: admin@oysterponds.com
Password: admin123
```

> ⚠️ Only run seed **once**. Running it again deletes all existing data. Admin creation is safe to run anytime (it checks if admin exists).

---

## STEP 5: Test Everything

Open your Vercel URL and test:

- [ ] Dashboard loads and shows stats
- [ ] Click **Customers** — see all 45 customers
- [ ] Click **New Order** — customer dropdown + products load
- [ ] Create a test order → verify it shows in **Orders**
- [ ] Deliver the order → generate an **Invoice**
- [ ] Download the invoice **PDF** (tests Puppeteer on Railway)
- [ ] **Send email** invoice (tests SMTP)
- [ ] **Mark invoice as paid** with check number
- [ ] Check **Reports** — sales data shows
- [ ] Click **Export Excel** — file downloads

---

## STEP 6: Custom Domain (Optional)

### Vercel (Frontend):
1. Go to Vercel project → **Settings** → **Domains**
2. Click **Add** → type your custom domain (e.g. `invoices.oysterponds.com`)
3. Vercel shows DNS records — add them at your domain registrar
4. Wait for DNS to propagate (5 min - 48 hours)

### Railway (Backend):
1. Go to Railway service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain (e.g. `api.oysterponds.com`)
3. Add the DNS records Railway shows

### After adding custom domains, update:
- Railway `CLIENT_URL` → your frontend custom domain
- Vercel `VITE_API_URL` → your backend custom domain + `/api`

---

## Architecture

```
┌─────────────────────┐
│   Client's Browser  │
│   (Any device)      │
└──────┬──────┬───────┘
       │      │
       ▼      ▼
┌──────────┐  ┌───────────────────────┐
│  Vercel  │  │       Railway         │
│ Frontend │  │       Backend         │
│  (React) │──│  (Node.js + Express)  │
│  Static  │  │  + Puppeteer (PDFs)   │
│  Files   │  │  + Nodemailer (Email) │
│  FREE    │  │  $5 credit / $5 mo    │
└──────────┘  └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    MongoDB Atlas      │
              │    (Cloud Database)   │
              │    FREE (M0 Tier)     │
              └───────────────────────┘
```

---

## Railway vs Render vs Vercel — Why This Combo?

| Feature | Railway | Render (Free) | Vercel |
|---------|---------|---------------|--------|
| **Cold starts** | ❌ None | ⚠️ 30-50 sec after 15 min idle | ❌ None |
| **Docker support** | ✅ Yes | ✅ Yes | ❌ No |
| **Custom domains** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Backend hosting** | ✅ Great | ✅ Good (sleeps) | ❌ Serverless only |
| **Frontend hosting** | ✅ OK | ✅ OK | ✅ Best (Edge CDN) |
| **Free tier** | $5 credit | 750 hrs/month | Unlimited |
| **Paid plan** | $5/mo + usage | $7/mo | $20/mo |
| **Puppeteer/PDF** | ✅ Docker | ✅ Docker | ❌ Not supported |

**Railway for backend** = no cold starts + Docker for Puppeteer
**Vercel for frontend** = fastest static hosting with edge CDN

---

## Costs Breakdown

### Free Trial:
- Railway: **$5 free credit** (lasts ~2-3 weeks with light usage)
- Vercel: **Free forever** (Hobby plan)
- MongoDB Atlas: **Free forever** (M0 tier)

### After Trial:
- Railway Hobby: **$5/month** + ~$1-3/month usage = **~$6-8/month**
- Vercel: **$0/month**
- MongoDB Atlas: **$0/month**
- **Total: ~$6-8/month**

---

## Troubleshooting

### Backend deploy fails on Railway
- Check **Deployment Logs** in Railway dashboard
- Make sure there's a `Dockerfile` in the `server/` folder
- Verify all environment variables are set

### "Network Error" or no data on frontend
- Check `VITE_API_URL` in Vercel matches your Railway URL exactly
- Must end with `/api` (e.g. `https://xxx.up.railway.app/api`)
- Check `CLIENT_URL` in Railway matches your Vercel URL exactly

### PDF download not working
- Check Railway logs for Puppeteer errors
- Make sure `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` is set
- The Dockerfile must install Chromium

### CORS errors in browser console
- `CLIENT_URL` in Railway must match your Vercel frontend URL exactly
- Include `https://` but NO trailing slash
- ✅ `https://oysterponds-invoice.vercel.app`
- ❌ `https://oysterponds-invoice.vercel.app/`

### Emails not sending
- Check `SMTP_USER` and `SMTP_PASS` in Railway variables
- Make sure it's a Gmail **App Password**, not your regular password
- Check Gmail inbox for security alerts

### Railway running out of credits
- Check usage at **https://railway.app** → **Usage**
- Upgrade to Hobby plan ($5/month) for continued use

---

## Quick Reference URLs

| What | URL |
|------|-----|
| **Your Frontend** | `https://oysterponds-invoice.vercel.app` |
| **Your Backend API** | `https://YOUR-URL.up.railway.app/api` |
| **Railway Dashboard** | `https://railway.app/dashboard` |
| **Vercel Dashboard** | `https://vercel.com/dashboard` |
| **MongoDB Atlas** | `https://cloud.mongodb.com` |
| **GitHub Repo** | `https://github.com/YOUR_USERNAME/oysterponds-invoice` |
