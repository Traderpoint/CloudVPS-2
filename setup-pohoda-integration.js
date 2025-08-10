/**
 * Pohoda Integration Setup Script
 * Helps configure and test the complete Cloud VPS + Pohoda integration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupPohodaIntegration() {
  console.log('🚀 Cloud VPS + Pohoda Integration Setup\n');
  console.log('This script will help you configure the complete integration.\n');

  try {
    // Step 1: Check current configuration
    console.log('1️⃣ Checking current configuration...');
    const configStatus = checkCurrentConfig();
    displayConfigStatus(configStatus);

    // Step 2: Gather configuration data
    console.log('\n2️⃣ Configuration setup...');
    const config = await gatherConfiguration();

    // Step 3: Update environment files
    console.log('\n3️⃣ Updating environment files...');
    await updateEnvironmentFiles(config);

    // Step 4: Test configuration
    console.log('\n4️⃣ Testing configuration...');
    await testConfiguration();

    console.log('\n🎉 Pohoda integration setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart both applications:');
    console.log('      cd systrix-middleware-nextjs && npm run dev');
    console.log('      cd "Eshop app" && npm run dev');
    console.log('   2. Test with real order and payment');
    console.log('   3. Check Pohoda for synchronized invoices');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

/**
 * Check current configuration status
 */
function checkCurrentConfig() {
  const middlewareEnvPath = path.join(__dirname, 'systrix-middleware-nextjs', '.env.local');
  const eshopEnvPath = path.join(__dirname, 'Eshop app', '.env.local');

  const status = {
    middlewareEnvExists: fs.existsSync(middlewareEnvPath),
    eshopEnvExists: fs.existsSync(eshopEnvPath),
    middlewareHasPohoda: false,
    eshopHasPohoda: false
  };

  // Check middleware env
  if (status.middlewareEnvExists) {
    const middlewareEnv = fs.readFileSync(middlewareEnvPath, 'utf8');
    status.middlewareHasPohoda = middlewareEnv.includes('DATIVERY_API_KEY') && 
                                 middlewareEnv.includes('POHODA_DATA_FILE');
  }

  // Check eshop env
  if (status.eshopEnvExists) {
    const eshopEnv = fs.readFileSync(eshopEnvPath, 'utf8');
    status.eshopHasPohoda = eshopEnv.includes('DATIVERY_API_KEY') && 
                            eshopEnv.includes('POHODA_DATA_FILE');
  }

  return status;
}

/**
 * Display configuration status
 */
function displayConfigStatus(status) {
  console.log('   Configuration Status:');
  console.log(`   ├─ Middleware .env.local: ${status.middlewareEnvExists ? '✅' : '❌'}`);
  console.log(`   ├─ Eshop .env.local: ${status.eshopEnvExists ? '✅' : '❌'}`);
  console.log(`   ├─ Middleware Pohoda config: ${status.middlewareHasPohoda ? '✅' : '❌'}`);
  console.log(`   └─ Eshop Pohoda config: ${status.eshopHasPohoda ? '✅' : '❌'}`);
}

/**
 * Gather configuration from user
 */
async function gatherConfiguration() {
  console.log('   Please provide your Pohoda/Dativery configuration:');
  
  const config = {};

  config.dativeryApiKey = await askQuestion('   Dativery API Key: ');
  config.dativeryApiUrl = await askQuestion('   Dativery API URL [https://api.dativery.com/v1]: ') || 'https://api.dativery.com/v1';
  config.pohodaDataFile = await askQuestion('   Pohoda Data File (e.g., StwPh_12345678_2024.mdb): ');
  config.pohodaUsername = await askQuestion('   Pohoda Username: ');
  config.pohodaPassword = await askQuestion('   Pohoda Password: ');

  return config;
}

/**
 * Update environment files with new configuration
 */
async function updateEnvironmentFiles(config) {
  const middlewareEnvPath = path.join(__dirname, 'systrix-middleware-nextjs', '.env.local');
  const eshopEnvPath = path.join(__dirname, 'Eshop app', '.env.local');

  // Update middleware .env.local
  if (fs.existsSync(middlewareEnvPath)) {
    let middlewareEnv = fs.readFileSync(middlewareEnvPath, 'utf8');
    
    middlewareEnv = updateEnvVariable(middlewareEnv, 'DATIVERY_API_KEY', config.dativeryApiKey);
    middlewareEnv = updateEnvVariable(middlewareEnv, 'DATIVERY_API_URL', config.dativeryApiUrl);
    middlewareEnv = updateEnvVariable(middlewareEnv, 'POHODA_DATA_FILE', config.pohodaDataFile);
    middlewareEnv = updateEnvVariable(middlewareEnv, 'POHODA_USERNAME', config.pohodaUsername);
    middlewareEnv = updateEnvVariable(middlewareEnv, 'POHODA_PASSWORD', config.pohodaPassword);
    
    fs.writeFileSync(middlewareEnvPath, middlewareEnv);
    console.log('   ✅ Updated systrix-middleware-nextjs/.env.local');
  }

  // Update eshop .env.local
  if (fs.existsSync(eshopEnvPath)) {
    let eshopEnv = fs.readFileSync(eshopEnvPath, 'utf8');
    
    eshopEnv = updateEnvVariable(eshopEnv, 'DATIVERY_API_KEY', config.dativeryApiKey);
    eshopEnv = updateEnvVariable(eshopEnv, 'DATIVERY_API_URL', config.dativeryApiUrl);
    eshopEnv = updateEnvVariable(eshopEnv, 'POHODA_DATA_FILE', config.pohodaDataFile);
    eshopEnv = updateEnvVariable(eshopEnv, 'POHODA_USERNAME', config.pohodaUsername);
    eshopEnv = updateEnvVariable(eshopEnv, 'POHODA_PASSWORD', config.pohodaPassword);
    
    fs.writeFileSync(eshopEnvPath, eshopEnv);
    console.log('   ✅ Updated Eshop app/.env.local');
  }
}

/**
 * Update environment variable in env file content
 */
function updateEnvVariable(envContent, varName, varValue) {
  const regex = new RegExp(`^${varName}=.*$`, 'm');
  const newLine = `${varName}=${varValue}`;
  
  if (regex.test(envContent)) {
    return envContent.replace(regex, newLine);
  } else {
    return envContent + `\n${newLine}`;
  }
}

/**
 * Test the configuration
 */
async function testConfiguration() {
  console.log('   Running integration test...');
  
  try {
    // Import and run the test
    const { testCloudVPSPohodaIntegration } = require('./test-cloudvps-pohoda-integration.js');
    await testCloudVPSPohodaIntegration();
    console.log('   ✅ Integration test completed');
  } catch (error) {
    console.log('   ⚠️ Integration test failed (expected if not fully configured)');
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Ask question helper
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Run setup if called directly
if (require.main === module) {
  setupPohodaIntegration()
    .then(() => {
      console.log('\n🏁 Setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPohodaIntegration };
