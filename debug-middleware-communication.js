/**
 * Debug script pro testování komunikace mezi CloudVPS a Middleware
 * Testuje přesně ty endpointy, které způsobují problémy
 */

const axios = require('axios');

const MIDDLEWARE_URL = 'http://localhost:3010';

async function testEndpoint(url, description) {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`URL: ${url}`);
    
    try {
        const response = await axios.get(url, { 
            timeout: 5000,
            validateStatus: () => true // Accept all status codes
        });
        
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
        
        // Check if response is JSON
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            console.log(`✅ JSON Response:`, JSON.stringify(response.data, null, 2));
        } else {
            console.log(`❌ Non-JSON Response (first 200 chars):`);
            console.log(response.data.toString().substring(0, 200) + '...');
        }
        
        return { success: response.status < 400, status: response.status, data: response.data };
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function debugMiddlewareCommunication() {
    console.log('🐛 DEBUG: Middleware Communication Issues');
    console.log('=' .repeat(60));
    
    // Test the problematic endpoints one by one
    const tests = [
        {
            url: `${MIDDLEWARE_URL}/health`,
            description: 'Health Check'
        },
        {
            url: `${MIDDLEWARE_URL}/api/affiliates`,
            description: 'Get All Affiliates'
        },
        {
            url: `${MIDDLEWARE_URL}/api/products`,
            description: 'Get All Products'
        },
        {
            url: `${MIDDLEWARE_URL}/api/product-mapping`,
            description: 'Get Product Mapping'
        },
        {
            url: `${MIDDLEWARE_URL}/api/test-connection`,
            description: 'Test HostBill Connection'
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await testEndpoint(test.url, test.description);
        results.push({ ...test, ...result });
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    // Show failed tests
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        failed.forEach(test => {
            console.log(`  - ${test.description}: ${test.error || `Status ${test.status}`}`);
        });
    }
    
    // Test CloudVPS API endpoints that call middleware
    console.log('\n🌐 Testing CloudVPS API Endpoints');
    console.log('=' .repeat(60));
    
    const cloudvpsTests = [
        {
            url: 'http://localhost:3000/api/middleware/health',
            description: 'CloudVPS -> Middleware Health'
        },
        {
            url: 'http://localhost:3000/api/middleware/test-affiliate',
            description: 'CloudVPS -> Middleware Test Affiliate'
        },
        {
            url: 'http://localhost:3000/api/middleware/get-all-products',
            description: 'CloudVPS -> Middleware Get All Products'
        }
    ];
    
    for (const test of cloudvpsTests) {
        await testEndpoint(test.url, test.description);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Check middleware server logs for errors');
    console.log('2. Verify all endpoints return proper JSON');
    console.log('3. Check CORS configuration');
    console.log('4. Restart both servers if needed');
}

// Run the debug
debugMiddlewareCommunication().catch(error => {
    console.error('💥 Debug script failed:', error);
    process.exit(1);
});
