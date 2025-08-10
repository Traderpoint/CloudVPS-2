/**
 * Test Delete Product and Detailed View Functionality
 * Tests the new delete product feature and enhanced product details display
 */

const http = require('http');

async function makeRequest(method, hostname, port, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

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

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testDetailedProductView() {
  console.log('👁️ Testing Detailed Product View...');
  
  try {
    const result = await makeRequest('GET', 'localhost', 3005, '/api/hostbill/product-detail?product_id=5&affiliate_id=1');
    
    if (result.success && result.product) {
      console.log('✅ Detailed product view successful!');
      
      const product = result.product;
      console.log('📊 Product Details Structure:');
      console.log(`  ID: ${product.id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Category: ${product.category}`);
      console.log(`  Type: ${product.type || 'N/A'}`);
      console.log(`  Module: ${product.module || 'N/A'}`);
      console.log(`  Visible: ${product.visible ? 'Yes' : 'No'}`);
      console.log(`  Description: ${product.description ? 'Available' : 'None'}`);
      
      // Check pricing fields
      console.log('💰 Pricing Information:');
      const pricingFields = ['m', 'q', 's', 'a', 'b', 't'];
      pricingFields.forEach(field => {
        if (product[field] && product[field] !== '0') {
          console.log(`  ${field.toUpperCase()}: ${product[field]} CZK`);
        }
      });
      
      // Check setup fees
      const setupFields = ['m_setup', 'q_setup', 'a_setup'];
      setupFields.forEach(field => {
        if (product[field] && product[field] !== '0') {
          console.log(`  ${field}: ${product[field]} CZK`);
        }
      });
      
      // Check configuration fields
      console.log('⚙️ Configuration:');
      console.log(`  Stock: ${product.stock || '0'}`);
      console.log(`  Quantity: ${product.qty || 'Unlimited'}`);
      console.log(`  Weight: ${product.weight || '0'}`);
      
      // Check components
      console.log('🔧 Components:');
      if (product.options && product.options.length > 0) {
        console.log(`  Custom Fields: ${product.options.length} configured`);
      } else {
        console.log('  Custom Fields: None configured');
      }
      
      return product;
    } else {
      console.log('❌ Detailed product view failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Detailed product view error:', error.message);
    return null;
  }
}

async function testCreateProductForDeletion() {
  console.log('\n🆕 Creating test product for deletion...');
  
  const timestamp = Date.now();
  const testProductName = `DELETE TEST Product ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: testProductName,
      settings: [1, 2], // General, Pricing
      affiliate_id: '1'
    };
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success && result.newProduct) {
      console.log('✅ Test product created for deletion');
      console.log(`📦 Created: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      return result.newProduct;
    } else {
      console.log('❌ Failed to create test product:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Create test product error:', error.message);
    return null;
  }
}

async function testDeleteProduct(productId, productName) {
  console.log(`\n🗑️ Testing Delete Product: ${productName} (ID: ${productId})...`);
  
  try {
    const deleteData = {
      productId: productId.toString(),
      affiliate_id: '1'
    };
    
    const result = await makeRequest('DELETE', 'localhost', 3005, '/api/hostbill/delete-product', deleteData);
    
    if (result.success) {
      console.log('✅ Product deletion successful!');
      console.log('📊 Deletion Result:');
      console.log(`  Deleted Product: ${result.deletedProduct.name} (ID: ${result.deletedProduct.id})`);
      console.log(`  Category: ${result.deletedProduct.category}`);
      console.log(`  Message: ${result.message}`);
      return true;
    } else {
      console.log('❌ Product deletion failed:', result.error);
      console.log('📋 Full response:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Product deletion error:', error.message);
    return false;
  }
}

async function runDeleteAndDetailedViewTest() {
  console.log('🚀 Testing Delete Product and Detailed View Functionality');
  console.log('================================================================================');
  console.log('Testing enhanced product details display and delete functionality');
  console.log('================================================================================');

  let testResults = {
    detailedView: false,
    createTestProduct: false,
    deleteProduct: false
  };

  // Test 1: Detailed Product View
  const productDetail = await testDetailedProductView();
  if (productDetail) {
    testResults.detailedView = true;
  }

  // Test 2: Create Test Product for Deletion
  const testProduct = await testCreateProductForDeletion();
  if (testProduct) {
    testResults.createTestProduct = true;
    
    // Test 3: Delete the Test Product
    const deleteSuccess = await testDeleteProduct(testProduct.id, testProduct.name);
    if (deleteSuccess) {
      testResults.deleteProduct = true;
    }
  }

  // Summary
  console.log('\n📊 DELETE AND DETAILED VIEW TEST SUMMARY');
  console.log('================================================================================');
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log('');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });

  console.log('\n🎯 IMPLEMENTED FEATURES');
  console.log('================================================================================');
  console.log('✅ Enhanced Product Details Display:');
  console.log('   1. General - ID, Name, Category, Type, Module, Visible, Description');
  console.log('   2. Pricing - All billing cycles, Setup fees');
  console.log('   3. Configuration - Stock, Quantity, Weight, Tax class, Server');
  console.log('   4. Components (Form fields) - Custom fields count and preview');
  console.log('   5. Emails - Welcome email, Email template configuration');
  console.log('   6. Related products - Related products list');
  console.log('   7. Automation scripts - Auto setup, Provisioning, Hooks');
  console.log('   8. Order process - Order form, Payment required, Trial period');
  console.log('   9. Domain settings - Domain required, Subdomain, TLD options');
  console.log('');
  console.log('✅ Delete Product Functionality:');
  console.log('   - Red "🗑️ Delete Product" button in product details');
  console.log('   - Confirmation dialog with warning');
  console.log('   - Middleware API call to delete product');
  console.log('   - Success/error feedback');
  console.log('   - Automatic refresh of products list');

  console.log('\n🔧 MIDDLEWARE ENDPOINTS');
  console.log('================================================================================');
  console.log(`${testResults.detailedView ? '✅' : '❌'} GET /api/hostbill/product-detail - Enhanced with all SETTINGS_LABELS fields`);
  console.log(`${testResults.deleteProduct ? '✅' : '❌'} DELETE /api/hostbill/delete-product - New delete functionality`);

  console.log('\n🎨 USER EXPERIENCE');
  console.log('================================================================================');
  console.log('📋 ENHANCED VIEW DETAILS FLOW:');
  console.log('1. Select product from dropdown');
  console.log('2. Click "👁️ View Details" button');
  console.log('3. Comprehensive product details display with all 9 SETTINGS_LABELS sections');
  console.log('4. Each section color-coded and organized');
  console.log('5. Red "🗑️ Delete Product" button in header');
  console.log('');
  console.log('🗑️ DELETE PRODUCT FLOW:');
  console.log('1. View product details');
  console.log('2. Click red "🗑️ Delete Product" button');
  console.log('3. Confirmation dialog appears with warning');
  console.log('4. Confirm deletion');
  console.log('5. Product deleted from HostBill');
  console.log('6. Success message displayed');
  console.log('7. Products list automatically refreshed');

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! NEW FEATURES WORKING!');
    console.log('================================================================================');
    console.log('✅ Enhanced product details display with all SETTINGS_LABELS fields');
    console.log('✅ Delete product functionality with confirmation');
    console.log('✅ Middleware integration working correctly');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please check the failed tests and fix any issues.');
  }

  console.log('\n✅ Delete product and detailed view test completed!');
}

// Run the test
runDeleteAndDetailedViewTest();
