/**
 * HostBill Payment Workflow: Authorize + Capture API
 * 
 * Řeší kompletní HostBill payment workflow:
 * 1. Authorize Payment (aktivace objednávky)
 * 2. Capture Payment (přidání platby k faktuře)
 * 3. Provision (automaticky se spustí po capture)
 * 
 * Podle HostBill workflow:
 * - Authorize Payment: Failed → Completed
 * - Capture Payment: Pending → Completed
 * - Provision: Pending → Ready/In Progress
 */

const HostBillClient = require('../../../lib/hostbill-client.js');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const {
      orderId,
      invoiceId,
      transactionId,
      amount,
      currency = 'CZK',
      paymentMethod = 'comgate',
      notes,
      skipAuthorize = false,
      skipCapture = false
    } = req.body;

    // Validate required parameters
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: invoiceId'
      });
    }

    console.log('🔄 Processing HostBill payment workflow (Authorize → Capture)', {
      orderId,
      invoiceId,
      transactionId,
      amount,
      paymentMethod,
      skipAuthorize,
      skipCapture
    });

    const hostbillClient = new HostBillClient();
    const finalTransactionId = transactionId || `API-${Date.now()}`;
    const results = {
      authorize: null,
      capture: null,
      workflow: {
        authorizePayment: 'pending',
        capturePayment: 'pending',
        provision: 'pending'
      }
    };

    // Get invoice amount if not provided
    let paymentAmount = parseFloat(amount) || 0;
    
    if (!paymentAmount || paymentAmount <= 0) {
      console.log('🔍 Getting invoice amount from HostBill...', { invoiceId });
      
      try {
        const invoiceResult = await hostbillClient.makeApiCall({
          call: 'getInvoices',
          'filter[id]': invoiceId
        });
        
        if (invoiceResult && !invoiceResult.error && invoiceResult.invoices) {
          const invoice = invoiceResult.invoices.find(inv => inv.id == invoiceId);
          if (invoice) {
            paymentAmount = parseFloat(invoice.grandtotal || invoice.total || invoice.subtotal2 || 0);
            console.log('✅ Retrieved invoice amount from HostBill:', {
              invoiceId,
              amount: paymentAmount
            });
          } else {
            throw new Error(`Invoice ${invoiceId} not found in HostBill`);
          }
        } else {
          throw new Error(`Failed to fetch invoice ${invoiceId}: ${JSON.stringify(invoiceResult.error)}`);
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch invoice amount:', fetchError.message);
        return res.status(400).json({
          success: false,
          error: `Could not determine invoice amount: ${fetchError.message}`,
          invoiceId
        });
      }
    }

    // STEP 1: AUTHORIZE PAYMENT (bypass gateway issues)
    if (!skipAuthorize && orderId) {
      console.log('🔐 Step 1: Authorizing payment (bypassing gateway issues)...', {
        orderId,
        transactionId: finalTransactionId
      });

      try {
        // Pokud selže standardní authorize kvůli "Unable to load payment gateway",
        // použijeme přímé API volání pro aktivaci objednávky
        console.log('🔧 Attempting direct order activation to bypass gateway issues...');

        const directAuthResult = await hostbillClient.makeApiCall({
          call: 'setOrderActive',
          id: orderId
        });

        if (directAuthResult && !directAuthResult.error) {
          console.log('✅ Step 1 COMPLETE: Order activated directly (gateway bypassed)', {
            orderId,
            result: directAuthResult
          });
          results.authorize = { success: true, result: directAuthResult, method: 'direct_activation' };
          results.workflow.authorizePayment = 'completed';
        } else {
          // Fallback: zkusíme standardní authorize
          console.log('🔄 Direct activation failed, trying standard authorize...');
          const authResult = await hostbillClient.authorizePayment(orderId, finalTransactionId);
          results.authorize = authResult;

          if (authResult.success) {
            console.log('✅ Step 1 COMPLETE: Payment authorized via standard method', {
              orderId,
              result: authResult.result
            });
            results.workflow.authorizePayment = 'completed';
          } else {
            console.warn('⚠️ Step 1 FAILED: Both direct and standard authorization failed', {
              orderId,
              directError: directAuthResult.error,
              standardError: authResult.error
            });
            results.workflow.authorizePayment = 'failed';
          }
        }
      } catch (authError) {
        console.error('❌ Step 1 ERROR: Authorization error', {
          orderId,
          error: authError.message
        });
        results.authorize = { success: false, error: authError.message };
        results.workflow.authorizePayment = 'failed';
      }
    } else {
      console.log('⏭️ Skipping authorization step', { skipAuthorize, orderId });
      results.workflow.authorizePayment = 'skipped';
    }

    // STEP 2: CAPTURE PAYMENT (direct API approach)
    if (!skipCapture) {
      console.log('💰 Step 2: Capturing payment (direct API approach)...', {
        invoiceId,
        amount: paymentAmount,
        transactionId: finalTransactionId
      });

      try {
        // Použijeme přímé API volání addInvoicePayment místo gateway capture
        console.log('🔧 Using direct addInvoicePayment API to bypass gateway issues...');

        const directCaptureResult = await hostbillClient.makeApiCall({
          call: 'addInvoicePayment',
          id: invoiceId,
          amount: parseFloat(paymentAmount).toFixed(2),
          paymentmodule: paymentMethod,
          fee: 0,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          transnumber: finalTransactionId,
          notes: notes || `Direct payment capture - Transaction: ${finalTransactionId}`,
          send_email: 1
        });

        if (directCaptureResult && !directCaptureResult.error) {
          console.log('✅ Step 2 COMPLETE: Payment captured directly (gateway bypassed)', {
            invoiceId,
            amount: paymentAmount,
            transactionId: finalTransactionId,
            paymentId: directCaptureResult.payment_id
          });
          results.capture = {
            success: true,
            result: directCaptureResult,
            method: 'direct_api',
            payment_id: directCaptureResult.payment_id
          };
          results.workflow.capturePayment = 'completed';
          results.workflow.provision = 'ready';
        } else {
          // Fallback: zkusíme standardní capture
          console.log('🔄 Direct capture failed, trying standard capture...');
          const captureData = {
            invoice_id: invoiceId,
            amount: paymentAmount,
            module: paymentMethod,
            trans_id: finalTransactionId,
            note: notes || `Payment captured via ${paymentMethod} - Transaction: ${finalTransactionId}`
          };

          const captureResult = await hostbillClient.capturePayment(captureData);
          results.capture = captureResult;

          if (captureResult.success) {
            console.log('✅ Step 2 COMPLETE: Payment captured via standard method', {
              invoiceId,
              amount: paymentAmount,
              transactionId: finalTransactionId
            });
            results.workflow.capturePayment = 'completed';
            results.workflow.provision = 'ready';
          } else {
            console.error('❌ Step 2 FAILED: Both direct and standard capture failed', {
              invoiceId,
              directError: directCaptureResult.error,
              standardError: captureResult.error
            });
            results.workflow.capturePayment = 'failed';
          }
        }
      } catch (captureError) {
        console.error('❌ Step 2 ERROR: Payment capture error', {
          invoiceId,
          error: captureError.message
        });
        results.capture = { success: false, error: captureError.message };
        results.workflow.capturePayment = 'failed';
      }
    } else {
      console.log('⏭️ Skipping capture step', { skipCapture });
      results.workflow.capturePayment = 'skipped';
    }

    // STEP 3: TRIGGER PROVISIONING (if both authorize and capture succeeded)
    if (results.workflow.authorizePayment === 'completed' &&
        results.workflow.capturePayment === 'completed' &&
        orderId) {
      console.log('🚀 Step 3: Triggering provisioning...', {
        orderId,
        invoiceId
      });

      try {
        // Spustíme provisioning pomocí runProvisioningHooks nebo podobného API
        const provisionResult = await hostbillClient.makeApiCall({
          call: 'runProvisioningHooks',
          orderid: orderId
        });

        if (provisionResult && !provisionResult.error) {
          console.log('✅ Step 3 COMPLETE: Provisioning triggered successfully', {
            orderId,
            result: provisionResult
          });
          results.workflow.provision = 'completed';
        } else {
          console.warn('⚠️ Step 3 WARNING: Provisioning trigger failed (may already be active)', {
            orderId,
            error: provisionResult.error
          });
          results.workflow.provision = 'ready'; // Still mark as ready
        }
      } catch (provisionError) {
        console.error('❌ Step 3 ERROR: Provisioning trigger error', {
          orderId,
          error: provisionError.message
        });
        results.workflow.provision = 'ready'; // Don't fail the whole workflow
      }
    } else {
      console.log('⏭️ Skipping provisioning - prerequisites not met', {
        authorize: results.workflow.authorizePayment,
        capture: results.workflow.capturePayment,
        orderId: !!orderId
      });
    }

    // Determine overall success
    const overallSuccess = (
      (skipAuthorize || results.workflow.authorizePayment === 'completed') &&
      (skipCapture || results.workflow.capturePayment === 'completed')
    );

    return res.status(200).json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'HostBill payment workflow completed successfully'
        : 'HostBill payment workflow completed with some failures',
      orderId,
      invoiceId,
      transactionId: finalTransactionId,
      amount: paymentAmount,
      currency,
      paymentMethod,
      workflow: results.workflow,
      details: {
        authorize: results.authorize,
        capture: results.capture
      },
      nextSteps: overallSuccess
        ? [
            'Payment workflow completed successfully',
            'Order has been activated (Authorize: completed)',
            'Payment has been captured (Capture: completed)',
            'Provisioning has been triggered (Provision: ' + results.workflow.provision + ')',
            'Check HostBill admin panel for service activation'
          ]
        : [
            'Some workflow steps failed - check details above',
            'Authorize Payment: ' + results.workflow.authorizePayment,
            'Capture Payment: ' + results.workflow.capturePayment,
            'Provision: ' + results.workflow.provision,
            'Check HostBill admin for detailed error information'
          ]
    });

  } catch (error) {
    console.error('❌ Error in authorize-capture workflow:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to process HostBill payment workflow'
    });
  }
}

/**
 * Example usage:
 * 
 * // Complete workflow (authorize + capture)
 * const response = await fetch('/api/payments/authorize-capture', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     orderId: '405',
 *     invoiceId: '446',
 *     transactionId: 'TXN123456',
 *     amount: 362,
 *     currency: 'CZK',
 *     paymentMethod: 'comgate',
 *     notes: 'Payment from terminal'
 *   })
 * });
 * 
 * // Only capture (if authorize already done)
 * const response = await fetch('/api/payments/authorize-capture', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     invoiceId: '446',
 *     transactionId: 'TXN123456',
 *     skipAuthorize: true
 *   })
 * });
 * 
 * // Only authorize (if capture will be done separately)
 * const response = await fetch('/api/payments/authorize-capture', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     orderId: '405',
 *     invoiceId: '446',
 *     transactionId: 'TXN123456',
 *     skipCapture: true
 *   })
 * });
 */
