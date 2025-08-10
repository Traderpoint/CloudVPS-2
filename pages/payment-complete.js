import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';

export default function PaymentComplete() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState(null);
  const [captureStatus, setCaptureStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prevent infinite loop - only run if paymentData is not set
    if (paymentData) return;

    // Force client-side rendering - wait for component to be mounted
    if (!mounted) return;

    // Direct URL parameter access as immediate fallback
    const urlParams = new URLSearchParams(window.location.search);
    const directData = {
      transactionId: urlParams.get('transactionId'),
      paymentId: urlParams.get('paymentId'),
      orderId: urlParams.get('orderId'),
      invoiceId: urlParams.get('invoiceId'),
      amount: urlParams.get('amount'),
      currency: urlParams.get('currency') || 'CZK',
      paymentMethod: urlParams.get('paymentMethod') || 'comgate',
      status: urlParams.get('status') || 'success'
    };

    console.log('🔍 Direct URL parameter extraction:', directData);
    console.log('🔍 Current URL:', window.location.href);

    // Always use direct URL parameters if available (more reliable than router.query)
    if (directData.orderId || directData.invoiceId) {
      console.log('🔄 Using direct URL parameter access:', directData);
      setPaymentData(directData);
      return; // Exit early if we got data from URL
    }

    // Wait for router to be ready
    if (!router.isReady) return;

    // Extract parameters from router.query or window.location as fallback
    let params = router.query;

    // Fallback to window.location.search if router.query is empty (Next.js issue after server-side redirect)
    if (typeof window !== 'undefined' && Object.keys(params).length === 0) {
      const urlParams = new URLSearchParams(window.location.search);
      params = {};
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
      console.log('🔄 Using window.location fallback for parameters:', params);
    }

    // Extract payment data from URL parameters
    const {
      invoiceId,
      orderId,
      amount,
      currency,
      paymentMethod,
      status,
      transactionId,
      paymentId,
      refId,
      REFNO,
      label,
      PAYUID,
      txn_id,
      transaction_id,
      payment_id,
      txnid,
      mihpayid
    } = params;

    // Use only primary transaction ID - no fallbacks
    const actualTransactionId = transactionId;
    const actualPaymentId = paymentId;

    console.log('🔍 Payment Complete - All URL parameters:', router.query);
    console.log('🔍 Extracted transaction IDs:', {
      transactionId,
      paymentId,
      refId,
      txnid,
      mihpayid,
      actualTransactionId,
      actualPaymentId
    });

    // Require both invoiceId AND transactionId - no fallbacks
    if (!invoiceId) {
      console.error('❌ Missing required invoiceId');
      return;
    }

    if (!actualTransactionId) {
      console.error('❌ Missing required transactionId');
      return;
    }

    // Validate numeric invoiceId
    if (isNaN(invoiceId)) {
      console.error('❌ Invalid invoiceId - must be numeric:', invoiceId);
      return;
    }

    // Validate orderId if present
    if (orderId && isNaN(orderId)) {
      console.error('❌ Invalid orderId - must be numeric:', orderId);
      return;
    }

    const data = {
      invoiceId,
      orderId,
      amount,
      currency: currency || 'CZK',
      paymentMethod: paymentMethod || 'comgate',
      status: status || 'success',
      transactionId: actualTransactionId,
      paymentId: actualPaymentId,
      // Keep original parameters for debugging
      originalParams: {
        transactionId,
        paymentId,
        refId
      }
    };

    setPaymentData(data);
    console.log('💳 Payment Complete - Final data extracted:', data);
  }, [mounted, router.isReady, router.query]); // Added mounted dependency

  // Auto-capture payment function
  const handleAutoCapture = async () => {
    if (!paymentData) return;

    setAutoCapturing(true);
    setCaptureStatus(null);

    try {
      console.log('🔄 Starting auto-capture for payment:', paymentData);

      // Clean amount - remove currency and convert to number
      let cleanAmount = paymentData.amount;
      if (typeof cleanAmount === 'string') {
        cleanAmount = cleanAmount.replace(/[^\d.,]/g, '').replace(',', '.');
      }
      const finalAmount = parseFloat(cleanAmount) || 0;

      // Validate that we have a real transaction ID
      if (!paymentData.transactionId) {
        setCaptureStatus({
          success: false,
          message: 'Cannot capture payment: Missing transaction ID from payment gateway'
        });
        return;
      }

      const captureData = {
        invoice_id: paymentData.invoiceId,
        amount: finalAmount,
        module: paymentData.paymentMethod === 'comgate' ? 'Comgate' : 'BankTransfer',
        trans_id: paymentData.transactionId, // Only use real transaction ID
        note: `Auto-capture payment for invoice ${paymentData.invoiceId} - Transaction: ${paymentData.transactionId} - Amount: ${finalAmount} CZK`
      };

      console.log('📤 Sending capture request:', captureData);

      const response = await fetch('/api/middleware/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Auto-capture successful:', result);
        setCaptureStatus({
          success: true,
          message: 'Payment captured successfully',
          data: result.data,
          transactionId: paymentData.transactionId,
          amount: finalAmount
        });
      } else {
        console.error('❌ Auto-capture failed:', result.error);
        setCaptureStatus({
          success: false,
          error: result.error,
          details: result.details
        });
      }

    } catch (error) {
      console.error('💥 Auto-capture error:', error);
      setCaptureStatus({
        success: false,
        error: error.message,
        details: 'Network or processing error during auto-capture'
      });
    } finally {
      setAutoCapturing(false);
    }
  };

  // Mark invoice as paid manually
  const handleMarkAsPaid = async () => {
    if (!paymentData) return;

    setLoading(true);

    try {
      console.log('🔄 Marking invoice as paid:', paymentData);

      const response = await fetch('/api/middleware/mark-invoice-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: paymentData.invoiceId,
          status: 'Paid',
          amount: parseFloat(paymentData.amount?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Invoice marked as paid:', result);
        alert('✅ Invoice marked as paid successfully!');
      } else {
        console.error('❌ Failed to mark invoice as paid:', result.error);
        alert(`❌ Failed to mark invoice as paid: ${result.error}`);
      }

    } catch (error) {
      console.error('💥 Mark as paid error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Go to order confirmation
  const handleGoToConfirmation = () => {
    const confirmationUrl = `/order-confirmation?invoiceId=${paymentData?.invoiceId}&orderId=${paymentData?.orderId}&amount=${paymentData?.amount}&status=paid&transactionId=${paymentData?.transactionId}`;
    router.push(confirmationUrl);
  };

  // Show loading state during SSR or before component is mounted
  if (!mounted || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
          {!mounted && <p className="text-xs text-gray-400 mt-2">Initializing client-side rendering...</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Complete - Cloud VPS</title>
        <meta name="description" content="Payment completed successfully" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Completed!</h1>
              <p className="text-lg text-gray-600">Your payment has been processed successfully</p>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{paymentData.orderId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice ID:</span>
                    <span className="font-medium">{paymentData.invoiceId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{paymentData.amount} {paymentData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium capitalize ${paymentData.status === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {paymentData.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{paymentData.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium text-sm break-all">
                      {paymentData.transactionId ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {paymentData.transactionId}
                        </span>
                      ) : (
                        <span className="text-red-500">Missing</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium text-sm break-all">
                      {paymentData.paymentId ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {paymentData.paymentId}
                        </span>
                      ) : (
                        <span className="text-red-500">Missing</span>
                      )}
                    </span>
                  </div>
                  {paymentData.originalParams && (
                    <div className="mt-4 pt-2 border-t border-gray-200">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          Debug: Original Parameters
                        </summary>
                        <div className="mt-2 space-y-1 text-gray-600">
                          {Object.entries(paymentData.originalParams).map(([key, value]) => (
                            value && (
                              <div key={key} className="flex justify-between">
                                <span>{key}:</span>
                                <span className="font-mono">{value}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={handleAutoCapture}
                disabled={autoCapturing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {autoCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Auto-Capturing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Auto-Capture Payment
                  </>
                )}
              </button>

              <button
                onClick={handleMarkAsPaid}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark as Paid
                  </>
                )}
              </button>

              <button
                onClick={handleGoToConfirmation}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Order Confirmation
              </button>
            </div>

            {/* Capture Status */}
            {captureStatus && (
              <div className={`rounded-lg p-6 mb-8 ${
                captureStatus.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  captureStatus.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {captureStatus.success ? '✅ Auto-Capture Successful' : '❌ Auto-Capture Failed'}
                </h3>
                
                {captureStatus.success ? (
                  <div className="space-y-2">
                    <p className="text-green-700">{captureStatus.message}</p>
                    <div className="text-sm text-green-600">
                      <p><strong>Transaction ID:</strong> {captureStatus.transactionId}</p>
                      <p><strong>Amount:</strong> {captureStatus.amount} CZK</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-700">{captureStatus.error}</p>
                    {captureStatus.details && (
                      <p className="text-sm text-red-600">{captureStatus.details}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Debug Information */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8">
              <details>
                <summary className="text-lg font-semibold text-yellow-900 cursor-pointer hover:text-yellow-700">
                  🐛 Debug Information (Click to expand)
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">All URL Parameters:</h4>
                    <div className="bg-white rounded p-3 text-xs font-mono">
                      <pre>{JSON.stringify(router.query, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Processed Payment Data:</h4>
                    <div className="bg-white rounded p-3 text-xs font-mono">
                      <pre>{JSON.stringify(paymentData, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Transaction ID Detection:</h4>
                    <div className="bg-white rounded p-3 text-sm">
                      <div className="space-y-1">
                        <div>transactionId: <span className="font-mono">{router.query.transactionId || 'null'}</span></div>
                        <div>paymentId: <span className="font-mono">{router.query.paymentId || 'null'}</span></div>
                        <div>refId: <span className="font-mono">{router.query.refId || 'null'}</span></div>
                        <div>txnid: <span className="font-mono">{router.query.txnid || 'null'}</span></div>
                        <div>mihpayid: <span className="font-mono">{router.query.mihpayid || 'null'}</span></div>
                        <div className="pt-2 border-t">
                          <strong>Final Transaction ID: </strong>
                          <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                            {paymentData?.transactionId || 'MISSING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Next Steps</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Auto-Capture Payment</h4>
                    <p className="text-blue-700 text-sm">Click "Auto-Capture Payment" to automatically process the payment capture</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Mark as Paid</h4>
                    <p className="text-blue-700 text-sm">Alternatively, manually mark the invoice as paid in HostBill</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Order Confirmation</h4>
                    <p className="text-blue-700 text-sm">View your order confirmation and service activation details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Force client-side rendering only
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}
