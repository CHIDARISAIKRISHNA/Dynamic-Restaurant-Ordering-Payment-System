# Render Deployment Instructions

## Quick Deploy Steps

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Go to Render Dashboard**: https://dashboard.render.com

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select the repository

4. **Configure Service**:
   - **Name**: `saikrishna-restaurant`
   - **Environment**: `Node`
   - **Root Directory**: `backend` (or leave empty if render.yaml is in root)
   - **Build Command**: `npm install` (or leave empty if using render.yaml)
   - **Start Command**: `npm start` (or leave empty if using render.yaml)
   - **Environment Variables**:
     - `NODE_ENV` = `production`

5. **Click "Create Web Service"**

6. **Wait for deployment** (takes 2-5 minutes)

## After Deployment

You'll get these URLs:
- **User Site**: `https://saikrishna-restaurant.onrender.com`
- **Admin Panel**: `https://saikrishna-restaurant.onrender.com/admin`

## Custom Domain Setup

To get `saikrishna-restaurant.render.com`:

1. Go to your service settings in Render
2. Click "Custom Domains"
3. Add domain: `saikrishna-restaurant.render.com`
4. Follow DNS instructions if needed

## How It Works

- Backend serves both frontend files and API
- Frontend files are served from `/frontend` directory
- API endpoints are at `/api/*`
- Admin panel is at `/admin`
- All routes work the same as local development

## Important Notes

- Render automatically sets the PORT environment variable
- The server uses `process.env.PORT` (defaults to 3000 for local)
- Frontend automatically detects production and uses same-origin API
- All data is stored in JSON files (no database needed)

