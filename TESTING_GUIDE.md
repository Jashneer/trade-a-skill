# Member 3 File Upload Testing Guide

## Test Scenarios

### 1. **Test Multer Middleware**
- Location: `backend/middleware/multer.js`
- What to test:
  - Upload file size limit (5MB)
  - Image format validation (only .jpg, .png, .gif allowed)
  - Reject non-image files

### 2. **Test Cloudinary Integration**
- Location: `backend/config/cloudinary.js` and `backend/lib/cloudinaryUpload.js`
- What to test:
  - Credentials are loaded from .env
  - File buffer is converted to image URL
  - Returned URL is secure (https://)

### 3. **Manual Testing Steps**

#### Step 1: Sign Up / Login
1. Go to http://localhost:5173/signup
2. Create an account or login

#### Step 2: Navigate to Profile
1. Go to http://localhost:5173/profile
2. Look for any file upload field (profile picture, skill image, etc.)

#### Step 3: Upload a Test Image
1. Click the file input
2. Select a small image file (.jpg, .png)
3. Check browser console (F12 → Console)
4. Expected: File uploads and returns URL from Cloudinary

#### Step 4: Verify in Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Upload file again
4. Look for multipart/form-data request
5. Response should contain image URL

### 4. **Test File Rejection**
1. Try uploading a non-image file (.txt, .pdf)
2. Expected: Error message "Only image files are allowed!"
3. Try uploading a file > 5MB
4. Expected: Error message "File too large"

### 5. **Environment Variables Check**
```bash
# Check .env file contains:
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value
```

## Expected Results

✅ **Success Indicators:**
- File uploads complete without errors
- Returned URL is from Cloudinary CDN
- Non-image files are rejected
- Large files are rejected

❌ **Error Indicators:**
- "CLOUDINARY_CLOUD_NAME is not defined"
- "Authentication failed"
- File upload timeout
- Returned URL is invalid

## Files to Monitor

### Backend
- `backend/config/cloudinary.js` - Configuration
- `backend/middleware/multer.js` - File handling
- `backend/lib/cloudinaryUpload.js` - Upload logic

### Frontend (When integrated)
- Should use FormData for file submission
- Send as multipart/form-data
- Handle returned image URL

## Running Tests

```bash
# Unit tests
cd backend
npm test

# Dev server
npm run dev

# Check specific endpoints
curl http://localhost:5000/api/users
```

## Debugging Tips

1. **Check Cloudinary credentials**
   ```bash
   echo $CLOUDINARY_CLOUD_NAME  # Should print your cloud name
   ```

2. **Monitor file size**
   - Max: 5MB
   - Test with: 1MB, 5MB, 10MB files

3. **Check MIME types**
   - Allowed: image/jpeg, image/png, image/gif, image/webp
   - Blocked: text/plain, application/pdf, video/mp4

4. **Browser Console Errors**
   - F12 → Console tab
   - Look for network errors or validation errors

## Next Steps

Once Member 2 integrates the routes:
1. Member 2 creates POST /api/upload endpoint
2. Adds the multer middleware
3. Calls uploadToCloudinary() function
4. Returns URL in response

Then test with actual form submission from the site.
