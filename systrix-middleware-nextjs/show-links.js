/**
 * Display available links and endpoints for Systrix Middleware NextJS
 * Run this script to see all available URLs
 */

const port = process.env.PORT || 3005;
const middlewareUrl = `http://localhost:${port}`;
const cloudVpsUrl = 'http://localhost:3000';
const partnersPortalUrl = 'http://localhost:3006';

console.log('\n' + '='.repeat(80));
console.log('🎛️  SYSTRIX MIDDLEWARE NEXTJS - AVAILABLE ENDPOINTS');
console.log('='.repeat(80));

console.log('\n📊 MAIN SERVICES:');
console.log(`  Dashboard:        ${middlewareUrl}/`);
console.log(`  CloudVPS App:     ${cloudVpsUrl}/`);
console.log(`  Partners Portal:  ${partnersPortalUrl}/`);

console.log('\n🔌 API ENDPOINTS:');
console.log(`  Status:           ${middlewareUrl}/api/status`);
console.log(`  Products:         ${middlewareUrl}/api/products`);
console.log(`  Affiliates:       ${middlewareUrl}/api/affiliates`);
console.log(`  Payment Methods:  ${middlewareUrl}/api/payments/methods`);
console.log(`  Test Connection:  ${middlewareUrl}/api/test-connection`);
console.log(`  Health Check:     ${middlewareUrl}/api/health`);

console.log('\n📈 MONITORING & STATS:');
console.log(`  Statistics:       ${middlewareUrl}/api/stats`);
console.log(`  Logs:             ${middlewareUrl}/api/logs`);
console.log(`  Product Mapping:  ${middlewareUrl}/api/product-mapping`);

console.log('\n🛠️  DEVELOPMENT & TESTING:');
console.log(`  Dashboard (alt):  ${middlewareUrl}/dashboard`);
console.log(`  API Documentation: Available at each endpoint with GET request`);

console.log('\n⚙️  CONFIGURATION:');
console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
console.log(`  Port:             ${port}`);
console.log(`  HostBill URL:     ${process.env.HOSTBILL_BASE_URL || 'Not configured'}`);
console.log(`  Log Level:        ${process.env.LOG_LEVEL || 'info'}`);

console.log('\n' + '='.repeat(80));
console.log('✅ All endpoints are available!');
console.log('💡 Tip: Open the Dashboard URL in your browser to get started');
console.log('='.repeat(80) + '\n');

console.log('🔗 QUICK COPY-PASTE LINKS:');
console.log(`Dashboard:   ${middlewareUrl}/`);
console.log(`API Status:  ${middlewareUrl}/api/status`);
console.log(`Products:    ${middlewareUrl}/api/products`);
console.log('');
