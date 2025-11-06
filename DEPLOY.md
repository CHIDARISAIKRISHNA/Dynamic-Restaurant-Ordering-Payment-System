# 🚀 Deploy to Netlify + Render

## Frontend → Netlify | Backend → Render

---

## STEP 1: Deploy Backend to Render

### 1.1 Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Backend for Render"
git remote add origin https://github.com/YOUR_USERNAME/restaurant-backend.git
git push -u origin main
```

### 1.2 Deploy on Render
1. Go to **render.com** → Sign up with GitHub
2. **"New +"** → **"Web Service"**
3. Connect **restaurant-backend** repo
4. Settings:
   - **Root Directory**: `backend` (if repo has both folders)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **"Create Web Service"**
6. Wait 5-10 minutes
7. **Copy URL**: `https://restaurant-api.onrender.com` ← SAVE THIS

**Note**: Server will start even without MySQL (you can add it later)

---

## STEP 2: Update Frontend API URLs

**Edit `frontend/app.js` (line 5):**
```javascript
const API_BASE_URL = "https://your-render-url.onrender.com/api"
```

**Edit `frontend/admin.js` (line 3):**
```javascript
const API_BASE_URL = "https://your-render-url.onrender.com/api"
```

*(Replace with YOUR Render URL)*

---

## STEP 3: Deploy Frontend to Netlify

### 3.1 Push to GitHub
```bash
cd frontend
git init
git add .
git commit -m "Frontend for Netlify"
git remote add origin https://github.com/YOUR_USERNAME/restaurant-frontend.git
git push -u origin main
```

### 3.2 Deploy on Netlify
1. Go to **netlify.com** → Sign up with GitHub
2. **"Add new site"** → **"Import an existing project"**
3. Select **restaurant-frontend** repo
4. Settings:
   - **Base directory**: `frontend` (if repo has both)
   - **Build command**: (leave empty)
   - **Publish directory**: `.`
5. Click **"Deploy site"**
6. **Copy URL**: `https://your-site.netlify.app` ← SAVE THIS

---

## STEP 4: Update CORS

1. Render dashboard → Your service → **"Environment"** tab
2. Add:
   ```
   FRONTEND_URL = https://your-site.netlify.app
   ```
3. Save (auto redeploys)

---

## ✅ DONE!

- **Users**: `https://your-site.netlify.app` ✅
- **Admin**: `https://your-site.netlify.app/admin` (password: admin123) ✅

---

## 📝 How It Works (No SQL Needed!)

**Orders are stored in JSON files:**
- `backend/data/orders.json` - All orders
- `backend/data/order_items.json` - Order items

**Admin can update order status:**
- Orders saved automatically when customer places order
- Admin can update status (pending → confirmed → preparing → ready → delivered)
- All changes saved to JSON files (no database needed!)

---

## 🎯 What Works Now:

- ✅ Menu displays
- ✅ Users can browse and place orders
- ✅ Orders saved to JSON files automatically
- ✅ Admin can access `/admin` page
- ✅ Admin can view all orders
- ✅ Admin can update order status
- ✅ All data persists in JSON files

**No MySQL/SQL needed - everything works with file storage!**

---

## 📝 Add MySQL Later (Optional)

If you want to use MySQL instead of JSON files:

1. Get free MySQL from **Aiven** or **PlanetScale**
2. Add to Render Environment Variables:
   ```
   DB_HOST = your-mysql-host
   DB_PORT = 3306
   DB_USER = your-username
   DB_PASSWORD = your-password
   DB_NAME = restaurant
   ```
3. System will automatically use MySQL instead of JSON files ✅
