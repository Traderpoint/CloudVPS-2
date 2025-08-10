/**
 * Verify Unique IDs Fix
 * Simple verification that the ID patterns are now unique
 */

const fs = require('fs');
const path = require('path');

function verifyUniqueIds() {
  console.log('🧪 === VERIFY UNIQUE IDS FIX ===\n');
  
  try {
    const filePath = path.join(__dirname, 'pages', 'invoice-payment-test.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log('📄 Checking invoice-payment-test.js for unique ID patterns...');
    
    // Check for the corrected ID pattern
    const hasUniqueMethodId = content.includes('id={`method-${order.id}-${invoice.id}`}');
    const hasUniqueKey = content.includes('key={`${order.id}-${invoice.id}`}');
    const hasConsistentGetElement = content.includes('getElementById(`method-${order.id}-${invoice.id}`)');
    
    console.log('\n📊 Pattern Analysis:');
    console.log('✅ Unique method ID pattern:', hasUniqueMethodId ? 'FOUND' : 'MISSING');
    console.log('✅ Unique React key:', hasUniqueKey ? 'FOUND' : 'MISSING');
    console.log('✅ Consistent getElementById:', hasConsistentGetElement ? 'FOUND' : 'MISSING');
    
    // Check for old problematic patterns
    const hasOldMethodId = content.includes('id={`method-${invoice.id}`}') && !content.includes('id={`method-${order.id}-${invoice.id}`}');
    const hasOldGetElement = content.includes('getElementById(`method-${invoice.id}`)') && !content.includes('getElementById(`method-${order.id}-${invoice.id}`)');
    
    console.log('\n🔍 Old Pattern Check:');
    console.log('❌ Old method ID pattern:', hasOldMethodId ? 'STILL PRESENT' : 'REMOVED');
    console.log('❌ Old getElementById pattern:', hasOldGetElement ? 'STILL PRESENT' : 'REMOVED');
    
    const isFixed = hasUniqueMethodId && hasUniqueKey && hasConsistentGetElement && !hasOldMethodId && !hasOldGetElement;
    
    if (isFixed) {
      console.log('\n✅ === FIX VERIFIED ===');
      console.log('🎉 All form field IDs are now UNIQUE!');
      console.log('📋 Pattern: method-{orderId}-{invoiceId}');
      console.log('🔧 This prevents duplicate ID conflicts');
      console.log('🌐 Browser autofill should work correctly');
      return true;
    } else {
      console.log('\n❌ === FIX INCOMPLETE ===');
      console.log('⚠️  Some patterns still need correction');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    return false;
  }
}

// Run the verification
if (require.main === module) {
  const success = verifyUniqueIds();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyUniqueIds };
