# Deployment Guide for Render

This guide will help you deploy the Restaurant Website to Render.

## Deployment Steps

### 1. Prepare Your Repository
Make sure all your code is committed and pushed to GitHub/GitLab/Bitbucket.

### 2. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Configure the service:
   - **Name**: `saikrishna-restaurant`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (Render automatically sets this, but we specify it)

5. Click **"Create Web Service"**

### 3. After Deployment

Once deployed, you'll get:
- **User URL**: `https://saikrishna-restaurant.onrender.com`
- **Admin URL**: `https://saikrishna-restaurant.onrender.com/admin`

### 4. Custom Domain (Optional)

If you want to use `saikrishna-restaurant.render.com`:
1. Go to your service settings
2. Click **"Custom Domains"**
3. Add your custom domain

## Project Structure

```
├── backend/
│   ├── server.js          # Main server (serves frontend + API)
│   ├── routes/            # API routes
│   ├── models/            # Data models
│   ├── services/          # AI services
│   └── data/              # JSON data files
├── frontend/
│   ├── index.html         # Main user page
│   ├── admin.html         # Admin panel
│   ├── app.js             # Frontend JavaScript
│   └── styles.css         # Styles
└── render.yaml            # Render configuration
```

## How It Works

- The backend server serves both the frontend files and the API
- Frontend is accessible at the root URL
- Admin panel is accessible at `/admin`
- API endpoints are at `/api/*`
- All frontend files are served as static files from the `frontend/` directory

## Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Automatically set by Render (default: 10000)

## Notes

- The project uses JSON file storage (no database needed)
- All data is stored in `backend/data/` directory
- The frontend automatically detects if it's running on localhost or production
- API calls use the same origin when deployed (since backend serves frontend)

