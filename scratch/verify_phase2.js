const http = require('http');
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
  console.log('--- Phase 2 Verification Script ---');

  // Start the server
  server = app.listen(PORT, async () => {
    console.log(`Test server booted on port ${PORT}`);

    try {
      // 1. Test Root Endpoint
      console.log('\nTesting GET / (Root)...');
      const rootRes = await request('GET', '/');
      console.log(`Status: ${rootRes.statusCode}`, rootRes.body);
      if (rootRes.statusCode === 200 && rootRes.body.message) {
        console.log('✅ Root endpoint working.');
      } else {
        throw new Error('Root endpoint failed');
      }

      // 2. Test Create Account API - Valid
      console.log('\nTesting POST /create-account (Valid Payload)...');
      const createAccValid = await request('POST', '/create-account', {
        username: 'test_account_user',
        email: 'test@example.com',
        password: 'securePassword123'
      });
      console.log(`Status: ${createAccValid.statusCode}`, createAccValid.body);
      if (createAccValid.statusCode === 200 && createAccValid.body.success && createAccValid.body.username === 'test_account_user') {
        console.log('✅ Create Account success mock working.');
      } else {
        throw new Error('Create Account valid payload failed');
      }

      // 3. Test Create Account API - Invalid
      console.log('\nTesting POST /create-account (Invalid Payload)...');
      const createAccInvalid = await request('POST', '/create-account', {
        username: 'test_account_user'
      });
      console.log(`Status: ${createAccInvalid.statusCode}`, createAccInvalid.body);
      if (createAccInvalid.statusCode === 400 && createAccInvalid.body.success === false) {
        console.log('✅ Create Account validation working.');
      } else {
        throw new Error('Create Account validation failed');
      }

      // 4. Test Join Subreddit API - Valid
      console.log('\nTesting POST /join-subreddit (Valid Payload)...');
      const joinValid = await request('POST', '/join-subreddit', {
        subreddit: 'javascript'
      });
      console.log(`Status: ${joinValid.statusCode}`, joinValid.body);
      if (joinValid.statusCode === 200 && joinValid.body.joined === true) {
        console.log('✅ Join Subreddit success mock working.');
      } else {
        throw new Error('Join Subreddit valid payload failed');
      }

      // 5. Test Join Subreddit API - Invalid
      console.log('\nTesting POST /join-subreddit (Invalid Payload)...');
      const joinInvalid = await request('POST', '/join-subreddit', {});
      console.log(`Status: ${joinInvalid.statusCode}`, joinInvalid.body);
      if (joinInvalid.statusCode === 400 && joinInvalid.body.success === false) {
        console.log('✅ Join Subreddit validation working.');
      } else {
        throw new Error('Join Subreddit validation failed');
      }

      // 6. Test Create Post API - Valid
      console.log('\nTesting POST /create-post (Valid Payload)...');
      const createPostValid = await request('POST', '/create-post', {
        subreddit: 'javascript',
        title: 'Boilerplate post title',
        content: 'Boilerplate post content'
      });
      console.log(`Status: ${createPostValid.statusCode}`, createPostValid.body);
      if (createPostValid.statusCode === 200 && createPostValid.body.status === 'success' && createPostValid.body.postUrl) {
        console.log('✅ Create Post success mock working.');
      } else {
        throw new Error('Create Post valid payload failed');
      }

      // 7. Test Create Post API - Invalid
      console.log('\nTesting POST /create-post (Invalid Payload - missing title)...');
      const createPostInvalid = await request('POST', '/create-post', {
        subreddit: 'javascript',
        content: 'Missing title'
      });
      console.log(`Status: ${createPostInvalid.statusCode}`, createPostInvalid.body);
      if (createPostInvalid.statusCode === 400 && createPostInvalid.body.success === false) {
        console.log('✅ Create Post validation working.');
      } else {
        throw new Error('Create Post validation failed');
      }

      console.log('\n🎉 ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
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
