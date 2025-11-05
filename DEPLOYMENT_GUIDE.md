# 🚀 Complete Deployment Guide

## ✅ Status Update Confirmation

**YES!** After deployment:
- ✅ Customer places order → Saved to database
- ✅ Admin updates status → **Saves to database immediately**
- ✅ Status persists across sessions
- ✅ All admins see updated status

**Everything works exactly like local development!**

---

## 📦 Deployment Overview

- **Frontend:** Netlify (Free hosting)
- **Backend:** Render (Free tier available)
- **Database:** SQLite (included with Render) or MySQL (Render PostgreSQL)

---

# 🎨 PART 1: Deploy Frontend to Netlify

## Step 1: Prepare Frontend

### 1.1 Update API URL

Edit `frontend/app.js` (around line 3-5):

**Find:**
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : "https://dynamic-restaurant-ordering-payment.onrender.com/api"
```

**Replace with your Render backend URL:**
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : "https://your-backend-name.onrender.com/api"  // ⚠️ Change this to your Render URL
```

### 1.2 Create `_redirects` File (Important!)

Create a new file: `frontend/_redirects`

**Content:**
```
/*    /index.html   200
```

This ensures React/SPA routing works correctly.

### 1.3 Optional: Create `netlify.toml`

Create `frontend/netlify.toml`:

```toml
[build]
  publish = "."
  command = "echo 'No build needed'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Step 2: Deploy to Netlify

### Method 1: Drag & Drop (Easiest)

1. **Go to:** https://app.netlify.com
2. **Sign up/Login** (free account)
3. **Drag and drop** the `frontend` folder onto Netlify
4. **Wait for deployment** (30-60 seconds)
5. **Copy your site URL** (e.g., `https://random-name-123.netlify.app`)

### Method 2: Git Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/restaurant-website.git
   git push -u origin main
   ```

2. **In Netlify:**
   - Click "New site from Git"
   - Connect GitHub
   - Select your repository
   - **Build settings:**
     - Base directory: `frontend`
     - Publish directory: `frontend`
     - Build command: (leave empty or `echo "No build needed"`)
   - Click "Deploy site"

### Method 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

---

## Step 3: Configure Netlify

### 3.1 Update Site Name

1. Go to **Site settings** → **Change site name**
2. Choose a custom name (e.g., `restaurant-ordering`)
3. Your URL: `https://restaurant-ordering.netlify.app`

### 3.2 Add Environment Variables (if needed)

**Site settings** → **Environment variables** → **Add variable**
- No variables needed for basic setup

---

## Step 4: Test Frontend

1. Visit your Netlify URL
2. Open browser console (F12)
3. Check for errors
4. Test placing an order
5. Verify API calls to backend

---

# ⚙️ PART 2: Deploy Backend to Render

## Step 1: Prepare Backend

### 1.1 Update CORS Settings

Edit `backend/server.js`:

**Find:**
```javascript
app.use(cors())
```

**Replace with:**
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'https://your-site-name.netlify.app',  // ⚠️ Change to your Netlify URL
    'https://*.netlify.app'  // Allows all Netlify subdomains
  ],
  credentials: true
}))
```

### 1.2 Update Port Configuration

Edit `backend/server.js`:

**Find:**
```javascript
const PORT = process.env.PORT || 3000;
```

**Keep as is** - Render automatically sets PORT

### 1.3 Create `render.yaml` (Optional)

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: restaurant-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### 1.4 Create `.renderignore` (Optional)

Create `backend/.renderignore`:

```
node_modules/
.git/
*.log
.DS_Store
```

---

## Step 2: Deploy to Render

### 2.1 Create Render Account

1. Go to: https://render.com
2. Sign up (free account)
3. Connect GitHub (optional but recommended)

### 2.2 Create Web Service

1. Click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - If using Git: Connect GitHub repo
   - If not: We'll use manual deploy

3. **Configure Service:**
   - **Name:** `restaurant-backend` (or your choice)
   - **Environment:** `Node`
   - **Region:** Choose closest to you
   - **Branch:** `main` (or `master`)
   - **Root Directory:** `backend` (if repo is in root)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Environment Variables:**
   - Click **"Advanced"** → **"Add Environment Variable"**
   - No variables needed for basic setup (SQLite works automatically)

5. **Click "Create Web Service"**

6. **Wait for deployment** (5-10 minutes first time)

7. **Copy your service URL** (e.g., `https://restaurant-backend.onrender.com`)

