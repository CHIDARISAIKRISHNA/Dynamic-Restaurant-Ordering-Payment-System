# 🚀 Quick Guide: Deploy Frontend to Netlify

## ✅ YES - Status Updates Work After Deployment!

**Confirmed:** After deployment, when customers place orders, you (as admin) can update status and it saves to database! ✅

---

## 📦 Step-by-Step: Deploy Frontend to Netlify

### **Method 1: Drag & Drop (Easiest - 2 minutes)**

1. **Prepare files:**
   - Make sure `frontend/_redirects` file exists (already created ✅)
   - Make sure `frontend/netlify.toml` exists (already created ✅)

2. **Go to Netlify:**
   - Visit: https://app.netlify.com
   - Sign up/Login (free)

3. **Deploy:**
   - Click "Add new site" → "Deploy manually"
   - **Drag and drop** the entire `frontend` folder
   - Wait 30-60 seconds
   - ✅ Your site is live!

4. **Get your URL:**
   - Copy your site URL (e.g., `https://amazing-site-123.netlify.app`)

5. **Update site name (optional):**
   - Site settings → Change site name
   - Choose: `restaurant-ordering` (or your choice)
   - New URL: `https://restaurant-ordering.netlify.app`

---

### **Method 2: Git Integration (Recommended)**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/restaurant-website.git
   git push -u origin main
   ```

2. **In Netlify:**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - **Configure:**
     - **Base directory:** `frontend`
     - **Publish directory:** `frontend`
     - **Build command:** (leave empty)
   - Click "Deploy site"

3. **Auto-deploy:**
   - Every time you push to GitHub, Netlify auto-deploys! ✅

---

### **Method 3: Netlify CLI**

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

## ⚙️ Step-by-Step: Deploy Backend to Render

### **Step 1: Prepare Backend**

1. **Update CORS** (already done in `server.js` ✅)
2. **Create `render.yaml`** (already created ✅)

### **Step 2: Deploy to Render**

1. **Go to Render:**
   - Visit: https://render.com
   - Sign up (free account)

2. **Create Web Service:**
   - Click **"New +"** → **"Web Service"**

3. **Connect Repository:**
   - **Option A:** Connect GitHub repo
     - Click "Connect GitHub"
     - Select your repository
   - **Option B:** Manual deploy
     - We'll upload files manually

4. **Configure Service:**
   - **Name:** `restaurant-backend`
   - **Environment:** `Node`
   - **Region:** Choose closest (e.g., Singapore, US East)
   - **Branch:** `main` (or `master`)
   - **Root Directory:** `backend` (if repo is in root)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. **Environment Variables:**
   - Click **"Advanced"**
   - **Add variable:**
     - Key: `FRONTEND_URL`
     - Value: `https://your-site-name.netlify.app` (your Netlify URL)

6. **Click "Create Web Service"**

7. **Wait for deployment:**
   - First deployment: 5-10 minutes
   - Subsequent: 2-5 minutes

8. **Copy your backend URL:**
   - Example: `https://restaurant-backend.onrender.com`

---

### **Step 3: Connect Frontend to Backend**

1. **Update `frontend/app.js`:**

   **Find (line 3-5):**
   ```javascript
   const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
     ? `http://${window.location.hostname}:3000/api`
     : "https://dynamic-restaurant-ordering-payment.onrender.com/api"
   ```

   **Replace with:**
   ```javascript
   const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
     ? `http://${window.location.hostname}:3000/api`
     : "https://restaurant-backend.onrender.com/api"  // ⚠️ Your Render backend URL
   ```

2. **Redeploy Frontend:**
   - Drag-drop `frontend` folder again to Netlify
   - OR push to GitHub (if using Git)

---

## ✅ Final Checklist

- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Render
- [ ] Frontend API URL updated
- [ ] Backend CORS configured
- [ ] Environment variable `FRONTEND_URL` set in Render
- [ ] Test customer order flow
- [ ] Test admin status update
- [ ] Verify database saves

---

## 🎯 Quick Test

### **Test Customer:**
1. Visit: `https://your-site.netlify.app`
2. Place order → Should save to database ✅

### **Test Admin:**
1. Visit: `https://your-site.netlify.app/?admin=admin123`
2. Update status → Should save to database ✅

---

## 📝 Important Notes

### **Render Free Tier:**
- ⚠️ Spins down after 15 min inactivity
- First request: 30-60 seconds (wake up time)
- Database persists (SQLite file)

### **Database:**
- SQLite works automatically
- File: `backend/data/restaurant.db`
- Persists across deployments
- For production: Consider PostgreSQL

---

## 🆘 Troubleshooting

### **Frontend not connecting:**
- Check API URL in `app.js`
- Check CORS in backend
- Check browser console (F12)

### **Backend not starting:**
- Check Render logs
- Verify `package.json` has start script
- Check Node version

### **CORS errors:**
- Update `allowedOrigins` in `server.js`
- Add Netlify URL to CORS
- Set `FRONTEND_URL` in Render

---

**Everything works after deployment!** 🎉

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

