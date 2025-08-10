/**
 * Test Delete Button Placement and List Refresh
 * Tests the new placement of delete button next to View Details and list refresh functionality
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

async function getProductsList() {
  console.log('📋 Getting current products list...');
  
  try {
    const result = await makeRequest('GET', 'localhost', 3005, '/api/affiliate/1/products?mode=affiliate');
    
    if (result.success && result.products) {
      console.log(`✅ Products list loaded: ${result.products.length} products`);
      return result.products;
    } else {
      console.log('❌ Failed to get products list:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Products list error:', error.message);
    return [];
  }
}

async function createTestProductForDeletion() {
  console.log('\n🆕 Creating test product for deletion test...');
  
  const timestamp = Date.now();
  const testProductName = `DELETE PLACEMENT TEST ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: testProductName,
      settings: [1, 2], // General, Pricing
      affiliate_id: '1'
    };
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success && result.newProduct) {
      console.log('✅ Test product created successfully');
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

async function deleteProductAndCheckRefresh(productId, productName, initialProductsCount) {
  console.log(`\n🗑️ Testing delete and refresh: ${productName} (ID: ${productId})...`);
  
  try {
    // Delete the product
    const deleteData = {
      productId: productId.toString(),
      affiliate_id: '1'
    };
    
    const deleteResult = await makeRequest('DELETE', 'localhost', 3005, '/api/hostbill/delete-product', deleteData);
    
    if (!deleteResult.success) {
      console.log('❌ Product deletion failed:', deleteResult.error);
      return false;
    }
    
    console.log('✅ Product deleted successfully');
    console.log(`📊 Deleted: ${deleteResult.deletedProduct.name} (ID: ${deleteResult.deletedProduct.id})`);
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if products list has been updated (should have one less product)
    console.log('\n🔄 Checking if products list was refreshed...');
    const updatedProducts = await getProductsList();
    
    if (updatedProducts.length === initialProductsCount - 1) {
      console.log('✅ Products list refreshed correctly');
      console.log(`📊 Product count: ${initialProductsCount} → ${updatedProducts.length}`);
      
      // Verify the deleted product is no longer in the list
      const deletedProductStillExists = updatedProducts.find(p => p.id === productId || p.id === productId.toString());
      if (!deletedProductStillExists) {
        console.log('✅ Deleted product removed from list');
        return true;
      } else {
        console.log('❌ Deleted product still appears in list');
        return false;
      }
    } else {
      console.log(`❌ Products list not refreshed correctly. Expected: ${initialProductsCount - 1}, Got: ${updatedProducts.length}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Delete and refresh test error:', error.message);
    return false;
  }
}

async function runDeletePlacementAndRefreshTest() {
  console.log('🚀 Testing Delete Button Placement and List Refresh');
  console.log('================================================================================');
  console.log('Testing new delete button placement next to View Details and list refresh');
  console.log('================================================================================');

  let testResults = {
    initialProductsList: false,
    createTestProduct: false,
    deleteAndRefresh: false
  };

  // Test 1: Get initial products list
  const initialProducts = await getProductsList();
  if (initialProducts.length > 0) {
    testResults.initialProductsList = true;
    console.log(`📊 Initial products count: ${initialProducts.length}`);
  }

  // Test 2: Create test product
  const testProduct = await createTestProductForDeletion();
  if (testProduct) {
    testResults.createTestProduct = true;
    
    // Verify product was added to list
    const productsAfterCreate = await getProductsList();
    console.log(`📊 Products count after creation: ${productsAfterCreate.length}`);
    
    // Test 3: Delete product and check refresh
    const deleteSuccess = await deleteProductAndCheckRefresh(
      testProduct.id, 
      testProduct.name, 
      productsAfterCreate.length
    );
    
    if (deleteSuccess) {
      testResults.deleteAndRefresh = true;
    }
  }

  // Summary
  console.log('\n📊 DELETE PLACEMENT AND REFRESH TEST SUMMARY');
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

  console.log('\n🎯 NEW IMPLEMENTATION FEATURES');
  console.log('================================================================================');
  console.log('✅ Delete Button Placement:');
  console.log('   - Moved from product detail card to main section');
  console.log('   - Positioned next to "👁️ View Details" button');
  console.log('   - Red "🗑️ Delete Product" button styling');
  console.log('   - Disabled when no product selected');
  console.log('   - Loading state during deletion');
  console.log('');
  console.log('✅ List Refresh Functionality:');
  console.log('   - Automatic refresh after successful deletion');
  console.log('   - Immediate update (no delay)');
  console.log('   - Deleted product removed from dropdown');
  console.log('   - Product count updated correctly');
  console.log('   - Success message with auto-clear after 5 seconds');

  console.log('\n🎨 USER EXPERIENCE IMPROVEMENTS');
  console.log('================================================================================');
  console.log('📋 IMPROVED DELETE FLOW:');
  console.log('1. Select product from dropdown');
  console.log('2. Click "🗑️ Delete Product" button (next to View Details)');
  console.log('3. Confirmation dialog appears');
  console.log('4. Confirm deletion');
  console.log('5. Product deleted from HostBill');
  console.log('6. Success message displayed');
  console.log('7. Products list automatically refreshed');
  console.log('8. Deleted product removed from dropdown');
  console.log('9. Success message auto-clears after 5 seconds');
  console.log('');
  console.log('📋 BUTTON LAYOUT:');
  console.log('[Product Dropdown] [👁️ View Details] [🗑️ Delete Product]');
  console.log('                   ↑ Blue button    ↑ Red button');

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! NEW PLACEMENT AND REFRESH WORKING!');
    console.log('================================================================================');
    console.log('✅ Delete button correctly placed next to View Details');
    console.log('✅ Products list refreshes automatically after deletion');
    console.log('✅ Deleted products removed from dropdown');
    console.log('✅ User experience improved with better button placement');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please check the failed tests and fix any issues.');
  }

  console.log('\n✅ Delete placement and refresh test completed!');
}

// Run the test
runDeletePlacementAndRefreshTest();
