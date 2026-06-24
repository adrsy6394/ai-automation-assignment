const http = require('http');
const app = require('../src/app');

const PORT = 5001;
let server;

function request(method, path, body, sendRaw = false) {
  return new Promise((resolve, reject) => {
    const postData = sendRaw ? body : (body ? JSON.stringify(body) : '');
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
  console.log('--- Phase 5 Verification Script ---');

  // Start the server
  server = app.listen(PORT, async () => {
    console.log(`Test server booted on port ${PORT}`);

    try {
      // 1. Test 404 Route Not Found
      console.log('\n1. Testing catch-all 404 Route Not Found...');
      const res404 = await request('GET', '/some-random-route-xyz');
      console.log(`Status Code: ${res404.statusCode}`);
      console.log('Response Body:', res404.body);
      if (res404.statusCode === 404 && res404.body.success === false && res404.body.message.includes('Route not found')) {
        console.log('✅ Catch-all 404 works and returns standard error format.');
      } else {
        throw new Error('404 catch-all verification failed');
      }

      // 2. Test Malformed JSON payload (Global error handler test)
      console.log('\n2. Testing malformed JSON payload handling...');
      const malformedRes = await request('POST', '/create-account', '{"username": "test",', true);
      console.log(`Status Code: ${malformedRes.statusCode}`);
      console.log('Response Body:', malformedRes.body);
      if (malformedRes.statusCode === 400 || malformedRes.statusCode === 500) {
        if (malformedRes.body.success === false && malformedRes.body.message) {
          console.log('✅ Malformed JSON error caught and returned in standard format.');
        } else {
          throw new Error('Malformed JSON payload did not return standard error payload');
        }
      } else {
        throw new Error(`Unexpected status code for malformed JSON: ${malformedRes.statusCode}`);
      }

      // 3. Test Controller validation boundaries (Empty title validation)
      console.log('\n3. Testing validation boundary checks (empty title)...');
      const badValidationRes = await request('POST', '/create-post', {
        subreddit: 'javascript',
        title: '',
        content: 'Verification body content'
      });
      console.log(`Status Code: ${badValidationRes.statusCode}`);
      console.log('Response Body:', badValidationRes.body);
      if (badValidationRes.statusCode === 400 && badValidationRes.body.success === false && badValidationRes.body.message.includes('Title')) {
        console.log('✅ Controller validation caught empty parameter and returned 400.');
      } else {
        throw new Error('Empty title validation check failed');
      }

      console.log('\n🎉 ALL PHASE 5 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
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
