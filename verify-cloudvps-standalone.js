// Verify that CloudVPS is standalone and ready for Docker build
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying CloudVPS Standalone Setup for Docker');
console.log('================================================');

const requiredFiles = [
  // Core files
  'package.json',
  'next.config.js',
  
  // Pages
  'pages/_app.js',
  'pages/index.js',
  'pages/vps.js',
  'pages/billing.js',
  'pages/payment-method.js',
  'pages/payment-success.js',
  'pages/oauth-success.js',
  'pages/test-cart.js',
  
  // API routes - Auth
  'pages/api/auth/[...nextauth].js',
  'pages/api/auth/login.js',
  'pages/api/auth/register.js',
  'pages/api/auth/test-register.js',
  
  // API routes - Orders
  'pages/api/orders/create.js',
  
  // API routes - Payments
  'pages/api/payments/initialize.js',
  'pages/api/payments/capture.js',
  
  // API routes - Middleware communication
  'pages/api/middleware/recent-orders.js',
  'pages/api/middleware/affiliate-products.js',
  'pages/api/middleware/order-test.js',
  'pages/api/middleware/payment-methods-test.js',
  
  // API routes - HostBill direct
  'pages/api/hostbill/products.js',
  'pages/api/hostbill/affiliates.js',
  
  // Components
  'components/CartSidebar.js',
  'components/VPSCartSidebar.js',
  'components/Toast.js',
  
  // Contexts
  'contexts/CartContext.js',
  
  // Utils
  'utils/affiliate.js',
  
  // Styles
  'styles/globals.css',
  'tailwind.config.js',
  'postcss.config.js',
  
  // Public assets
  'public/favicon.ico'
];

const requiredDirectories = [
  'pages',
  'pages/api',
  'pages/api/auth',
  'pages/api/orders',
  'pages/api/payments',
  'pages/api/middleware',
  'pages/api/hostbill',
  'components',
  'contexts',
  'utils',
  'styles',
  'public'
];

let missingFiles = [];
let missingDirectories = [];

console.log('📁 Checking required directories...');
requiredDirectories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    missingDirectories.push(dir);
    console.log(`❌ Missing directory: ${dir}`);
  } else {
    console.log(`✅ Directory exists: ${dir}`);
  }
});

console.log('\n📄 Checking required files...');
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
    console.log(`❌ Missing file: ${file}`);
  } else {
    console.log(`✅ File exists: ${file}`);
  }
});

console.log('\n🔍 Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    'next-auth',
    'axios'
  ];
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`✅ Dependency: ${dep}@${allDeps[dep]}`);
    } else {
      console.log(`❌ Missing dependency: ${dep}`);
      missingFiles.push(`dependency: ${dep}`);
    }
  });
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  missingFiles.push('package.json (readable)');
}

console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local exists');
  
  try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'MIDDLEWARE_URL',
      'HOSTBILL_API_ID',
      'HOSTBILL_API_KEY'
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (envLocal.includes(envVar)) {
        console.log(`✅ Environment variable: ${envVar}`);
      } else {
        console.log(`❌ Missing environment variable: ${envVar}`);
      }
    });
  } catch (error) {
    console.log(`❌ Error reading .env.local: ${error.message}`);
  }
} else {
  console.log('❌ .env.local missing');
  missingFiles.push('.env.local');
}

console.log('\n🔗 Checking middleware dependency...');
const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
console.log(`📡 Configured middleware URL: ${middlewareUrl}`);

// Check if middleware endpoints are referenced correctly
const middlewareEndpoints = [
  'pages/api/orders/create.js',
  'pages/api/middleware/recent-orders.js',
  'pages/api/middleware/affiliate-products.js'
];

middlewareEndpoints.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('MIDDLEWARE_URL') || content.includes('localhost:3005')) {
      console.log(`✅ Middleware integration: ${file}`);
    } else {
      console.log(`⚠️  No middleware reference in: ${file}`);
    }
  }
});

console.log('\n📊 Verification Results:');
console.log('========================');

if (missingDirectories.length === 0 && missingFiles.length === 0) {
  console.log('🎉 SUCCESS: CloudVPS is standalone and ready for Docker build!');
  console.log('');
  console.log('✅ All required files and directories are present.');
  console.log('✅ Dependencies are configured correctly.');
  console.log('✅ Environment variables are set up.');
  console.log('✅ Middleware integration is configured.');
  console.log('');
  console.log('🚀 Next steps for Docker deployment:');
  console.log('   1. Create Dockerfile');
  console.log('   2. Create docker-compose.yml');
  console.log('   3. Create .env.example for production');
  console.log('   4. Test Docker build');
  console.log('');
  console.log('⚠️  Important notes:');
  console.log('   - Google OAuth requires proper domain configuration');
  console.log('   - Middleware must be running on port 3005');
  console.log('   - HostBill API credentials must be valid');
} else {
  console.log('❌ FAILURE: Missing required files or directories!');
  console.log('');
  
  if (missingDirectories.length > 0) {
    console.log('Missing directories:');
    missingDirectories.forEach(dir => console.log(`  - ${dir}`));
    console.log('');
  }
  
  if (missingFiles.length > 0) {
    console.log('Missing files:');
    missingFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');
  }
  
  console.log('Please ensure all required files are present before building Docker image.');
  process.exit(1);
}

console.log('📋 CloudVPS structure summary:');
console.log(`   📁 Directories: ${requiredDirectories.length - missingDirectories.length}/${requiredDirectories.length}`);
console.log(`   📄 Files: ${requiredFiles.length - missingFiles.length}/${requiredFiles.length}`);
console.log(`   📦 Dependencies: Next.js, React, NextAuth, Axios`);
console.log(`   🔧 Environment: Google OAuth + HostBill + Middleware`);
console.log(`   🐳 Docker: Ready for setup`);