---

## Step 3: Configure Render Backend

### 3.1 Update CORS with Netlify URL

1. Go to **Environment** tab
2. Add variable:
   - Key: `FRONTEND_URL`
   - Value: `https://your-site-name.netlify.app`

3. Update `backend/server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  process.env.FRONTEND_URL || 'https://your-site-name.netlify.app',
  'https://*.netlify.app'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed.replace('*', '')))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
```

### 3.2 Database Setup

**Option A: SQLite (Simple - Default)**
- Database file: `backend/data/restaurant.db`
- Created automatically on first run
- Works out of the box

**Option B: PostgreSQL (Recommended for production)**
- In Render dashboard: **"New +"** → **"PostgreSQL"**
- Name: `restaurant-db`
- Copy connection string
- Update `backend/config/database.js` to use PostgreSQL

---

## Step 4: Connect Frontend to Backend

### 4.1 Update Frontend API URL

Edit `frontend/app.js`:

**Find:**
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : "https://dynamic-restaurant-ordering-payment.onrender.com/api"
```

**Replace with:**
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : "https://your-backend-name.onrender.com/api"  // ⚠️ Your Render backend URL
```

### 4.2 Redeploy Frontend

1. Update `frontend/app.js` with backend URL
2. Push to Git or drag-drop to Netlify again
3. Wait for deployment

---

# 🔗 PART 3: Final Configuration

## Step 1: Test Everything

### Test Customer Flow:
1. Visit Netlify URL (without `?admin=`)
2. Fill customer name + phone
3. Select items
4. Generate bill
5. Place order
6. ✅ Order should save to database

### Test Admin Flow:
1. Visit: `https://your-site.netlify.app/?admin=admin123`
2. Admin panel should appear
3. See all orders
4. Update order status
5. ✅ Status should save to database

---

## Step 2: Important Notes

### Render Free Tier:
- ⚠️ **Spins down after 15 minutes of inactivity**
- First request takes 30-60 seconds to wake up
- Consider upgrading for always-on service

### Database Persistence:
- SQLite file persists on Render
- Data survives deployments
- For production: Consider PostgreSQL

### CORS Issues:
- Make sure CORS includes your Netlify URL
- Check browser console for errors
- Verify backend is accessible

---

## Step 3: Troubleshooting

### Frontend not connecting to backend:
1. Check API URL in `app.js`
2. Check CORS settings in backend
3. Check browser console (F12)
4. Verify backend is running on Render

### Admin panel not appearing:
1. Use URL: `?admin=admin123`
2. Check browser console for errors
3. Verify admin password in code

### Orders not saving:
1. Check backend logs on Render
2. Verify database file exists
3. Check API endpoint is accessible

---

## 📋 Deployment Checklist

- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Render
- [ ] API URL updated in frontend
- [ ] CORS configured in backend
- [ ] Netlify URL added to CORS
- [ ] Admin password changed (if needed)
- [ ] Test customer order flow
- [ ] Test admin status update
- [ ] Verify database saves data

---

## 🎯 Quick Reference

### Frontend (Netlify):
- URL: `https://your-site-name.netlify.app`
- Admin: `https://your-site-name.netlify.app/?admin=admin123`

### Backend (Render):
- URL: `https://your-backend-name.onrender.com`
- API: `https://your-backend-name.onrender.com/api`

### Database:
- File: `backend/data/restaurant.db` (SQLite)
- Or: PostgreSQL on Render

---

**Everything will work after deployment!** ✅

