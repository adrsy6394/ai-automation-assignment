const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');

const PORT = 5001;
let server;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsedBody = null;
        try {
          if (data) parsedBody = JSON.parse(data);
        } catch (err) {
          parsedBody = data;
        }
        resolve({
          statusCode: res.statusCode,
          body: parsedBody
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Phase 4 Verification Script ---');

  // Start the server
  server = app.listen(PORT, async () => {
    console.log(`Test server booted on port ${PORT}`);

    try {
      // 1. Test POST /join-subreddit - No Session
      console.log('\n1. Testing POST /join-subreddit without session cookies...');
      const joinNoSession = await request('POST', '/join-subreddit', {
        subreddit: 'javascript',
        username: 'non_existent_user_session'
      });
      console.log(`Status Code: ${joinNoSession.statusCode}`);
      console.log('Response:', joinNoSession.body);
      if (joinNoSession.statusCode === 401 && joinNoSession.body.success === false) {
        console.log('✅ Correctly rejected join attempt without active session.');
      } else {
        throw new Error('Join subreddit session validation failed');
      }

      // 2. Test POST /create-post - No Session
      console.log('\n2. Testing POST /create-post without session cookies...');
      const postNoSession = await request('POST', '/create-post', {
        subreddit: 'javascript',
        title: 'Verification Post Title',
        content: 'Verification content body',
        username: 'non_existent_user_session'
      });
      console.log(`Status Code: ${postNoSession.statusCode}`);
      console.log('Response:', postNoSession.body);
      if (postNoSession.statusCode === 401 && postNoSession.body.success === false) {
        console.log('✅ Correctly rejected post attempt without active session.');
      } else {
        throw new Error('Create post session validation failed');
      }

      // 3. Test Session verification with expired/invalid cookies (Triggers browser automation)
      console.log('\n3. Testing active session verification with dummy invalid cookies...');
      const testUser = 'phase4_verify_dummy';
      const cookieDir = path.join(__dirname, '../cookies');
      if (!fs.existsSync(cookieDir)) {
        fs.mkdirSync(cookieDir);
      }
      const dummyCookiesFile = path.join(cookieDir, `${testUser}_session.json`);
      
      // Write dummy expired/invalid cookie data
      const dummyCookiesData = {
        cookies: [
          {
            name: 'reddit_session',
            value: 'invalid_expired_token_123',
            domain: '.reddit.com',
            path: '/'
          }
        ]
      };
      fs.writeFileSync(dummyCookiesFile, JSON.stringify(dummyCookiesData, null, 2), 'utf8');
      console.log(`Created dummy cookie file for user: ${testUser}`);

      // Call join-subreddit (triggers browser launch, navigation, redirect check, and close)
      console.log('Hitting POST /join-subreddit to trigger session validation...');
      const joinInvalidSession = await request('POST', '/join-subreddit', {
        subreddit: 'javascript',
        username: testUser
      });
      
      console.log(`Status Code: ${joinInvalidSession.statusCode}`);
      console.log('Response:', joinInvalidSession.body);

      // Clean up dummy cookie file
      if (fs.existsSync(dummyCookiesFile)) {
        fs.unlinkSync(dummyCookiesFile);
      }
      console.log('Removed dummy cookie file.');

      if (joinInvalidSession.statusCode === 401 && joinInvalidSession.body.success === false) {
        console.log('✅ Playwright successfully launched, navigated, detected session invalidity, and closed context.');
      } else {
        throw new Error('Failed to detect invalid session redirection');
      }

      console.log('\n🎉 ALL PHASE 4 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
      cleanup(0);
    } catch (err) {
      console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
      cleanup(1);
    }
  });
}

function cleanup(exitCode) {
  if (server) {
    server.close(() => {
      console.log('Test server closed.');
      process.exit(exitCode);
    });
  } else {
    process.exit(exitCode);
  }
}

runTests();
