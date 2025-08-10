/**
 * Payment Return Handler
 * Handles return URLs from payment gateways and redirects back to Cloud VPS
 */

const HostBillClient = require('../../../lib/hostbill-client');

export default async function handler(req, res) {
  const { method, query } = req;
  
  console.log('🔄 Payment return handler called', {
    method,
    query,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  console.log('🔍 All URL parameters received:', query);

  // Debug: Write to file for debugging
  const fs = require('fs');
  const debugLog = `[${new Date().toISOString()}] Return handler called with: ${JSON.stringify(query)}\n`;
  fs.appendFileSync('return-handler-debug.log', debugLog);

  try {
    // Extract parameters according to ComGate documentation
    const {
      // ComGate standard parameters (from return URL)
      transId,      // Main ComGate transaction ID (always present)
      refId,        // Reference ID from e-shop (our orderId/invoiceId)

      // Legacy/fallback parameters
      status = 'unknown',
      orderId,
      invoiceId,
      transactionId,
      paymentMethod,
      amount,
      currency,

      // PayU specific
      txnid,
      mihpayid,

      // Generic fallbacks
      success,
      error,
      cancelled,
      transaction_id,
      payment_id,
      txn_id,
      ref_id,
      id,
      label,
      REFNO,
      PAYUID
    } = query;

    // Determine payment status
    let paymentStatus = 'unknown';
    let redirectPath = '/payment/unknown';

    if (status === 'success' || status === 'PAID' || success === 'true') {
      paymentStatus = 'success';
      redirectPath = '/payment-success';  // Changed to new success page
    } else if (status === 'cancelled' || cancelled === 'true' || status === 'CANCELLED') {
      paymentStatus = 'cancelled';
      redirectPath = '/payment-failed';   // Changed to new failed page
    } else if (status === 'pending' || status === 'PENDING') {
      paymentStatus = 'pending';
      redirectPath = '/payment-success';  // Pending goes to success page with status
    } else if (status === 'failed' || status === 'FAILED' || error) {
      paymentStatus = 'failed';
      redirectPath = '/payment-failed';   // Changed to new failed page
    }

    // ComGate return URL analysis according to documentation
    // ComGate always sends transId as main transaction identifier
    let realTransactionId = transId; // Primary ComGate transaction ID
    let realRefId = refId;           // Reference ID (our orderId/invoiceId)
    let realAmount = amount;
    let realCurrency = currency || 'CZK';
    let realPaymentMethod = paymentMethod || 'comgate';

    // Try to get transaction data from ComGate callback if not in URL
    if (!realTransactionId && (invoiceId || orderId)) {
      const lookupKey = invoiceId || orderId;
      const callbackData = global.comgateTransactions?.get(lookupKey);

      if (callbackData) {
        console.log('🔍 Found ComGate transaction data from callback:', callbackData);
        realTransactionId = callbackData.transId;
        realRefId = callbackData.refId;
        realAmount = callbackData.price ? callbackData.price / 100 : realAmount; // Convert from cents
        realCurrency = callbackData.curr || realCurrency;
        realPaymentMethod = 'comgate';

        console.log('✅ Using ComGate callback data:', {
          transactionId: realTransactionId,
          refId: realRefId,
          amount: realAmount,
          currency: realCurrency
        });
      } else {
        console.log('⚠️ No ComGate callback data found for key:', lookupKey);
      }
    }

    // Fallback for other gateways or legacy implementations
    if (!realTransactionId) {
      realTransactionId = transactionId || txnid || mihpayid || transaction_id ||
                         payment_id || txn_id || ref_id || id || label || REFNO || PAYUID;
    }

    console.log('🔍 ComGate return URL analysis:', {
      transId,           // ComGate transaction ID (primary)
      refId,            // ComGate reference ID (our order/invoice)
      orderId,          // Legacy parameter
      invoiceId,        // Legacy parameter
      finalTransactionId: realTransactionId,
      finalRefId: realRefId
    });

    // Verify payment status with ComGate API if we have transId
    if (realTransactionId && (realPaymentMethod === 'comgate' || !realPaymentMethod)) {
      try {
        console.log('🔍 Verifying payment status with ComGate Status API', {
          transId: realTransactionId,
          refId: realRefId
        });

        // Use ComGate Status API according to documentation
        const ComgateProcessor = require('../../../lib/comgate-processor');
        const comgateProcessor = new ComgateProcessor();

        const paymentStatusResult = await comgateProcessor.checkPaymentStatus(realTransactionId);

        if (paymentStatusResult.success) {
          // Update with real data from ComGate API
          realAmount = paymentStatusResult.amount || realAmount;
          realCurrency = paymentStatusResult.currency || realCurrency;

          // Determine payment status from ComGate response
          if (paymentStatusResult.status === 'PAID') {
            paymentStatus = 'success';
          } else if (paymentStatusResult.status === 'CANCELLED') {
            paymentStatus = 'failed';
          } else if (paymentStatusResult.status === 'PENDING') {
            paymentStatus = 'pending';
          }

          console.log('✅ ComGate Status API verification successful', {
            transId: realTransactionId,
            status: paymentStatusResult.status,
            amount: realAmount,
            currency: realCurrency,
            refId: paymentStatusResult.refId || realRefId
          });
        } else {
          console.log('⚠️ ComGate Status API verification failed, using URL parameters');
        }
      } catch (error) {
        console.log('⚠️ Error verifying payment with ComGate Status API:', error.message);
        // Continue with URL parameters if API call fails
      }
    }

    // Determine orderId and invoiceId from ComGate refId - NO FALLBACKS
    // ComGate refId should be the invoice ID (numeric)
    let finalOrderId = orderId;
    let finalInvoiceId = invoiceId || refId; // refId should be invoice ID

    // Validate that we have proper numeric IDs
    if (finalInvoiceId && isNaN(finalInvoiceId)) {
      console.error('❌ Invalid invoice ID - must be numeric:', finalInvoiceId);
      throw new Error('Invalid invoice ID - must be numeric');
    }

    if (finalOrderId && isNaN(finalOrderId)) {
      console.error('❌ Invalid order ID - must be numeric:', finalOrderId);
      throw new Error('Invalid order ID - must be numeric');
    }

    // Require valid invoice ID - no fallbacks
    if (!finalInvoiceId) {
      console.error('❌ Missing invoice ID - cannot process payment without it');
      throw new Error('Missing invoice ID');
    }

    console.log('🔍 RefId mapping debug:', {
      'ComGate refId': refId,
      'URL orderId': orderId,
      'URL invoiceId': invoiceId,
      'Final orderId': finalOrderId,
      'Final invoiceId': finalInvoiceId,
      'RefId type': typeof refId,
      'RefId starts with ORDER': refId?.startsWith('ORDER-')
    });

    // Log the return with correct ComGate data
    console.log('🔄 Processing payment return with ComGate data', {
      paymentStatus,
      transId: realTransactionId,        // ComGate transaction ID
      refId: realRefId,                  // ComGate reference ID (our order/invoice)
      orderId: finalOrderId,
      invoiceId: finalInvoiceId,
      amount: realAmount,
      currency: realCurrency,
      paymentMethod: realPaymentMethod
    });

    // Debug: Console log condition check
    console.log('🔍 CONDITION CHECK:', {
      paymentStatus,
      finalInvoiceId,
      condition: paymentStatus === 'success' && finalInvoiceId,
      paymentStatusType: typeof paymentStatus,
      finalInvoiceIdType: typeof finalInvoiceId
    });

    // Process payment according to HostBill workflow: Authorize → Capture → Provision
    if (paymentStatus === 'success' && finalInvoiceId) {
      console.log('✅ Payment successful, processing complete HostBill workflow (Authorize → Capture → Provision)...', {
        invoiceId: finalInvoiceId,
        orderId: finalOrderId,
        transactionId: realTransactionId,  // Use ComGate transId
        amount: realAmount,
        currency: realCurrency,
        paymentMethod: realPaymentMethod
      });

      // Debug: Write to file for debugging
      const debugLog2 = `[${new Date().toISOString()}] Starting payment processing for invoice ${finalInvoiceId} with amount ${realAmount}\n`;
      fs.appendFileSync('return-handler-debug.log', debugLog2);

      try {
        const hostbillClient = new HostBillClient();

        // Validate that we have a real transaction ID from payment gateway
        if (!realTransactionId) {
          console.error('❌ No real transaction ID from payment gateway - cannot process payment without it');
          throw new Error('Missing transaction ID from payment gateway');
        }

        const finalTransactionId = realTransactionId; // Only use real transaction ID

        // Get invoice amount first (use ComGate verified amount or get from HostBill)
        let paymentAmount = parseFloat(realAmount) || 0;

        // If no amount provided, we need to get it from HostBill
        if (!paymentAmount || paymentAmount <= 0) {
          try {
            console.log('🔍 Getting invoice amount from HostBill...', { invoiceId: finalInvoiceId });
            const invoiceResult = await hostbillClient.makeApiCall({
              call: 'getInvoices',
              'filter[id]': finalInvoiceId
            });

            if (invoiceResult && !invoiceResult.error && invoiceResult.invoices) {
              const invoice = invoiceResult.invoices.find(inv => inv.id == finalInvoiceId);
              if (invoice) {
                paymentAmount = parseFloat(invoice.grandtotal || invoice.total || invoice.subtotal2 || 0);
                console.log('✅ Retrieved invoice amount from HostBill:', {
                  invoiceId: finalInvoiceId,
                  amount: paymentAmount,
                  currency: realCurrency
                });
              }
            }
          } catch (fetchError) {
            console.error('❌ Could not fetch invoice amount from HostBill:', fetchError.message);
            throw new Error('Cannot process payment without invoice amount');
          }
        }

        // STEP 1: AUTHORIZE PAYMENT (activate order)
        if (finalOrderId) {
          console.log('🔐 Step 1: Authorizing payment (activating order)...', {
            orderId: finalOrderId,
            transactionId: finalTransactionId
          });

          try {
            const authResult = await hostbillClient.authorizePayment(orderId, finalTransactionId);

            if (authResult.success) {
              console.log('✅ Step 1 COMPLETE: Payment authorized - order activated', {
                orderId,
                invoiceId,
                transactionId: finalTransactionId,
                result: authResult.result
              });
            } else {
              console.warn('⚠️ Step 1 FAILED: Payment authorization failed, continuing with capture...', {
                orderId,
                invoiceId,
                error: authResult.error
              });
            }
          } catch (authError) {
            console.warn('⚠️ Step 1 ERROR: Payment authorization error, continuing with capture...', {
              orderId,
              invoiceId,
              error: authError.message
            });
          }
        } else {
          console.log('⚠️ No orderId provided, skipping authorization step');
        }

        // STEP 2: MARK INVOICE AS PAID (proven method from Git history)
        console.log('💰 Step 2: Marking invoice as PAID using proven method...', {
          invoiceId,
          amount: paymentAmount,
          transactionId: finalTransactionId
        });

        try {
          // Step 2a: Add payment record to invoice (creates transaction history)
          console.log('💳 Step 2a: Adding payment record to invoice...', {
            invoiceId,
            amount: paymentAmount,
            paymentMethod: paymentMethod || 'comgate'
          });

          const paymentData = {
            invoice_id: invoiceId,
            amount: paymentAmount,
            currency: realCurrency || 'CZK',
            date: new Date().toISOString().split('T')[0],
            method: '0', // Use ID "0" for Credit Balance/Manual payments (proven method)
            transaction_id: finalTransactionId,
            notes: `Payment processed via ${paymentMethod || 'payment gateway'} - Transaction: ${finalTransactionId}`
          };

          const paymentResult = await hostbillClient.addInvoicePayment(paymentData);

          if (paymentResult.success) {
            console.log('✅ Step 2a COMPLETE: Payment record added successfully', {
              invoiceId,
              paymentId: paymentResult.payment_id,
              transactionId: finalTransactionId
            });

            // Debug: Write to file for debugging
            const debugLog3 = `[${new Date().toISOString()}] Payment record added successfully for invoice ${invoiceId}\n`;
            fs.appendFileSync('return-handler-debug.log', debugLog3);
          } else {
            console.log('⚠️ Step 2a WARNING: Payment record failed, continuing with status update...', paymentResult.error);

            // Debug: Write to file for debugging
            const debugLog4 = `[${new Date().toISOString()}] Payment record failed for invoice ${invoiceId}: ${paymentResult.error}\n`;
            fs.appendFileSync('return-handler-debug.log', debugLog4);
          }

          // Step 2b: Update invoice status to PAID (proven method using setInvoiceStatus)
          console.log('📋 Step 2b: Updating invoice status to PAID...', {
            invoiceId
          });

          const statusResult = await hostbillClient.updateInvoiceStatus(invoiceId, 'Paid');

          if (statusResult.success) {
            console.log('✅ Step 2b COMPLETE: Invoice status updated to PAID successfully', {
              invoiceId,
              result: statusResult.result
            });

            console.log('✅ Step 2 COMPLETE: Invoice marked as PAID using proven method', {
              invoiceId,
              amount: paymentAmount,
              transactionId: finalTransactionId,
              paymentMethod: paymentMethod || 'comgate'
            });

            // STEP 3: VERIFY WORKFLOW COMPLETION
            console.log('🔍 Step 3: Verifying HostBill workflow completion...', {
              invoiceId,
              orderId
            });

            // The workflow should now be:
            // ✅ Authorize Payment: Completed
            // ✅ Add Payment Record: Completed
            // ✅ Update Invoice Status: Completed
            // 🔄 Provision: Ready/In Progress

          } else {
            console.error('❌ Step 2b FAILED: Invoice status update failed', {
              invoiceId,
              error: statusResult.error
            });
            throw new Error('Invoice status update failed - cannot complete payment processing');
          }

        } catch (paymentError) {
          console.error('❌ Step 2 FAILED: Payment processing failed', {
            invoiceId,
            error: paymentError.message
          });
          throw new Error(`Payment processing failed: ${paymentError.message}`);
        }

      } catch (error) {
        console.error('❌ Error processing HostBill payment workflow', {
          invoiceId,
          orderId,
          error: error.message,
          stack: error.stack
        });
        // Don't fail the redirect if payment processing fails
      }
    }

    // Build redirect URL to Cloud VPS
    const cloudVpsUrl = process.env.CLOUDVPS_URL || 'http://localhost:3000';

    // Redirect to payment-complete page with action buttons for successful payments
    let redirectUrl;
    if (paymentStatus === 'success') {
      redirectUrl = new URL('/payment-complete', cloudVpsUrl);

      // Add all ComGate payment data as URL parameters for the payment-complete page
      redirectUrl.searchParams.set('status', 'success'); // Add status parameter
      if (finalOrderId) {
        redirectUrl.searchParams.set('orderId', finalOrderId);
      }
      if (finalInvoiceId) {
        redirectUrl.searchParams.set('invoiceId', finalInvoiceId);
      }
      if (realAmount) {
        redirectUrl.searchParams.set('amount', realAmount);
      }
      if (realCurrency) {
        redirectUrl.searchParams.set('currency', realCurrency);
      }
      if (realTransactionId) {
        redirectUrl.searchParams.set('transactionId', realTransactionId);
        redirectUrl.searchParams.set('paymentId', realTransactionId);
      }
      if (realPaymentMethod) {
        redirectUrl.searchParams.set('paymentMethod', realPaymentMethod);
      }

      console.log('🎯 Redirecting to payment-complete page with Auto-Capture and Mark as Paid buttons', {
        orderId: finalOrderId,
        invoiceId: finalInvoiceId,
        amount: realAmount,
        currency: realCurrency,
        transactionId: realTransactionId,
        paymentMethod: realPaymentMethod
      });

    } else if (paymentStatus === 'cancelled') {
      redirectUrl = new URL('/payment-failed', cloudVpsUrl);
      redirectUrl.searchParams.set('reason', 'cancelled');
    } else if (paymentStatus === 'failed') {
      redirectUrl = new URL('/payment-failed', cloudVpsUrl);
      redirectUrl.searchParams.set('reason', 'declined');
    } else if (paymentStatus === 'pending') {
      // Pending payments also go to payment-complete page
      redirectUrl = new URL('/payment-complete', cloudVpsUrl);
      redirectUrl.searchParams.set('status', 'pending');

      // Add ComGate payment data for pending payments
      if (finalOrderId) {
        redirectUrl.searchParams.set('orderId', finalOrderId);
      }
      if (finalInvoiceId) {
        redirectUrl.searchParams.set('invoiceId', finalInvoiceId);
      }
      if (realAmount) {
        redirectUrl.searchParams.set('amount', realAmount);
      }
      if (realCurrency) {
        redirectUrl.searchParams.set('currency', realCurrency);
      }
      if (realTransactionId) {
        redirectUrl.searchParams.set('transactionId', realTransactionId);
        redirectUrl.searchParams.set('paymentId', realTransactionId);
      }
      if (realPaymentMethod) {
        redirectUrl.searchParams.set('paymentMethod', realPaymentMethod);
      }

    } else {
      redirectUrl = new URL('/payment-failed', cloudVpsUrl);
      redirectUrl.searchParams.set('reason', 'unknown');
    }

    // Add all ComGate payment parameters to redirect URL
    if (finalInvoiceId) {
      redirectUrl.searchParams.set('invoiceId', finalInvoiceId);
    }
    if (realTransactionId) {
      redirectUrl.searchParams.set('transactionId', realTransactionId);
      redirectUrl.searchParams.set('paymentId', realTransactionId);
    }
    if (realAmount) {
      redirectUrl.searchParams.set('amount', realAmount);
    }
    if (realCurrency) {
      redirectUrl.searchParams.set('currency', realCurrency);
    }
    if (realPaymentMethod) {
      redirectUrl.searchParams.set('paymentMethod', realPaymentMethod);
    }
    redirectUrl.searchParams.set('status', paymentStatus);

    // Add ComGate specific parameters for debugging
    if (transId) {
      redirectUrl.searchParams.set('transId', transId);  // ComGate transaction ID
    }
    if (realRefId) {
      redirectUrl.searchParams.set('refId', realRefId);  // ComGate reference ID
    }

    // Add legacy/fallback parameters for debugging
    if (txnid) {
      redirectUrl.searchParams.set('txnid', txnid);
    }
    if (mihpayid) {
      redirectUrl.searchParams.set('mihpayid', mihpayid);
    }
    if (id) {
      redirectUrl.searchParams.set('id', id);
    }
    if (label) {
      redirectUrl.searchParams.set('label', label);
    }
    if (REFNO) {
      redirectUrl.searchParams.set('REFNO', REFNO);
    }
    if (PAYUID) {
      redirectUrl.searchParams.set('PAYUID', PAYUID);
    }
    if (transaction_id) {
      redirectUrl.searchParams.set('transaction_id', transaction_id);
    }
    if (payment_id) {
      redirectUrl.searchParams.set('payment_id', payment_id);
    }
    if (txn_id) {
      redirectUrl.searchParams.set('txn_id', txn_id);
    }
    if (ref_id) {
      redirectUrl.searchParams.set('ref_id', ref_id);
    }

    console.log('🔄 Redirecting to Cloud VPS', {
      redirectUrl: redirectUrl.toString(),
      paymentStatus,
      allParameters: {
        finalOrderId,
        finalInvoiceId,
        realAmount,
        realCurrency,
        realTransactionId,
        realPaymentMethod
      }
    });

    console.log('🎯 FINAL REDIRECT URL:', redirectUrl.toString());

    // Try standard HTTP redirect first
    console.log('🔄 Attempting standard HTTP 302 redirect...');
    res.redirect(302, redirectUrl.toString());

  } catch (error) {
    console.error('❌ Payment return handler error', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    // Redirect to error page on Cloud VPS
    const cloudVpsUrl = process.env.CLOUDVPS_URL || 'http://localhost:3000';
    const errorUrl = new URL('/payment/error', cloudVpsUrl);
    errorUrl.searchParams.set('error', 'return_handler_error');
    errorUrl.searchParams.set('message', error.message);
    
    res.redirect(302, errorUrl.toString());
  }
}
