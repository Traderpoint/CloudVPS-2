/**
 * Test Direct HostBill Invoice Creation (Bypass Middleware)
 * This will show us the default HostBill behavior for invoice creation
 */

const https = require('https');
const querystring = require('querystring');

async function makeHostBillApiCall(params) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      api_id: 'adcdebb0e3b6f583052d',
      api_key: '341697c41aeb1c842f0d',
      ...params
    });

    const req = https.request('https://vps.kabel1it.cz/admin/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testDirectHostBillInvoice() {
  console.log('🚀 Testing Direct HostBill Invoice Creation (No Middleware)');
  console.log('================================================================================');
  console.log('This will show us the default HostBill behavior for invoices');
  console.log('================================================================================');

  try {
    // Use existing client ID 113 (TrueOldStyle Customer)
    const clientId = '113';
    
    console.log('1️⃣ Creating direct HostBill invoice...');
    
    // Create invoice directly via HostBill API with default status
    const invoiceItems = JSON.stringify([{
      type: 'product',
      product_id: '5', // VPS Start
      description: 'VPS Start - Quarterly',
      amount: 1,
      price: '897.00'
    }]);

    const invoiceParams = {
      call: 'addInvoice',
      client_id: clientId,
      // Don't specify status - let HostBill use default
      items: invoiceItems,
      payment_method: '0' // Credit Balance
    };

    console.log('📤 Direct HostBill invoice API call:', {
      call: invoiceParams.call,
      client_id: invoiceParams.client_id,
      payment_method: invoiceParams.payment_method,
      items: 'VPS Start - Quarterly (897 CZK)'
    });

    const invoiceResult = await makeHostBillApiCall(invoiceParams);
    
    if (!invoiceResult.success || !invoiceResult.invoice_id) {
      console.log('❌ Direct invoice creation failed:', invoiceResult);
      return;
    }

    console.log('✅ Direct HostBill invoice created:', {
      invoiceId: invoiceResult.invoice_id,
      success: invoiceResult.success
    });

    // Wait for HostBill to process
    console.log('⏳ Waiting for HostBill to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get invoice details
    console.log('2️⃣ Getting direct invoice details...');
    
    const invoiceDetails = await makeHostBillApiCall({
      call: 'getInvoice',
      id: invoiceResult.invoice_id
    });

    if (invoiceDetails.success && invoiceDetails.invoice) {
      const invoice = invoiceDetails.invoice;
      
      console.log('📋 Direct HostBill invoice details:');
      console.log('================================================================================');
      
      const directInvoice = {
        invoiceId: invoiceResult.invoice_id,
        status: invoice.status,
        credit: invoice.credit,
        total: invoice.total,
        subtotal: invoice.subtotal,
        clientId: invoice.client_id,
        paymentMethod: invoice.payment_method,
        datePaid: invoice.date_paid,
        dateCreated: invoice.date_created
      };

      console.log(`Invoice ID:      ${directInvoice.invoiceId}`);
      console.log(`Status:          ${directInvoice.status}`);
      console.log(`Credit:          ${directInvoice.credit} CZK`);
      console.log(`Total:           ${directInvoice.total} CZK`);
      console.log(`Subtotal:        ${directInvoice.subtotal} CZK`);
      console.log(`Payment Method:  ${directInvoice.paymentMethod}`);
      console.log(`Date Created:    ${directInvoice.dateCreated}`);
      console.log(`Date Paid:       ${directInvoice.datePaid || 'Not paid'}`);

      // Get client details
      console.log('\n3️⃣ Getting client details...');
      
      const clientDetails = await makeHostBillApiCall({
        call: 'getClientDetails',
        id: directInvoice.clientId
      });

      if (clientDetails.success && clientDetails.client) {
        const clientCredit = clientDetails.client.credit;
        
        console.log('👤 Client details:', {
          clientId: directInvoice.clientId,
          firstName: clientDetails.client.firstname,
          lastName: clientDetails.client.lastname,
          email: clientDetails.client.email,
          credit: clientCredit
        });

        // Final evaluation
        console.log('\n🎯 DIRECT HOSTBILL INVOICE BEHAVIOR:');
        console.log('================================================================================');
        
        const invoicePaid = directInvoice.status === 'Paid';
        const hasPositiveCredit = parseFloat(directInvoice.credit || 0) > 0;
        const clientHasCredit = parseFloat(clientCredit || 0) > 0;
        
        console.log(`✅ Invoice Status: ${invoicePaid ? 'PAID (DEFAULT)' : 'UNPAID (DEFAULT)'} (${directInvoice.status})`);
        console.log(`✅ Invoice Credit: ${hasPositiveCredit ? 'POSITIVE (DEFAULT)' : 'ZERO (DEFAULT)'} (${directInvoice.credit} CZK)`);
        console.log(`✅ Client Credit: ${clientHasCredit ? 'POSITIVE' : 'ZERO'} (${clientCredit} CZK)`);

        console.log('\n📊 HOSTBILL DEFAULT BEHAVIOR ANALYSIS:');
        console.log('================================================================================');
        
        if (invoicePaid && hasPositiveCredit) {
          console.log('🎉 HOSTBILL DEFAULT: Auto-Paid with positive credit!');
          console.log('   - HostBill naturally creates Paid invoices');
          console.log('   - HostBill automatically adds positive credit');
          console.log('   - Our middleware must be modifying this behavior');
          console.log('   - The "Unpaid" status in our orders comes from middleware logic');
        } else if (!invoicePaid && !hasPositiveCredit) {
          console.log('⚠️ HOSTBILL DEFAULT: Unpaid with zero credit');
          console.log('   - HostBill creates Unpaid invoices by default');
          console.log('   - No automatic credit is added');
          console.log('   - Our middleware is not the cause of Unpaid status');
          console.log('   - This is normal HostBill behavior');
        } else {
          console.log('🤔 HOSTBILL DEFAULT: Mixed behavior');
          console.log(`   - Invoice Status: ${directInvoice.status}`);
          console.log(`   - Invoice Credit: ${directInvoice.credit} CZK`);
          console.log('   - This needs further investigation');
        }

        // Test with explicit Paid status
        console.log('\n4️⃣ Testing with explicit Paid status...');
        
        const paidInvoiceParams = {
          call: 'addInvoice',
          client_id: clientId,
          status: 'Paid', // Explicitly set to Paid
          items: invoiceItems,
          payment_method: '0'
        };

        const paidInvoiceResult = await makeHostBillApiCall(paidInvoiceParams);
        
        if (paidInvoiceResult.success && paidInvoiceResult.invoice_id) {
          console.log('✅ Paid invoice created:', paidInvoiceResult.invoice_id);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const paidInvoiceDetails = await makeHostBillApiCall({
            call: 'getInvoice',
            id: paidInvoiceResult.invoice_id
          });

          if (paidInvoiceDetails.success && paidInvoiceDetails.invoice) {
            const paidInvoice = paidInvoiceDetails.invoice;
            
            console.log('📋 Explicitly Paid invoice details:', {
              invoiceId: paidInvoiceResult.invoice_id,
              status: paidInvoice.status,
              credit: paidInvoice.credit,
              total: paidInvoice.total
            });

            console.log('\n🔍 COMPARISON:');
            console.log(`Default Invoice: Status=${directInvoice.status}, Credit=${directInvoice.credit}`);
            console.log(`Paid Invoice:    Status=${paidInvoice.status}, Credit=${paidInvoice.credit}`);
          }
        }

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('================================================================================');
        console.log(`Default Invoice: ${directInvoice.invoiceId} - Status: ${directInvoice.status}, Credit: ${directInvoice.credit} CZK`);
        console.log(`Client Credit: ${clientCredit} CZK`);
        console.log(`Conclusion: ${invoicePaid ? 'HostBill auto-pays invoices' : 'HostBill creates unpaid invoices'}`);
      }
    } else {
      console.log('❌ Failed to get direct invoice details:', invoiceDetails.error);
    }

  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }

  console.log('\n✅ Direct HostBill invoice test completed!');
}

// Run the script
testDirectHostBillInvoice();
