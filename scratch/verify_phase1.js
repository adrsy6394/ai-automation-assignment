const path = require('path');
const fs = require('fs');

// Load .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const logger = require('../src/utils/logger');
const cookieManager = require('../src/utils/cookieManager');

console.log('--- Phase 1 Verification Script ---');

// 1. Verify environment variables
console.log('\n1. Verifying environment variables...');
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

if (process.env.PORT === '5000' && process.env.NODE_ENV === 'development') {
  console.log('✅ Environment variables loaded successfully.');
} else {
  console.error('❌ Environment variables failed to load correctly.');
  process.exit(1);
}

// 2. Verify Logging
console.log('\n2. Verifying logging utility...');
logger.info('Verification test info message');
logger.warn('Verification test warning message');
logger.error('Verification test error message');

const logFilePath = path.join(__dirname, '../logs/app.log');
if (fs.existsSync(logFilePath)) {
  const content = fs.readFileSync(logFilePath, 'utf8');
  if (content.includes('Verification test info message') &&
      content.includes('Verification test warning message') &&
      content.includes('Verification test error message')) {
    console.log('✅ Logging file verification successful.');
  } else {
    console.error('❌ Log file does not contain verification messages.');
    process.exit(1);
  }
} else {
  console.error('❌ Log file not created.');
  process.exit(1);
}

// 3. Verify Cookie Manager
console.log('\n3. Verifying cookie manager...');
const testUser = 'verify_test_user';
const testCookies = [
  { name: 'session_id', value: 'xyz123', domain: 'reddit.com' },
  { name: 'auth_token', value: 'abc456', domain: 'reddit.com' }
];

// Save cookies
const saveSuccess = cookieManager.saveCookies(testUser, testCookies);
if (saveSuccess) {
  console.log('✅ Cookies saved successfully.');
} else {
  console.error('❌ Failed to save cookies.');
  process.exit(1);
}

// Load cookies
const loadedCookies = cookieManager.loadCookies(testUser);
if (loadedCookies && loadedCookies.length === 2 && loadedCookies[0].name === 'session_id') {
  console.log('✅ Cookies loaded successfully and match expected content.');
} else {
  console.error('❌ Failed to load cookies or content mismatch.');
  process.exit(1);
}

// Clean up test cookie file
const cookieFilePath = path.join(__dirname, `../cookies/${testUser}_session.json`);
if (fs.existsSync(cookieFilePath)) {
  fs.unlinkSync(cookieFilePath);
  console.log('✅ Temporary verification cookie file cleaned up.');
}

console.log('\n🎉 ALL PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
