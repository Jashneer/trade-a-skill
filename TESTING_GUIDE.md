<<<<<<< HEAD
# Integration Test Suite - Implementation Guide

## Overview

A comprehensive Jest + Supertest integration test suite has been created to validate the dual-database system (MongoDB + PostgreSQL via Prisma). The test suite covers all QA requirements from Member 4.

## File Location

📍 **File Created:** `backend/tests/integration.test.js`

## Test Coverage

### ✅ 1. Authentication Test (MongoDB)
- **Route Tested:** `POST /api/auth/signup`
- **What it does:** 
  - Creates a user in MongoDB
  - Verifies JWT token is generated
  - Validates user data is correctly stored
  - Tests error cases (duplicate email, missing fields)
- **Key Assertions:**
  - User exists in MongoDB after signup
  - JWT token is valid and decodable
  - Password is NOT returned in response
  - Duplicate emails return 409 Conflict

### ✅ 2. Cross-Database Test (MongoDB + PostgreSQL)
- **Routes Tested:** `GET /api/skills` and `POST /api/skills`
- **What it does:**
  - Verifies PostgreSQL connection works via Prisma
  - Tests skill creation while MongoDB user is active
  - Confirms both databases are operational simultaneously
- **Key Assertions:**
  - GET /api/skills returns data from PostgreSQL
  - POST /api/skills creates records in PostgreSQL
  - Protected endpoint requires JWT token
  - Skill data persists in PostgreSQL

### ✅ 3. Profile Update Test (PostgreSQL via Prisma)
- **Route Tested:** `PATCH /api/users/:id`
- **What it does:**
  - Creates test user in PostgreSQL
  - Updates user profile with new data
  - Validates changes persist in database
  - Tests password protection (rejects password updates)
- **Key Assertions:**
  - Profile updates reflect in PostgreSQL
  - Password update attempts are rejected with 400
  - Updated fields persist across queries

### ✅ 4. Authentication Middleware Test (JWT Protection)
- **Routes Tested:** All protected endpoints
- **What it does:**
  - Tests 401 responses when JWT is missing
  - Validates token validation logic
  - Tests expired tokens
  - Checks malformed authorization headers
- **Key Assertions:**
  - Missing JWT returns 401 Unauthorized
  - Invalid JWT returns 401
  - Expired JWT returns 401 (Token expired)
  - Malformed headers return 401

### ✅ 5. Data Cleanup (Automatic)
- **What it does:**
  - Automatically deletes test data from MongoDB using Mongoose
  - Automatically deletes test data from PostgreSQL using Prisma
  - Runs in the `afterAll()` hook after all tests complete
- **Key Features:**
  - Uses unique test emails (timestamp-based) to avoid conflicts
  - Proper error handling if cleanup fails
  - Disconnect from both databases after tests

### ✅ 6. Integration Consistency Tests
- Tests concurrent requests to both databases
- Validates transaction integrity
- Ensures seamless cross-database operations

## Required Environment Variables

Make sure your `.env` file includes:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/trade-a-skill

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/trade_a_skill

# JWT
JWT_SECRET=trade-a-skill-jwt-secret

# Server
PORT=5000
ADMIN_EMAIL=admin@gmail.com
```

## How to Run the Tests

### Run All Tests
```bash
npm test
```

### Run Only Integration Tests
```bash
npm test -- integration.test.js
```

### Run with Verbose Output
```bash
npm test -- --verbose
```

### Run a Specific Test Suite
```bash
npm test -- --testNamePattern="Authentication Tests"
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

## Test Execution Timeline

Each test suite runs in sequence:

1. **Setup** (beforeAll)
   - Connect to MongoDB
   - Initialize Prisma client
   - Generate unique test email

2. **Authentication Tests** (~5-10 seconds)
   - Signup test
   - Duplicate email test
   - Missing fields test

3. **Cross-Database Tests** (~5-10 seconds)
   - GET skills test
   - POST skills test
   - Protected route test

4. **Profile Update Tests** (~5-10 seconds)
   - Each test creates/deletes a test user

5. **Middleware Tests** (~5 seconds)
   - Multiple authorization validation tests

6. **Data Cleanup Tests** (verification)

7. **Integration Consistency Tests** (~5-10 seconds)

8. **Cleanup** (afterAll)
   - Delete test user from MongoDB
   - Delete test skills from PostgreSQL
   - Disconnect from databases

**Total Estimated Time:** 2-3 minutes

## Cleanup Strategy

### Automatic Cleanup (in afterAll hook)
```javascript
// MongoDB - Using Mongoose
await User.findByIdAndDelete(testUserId);

// PostgreSQL - Using Prisma
await prisma.skill.delete({ where: { id: testSkillId } });
```

