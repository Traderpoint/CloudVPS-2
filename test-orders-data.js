/**
 * Test Orders Data Structure
 * Verifies what data the middleware API actually returns
 */

const http = require('http');

async function testOrdersData() {
  console.log('🧪 === ORDERS DATA STRUCTURE TEST ===\n');
  
  try {
    // Test middleware API directly
    console.log('🔍 Testing middleware API directly...');
    const middlewareResponse = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3005/api/orders/recent?limit=1', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, error: error.message });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    if (middlewareResponse.status === 200 && middlewareResponse.data.success) {
      console.log('✅ Middleware API successful');
      console.log('📊 Orders count:', middlewareResponse.data.orders?.length || 0);
      
      if (middlewareResponse.data.orders && middlewareResponse.data.orders.length > 0) {
        const firstOrder = middlewareResponse.data.orders[0];
        console.log('\n📋 First Order Structure:');
        console.log('   - Order ID:', firstOrder.id);
        console.log('   - Order Number:', firstOrder.number);
        console.log('   - Client Name:', firstOrder.client_name);
        console.log('   - Product:', firstOrder.product_name);
        console.log('   - Status:', firstOrder.status);
        console.log('   - Total:', firstOrder.total, firstOrder.currency);
        console.log('   - Invoices Count:', firstOrder.invoices?.length || 0);
        
        if (firstOrder.invoices && firstOrder.invoices.length > 0) {
          console.log('\n💰 Invoices for this order:');
          firstOrder.invoices.forEach((invoice, index) => {
            console.log(`   ${index + 1}. Invoice ID: ${invoice.id}, Status: ${invoice.status}, Total: ${invoice.total} ${invoice.currency}`);
          });
          
          if (firstOrder.invoices.length > 5) {
            console.log(`   ... and ${firstOrder.invoices.length - 5} more invoices`);
            console.log('\n❌ PROBLEM DETECTED: Too many invoices for one order!');
            console.log('🔍 Expected: 1-2 invoices per order');
            console.log('🔍 Actual:', firstOrder.invoices.length, 'invoices');
            
            // Check if invoices have different order_ids
            const uniqueOrderIds = [...new Set(firstOrder.invoices.map(inv => inv.order_id))];
            console.log('🔍 Unique order IDs in invoices:', uniqueOrderIds);
            
            return false;
          }
        } else {
          console.log('\n⚠️  No invoices found for this order');
        }
      }
      
      return true;
    } else {
      console.log('❌ Middleware API failed');
      console.log('   Status:', middlewareResponse.status);
      console.log('   Error:', middlewareResponse.data.error || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Test CloudVPS API too
async function testCloudVPSAPI() {
  console.log('\n🔍 Testing CloudVPS API...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/middleware/recent-orders?limit=1', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, error: error.message });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ CloudVPS API successful');
      console.log('📊 Orders count:', response.data.orders?.length || 0);
      
      if (response.data.orders && response.data.orders.length > 0) {
        const firstOrder = response.data.orders[0];
        console.log('📋 First Order via CloudVPS:');
        console.log('   - Order ID:', firstOrder.id);
        console.log('   - Invoices Count:', firstOrder.invoices?.length || 0);
        
        return firstOrder.invoices?.length <= 5; // Reasonable number
      }
    }
    
    return false;
  } catch (error) {
    console.log('❌ CloudVPS API test failed:', error.message);
    return false;
  }
}

// Run the tests
if (require.main === module) {
  Promise.all([testOrdersData(), testCloudVPSAPI()])
    .then(([middlewareOk, cloudvpsOk]) => {
      console.log('\n📊 === TEST RESULTS ===');
      console.log('Middleware API:', middlewareOk ? '✅ OK' : '❌ PROBLEM');
      console.log('CloudVPS API:', cloudvpsOk ? '✅ OK' : '❌ PROBLEM');
      
      if (!middlewareOk || !cloudvpsOk) {
        console.log('\n🔧 === DIAGNOSIS ===');
        console.log('The issue is likely in the HostBill API filter:');
        console.log('- filter[order_id] might not work correctly');
        console.log('- HostBill might be returning ALL invoices instead of filtered ones');
        console.log('- Need to fix the filtering logic in middleware');
      }
      
      process.exit(middlewareOk && cloudvpsOk ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testOrdersData, testCloudVPSAPI };
