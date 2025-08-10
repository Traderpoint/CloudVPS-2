/**
 * Test Unique IDs in Invoice Payment Test
 * Verifies that all form elements have unique IDs
 */

const puppeteer = require('puppeteer');

async function testUniqueIds() {
  console.log('🧪 === UNIQUE IDS TEST ===\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the page
    console.log('🌐 Loading Invoice Payment Test page...');
    await page.goto('http://localhost:3000/invoice-payment-test', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Get all elements with IDs
    const elementsWithIds = await page.evaluate(() => {
      const elements = document.querySelectorAll('[id]');
      const ids = [];
      
      elements.forEach(element => {
        ids.push({
          id: element.id,
          tagName: element.tagName,
          type: element.type || null,
          className: element.className || null
        });
      });
      
      return ids;
    });
    
    console.log('📊 Found elements with IDs:', elementsWithIds.length);
    
    // Check for duplicates
    const idCounts = {};
    const duplicates = [];
    
    elementsWithIds.forEach(element => {
      if (idCounts[element.id]) {
        idCounts[element.id]++;
        if (idCounts[element.id] === 2) {
          duplicates.push(element.id);
        }
      } else {
        idCounts[element.id] = 1;
      }
    });
    
    console.log('\n📋 All IDs found:');
    elementsWithIds.forEach(element => {
      const count = idCounts[element.id];
      const status = count > 1 ? '❌ DUPLICATE' : '✅ UNIQUE';
      console.log(`   ${status} ${element.id} (${element.tagName}${element.type ? ` type="${element.type}"` : ''})`);
    });
    
    if (duplicates.length === 0) {
      console.log('\n✅ ALL IDs ARE UNIQUE!');
      console.log('🎉 No duplicate form field IDs found');
      return true;
    } else {
      console.log('\n❌ DUPLICATE IDs FOUND:');
      duplicates.forEach(id => {
        console.log(`   - "${id}" appears ${idCounts[id]} times`);
      });
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testUniqueIds()
    .then((success) => {
      console.log('\n📊 === TEST RESULT ===');
      if (success) {
        console.log('✅ All form field IDs are UNIQUE');
        console.log('🎉 Browser autofill should work correctly!');
      } else {
        console.log('❌ Duplicate IDs found - needs fixing');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testUniqueIds };
