/**
 * Test Console Errors Fixed
 * Verifies that console errors have been resolved
 */

const fs = require('fs');
const path = require('path');

function testConsoleErrorsFixes() {
  console.log('🧪 === CONSOLE ERRORS FIXES TEST ===\n');
  
  try {
    // Test 1: Check React warning fix (no selected + defaultValue)
    console.log('🔍 Test 1: React warning fix...');
    const invoiceTestPath = path.join(__dirname, 'pages', 'invoice-payment-test.js');
    const invoiceContent = fs.readFileSync(invoiceTestPath, 'utf8');
    
    const hasDefaultValue = invoiceContent.includes('defaultValue="comgate"');
    const hasSelectedProp = invoiceContent.includes('selected={method.id === \'comgate\'}');
    
    console.log('   - defaultValue="comgate":', hasDefaultValue ? '✅ FOUND' : '❌ MISSING');
    console.log('   - selected prop on option:', hasSelectedProp ? '❌ STILL PRESENT' : '✅ REMOVED');
    
    const reactWarningFixed = hasDefaultValue && !hasSelectedProp;
    console.log('   - React warning fixed:', reactWarningFixed ? '✅ YES' : '❌ NO');
    
    // Test 2: Check CSP fix (no Google Fonts)
    console.log('\n🔍 Test 2: CSP Google Fonts fix...');
    const documentPath = path.join(__dirname, 'pages', '_document.js');
    const documentContent = fs.readFileSync(documentPath, 'utf8');
    
    const hasGoogleFonts = documentContent.includes('fonts.googleapis.com');
    const hasInterFont = documentContent.includes('Inter:wght');
    
    console.log('   - Google Fonts links:', hasGoogleFonts ? '❌ STILL PRESENT' : '✅ REMOVED');
    console.log('   - Inter font import:', hasInterFont ? '❌ STILL PRESENT' : '✅ REMOVED');
    
    const cspFixed = !hasGoogleFonts && !hasInterFont;
    console.log('   - CSP issue fixed:', cspFixed ? '✅ YES' : '❌ NO');
    
    // Test 3: Check Next.js config CSP
    console.log('\n🔍 Test 3: Next.js CSP configuration...');
    const configPath = path.join(__dirname, 'next.config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const hasGoogleFontsInCSP = configContent.includes('fonts.googleapis.com');
    const hasGstaticInCSP = configContent.includes('fonts.gstatic.com');
    const hasSelfFontSrc = configContent.includes("font-src 'self'");
    
    console.log('   - Google Fonts in CSP:', hasGoogleFontsInCSP ? '❌ STILL PRESENT' : '✅ REMOVED');
    console.log('   - Gstatic in CSP:', hasGstaticInCSP ? '❌ STILL PRESENT' : '✅ REMOVED');
    console.log('   - Self font-src only:', hasSelfFontSrc ? '✅ CORRECT' : '❌ MISSING');
    
    const cspConfigFixed = !hasGoogleFontsInCSP && !hasGstaticInCSP && hasSelfFontSrc;
    console.log('   - CSP config fixed:', cspConfigFixed ? '✅ YES' : '❌ NO');
    
    // Test 4: Check font usage (should be system fonts only)
    console.log('\n🔍 Test 4: Font usage check...');
    const usesArialFont = invoiceContent.includes("fontFamily: 'Arial, sans-serif'");
    const usesInterFont = invoiceContent.includes('Inter') || invoiceContent.includes('font-family: Inter');
    
    console.log('   - Uses Arial (system font):', usesArialFont ? '✅ YES' : '❌ NO');
    console.log('   - Uses Inter (Google font):', usesInterFont ? '❌ YES' : '✅ NO');
    
    const fontUsageCorrect = usesArialFont && !usesInterFont;
    console.log('   - Font usage correct:', fontUsageCorrect ? '✅ YES' : '❌ NO');
    
    // Overall result
    const allFixed = reactWarningFixed && cspFixed && cspConfigFixed && fontUsageCorrect;
    
    console.log('\n📊 === FIXES SUMMARY ===');
    console.log('1. React warning (defaultValue + selected):', reactWarningFixed ? '✅ FIXED' : '❌ NOT FIXED');
    console.log('2. CSP Google Fonts issue:', cspFixed ? '✅ FIXED' : '❌ NOT FIXED');
    console.log('3. CSP configuration:', cspConfigFixed ? '✅ FIXED' : '❌ NOT FIXED');
    console.log('4. Font usage (system fonts only):', fontUsageCorrect ? '✅ FIXED' : '❌ NOT FIXED');
    
    if (allFixed) {
      console.log('\n✅ === ALL CONSOLE ERRORS FIXED ===');
      console.log('🎉 No more console warnings expected!');
      console.log('📋 Changes made:');
      console.log('   - Removed selected prop from option elements');
      console.log('   - Removed Google Fonts from _document.js');
      console.log('   - Updated CSP to allow only system fonts');
      console.log('   - Using Arial font family consistently');
      console.log('\n🌐 Test the page: http://localhost:3000/invoice-payment-test');
      console.log('👀 Check browser console - should be clean now!');
    } else {
      console.log('\n❌ === SOME ISSUES REMAIN ===');
      console.log('⚠️  Check the failing tests above');
    }
    
    return allFixed;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const success = testConsoleErrorsFixes();
  process.exit(success ? 0 : 1);
}

module.exports = { testConsoleErrorsFixes };
