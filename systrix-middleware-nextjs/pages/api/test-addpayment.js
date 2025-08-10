/**
 * Test addPayment API call
 * POST /api/test-addpayment
 */

const HostBillClient = require('../../lib/hostbill-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { invoiceId, amount = 604, gateway = 'comgate', transId = 'TEST-ADDPAYMENT' } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing invoiceId'
      });
    }

    console.log('🧪 Testing addPayment API call', {
      invoiceId,
      amount,
      gateway,
      transId
    });

    const hostbillClient = new HostBillClient();

    // Test different addPayment variations
    const testCalls = [
      { 
        call: 'addPayment',
        invoiceid: invoiceId,
        amount,
        gateway,
        trans_id: transId,
        fees: 0
      },
      { 
        call: 'addPayment',
        invoice_id: invoiceId,
        amount,
        gateway,
        trans_id: transId,
        fees: 0
      },
      { 
        call: 'addPayment',
        id: invoiceId,
        amount,
        gateway,
        trans_id: transId,
        fees: 0
      }
    ];

    const results = {};
    
    for (const testCall of testCalls) {
      try {
        console.log(`Testing addPayment with params:`, testCall);
        const result = await hostbillClient.makeApiCall(testCall);
        results[`addPayment_${testCall.invoiceid ? 'invoiceid' : testCall.invoice_id ? 'invoice_id' : 'id'}`] = { 
          success: true, 
          result,
          params: testCall
        };
        console.log(`✅ addPayment succeeded:`, result);
        
        // If this call succeeded, break and use it
        if (!result.error || result.error.length === 0) {
          break;
        }
      } catch (error) {
        results[`addPayment_${testCall.invoiceid ? 'invoiceid' : testCall.invoice_id ? 'invoice_id' : 'id'}`] = { 
          success: false, 
          error: error.message,
          params: testCall
        };
        console.log(`❌ addPayment failed:`, error.message);
      }
    }

    res.status(200).json({
      success: true,
      invoiceId,
      amount,
      gateway,
      transId,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ addPayment test failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
