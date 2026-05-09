# API Configuration Instructions

## Problem
The frontend is deployed on Vercel, but the backend API is not deployed to a publicly accessible location. When the frontend tries to make API requests, it fails because there's no backend running at the expected URL.

## Solution

### Option 1: Deploy Backend Separately (Recommended for Flexibility)

1. **Deploy backend to a service** (e.g., Render, Railway, Vercel, Heroku):
   - Backend can be deployed to: https://your-backend-url.com
   
2. **Set environment variable in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_BACKEND_URL=https://your-backend-url.com`

3. **Ensure CORS is configured** in `backend/server.js`:
   ```javascript
   app.use(cors({
     origin: ['https://your-frontend-url.vercel.app', 'your-backend-url.com'],
     credentials: true
   }));
   ```

### Option 2: Deploy Both Frontend and Backend Together

Deploy the entire project (frontend + backend) to Vercel using a monorepo setup with `vercel.json`.

1. Create/update `vercel.json` in the root folder
2. Configure it to build and deploy both frontend and backend

### Current Setup

**Local Development (Working):**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Vite proxy routes `/api/*` to localhost:5000 ✓

**Production (Currently Broken):**
- Frontend: https://trade-a-skill-r5lu.vercel.app
- Backend: ??? (not deployed)
- Requests fail because `/api/*` tries to hit the Vercel domain

## Environment Variables

### Frontend (.env or via Vercel Dashboard)
```
VITE_BACKEND_URL=https://your-backend-url.com
```

If not set, it defaults to the current domain (Vercel), which won't work.

### Backend (.env)
Ensure these are set:
```
MONGO_URI=your_mongodb_uri
DATABASE_URL=your_postgresql_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
PORT=5000
NODE_ENV=production
```