### Test Data Isolation
- Each test uses a unique email: `test-user-${timestamp}@test.local`
- No conflicts with existing user data
- Safe to run tests multiple times

### Manual Cleanup (if needed)
```javascript
// Delete specific user from MongoDB
const User = require('./models/User');
await User.deleteOne({ email: 'test@test.local' });

// Delete specific skill from PostgreSQL
const prisma = require('./lib/prisma')();
await prisma.skill.delete({ where: { id: 1 } });
```

## Key Test Features

| Feature | Implementation |
|---------|-----------------|
| **Database Connections** | beforeAll hook initializes both MongoDB and Prisma |
| **Test Isolation** | Each test uses unique timestamps for emails |
| **Error Handling** | Comprehensive error messages for failures |
| **Cleanup** | afterAll hook handles cleanup with error catching |
| **JWT Testing** | Creates real tokens and tests validation |
| **Concurrent Requests** | Promise.all() tests simultaneous DB access |
| **Timeout Safety** | 30s timeout for database operations |

## Expected Test Output

```
 PASS  tests/integration.test.js
  Trade-a-Skill Integration Tests - Dual Database System
    Authentication Tests
      ✓ POST /api/auth/signup should create a user in MongoDB and return JWT token (XXms)
      ✓ POST /api/auth/signup with duplicate email should return 409 Conflict (XXms)
      ✓ POST /api/auth/signup with missing required fields should return 400 Bad Request (XXms)
    Cross-Database Tests (MongoDB + PostgreSQL)
      ✓ GET /api/skills should return skills from PostgreSQL (XXms)
      ✓ POST /api/skills (protected) should create skill in PostgreSQL with valid JWT (XXms)
      ✓ POST /api/skills (protected) should require JWT token (XXms)
    Profile Update Tests (Prisma PostgreSQL)
      ✓ PATCH /api/users/:id with JWT should update user profile in PostgreSQL (XXms)
      ✓ PATCH /api/users/:id should reject password updates (XXms)
    Authentication Middleware Tests
      ✓ Protected route without JWT token should return 401 Unauthorized (XXms)
      ✓ Protected route with invalid JWT token should return 401 Unauthorized (XXms)
      ✓ Protected route with malformed Authorization header should return 401 (XXms)
      ✓ Protected route with expired JWT should return 401 Unauthorized (XXms)
      ✓ PATCH /api/users without JWT should return 401 Unauthorized (XXms)
    Data Cleanup Tests
      ✓ Test user should be deleted from MongoDB after test completion (XXms)
      ✓ Test skill should be deleted from PostgreSQL after test completion (XXms)
    Integration Consistency Tests
      ✓ Should handle concurrent requests to MongoDB and PostgreSQL (XXms)
      ✓ Should maintain transaction integrity across both databases (XXms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

## Troubleshooting

### Issue: "Cannot find module 'supertest'"
**Solution:** Install dev dependencies
```bash
npm install --save-dev supertest
```

### Issue: Connection Refused to MongoDB/PostgreSQL
**Solution:** 
- Ensure MongoDB is running: `mongod`
- Ensure PostgreSQL is running
- Check DATABASE_URL and MONGODB_URI are correct

### Issue: "Authentication required" errors in all tests
**Solution:** 
- Ensure JWT_SECRET is set in .env
- Check that authVerify middleware is properly configured

### Issue: Tests timeout
**Solution:**
- Increase timeout: `npm test -- --testTimeout=60000`
- Check database connections are working
- Verify network connectivity to databases

## Continuous Integration

To run these tests in CI/CD pipelines:

```bash
# Example GitHub Actions
- name: Run Integration Tests
  run: npm test -- --coverage --testTimeout=60000
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Maintenance

### Adding New Tests
1. Add test inside appropriate `describe` block
2. Use `testUserEmail` or generate unique email for isolation
3. Save IDs of created resources
4. Add cleanup in the `afterAll` hook if needed

### Updating Endpoints
If API routes change, update the test routes accordingly:
```javascript
// OLD
.post('/api/auth/signup')

// NEW
.post('/api/auth/v2/signup')
```

### Database Schema Changes
If database schemas change:
1. Update the payloads in tests
2. Update Prisma/Mongoose schema
3. Update assertions to match new fields

## Next Steps

1. **Run the tests:** `npm test`
2. **Review output:** Check all 18 tests pass
3. **Integrate to CI/CD:** Add test command to pipeline
4. **Monitor:** Track test execution in CI logs
5. **Maintain:** Update tests as API changes

---

**Created By:** Member 4 (QA Lead)  
**Date:** 2026-05-09  
**Test Type:** Integration Test Suite  
**Coverage:** Dual-Database System (MongoDB + PostgreSQL)
=======
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
>>>>>>> 63158154381ac718497006d21e439c5efbd894dd
