/**
 * Test updateinvoice API call
 * POST /api/test-updateinvoice
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
    const { invoiceId, status = 'Paid' } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing invoiceId'
      });
    }

    console.log('🧪 Testing updateinvoice API call', {
      invoiceId,
      status
    });

    const hostbillClient = new HostBillClient();

    // Test different API calls to find the correct one that sets date properly
    const testCalls = [
      { call: 'markInvoicePaid', id: invoiceId },
      { call: 'setInvoiceStatus', id: invoiceId, status: status },
      { call: 'updateInvoice', id: invoiceId, status: status, datepaid: new Date().toISOString().split('T')[0] },
      { call: 'setInvoiceStatus', id: invoiceId, status: status, datepaid: new Date().toISOString().split('T')[0] },
      { call: 'markInvoiceAsPaid', id: invoiceId, datepaid: new Date().toISOString().split('T')[0] },
      { call: 'setInvoicePaid', id: invoiceId, date: new Date().toISOString().split('T')[0] },
      { call: 'invoiceMarkPaid', id: invoiceId, date: new Date().toISOString().split('T')[0] }
    ];

    const results = {};

    for (const testCall of testCalls) {
      try {
        console.log(`Testing API call: ${testCall.call}`);
        const result = await hostbillClient.makeApiCall(testCall);
        results[testCall.call] = { success: true, result };
        console.log(`✅ ${testCall.call} succeeded:`, result);

        // If this call succeeded, break and use it
        if (!result.error || result.error.length === 0) {
          break;
        }
      } catch (error) {
        results[testCall.call] = { success: false, error: error.message };
        console.log(`❌ ${testCall.call} failed:`, error.message);
      }
    }

    const result = results;

    console.log('✅ updateinvoice result:', result);

    res.status(200).json({
      success: true,
      invoiceId,
      status,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ updateinvoice test failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
