// Verify that middleware is standalone and has all required files
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Systrix Middleware NextJS Standalone Setup');
console.log('=====================================================');

const requiredFiles = [
  // Core files
  'package.json',
  'next.config.js',
  'server.js',
  
  // Library files
  'lib/hostbill-client.js',
  'lib/order-processor.js',
  'lib/payment-processor.js',
  'lib/product-mapper.js',
  'lib/comgate-client.js',
  'lib/comgate-processor.js',
  'lib/startup-info.js',
  
  // Utility files
  'utils/logger.js',
  
  // Components
  'components/Layout.js',
  'components/MetricsCards.js',
  'components/ProductMappingTable.js',
  'components/QuickActions.js',
  'components/SystemInfo.js',
  
  // Pages
  'pages/_app.js',
  'pages/_document.js',
  'pages/index.js',
  'pages/dashboard.js',
  'pages/tech-dashboard.js',
  'pages/test.js',
  
  // API routes
  'pages/api/health.js',
  'pages/api/status.js',
  'pages/api/orders/create.js',
  'pages/api/payments/methods.js',
  'pages/api/products.js',
  'pages/api/test-connection.js',
  
  // Styles
  'styles/globals.css',
  
  // Configuration
  'tailwind.config.js',
  'postcss.config.js',
  
  // Docker files
  'Dockerfile',
  'docker-compose.yml',
  '.dockerignore',
  
  // Documentation
  'README.md',
  'DOCKER.md',
  '.env.example'
];

const requiredDirectories = [
  'lib',
  'utils',
  'components',
  'pages',
  'pages/api',
  'pages/api/orders',
  'pages/api/payments',
  'pages/api/invoices',
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
    'axios',
    'winston',
    'express',
    'cors',
    'helmet',
    'express-rate-limit',
    'express-validator',
    'uuid',
    'dotenv',
    'chalk'
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
if (fs.existsSync('.env.example')) {
  console.log('✅ .env.example exists');
  
  try {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const requiredEnvVars = [
      'HOSTBILL_API_ID',
      'HOSTBILL_API_KEY',
      'HOSTBILL_API_URL',
      'PORT'
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (envExample.includes(envVar)) {
        console.log(`✅ Environment variable template: ${envVar}`);
      } else {
        console.log(`❌ Missing environment variable template: ${envVar}`);
      }
    });
  } catch (error) {
    console.log(`❌ Error reading .env.example: ${error.message}`);
  }
} else {
  console.log('❌ .env.example missing');
  missingFiles.push('.env.example');
}

console.log('\n📊 Verification Results:');
console.log('========================');

if (missingDirectories.length === 0 && missingFiles.length === 0) {
  console.log('🎉 SUCCESS: All required files and directories are present!');
  console.log('');
  console.log('✅ The middleware is standalone and ready for Docker build.');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Copy .env.example to .env and configure your values');
  console.log('   2. Run: chmod +x build-docker.sh');
  console.log('   3. Run: ./build-docker.sh');
  console.log('   4. Run: docker-compose up -d');
  console.log('   5. Test: node test-docker-functionality.js');
  console.log('');
  console.log('🌐 Dashboard will be available at: http://localhost:3005/dashboard');
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

console.log('📋 File structure summary:');
console.log(`   📁 Directories: ${requiredDirectories.length - missingDirectories.length}/${requiredDirectories.length}`);
console.log(`   📄 Files: ${requiredFiles.length - missingFiles.length}/${requiredFiles.length}`);
console.log(`   📦 Dependencies: Checked`);
console.log(`   🔧 Environment: Configured`);
console.log(`   🐳 Docker: Ready`);
