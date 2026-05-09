// Quick debug: what does the multipart body look like?
const fs = require('fs');
const path = require('path');

const CRLF = '\r\n';
const boundary = '----DebugBound123';
const fieldName = 'profileImage';
const fileName = 'test.jpg';
const fakeFile = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // Minimal JPEG header

const body = Buffer.concat([
  Buffer.from('--' + boundary + CRLF),
  Buffer.from('Content-Disposition: form-data; name="' + fieldName + '"; filename="' + fileName + '"' + CRLF),
  Buffer.from('Content-Type: image/jpeg' + CRLF + CRLF),
  fakeFile,
  Buffer.from(CRLF + '--' + boundary + '--' + CRLF),
]);

console.log('Body hex (first 200 chars):', body.toString('hex').substring(0, 200));
console.log('Body text (first 200 chars):', body.toString('utf8').substring(0, 200));
console.log('Body length:', body.length);
