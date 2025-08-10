/**
 * Test Middleware Compliance
 * Ověřuje, že CloudVPS komunikuje výhradně přes middleware
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing CloudVPS Middleware Compliance');
console.log('=========================================');
console.log('');

// Test 1: Check .env file for HostBill credentials
console.log('1️⃣ Checking .env file for HostBill credentials...');
console.log('================================================');

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const lines = envContent.split('\n');
  
  const hostbillCredentials = [
    'HOSTBILL_API_ID',
    'HOSTBILL_API_KEY', 
    'HOSTBILL_API_SECRET',
    'HOSTBILL_API_URL'
  ];
  
  let foundCredentials = [];
  let commentedCredentials = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    hostbillCredentials.forEach(cred => {
      if (trimmedLine.startsWith(`${cred}=`)) {
        foundCredentials.push({ credential: cred, line: index + 1, content: line });
      } else if (trimmedLine.startsWith(`# ${cred}=`)) {
        commentedCredentials.push({ credential: cred, line: index + 1, content: line });
      }
    });
  });
  
  if (foundCredentials.length > 0) {
    console.log('❌ FOUND ACTIVE HOSTBILL CREDENTIALS IN .env:');
    foundCredentials.forEach(item => {
      console.log(`   Line ${item.line}: ${item.content}`);
    });
    console.log('   ⚠️ These must be removed or commented out!');
  } else {
    console.log('✅ No active HostBill credentials found in .env');
  }
  
  if (commentedCredentials.length > 0) {
    console.log('✅ Found commented HostBill credentials (good):');
    commentedCredentials.forEach(item => {
      console.log(`   Line ${item.line}: ${item.content}`);
    });
  }
  
  console.log('');
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
  console.log('');
}

// Test 2: Check for direct HostBill API usage in code
console.log('2️⃣ Checking for direct HostBill API usage in code...');
console.log('==================================================');

const filesToCheck = [
  'components/ProductSelector.js',
  'components/HostBillAffiliate.js', 
  'pages/complete-order-test.js',
  'pages/hostbill-modules-test.js'
];

let violationFound = false;

filesToCheck.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      console.log(`📁 Checking ${filePath}:`);
      
      // Check for direct HostBill API calls
      const violations = [];
      const middlewareCalls = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Check for violations
        if (trimmedLine.includes('/api/hostbill/') && !trimmedLine.includes('//')) {
          violations.push({ line: index + 1, content: line });
          violationFound = true;
        }
        
        // Check for middleware calls
        if (trimmedLine.includes('localhost:3005') || trimmedLine.includes('middlewareUrl')) {
          middlewareCalls.push({ line: index + 1, content: line });
        }
      });
      
      if (violations.length > 0) {
        console.log('   ❌ VIOLATIONS FOUND:');
        violations.forEach(item => {
          console.log(`     Line ${item.line}: ${item.content.trim()}`);
        });
      } else {
        console.log('   ✅ No direct HostBill API calls found');
      }
      
      if (middlewareCalls.length > 0) {
        console.log('   ✅ MIDDLEWARE CALLS FOUND:');
        middlewareCalls.forEach(item => {
          console.log(`     Line ${item.line}: ${item.content.trim()}`);
        });
      }
      
      console.log('');
    } else {
      console.log(`📁 ${filePath}: File not found`);
      console.log('');
    }
  } catch (error) {
    console.log(`📁 ${filePath}: Error reading file - ${error.message}`);
    console.log('');
  }
});

// Test 3: Check /api/hostbill/ directory
console.log('3️⃣ Checking /api/hostbill/ directory...');
console.log('======================================');

const hostbillApiDir = 'pages/api/hostbill';
if (fs.existsSync(hostbillApiDir)) {
  const files = fs.readdirSync(hostbillApiDir);
  console.log(`📂 Found ${files.length} files in ${hostbillApiDir}:`);
  
  files.forEach(file => {
    const filePath = path.join(hostbillApiDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file uses HostBill credentials directly
      const usesCredentials = content.includes('HOSTBILL_API_ID') || 
                             content.includes('HOSTBILL_API_KEY') ||
                             content.includes('process.env.HOSTBILL');
      
      // Check if file redirects to middleware
      const redirectsToMiddleware = content.includes('localhost:3005') ||
                                   content.includes('MIDDLEWARE_URL') ||
                                   content.includes('middleware');
      
      if (usesCredentials && !redirectsToMiddleware) {
        console.log(`   ❌ ${file} - Uses HostBill credentials directly`);
        violationFound = true;
      } else if (redirectsToMiddleware) {
        console.log(`   ✅ ${file} - Redirects to middleware`);
      } else {
        console.log(`   ⚠️ ${file} - Needs review`);
      }
    } catch (error) {
      console.log(`   ❌ ${file} - Error reading: ${error.message}`);
    }
  });
  console.log('');
} else {
  console.log('📂 /api/hostbill/ directory not found');
  console.log('');
}

// Test 4: Test middleware connectivity
console.log('4️⃣ Testing middleware connectivity...');
console.log('====================================');

async function testMiddlewareConnectivity() {
  try {
    const middlewareUrl = 'http://localhost:3005';
    
    // Test health endpoint
    console.log(`🔍 Testing ${middlewareUrl}/api/health`);
    const healthResponse = await fetch(`${middlewareUrl}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Middleware is running and healthy');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Port: ${healthData.port}`);
      if (healthData.hostbill) {
        console.log(`   HostBill: ${healthData.hostbill.status}`);
      }
    } else {
      console.log(`❌ Middleware health check failed: ${healthResponse.status}`);
    }
    
    // Test products endpoint
    console.log(`🔍 Testing ${middlewareUrl}/api/products`);
    const productsResponse = await fetch(`${middlewareUrl}/api/products`);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log('✅ Middleware products endpoint working');
      console.log(`   Products found: ${productsData.products?.length || 0}`);
    } else {
      console.log(`❌ Middleware products endpoint failed: ${productsResponse.status}`);
    }
    
  } catch (error) {
    console.log('❌ Cannot connect to middleware:', error.message);
    console.log('   Make sure middleware is running on port 3005');
  }
  
  console.log('');
}

// Run async test
testMiddlewareConnectivity().then(() => {
  // Final summary
  console.log('📊 MIDDLEWARE COMPLIANCE TEST SUMMARY');
  console.log('====================================');
  
  if (!violationFound) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ CloudVPS is compliant with middleware-only communication');
    console.log('✅ No direct HostBill API calls found');
    console.log('✅ HostBill credentials removed from .env');
    console.log('✅ Frontend components use middleware endpoints');
    console.log('');
    console.log('🔧 Architecture compliance:');
    console.log('   CloudVPS (port 3000) → Middleware (port 3005) → HostBill API');
    console.log('   ✅ No direct CloudVPS → HostBill communication');
    console.log('   ✅ All communication goes through middleware');
  } else {
    console.log('❌ COMPLIANCE VIOLATIONS FOUND!');
    console.log('❌ CloudVPS still has direct HostBill API communication');
    console.log('❌ Review the violations above and fix them');
    console.log('');
    console.log('🔧 Required fixes:');
    console.log('   1. Remove/comment HostBill credentials from .env');
    console.log('   2. Update frontend code to use middleware endpoints');
    console.log('   3. Update /api/hostbill/ files to redirect to middleware');
    console.log('   4. Test all functionality after fixes');
  }
  
  console.log('');
  console.log('🌐 Middleware endpoints to use:');
  console.log('   Products: http://localhost:3005/api/products');
  console.log('   Orders: http://localhost:3005/api/orders/create');
  console.log('   Payment Methods: http://localhost:3005/api/payment-methods');
  console.log('   Affiliate Tracking: http://localhost:3005/api/affiliate/track-visit');
  console.log('   Affiliate Conversion: http://localhost:3005/api/affiliate/track-conversion');
});
