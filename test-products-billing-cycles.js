/**
 * Test Products and Billing Cycles
 * Finding products that support draft/free billing cycles
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function makeHostBillApiCall(params) {
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const curlCommand = `curl -k -X POST "https://vps.kabel1it.cz/admin/api.php" -H "Content-Type: application/x-www-form-urlencoded" -d "api_id=adcdebb0e3b6f583052d&api_key=341697c41aeb1c842f0d&${paramString}"`;
  
  try {
    const { stdout, stderr } = await execAsync(curlCommand);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Curl error:', error.message);
    return { error: error.message };
  }
}

async function testProductsAndBillingCycles() {
  console.log('🚀 Testing Products and Billing Cycles');
  console.log('================================================================================');
  console.log('Finding products that support draft/free billing cycles');
  console.log('================================================================================');

  // 1. Get list of products
  console.log('1️⃣ Getting list of products...');
  
  const productsResult = await makeHostBillApiCall({
    call: 'getProducts'
  });

  if (!productsResult.success) {
    console.log('❌ Failed to get products:', productsResult.error);
    return;
  }

  console.log('✅ Products retrieved successfully');
  console.log(`📦 Total products: ${productsResult.products ? productsResult.products.length : 'Unknown'}`);

  if (productsResult.products) {
    console.log('\n📋 Available Products:');
    console.log('================================================================================');
    
    productsResult.products.forEach((product, index) => {
      console.log(`${index + 1}. Product ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Type: ${product.type}`);
      console.log(`   Category: ${product.category_name || 'N/A'}`);
      console.log(`   Status: ${product.status}`);
      if (product.pricing) {
        console.log(`   Pricing: ${JSON.stringify(product.pricing)}`);
      }
      console.log('');
    });

    // 2. Test different products with draft/free billing cycles
    console.log('\n2️⃣ Testing different products with draft/free billing cycles...');
    
    const testProducts = productsResult.products.slice(0, 5); // Test first 5 products
    const billingCyclesToTest = ['draft', 'free', 'onetime'];

    for (const product of testProducts) {
      console.log(`\n🧪 Testing Product ${product.id}: ${product.name}`);
      console.log('================================================================================');

      for (const billingCycle of billingCyclesToTest) {
        console.log(`\n📤 Testing ${product.name} with ${billingCycle} billing cycle...`);

        try {
          const timestamp = Date.now();
          
          const orderData = {
            customer: {
              firstName: "TestProduct",
              lastName: `${billingCycle}Test`,
              email: `test.product.${billingCycle}.${timestamp}@test.com`,
              phone: "+420123456789",
              address: "Test Street 123",
              city: "Praha",
              postalCode: "11000",
              country: "CZ",
              company: `Test Product ${billingCycle} s.r.o.`
            },
            items: [{
              productId: product.id,
              name: product.name,
              quantity: 1,
              price: billingCycle === 'free' ? 0 : 299,
              cycle: billingCycle
            }],
            paymentMethod: "0",
            total: billingCycle === 'free' ? 0 : 299
          };

          // Create order via our API
          const http = require('http');
          const postData = JSON.stringify(orderData);
          
          const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/orders/create',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const orderResult = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
              let responseData = '';
              res.on('data', (chunk) => {
                responseData += chunk;
              });
              
              res.on('end', () => {
                try {
                  const jsonData = JSON.parse(responseData);
                  resolve(jsonData);
                } catch (e) {
                  resolve({ error: 'Invalid JSON', raw: responseData });
                }
              });
            });

            req.on('error', (err) => {
              reject(err);
            });

            req.write(postData);
            req.end();
          });

          if (orderResult.success) {
            const order = orderResult.orders[0];
            console.log(`✅ Order created: ${order.orderId}`);

            // Wait and check order details
            await new Promise(resolve => setTimeout(resolve, 2000));

            const orderDetails = await makeHostBillApiCall({
              call: 'getOrderDetails',
              id: order.orderId
            });

            if (orderDetails.success) {
              const details = orderDetails.details;
              const hosting = details.hosting[0];
              
              console.log(`📊 Result: ${billingCycle} → ${hosting?.billingcycle || 'N/A'}`);
              console.log(`   Balance: ${details.balance}, Status: ${details.status}`);
              
              // Check for Payment Authorized
              if (details.balance === 'Authorized') {
                console.log('🎉 PAYMENT AUTHORIZED FOUND!');
              }
              
              // Check if billing cycle was preserved
              if (hosting?.billingcycle?.toLowerCase() === billingCycle.toLowerCase()) {
                console.log('🎯 BILLING CYCLE PRESERVED!');
              }
            }
          } else {
            console.log(`❌ Order creation failed: ${orderResult.error}`);
          }

        } catch (error) {
          console.log(`❌ Test failed: ${error.message}`);
        }

        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // 3. Test with direct HostBill API calls for specific products
  console.log('\n3️⃣ Testing direct HostBill API calls...');
  
  const directTests = [
    { product_id: '1', billingcycle: 'draft', payment_module: '0' },
    { product_id: '1', billingcycle: 'free', payment_module: '0' },
    { product_id: '5', billingcycle: 'draft', payment_module: '10' },
    { product_id: '5', billingcycle: 'free', payment_module: '10' }
  ];

  for (const test of directTests) {
    console.log(`\n📤 Direct API test: Product ${test.product_id}, Cycle ${test.billingcycle}, Payment ${test.payment_module}`);

    const orderParams = {
      call: 'addOrder',
      client_id: '113',
      product_id: test.product_id,
      domain: '',
      billingcycle: test.billingcycle,
      payment_module: test.payment_module,
      qty: '1',
      notes: `Direct API test - ${test.billingcycle} - ${Date.now()}`
    };

    const result = await makeHostBillApiCall(orderParams);
    
    if (result.success) {
      console.log(`✅ Direct API success: Order ${result.order_id || result.id}`);
      
      if (result.order_id || result.id) {
        const orderId = result.order_id || result.id;
        
        // Check order details
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const orderDetails = await makeHostBillApiCall({
          call: 'getOrderDetails',
          id: orderId
        });

        if (orderDetails.success) {
          const details = orderDetails.details;
          const hosting = details.hosting[0];
          
          console.log(`📊 Direct Result: ${test.billingcycle} → ${hosting?.billingcycle || 'N/A'}`);
          console.log(`   Balance: ${details.balance}, Status: ${details.status}`);
          
          if (details.balance === 'Authorized') {
            console.log('🎉 PAYMENT AUTHORIZED FOUND IN DIRECT API!');
          }
        }
      }
    } else {
      console.log(`❌ Direct API failed: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Products and billing cycles test completed!');
}

// Run the script
testProductsAndBillingCycles();
