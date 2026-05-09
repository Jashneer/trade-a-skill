const http = require('http');
const fs = require('fs');
const path = require('path');

async function httpRequest(method, urlPath, options = {}) {
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

async function run() {
  console.log('=== Cloudinary Upload Integration Test ===\n');

  // Step 1: Login
  const loginBody = JSON.stringify({ email: 'upload-tester@test.com', password: 'test123456' });
  const loginRes = await httpRequest('POST', '/api/auth/login', {
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) },
    body: loginBody,
  });

  if (!loginRes.data.token) {
    console.log('❌ Login failed:', loginRes.data);
    return;
  }
  const token = loginRes.data.token;
  console.log('✅ Login successful, got JWT token\n');

  // Step 2: Create test image (valid tiny JPEG)
  const imgPath = path.join(__dirname, 'cloudinary-test.jpg');
  const jpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFwABAAMAAAAAAAAAAAAAAAAABAUGB//EACUQAAIBAwMDBQEAAAAAAAAAAAECAwQFEQAGIRIxQQcTImFxUf/EABYBAQEBAAAAAAAAAAAAAAAAAAIDBP/EABgRAAMBAQAAAAAAAAAAAAAAAAACEQEh/9oADAMBAAIRAxEAPwBNtba17v8AcYKK1Uy1FaRlI2mCFj+Z7DTm89g7i21aJa2mpKinlHwlpqhXVv3HOD+50z9JNoXux2C4Vu4IvYuFwZGMXkoi9gT9kn+caY+ouya7d9npILbVU0E1NMJgZ2KqwxggkA+Qdaw2mlJC//2Q==';
  fs.writeFileSync(imgPath, Buffer.from(jpegBase64, 'base64'));
  console.log('📁 Created test image:', fs.statSync(imgPath).size, 'bytes\n');

  // Step 3: Upload profile image
  console.log('--- Test: Profile Image Upload to Cloudinary ---');
  const boundary = '----FormBoundary' + Date.now().toString(16);
  const fileBuffer = fs.readFileSync(imgPath);

  const multipartBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="profileImage"; filename="test.jpg"\r\n`),
    Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await httpRequest('POST', '/api/upload/profile-image', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': multipartBody.length,
    },
    body: multipartBody,
  });

  console.log('Status:', uploadRes.status);
  if (uploadRes.status === 200 && uploadRes.data.success) {
    console.log('✅ Profile image uploaded successfully!');
    console.log('   Cloudinary URL:', uploadRes.data.data.imageUrl);
    console.log('   User profileImage updated:', !!uploadRes.data.data.user);
  } else {
    console.log('❌ Upload failed:', JSON.stringify(uploadRes.data, null, 2));
  }

  // Step 4: Upload skill image
  console.log('\n--- Test: Skill Image Upload to Cloudinary ---');
  const boundary2 = '----FormBoundary' + (Date.now() + 1).toString(16);
  const multipartBody2 = Buffer.concat([
    Buffer.from(`--${boundary2}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="skillImage"; filename="skill.jpg"\r\n`),
    Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary2}--\r\n`),
  ]);

  const skillRes = await httpRequest('POST', '/api/upload/skill-image', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary2}`,
      'Content-Length': multipartBody2.length,
    },
    body: multipartBody2,
  });

  console.log('Status:', skillRes.status);
  if (skillRes.status === 200 && skillRes.data.success) {
    console.log('✅ Skill image uploaded successfully!');
    console.log('   Cloudinary URL:', skillRes.data.data.imageUrl);
  } else {
    console.log('❌ Upload failed:', JSON.stringify(skillRes.data, null, 2));
  }

  // Cleanup
  try { fs.unlinkSync(imgPath); } catch {}

  console.log('\n=== Done ===');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
