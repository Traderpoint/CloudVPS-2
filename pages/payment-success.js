import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function PaymentSuccess() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [captureStatus, setCaptureStatus] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      processPaymentSuccess();
    }
  }, [router.isReady]);

  const processPaymentSuccess = async () => {
    try {
      // Get order data from URL parameters including ComGate transaction data
      const {
        invoiceId,
        orderId,
        amount,
        paymentMethod,
        status,
        // ComGate specific parameters
        transactionId,
        refId,
        REFNO,
        label,
        // PayU specific parameters
        PAYUID,
        txn_id,
        // Generic transaction parameters
        transaction_id,
        payment_id
      } = router.query;

      // Determine the actual transaction ID from various gateway formats
      const actualTransactionId = transactionId || refId || REFNO || label || PAYUID || txn_id || transaction_id || payment_id;

      console.log('🔍 Extracted payment data from URL:', {
        invoiceId,
        orderId,
        amount,
        paymentMethod,
        status,
        actualTransactionId,
        allParams: router.query
      });

      if (invoiceId && orderId) {
        setOrderData({
          invoiceId,
          orderId,
          amount,
          paymentMethod,
          status: status || 'success',
          transactionId: actualTransactionId
        });

        console.log('🔄 Processing payment success with real ComGate transaction ID:', {
          invoiceId,
          orderId,
          amount,
          paymentMethod,
          status,
          transactionId: actualTransactionId
        });

        // Call Capture Payment (same logic as invoice-payment-test)
        // If amount is missing, try to get it from invoice status
        let finalAmount = amount;
        if (!finalAmount) {
          console.log('⚠️ Amount missing from URL, fetching from invoice status...');
          try {
            const invoiceResponse = await fetch(`http://localhost:3005/api/invoices/${invoiceId}/status`);
            const invoiceData = await invoiceResponse.json();

            if (invoiceData.success && invoiceData.amount) {
              finalAmount = invoiceData.amount;
              console.log('✅ Amount retrieved from invoice status:', finalAmount);
            } else {
              console.log('⚠️ Invoice status response:', invoiceData);

              // Fallback: try recent orders
              console.log('⚠️ Trying fallback: recent orders...');
              const ordersResponse = await fetch('/api/middleware/recent-orders?limit=10');
              const ordersData = await ordersResponse.json();

              if (ordersData.success && ordersData.orders) {
                const matchingOrder = ordersData.orders.find(order =>
                  order.id === orderId || order.invoices.some(inv => inv.id === invoiceId)
                );

                if (matchingOrder) {
                  const matchingInvoice = matchingOrder.invoices.find(inv => inv.id === invoiceId);
                  if (matchingInvoice && matchingInvoice.total) {
                    finalAmount = matchingInvoice.total.replace(/[^\d.,]/g, '').replace(',', '.');
                    console.log('✅ Amount retrieved from recent orders:', finalAmount);
                  }
                }
              }
            }
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch amount:', fetchError.message);
          }
        }

        console.log('🔄 About to call handleCompletePaymentFlow with:', {
          invoiceId,
          orderId,
          originalAmount: amount,
          finalAmount,
          finalAmountType: typeof finalAmount
        });

        await handleCompletePaymentFlow(invoiceId, orderId, finalAmount, actualTransactionId);
      }
    } catch (error) {
      console.error('❌ Error processing payment success:', error);
      setCaptureStatus({
        success: false,
        error: error.message,
        details: 'Failed to process payment capture'
      });
    }

    setIsLoading(false);
    setProcessing(false);
  };

  // Complete payment flow function (Authorize → Capture → Provision)
  const handleCompletePaymentFlow = async (invoiceId, orderId, amount, realTransactionId) => {
    try {
      console.log('🔄 Starting complete payment flow for:', {
        invoiceId,
        orderId,
        amount,
        realTransactionId
      });
      console.log('📊 Original amount value:', amount, 'Type:', typeof amount);

      // Správně zpracuj částku - odstraň měnu a převeď na číslo
      let cleanAmount = amount;
      if (typeof amount === 'string') {
        // Odstraň CZK, mezery a další znaky, nech jen čísla a desetinnou čárku/tečku
        cleanAmount = amount.replace(/[^\d.,]/g, '').replace(',', '.');
      }
      const finalAmount = parseFloat(cleanAmount) || 0;

      console.log('💰 Processed amount:', finalAmount, 'CZK');

      if (finalAmount <= 0) {
        throw new Error('Cannot determine payment amount - amount is required for payment flow');
      }

      // Prepare data for complete payment workflow with REAL transaction ID from ComGate
      const finalTransactionId = realTransactionId || `PAYMENT-SUCCESS-${invoiceId}-${Date.now()}`;

      const workflowData = {
        orderId: orderId,
        invoiceId: invoiceId,
        amount: finalAmount,
        currency: 'CZK',
        paymentMethod: 'comgate',
        transactionId: finalTransactionId, // REAL transaction ID from ComGate
        notes: realTransactionId
          ? `Payment workflow with ComGate transaction ID: ${realTransactionId} for invoice ${invoiceId} (${finalAmount} CZK)`
          : `Payment workflow fallback for invoice ${invoiceId} (${finalAmount} CZK)`
      };

      console.log('🚀 Calling complete payment workflow with REAL ComGate transaction ID:', {
        ...workflowData,
        isRealTransactionId: !!realTransactionId
      });

      console.log('🚀 Calling complete payment workflow:', workflowData);

      const response = await fetch('/api/middleware/authorize-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData)
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Complete payment workflow successful:', data);
        setCaptureStatus({
          success: true,
          message: `Payment workflow completed successfully for invoice ${invoiceId}`,
          workflow: data.workflow,
          orderId: data.orderId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          transactionId: data.transactionId,
          nextSteps: data.nextSteps
        });

        // Smaž košík po úspěšné platbě
        console.log('🛒 Payment successful - clearing cart');
        clearCart('payment_success');
      } else {
        console.log('❌ Failed to complete payment workflow:', data.error);
        setCaptureStatus({
          success: false,
          error: data.error,
          details: data.details,
          workflow: data.workflow
        });
      }

    } catch (err) {
      console.error('💥 Complete payment workflow error:', err);
      setCaptureStatus({
        success: false,
        error: err.message,
        details: 'Network or processing error during payment workflow'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Platba úspěšná - Cloud VPS</title>
        <meta name="description" content="Vaše platba byla úspěšně zpracována" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {orderData?.status === 'pending' ? 'Platba je zpracovávána' : 'Platba úspěšná!'}
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-8">
              {orderData?.status === 'pending'
                ? 'Vaše platba je aktuálně zpracovávána. Obdržíte potvrzení e-mailem, jakmile bude platba dokončena.'
                : 'Děkujeme za vaši objednávku! Platba byla úspěšně zpracována a vaše služby budou aktivovány během několika minut.'
              }
            </p>

            {/* Order Details */}
            {orderData && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaily objednávky</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Číslo objednávky:</span>
                    <span className="font-medium">{orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Číslo faktury:</span>
                    <span className="font-medium">{orderData.invoiceId}</span>
                  </div>
                  {orderData.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Částka:</span>
                      <span className="font-medium">{orderData.amount} CZK</span>
                    </div>
                  )}
                  {orderData.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platební metoda:</span>
                      <span className="font-medium capitalize">{orderData.paymentMethod}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stav:</span>
                    <span className={`font-medium ${
                      orderData.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {orderData.status === 'pending' ? 'Zpracovává se' : 'Dokončeno'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Status */}
            {processing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Zpracovávání platby</h3>
                    <p className="text-sm text-yellow-700">
                      Označujeme fakturu jako zaplacenou...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Workflow Status */}
            {captureStatus && (
              <div className={`${captureStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6 mb-8 text-left`}>
                <h3 className={`text-lg font-semibold ${captureStatus.success ? 'text-green-800' : 'text-red-800'} mb-4`}>
                  {captureStatus.success ? '✅ Platba zpracována' : '❌ Problém se zpracováním platby'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Status:</strong> {captureStatus.message}</div>

                  {/* Workflow Status */}
                  {captureStatus.workflow && (
                    <div className="mt-4">
                      <div><strong>Workflow kroky:</strong></div>
                      <div className="ml-4 space-y-1">
                        <div className={`${captureStatus.workflow.authorizePayment === 'completed' ? 'text-green-700' : captureStatus.workflow.authorizePayment === 'failed' ? 'text-red-700' : 'text-yellow-700'}`}>
                          {captureStatus.workflow.authorizePayment === 'completed' ? '✅' : captureStatus.workflow.authorizePayment === 'failed' ? '❌' : '🔄'}
                          Authorize Payment: {captureStatus.workflow.authorizePayment}
                        </div>
                        <div className={`${captureStatus.workflow.capturePayment === 'completed' ? 'text-green-700' : captureStatus.workflow.capturePayment === 'failed' ? 'text-red-700' : 'text-yellow-700'}`}>
                          {captureStatus.workflow.capturePayment === 'completed' ? '✅' : captureStatus.workflow.capturePayment === 'failed' ? '❌' : '🔄'}
                          Capture Payment: {captureStatus.workflow.capturePayment}
                        </div>
                        <div className={`${captureStatus.workflow.provision === 'ready' ? 'text-green-700' : 'text-yellow-700'}`}>
                          {captureStatus.workflow.provision === 'ready' ? '✅' : '🔄'}
                          Provision: {captureStatus.workflow.provision}
                        </div>
                      </div>
                    </div>
                  )}

                  {captureStatus.orderId && (
                    <div><strong>ID objednávky:</strong> {captureStatus.orderId}</div>
                  )}
                  {captureStatus.invoiceId && (
                    <div><strong>ID faktury:</strong> {captureStatus.invoiceId}</div>
                  )}
                  {captureStatus.amount && (
                    <div><strong>Částka:</strong> {captureStatus.amount} CZK</div>
                  )}
                  {captureStatus.transactionId && (
                    <div><strong>ID transakce:</strong> {captureStatus.transactionId}</div>
                  )}
                  {captureStatus.nextSteps && captureStatus.nextSteps.length > 0 && (
                    <div className="mt-3">
                      <strong>Další kroky:</strong>
                      <ul className="ml-4 list-disc">
                        {captureStatus.nextSteps.map((step, index) => (
                          <li key={index} className="text-green-700">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {captureStatus.error && (
                    <div className="text-red-700"><strong>Chyba:</strong> {captureStatus.error}</div>
                  )}
                  {captureStatus.details && (
                    <div className="text-red-700"><strong>Detaily:</strong> {captureStatus.details}</div>
                  )}
                </div>
              </div>
            )}



            {/* Success Message */}
            {captureStatus && captureStatus.success && (
              <div className="bg-green-50 rounded-lg p-6 mb-8 text-center">
                <h3 className="text-lg font-semibold text-green-900 mb-2">🎉 Objednávka úspěšně dokončena!</h3>
                <p className="text-green-800 mb-3">
                  Platba byla zpracována a všechny kroky byly úspěšně dokončeny:
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <div>✅ Authorize Payment - Autorizace platby (aktivace objednávky)</div>
                  <div>✅ Capture Payment - Zachycení platby (označení faktury jako PAID)</div>
                  <div>✅ Provision Ready - Služby připraveny k poskytnutí</div>
                </div>
                <p className="text-green-800 mt-3">
                  Vaše služby budou aktivovány během několika minut.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Zpět na hlavní stránku
              </Link>
              <Link
                href="/contact"
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Kontaktovat podporu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
