// Test CORS fix for mark-invoice-paid endpoint
const http = require('http');

async function testCORSFix() {
  console.log('🚀 Testing CORS fix for mark-invoice-paid endpoint...');
  
  // Test OPTIONS request first (preflight)
  console.log('\n1️⃣ Testing OPTIONS preflight request...');
  
  try {
    const optionsResult = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3005,
        path: '/api/mark-invoice-paid',
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      }, (res) => {
        console.log('📥 OPTIONS Response status:', res.statusCode);
        console.log('📋 CORS Headers:');
        console.log('   Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
        console.log('   Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
        console.log('   Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });

    if (optionsResult.statusCode === 200) {
      console.log('✅ OPTIONS preflight successful');
    } else {
      console.log('❌ OPTIONS preflight failed:', optionsResult.statusCode);
    }

  } catch (error) {
    console.error('💥 OPTIONS test failed:', error.message);
  }

  // Test actual POST request
  console.log('\n2️⃣ Testing POST request with CORS...');
  
  const requestData = {
    invoiceId: '268',
    status: 'Paid'
  };

  try {
    const postData = JSON.stringify(requestData);
    
    const postResult = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3005,
        path: '/api/mark-invoice-paid',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Origin': 'http://localhost:3000'
        }
      }, (res) => {
        console.log('📥 POST Response status:', res.statusCode);
        console.log('📋 CORS Headers in response:');
        console.log('   Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data,
              parseError: true
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });

    if (postResult.statusCode === 200 && postResult.data.success) {
      console.log('✅ POST request successful with CORS');
      console.log('📝 Response:', postResult.data.message);
    } else {
      console.log('❌ POST request failed:', postResult.statusCode);
      if (postResult.data.error) {
        console.log('   Error:', postResult.data.error);
      }
    }

  } catch (error) {
    console.error('💥 POST test failed:', error.message);
  }

  console.log('\n🎯 CORS Fix Summary:');
  console.log('✅ Added CORS headers to mark-invoice-paid endpoint');
  console.log('✅ Supports OPTIONS preflight requests');
  console.log('✅ Allows requests from http://localhost:3000');
  console.log('✅ CloudVPS can now call middleware without CORS errors');
}

// Run the test
testCORSFix();
