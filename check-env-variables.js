// Check if all required environment variables are set for Docker deployment
const fs = require('fs');
const path = require('path');

function checkEnvFile(filePath, requiredVars, systemName) {
  console.log(`\n🔍 Checking ${systemName} environment variables...`);
  console.log(`📁 File: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Environment file not found: ${filePath}`);
    return false;
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  let allPresent = true;
  let missingVars = [];
  let presentVars = [];
  
  requiredVars.forEach(varName => {
    // Check if variable is defined and has a value (not just placeholder)
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1] && 
        !match[1].includes('your_') && 
        !match[1].includes('your-') &&
        match[1] !== 'undefined' &&
        match[1].trim() !== '') {
      presentVars.push(`${varName}=${match[1].substring(0, 20)}...`);
    } else {
      missingVars.push(varName);
      allPresent = false;
    }
  });
  
  console.log(`✅ Present variables (${presentVars.length}):`);
  presentVars.forEach(v => console.log(`   ${v}`));
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing or placeholder variables (${missingVars.length}):`);
    missingVars.forEach(v => console.log(`   ${v}`));
  }
  
  return allPresent;
}

console.log('🔧 Environment Variables Check for Docker Deployment');
console.log('===================================================');

// CloudVPS required variables
const cloudvpsRequired = [
  'NODE_ENV',
  'PORT',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'HOSTBILL_API_ID',
  'HOSTBILL_API_KEY',
  'MIDDLEWARE_URL',
  'NEXT_PUBLIC_MIDDLEWARE_URL'
];

// Middleware required variables
const middlewareRequired = [
  'PORT',
  'NODE_ENV',
  'HOSTBILL_API_ID',
  'HOSTBILL_API_KEY',
  'HOSTBILL_API_URL',
  'COMGATE_MERCHANT_ID',
  'COMGATE_SECRET',
  'PRODUCT_MAPPING_1',
  'PRODUCT_MAPPING_2',
  'PRODUCT_MAPPING_3',
  'PRODUCT_MAPPING_4'
];

// Check CloudVPS
const cloudvpsOk = checkEnvFile('.env', cloudvpsRequired, 'CloudVPS');

// Check Middleware
const middlewareOk = checkEnvFile('systrix-middleware-nextjs/.env', middlewareRequired, 'Middleware');

console.log('\n📊 Summary:');
console.log('===========');

if (cloudvpsOk && middlewareOk) {
  console.log('🎉 SUCCESS: All required environment variables are configured!');
  console.log('');
  console.log('✅ CloudVPS: Ready for Docker deployment');
  console.log('✅ Middleware: Ready for Docker deployment');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Build CloudVPS: ./build-docker.sh');
  console.log('   2. Build Middleware: cd systrix-middleware-nextjs && ./build-docker.sh');
  console.log('   3. Run both: docker-compose up -d');
  console.log('');
  console.log('🌐 Services will be available at:');
  console.log('   CloudVPS: http://localhost:3000');
  console.log('   Middleware: http://localhost:3005/dashboard');
} else {
  console.log('❌ FAILURE: Some environment variables are missing or not configured!');
  console.log('');
  
  if (!cloudvpsOk) {
    console.log('🔧 CloudVPS issues:');
    console.log('   - Check .env file in root directory');
    console.log('   - Ensure Google OAuth credentials are set');
    console.log('   - Verify HostBill API credentials');
  }
  
  if (!middlewareOk) {
    console.log('🔧 Middleware issues:');
    console.log('   - Check systrix-middleware-nextjs/.env file');
    console.log('   - Ensure HostBill API credentials are set');
    console.log('   - Verify Comgate payment gateway credentials');
  }
  
  console.log('');
  console.log('📖 See ENVIRONMENT-SETUP.md for detailed configuration guide');
  process.exit(1);
}

console.log('🔗 Important notes:');
console.log('   - Google OAuth requires domain configuration in Google Cloud Console');
console.log('   - Payment gateways require valid merchant accounts');
console.log('   - Both systems can run independently in Docker containers');
console.log('   - Middleware must be accessible from CloudVPS for full functionality');
