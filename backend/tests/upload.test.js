/**
 * Member 3 Upload System — Complete Test Suite
 * Tests all upload endpoints: auth, validation, Cloudinary upload, delete, SSR page
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
let AUTH_TOKEN = '';

// ─── HTTP Helper ───
function httpRequest(method, urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// ─── JSON Request Helper ───
function jsonRequest(method, urlPath, jsonBody, extraHeaders = {}) {
  const data = JSON.stringify(jsonBody);
  return httpRequest(method, urlPath, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      ...extraHeaders,
    },
    body: data,
  });
}

// ─── Multipart Upload Helper (same pattern as working cloudinary-upload.test.js) ───
function uploadFile(urlPath, fieldName, filePath, token) {
  const boundary = '----FormBoundary' + Date.now().toString(16);
  const fileBuffer = fs.readFileSync(filePath);
  const CRLF = '\r\n';

  const multipartBody = Buffer.concat([
    Buffer.from('--' + boundary + CRLF),
    Buffer.from('Content-Disposition: form-data; name="' + fieldName + '"; filename="' + path.basename(filePath) + '"' + CRLF),
    Buffer.from('Content-Type: image/jpeg' + CRLF + CRLF),
    fileBuffer,
    Buffer.from(CRLF + '--' + boundary + '--' + CRLF),
  ]);

  return httpRequest('POST', urlPath, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': multipartBody.length,
    },
    body: multipartBody,
  });
}

// ─── Create Test Image ───
function createTestImage() {
  const imgPath = path.join(__dirname, 'test-suite-image.jpg');
  const jpegBase64 =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
    'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy' +
    'MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEB' +
    'AxEB/8QAFwABAAMAAAAAAAAAAAAAAAAABAUGB//EACUQAAIBAwMDBQEAAAAAAAAAAAECAwQFEQAGIRIx' +
    'QQcTImFxUf/EABYBAQEBAAAAAAAAAAAAAAAAAAIDBP/EABgRAAMBAQAAAAAAAAAAAAAAAAACEQEh/9oA' +
    'DAMBAAIRAxEAPwBNtba17v8AcYKK1Uy1FaRlI2mCFj+Z7DTm89g7i21aJa2mpKinlHwlpqhXVv3H' +
    'OD+50z9JNoXux2C4Vu4IvYuFwZGMXkoi9gT9kn+caY+ouya7d9npILbVU0E1NMJgZ2KqwxggkA+Q' +
    'daw2mlJC//2Q==';
  fs.writeFileSync(imgPath, Buffer.from(jpegBase64, 'base64'));
  return imgPath;
}

// ─── Test Runner ───
async function runTests() {
  const results = [];
  const testImage = createTestImage();

  function record(name, pass, extra = '') {
    results.push({ name, pass });
    console.log(`${pass ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  }

  console.log('🧪 Member 3 Upload System — Complete Test Suite\n');
  console.log('='.repeat(58));

  // TEST 1: Server health
  try {
    const res = await httpRequest('GET', '/api/features');
    record('TEST 1:  Server is running', res.status === 200, `status ${res.status}`);
  } catch (e) {
    record('TEST 1:  Server is running', false, e.message);
    console.log('\n⛔ Server not reachable. Aborting.\n');
    process.exit(1);
  }

  // TEST 2: Get auth token
  try {
    let res = await jsonRequest('POST', '/api/auth/signup', {
      firstName: 'Suite', lastName: 'Tester', email: 'suite-tester@test.com', password: 'test123456',
    });
    if (res.status === 409) {
      res = await jsonRequest('POST', '/api/auth/login', {
        email: 'suite-tester@test.com', password: 'test123456',
      });
    }
    AUTH_TOKEN = res.data?.token || '';
    record('TEST 2:  Get auth token', !!AUTH_TOKEN, `status ${res.status}`);
  } catch (e) {
    record('TEST 2:  Get auth token', false, e.message);
  }

  // TEST 3: Profile upload without auth → 401
  try {
    const res = await httpRequest('POST', '/api/upload/profile-image');
    record('TEST 3:  Profile upload (no auth) → 401', res.status === 401, `status ${res.status}`);
  } catch (e) {
    record('TEST 3:  Profile upload (no auth) → 401', false, e.message);
  }

  // TEST 4: Skill upload without auth → 401
  try {
    const res = await httpRequest('POST', '/api/upload/skill-image');
    record('TEST 4:  Skill upload (no auth) → 401', res.status === 401, `status ${res.status}`);
  } catch (e) {
    record('TEST 4:  Skill upload (no auth) → 401', false, e.message);
  }

  // TEST 5: Profile upload with auth, no file → 400
  try {
    const res = await jsonRequest('POST', '/api/upload/profile-image', {}, {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    });
    record('TEST 5:  Profile upload (no file) → 400', res.status === 400, `"${res.data?.message}"`);
  } catch (e) {
    record('TEST 5:  Profile upload (no file) → 400', false, e.message);
  }

  // TEST 6: Profile image upload to Cloudinary → 200
  try {
    const res = await uploadFile('/api/upload/profile-image', 'profileImage', testImage, AUTH_TOKEN);
    const pass = res.status === 200 && res.data?.success === true;
    const url = res.data?.data?.imageUrl || '';
    record('TEST 6:  Profile image → Cloudinary → 200', pass, pass ? url : `status ${res.status}: ${res.data?.message || res.data?.error}`);
  } catch (e) {
    record('TEST 6:  Profile image → Cloudinary → 200', false, e.message);
  }

  // TEST 7: Skill image upload to Cloudinary → 200
  try {
    const res = await uploadFile('/api/upload/skill-image', 'skillImage', testImage, AUTH_TOKEN);
    const pass = res.status === 200 && res.data?.success === true;
    const url = res.data?.data?.imageUrl || '';
    record('TEST 7:  Skill image → Cloudinary → 200', pass, pass ? url : `status ${res.status}: ${res.data?.message || res.data?.error}`);
  } catch (e) {
    record('TEST 7:  Skill image → Cloudinary → 200', false, e.message);
  }

  // TEST 8: Delete image without publicId → 400
  try {
    const res = await jsonRequest('DELETE', '/api/upload/image', {}, {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    });
    record('TEST 8:  Delete image (no publicId) → 400', res.status === 400, `"${res.data?.message}"`);
  } catch (e) {
    record('TEST 8:  Delete image (no publicId) → 400', false, e.message);
  }

  // TEST 9: Delete image with fake publicId → 404
  try {
    const res = await jsonRequest('DELETE', '/api/upload/image', { publicId: 'fake/nonexistent-12345' }, {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    });
    record('TEST 9:  Delete image (fake publicId) → 404', res.status === 404, `status ${res.status}`);
  } catch (e) {
    record('TEST 9:  Delete image (fake publicId) → 404', false, e.message);
  }

  // TEST 10: SSR /upload page without auth → 401
  try {
    const res = await httpRequest('GET', '/upload');
    record('TEST 10: SSR /upload (no auth) → 401', res.status === 401, `status ${res.status}`);
  } catch (e) {
    record('TEST 10: SSR /upload (no auth) → 401', false, e.message);
  }

  // ─── Summary ───
  console.log('\n' + '='.repeat(58));
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  if (passed === total) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('\n❌ Failed:');
    results.filter(r => !r.pass).forEach(r => console.log(`   - ${r.name}`));
    console.log('');
  }

  // Cleanup
  try { fs.unlinkSync(testImage); } catch {}
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => { console.error('Error:', err); process.exit(1); });
