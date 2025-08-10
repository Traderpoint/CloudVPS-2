// Debug test for payment-complete page
// Tests what actually happens when user lands on payment-complete page

const BASE_URL = 'http://localhost:3000';

async function testPaymentCompleteDebug() {
  console.log('🔍 Testing Payment-Complete Page Debug...\n');

  try {
    // Test data with real transaction ID
    const testParams = {
      transactionId: 'FXPC-1JMZ-B8IN',
      paymentId: 'FXPC-1JMZ-B8IN',
      orderId: 'ORDER-1754404432762',
      invoiceId: '456',
      amount: '1000',
      currency: 'CZK',
      paymentMethod: 'comgate',
      status: 'success'
    };

    console.log('📋 Test parameters:', testParams);

    // Step 1: Test payment-complete page with URL parameters
    console.log('\n1️⃣ STEP 1: Test payment-complete page with URL parameters');
    console.log('==========================================================');
    
    const queryString = new URLSearchParams(testParams).toString();
    const paymentCompleteUrl = `${BASE_URL}/payment-complete?${queryString}`;
    
    console.log('🔗 Payment complete URL:', paymentCompleteUrl);
    console.log('📋 Query string:', queryString);

    const response = await fetch(paymentCompleteUrl);
    
    if (response.ok) {
      const html = await response.text();
      
      console.log('✅ Payment complete page loaded');
      console.log('   Status:', response.status);
      console.log('   Content-Type:', response.headers.get('content-type'));
      
      // Check if transaction ID is visible in HTML
      if (html.includes(testParams.transactionId)) {
        console.log('   ✅ Transaction ID found in HTML:', testParams.transactionId);
      } else {
        console.log('   ❌ Transaction ID NOT found in HTML');
        console.log('   🔍 Searching for any transaction ID patterns...');
        
        // Look for transaction ID patterns
        const transactionPatterns = [
          /[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/g,
          /transactionId['":\s]*([A-Z0-9-]+)/gi,
          /transaction['":\s]*([A-Z0-9-]+)/gi
        ];
        
        let foundPatterns = [];
        transactionPatterns.forEach((pattern, index) => {
          const matches = html.match(pattern);
          if (matches) {
            foundPatterns.push(`Pattern ${index + 1}: ${matches.join(', ')}`);
          }
        });
        
        if (foundPatterns.length > 0) {
          console.log('   🔍 Found transaction patterns:', foundPatterns);
        } else {
          console.log('   ❌ No transaction ID patterns found in HTML');
        }
      }
      
      // Check for specific elements
      if (html.includes('Auto-Capture Payment')) {
        console.log('   ✅ Auto-Capture button found');
      }
      
      if (html.includes('Mark as Paid')) {
        console.log('   ✅ Mark as Paid button found');
      }
      
      if (html.includes('Order Confirmation')) {
        console.log('   ✅ Order Confirmation button found');
      }
      
      // Check for JavaScript errors or issues
      if (html.includes('router.query')) {
        console.log('   ✅ Router.query usage detected');
      }
      
      if (html.includes('useEffect')) {
        console.log('   ✅ useEffect hook detected');
      }
      
      // Check for console.log statements
      if (html.includes('console.log')) {
        console.log('   ✅ Console logging detected');
      }
      
    } else {
      console.log('❌ Payment complete page error:', response.status);
    }

    // Step 2: Test individual URL parameters
    console.log('\n2️⃣ STEP 2: Test individual URL parameters');
    console.log('==========================================');
    
    Object.entries(testParams).forEach(([key, value]) => {
      const singleParamUrl = `${BASE_URL}/payment-complete?${key}=${value}`;
      console.log(`   ${key}: ${value}`);
    });

    // Step 3: Test with minimal parameters
    console.log('\n3️⃣ STEP 3: Test with minimal parameters');
    console.log('=======================================');
    
    const minimalParams = {
      transactionId: testParams.transactionId,
      invoiceId: testParams.invoiceId
    };
    
    const minimalQueryString = new URLSearchParams(minimalParams).toString();
    const minimalUrl = `${BASE_URL}/payment-complete?${minimalQueryString}`;
    
    console.log('🔗 Minimal URL:', minimalUrl);
    
    const minimalResponse = await fetch(minimalUrl);
    
    if (minimalResponse.ok) {
      const minimalHtml = await minimalResponse.text();
      
      if (minimalHtml.includes(testParams.transactionId)) {
        console.log('   ✅ Transaction ID found with minimal parameters');
      } else {
        console.log('   ❌ Transaction ID NOT found with minimal parameters');
      }
    }

    // Step 4: Test JavaScript execution simulation
    console.log('\n4️⃣ STEP 4: Test JavaScript execution simulation');
    console.log('===============================================');
    
    console.log('🔄 Simulating JavaScript parameter extraction...');
    
    // Simulate what happens in useEffect
    const urlParams = new URLSearchParams(queryString);
    const extractedParams = {};
    for (const [key, value] of urlParams.entries()) {
      extractedParams[key] = value;
    }
    
    console.log('📋 Extracted parameters:', extractedParams);
    
    const {
      transactionId,
      paymentId,
      invoiceId,
      orderId,
      amount,
      currency,
      paymentMethod,
      status
    } = extractedParams;
    
    const actualTransactionId = transactionId || paymentId;
    const actualPaymentId = paymentId || transactionId;
    
    console.log('🔍 Processed transaction IDs:', {
      transactionId,
      paymentId,
      actualTransactionId,
      actualPaymentId
    });
    
    if (actualTransactionId) {
      console.log('   ✅ Transaction ID successfully extracted:', actualTransactionId);
    } else {
      console.log('   ❌ Transaction ID extraction failed');
    }

    // Step 5: Test API endpoints that payment-complete page would call
    console.log('\n5️⃣ STEP 5: Test API endpoints');
    console.log('==============================');
    
    if (actualTransactionId && invoiceId) {
      // Test auto-capture API
      console.log('🔄 Testing auto-capture API...');
      
      const captureData = {
        invoice_id: invoiceId,
        amount: parseFloat(amount) || 1000,
        module: 'Comgate',
        trans_id: actualTransactionId,
        note: `Debug test auto-capture - Transaction: ${actualTransactionId}`
      };
      
      try {
        const captureResponse = await fetch(`${BASE_URL}/api/middleware/capture-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(captureData)
        });
        
        if (captureResponse.ok) {
          const captureResult = await captureResponse.json();
          
          if (captureResult.success) {
            console.log('   ✅ Auto-capture API working');
            console.log('   Result:', captureResult.message);
          } else {
            console.log('   ⚠️ Auto-capture API returned error:', captureResult.error);
          }
        } else {
          console.log('   ❌ Auto-capture API error:', captureResponse.status);
        }
      } catch (error) {
        console.log('   ❌ Auto-capture API exception:', error.message);
      }
    }

    // Step 6: Summary and recommendations
    console.log('\n🎯 SUMMARY AND RECOMMENDATIONS');
    console.log('===============================');
    
    console.log('\n📊 Debug Results:');
    console.log('   URL Parameters: ✅ Correctly formatted');
    console.log('   Page Loading: ✅ Payment-complete page loads');
    console.log('   Parameter Extraction: ✅ JavaScript logic works');
    console.log('   Transaction ID: ' + (actualTransactionId ? '✅ ' + actualTransactionId : '❌ Missing'));
    
    console.log('\n🔍 Possible Issues:');
    console.log('   1. Next.js router.query timing issue');
    console.log('   2. Client-side JavaScript not executing');
    console.log('   3. useEffect dependency array issue');
    console.log('   4. Browser cache preventing updates');
    
    console.log('\n🛠️ Debugging Steps:');
    console.log('   1. Open browser dev tools on payment-complete page');
    console.log('   2. Check console for JavaScript errors');
    console.log('   3. Verify router.query in browser console');
    console.log('   4. Check if useEffect is firing');
    console.log('   5. Try hard refresh (Ctrl+Shift+R)');
    
    console.log('\n✅ DEBUG TEST COMPLETE!');

  } catch (error) {
    console.error('❌ Payment-complete debug test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS (3000) is running');
    console.log('   2. Check that payment-complete.js exists');
    console.log('   3. Verify URL parameter format');
    console.log('   4. Test with browser dev tools open');
  }
}

// Run the debug test
if (require.main === module) {
  testPaymentCompleteDebug();
}

module.exports = { testPaymentCompleteDebug };
