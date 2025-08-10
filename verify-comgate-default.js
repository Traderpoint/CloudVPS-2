/**
 * Verify Comgate Default Setting
 * Simple verification that Comgate is set as default payment method
 */

const fs = require('fs');
const path = require('path');

function verifyComgateDefault() {
  console.log('🧪 === VERIFY COMGATE DEFAULT SETTING ===\n');
  
  try {
    const filePath = path.join(__dirname, 'pages', 'invoice-payment-test.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log('📄 Checking invoice-payment-test.js for Comgate default...');
    
    // Check for defaultValue="comgate"
    const hasDefaultValue = content.includes('defaultValue="comgate"');
    console.log('✅ defaultValue="comgate":', hasDefaultValue ? 'FOUND' : 'MISSING');
    
    // Check for selected={method.id === 'comgate'}
    const hasSelectedLogic = content.includes('selected={method.id === \'comgate\'}');
    console.log('✅ selected logic for comgate:', hasSelectedLogic ? 'FOUND' : 'MISSING');
    
    // Check for fallback Comgate
    const hasFallbackComgate = content.includes('{ id: \'comgate\', name: \'Comgate\' }');
    console.log('✅ Comgate in fallback methods:', hasFallbackComgate ? 'FOUND' : 'MISSING');
    
    const success = hasDefaultValue && hasSelectedLogic && hasFallbackComgate;
    
    if (success) {
      console.log('\n✅ === COMGATE DEFAULT VERIFIED ===');
      console.log('🎯 Comgate will be pre-selected as default payment method');
      console.log('📋 All required components are in place');
      return true;
    } else {
      console.log('\n❌ === COMGATE DEFAULT INCOMPLETE ===');
      console.log('⚠️  Missing components - check the implementation');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    return false;
  }
}

// Run the verification
if (require.main === module) {
  const success = verifyComgateDefault();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyComgateDefault };
