/**
 * Debug Invoice Structure
 * Check what fields invoices actually have from HostBill
 */

const HostBillClient = require('./lib/hostbill-client');

async function debugInvoiceStructure() {
  console.log('🧪 === DEBUG INVOICE STRUCTURE ===\n');
  
  try {
    const hostbillClient = new HostBillClient();
    
    // Get a few invoices to see their structure
    console.log('🔍 Getting invoices from HostBill...');
    const invoicesResult = await hostbillClient.makeApiCall({
      call: 'getInvoices',
      limit: 3
    });

    if (invoicesResult && invoicesResult.invoices) {
      const invoices = Array.isArray(invoicesResult.invoices) 
        ? invoicesResult.invoices 
        : Object.values(invoicesResult.invoices);
      
      console.log('📊 Total invoices found:', invoices.length);
      console.log('\n📋 First few invoices structure:');
      
      invoices.slice(0, 3).forEach((invoice, index) => {
        console.log(`\n${index + 1}. Invoice ID: ${invoice.id}`);
        console.log('   Fields available:');
        Object.keys(invoice).forEach(key => {
          const value = invoice[key];
          if (key.toLowerCase().includes('order') || key === 'id' || key === 'status' || key === 'total') {
            console.log(`   - ${key}: ${value} (${typeof value})`);
          }
        });
      });
      
      // Check for order-related fields
      console.log('\n🔍 Looking for order-related fields...');
      const firstInvoice = invoices[0];
      const orderFields = Object.keys(firstInvoice).filter(key => 
        key.toLowerCase().includes('order') || 
        key.toLowerCase().includes('service') ||
        key.toLowerCase().includes('product')
      );
      
      console.log('📋 Order-related fields found:', orderFields);
      orderFields.forEach(field => {
        console.log(`   - ${field}: ${firstInvoice[field]}`);
      });
      
      // Get orders to compare
      console.log('\n🔍 Getting orders for comparison...');
      const ordersResult = await hostbillClient.makeApiCall({
        call: 'getOrders',
        limit: 2
      });
      
      if (ordersResult && ordersResult.orders) {
        const orders = Array.isArray(ordersResult.orders) 
          ? ordersResult.orders 
          : Object.values(ordersResult.orders);
        
        console.log('\n📋 First order structure:');
        const firstOrder = orders[0];
        console.log('   Order ID:', firstOrder.id);
        console.log('   Order fields:');
        Object.keys(firstOrder).forEach(key => {
          if (key === 'id' || key === 'client_id' || key === 'status' || key === 'total') {
            console.log(`   - ${key}: ${firstOrder[key]} (${typeof firstOrder[key]})`);
          }
        });
        
        // Try to find matching invoices
        console.log('\n🔍 Looking for invoices matching order ID', firstOrder.id);
        const matchingInvoices = invoices.filter(invoice => {
          return Object.values(invoice).some(value => 
            value && value.toString() === firstOrder.id.toString()
          );
        });
        
        console.log('📊 Matching invoices found:', matchingInvoices.length);
        if (matchingInvoices.length > 0) {
          console.log('✅ Found matching field patterns!');
          matchingInvoices.slice(0, 2).forEach((invoice, index) => {
            console.log(`   ${index + 1}. Invoice ${invoice.id}:`);
            Object.keys(invoice).forEach(key => {
              if (invoice[key] && invoice[key].toString() === firstOrder.id.toString()) {
                console.log(`      - MATCH: ${key} = ${invoice[key]}`);
              }
            });
          });
        } else {
          console.log('❌ No matching invoices found - field names might be different');
        }
      }
      
      return true;
    } else {
      console.log('❌ No invoices returned from HostBill');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

// Run the debug
if (require.main === module) {
  debugInvoiceStructure()
    .then((success) => {
      console.log('\n📊 === DEBUG COMPLETE ===');
      if (success) {
        console.log('✅ Invoice structure analyzed');
        console.log('🔧 Use the findings to fix the filtering logic');
      } else {
        console.log('❌ Debug failed - check HostBill connection');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Debug execution failed:', error);
      process.exit(1);
    });
}

module.exports = { debugInvoiceStructure };
