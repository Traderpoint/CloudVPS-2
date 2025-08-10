/**
 * Test ID Patterns in Invoice Payment Test
 * Verifies that ID patterns in the code are unique
 */

const fs = require('fs');
const path = require('path');

function testIdPatterns() {
  console.log('🧪 === ID PATTERNS TEST ===\n');
  
  try {
    // Read the invoice payment test file
    const filePath = path.join(__dirname, 'pages', 'invoice-payment-test.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log('📄 Analyzing invoice-payment-test.js...');
    
    // Find all ID patterns
    const idPatterns = [];
    
    // Look for id={...} patterns
    const idRegex = /id=\{[^}]+\}/g;
    let match;
    
    while ((match = idRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      idPatterns.push({
        pattern: match[0],
        line: line,
        context: content.split('\n')[line - 1].trim()
      });
    }
    
    console.log('📊 Found ID patterns:', idPatterns.length);
    
    idPatterns.forEach((pattern, index) => {
      console.log(`   ${index + 1}. Line ${pattern.line}: ${pattern.pattern}`);
      console.log(`      Context: ${pattern.context}`);
    });
    
    // Analyze patterns for uniqueness
    console.log('\n🔍 Analyzing ID uniqueness patterns...');
    
    const methodIdPattern = idPatterns.find(p => p.pattern.includes('method-'));
    if (methodIdPattern) {
      if (methodIdPattern.pattern.includes('order.id') && methodIdPattern.pattern.includes('invoice.id')) {
        console.log('✅ Method select IDs use both order.id and invoice.id - UNIQUE');
      } else if (methodIdPattern.pattern.includes('invoice.id') && !methodIdPattern.pattern.includes('order.id')) {
        console.log('❌ Method select IDs use only invoice.id - POTENTIAL DUPLICATES');
      } else {
        console.log('⚠️  Method select ID pattern unclear');
      }
    }
    
    // Check for getElementById calls
    console.log('\n🔍 Checking getElementById calls...');
    const getElementRegex = /getElementById\([^)]+\)/g;
    const getElementCalls = [];
    
    while ((match = getElementRegex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      getElementCalls.push({
        call: match[0],
        line: line
      });
    }
    
    getElementCalls.forEach((call, index) => {
      console.log(`   ${index + 1}. Line ${call.line}: ${call.call}`);
      
      if (call.call.includes('order.id') && call.call.includes('invoice.id')) {
        console.log('      ✅ Uses both order.id and invoice.id - CONSISTENT');
      } else if (call.call.includes('invoice.id') && !call.call.includes('order.id')) {
        console.log('      ❌ Uses only invoice.id - INCONSISTENT');
      }
    });
    
    // Final assessment
    const hasUniquePatterns = methodIdPattern && 
                             methodIdPattern.pattern.includes('order.id') && 
                             methodIdPattern.pattern.includes('invoice.id');
    
    const hasConsistentCalls = getElementCalls.every(call => 
      call.call.includes('order.id') && call.call.includes('invoice.id')
    );
    
    console.log('\n📊 === ASSESSMENT ===');
    console.log('ID Pattern Uniqueness:', hasUniquePatterns ? '✅ GOOD' : '❌ NEEDS FIX');
    console.log('getElementById Consistency:', hasConsistentCalls ? '✅ GOOD' : '❌ NEEDS FIX');
    
    return hasUniquePatterns && hasConsistentCalls;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const success = testIdPatterns();
  
  console.log('\n📊 === TEST RESULT ===');
  if (success) {
    console.log('✅ ID patterns are UNIQUE and CONSISTENT');
    console.log('🎉 No duplicate form field IDs expected!');
  } else {
    console.log('❌ ID patterns need improvement');
  }
  
  process.exit(success ? 0 : 1);
}

module.exports = { testIdPatterns };
