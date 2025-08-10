import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import RealPaymentProcessor from '../lib/real-payment-processor';

const PaymentSuccessFlow = () => {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({});
  const [paymentData, setPaymentData] = useState(null);

  // Get payment data - ALWAYS use window.location for reliability
  useEffect(() => {
    console.log('🔍 Payment-Success-Flow: useEffect STARTED');
    console.log('🔍 Payment-Success-Flow: Router query received:', router.query);
    console.log('🔍 Payment-Success-Flow: Router ready:', router.isReady);
    console.log('🔍 Payment-Success-Flow: Window location:', typeof window !== 'undefined' ? window.location.href : 'N/A');

    // ✅ IMMEDIATE TEST: Log window.location.search
    if (typeof window !== 'undefined') {
      console.log('🔍 IMMEDIATE TEST: window.location.search:', window.location.search);
      console.log('🔍 IMMEDIATE TEST: URLSearchParams test:', new URLSearchParams(window.location.search).get('transactionId'));
    }

    // ✅ FIXED: Use same logic as working test page
    let invoiceId, orderId, amount, paymentId, transactionId, paymentMethod, currency, status;

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      invoiceId = urlParams.get('invoiceId');
      orderId = urlParams.get('orderId');
      amount = urlParams.get('amount');
      paymentId = urlParams.get('paymentId');
      transactionId = urlParams.get('transactionId');
      paymentMethod = urlParams.get('paymentMethod');
      currency = urlParams.get('currency');
      status = urlParams.get('status');

      console.log('🔍 Payment-Success-Flow: Extracted from window.location:', {
        invoiceId, orderId, amount, paymentId, transactionId, paymentMethod, currency, status
      });

      // ✅ IMMEDIATE LOG with actual extracted values
      console.log('✅ EXTRACTED VALUES - Transaction ID:', transactionId);
      console.log('✅ EXTRACTED VALUES - Payment ID:', paymentId);
    }

    if (invoiceId && orderId) {
      console.log('✅ Payment-Success-Flow: Required parameters found');
      console.log('🔍 Payment-Success-Flow: Transaction ID:', transactionId);
      console.log('🔍 Payment-Success-Flow: Payment ID:', paymentId);

      const parsedAmount = amount ? parseFloat(amount) : null;

      const data = {
        invoiceId,
        orderId,
        amount: parsedAmount,
        currency: currency || 'CZK',
        paymentId,
        transactionId,
        paymentMethod: paymentMethod || 'comgate'
      };
      setPaymentData(data);

      // ✅ FIXED: Log with actual extracted values (not from data object)
      addLog('success', `Payment Success Flow initialized for Invoice ${invoiceId}, Order ${orderId}`);
      addLog('info', `Payment Data: ${JSON.stringify(data, null, 2)}`);

      // ✅ CRITICAL FIX: Use extracted variables directly, not from data object
      if (transactionId) {
        addLog('success', `✅ Transaction ID found: ${transactionId}`);
      } else {
        addLog('error', '❌ Transaction ID is NULL or undefined');
      }

      if (paymentId) {
        addLog('success', `✅ Payment ID found: ${paymentId}`);
      } else {
        addLog('error', '❌ Payment ID is NULL or undefined');
      }

      console.log('🔍 FINAL CHECK - Transaction ID:', transactionId);
      console.log('🔍 FINAL CHECK - Payment ID:', paymentId);
      console.log('🔍 FINAL CHECK - Data object:', data);

      // Log the source of amount data
      if (parsedAmount) {
        addLog('info', `Amount: ${parsedAmount} ${currency || 'CZK'} (from URL parameters)`);
      } else {
        addLog('warning', 'No amount provided in URL parameters');
      }
    }
  }, [router.query, router.isReady]);

  // ✅ ADDITIONAL DEBUG: Log current paymentData state
  useEffect(() => {
    console.log('🔍 Payment-Success-Flow: Current paymentData state:', paymentData);
    if (paymentData) {
      console.log('✅ Payment-Success-Flow: PaymentData is set:', {
        transactionId: paymentData.transactionId,
        paymentId: paymentData.paymentId,
        invoiceId: paymentData.invoiceId,
        orderId: paymentData.orderId,
        amount: paymentData.amount
      });
    } else {
      console.log('❌ Payment-Success-Flow: PaymentData is NULL');
    }
  }, [paymentData]);

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      type,
      message,
      timestamp
    }]);
  };

  const setButtonLoading = (buttonId, isLoading) => {
    setLoading(prev => ({ ...prev, [buttonId]: isLoading }));
  };

  // 1. Add Invoice Payment and Transaction ID
  const handleAddInvoicePayment = async () => {
    if (!paymentData) {
      addLog('error', 'No payment data available');
      return;
    }

    setButtonLoading('addPayment', true);
    addLog('info', '🔄 Step 1: Adding Invoice Payment and Transaction ID...');

    try {
      const middlewareUrl = 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/invoices/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: paymentData.invoiceId,
          transactionId: paymentData.transactionId || `${paymentData.paymentMethod.toUpperCase()}-${Date.now()}`,
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount || 0, // Use 0 if no amount provided
          currency: paymentData.currency || 'CZK',
          notes: `Payment completed via ${paymentData.paymentMethod} - Order ${paymentData.orderId}`
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addLog('success', `✅ Invoice Payment Added Successfully`);
        addLog('info', `Transaction ID: ${result.transactionId || paymentData.transactionId}`);
        addLog('info', `Payment Method: ${paymentData.paymentMethod}`);
        addLog('info', `Amount: ${paymentData.amount || 'Not specified'} ${paymentData.currency || 'CZK'}`);
        addLog('info', `HostBill Response: ${result.message || 'Payment recorded'}`);

        // Check Pohoda sync result
        if (result.pohodaSync) {
          if (result.pohodaSync.success) {
            addLog('success', `✅ Pohoda Sync: Invoice automatically synchronized`);
            addLog('info', `Pohoda Invoice ID: ${result.pohodaSync.pohodaOrderId || paymentData.invoiceId}`);
          } else {
            addLog('warning', `⚠️ Pohoda Sync: Failed but payment processed`);
            addLog('warning', `Pohoda Error: ${result.pohodaSync.error}`);
          }
        } else {
          addLog('info', `ℹ️ Pohoda Sync: Not configured or not attempted`);
        }
      } else {
        throw new Error(result.error || result.message || 'Failed to add payment');
      }
    } catch (error) {
      addLog('error', `❌ Failed to add invoice payment: ${error.message}`);
    } finally {
      setButtonLoading('addPayment', false);
    }
  };

  // 2. Capture Payment
  const handleCapturePayment = async () => {
    if (!paymentData) {
      addLog('error', 'No payment data available');
      return;
    }

    setButtonLoading('capturePayment', true);
    addLog('info', '🔄 Step 2: Capturing Payment...');

    try {
      const middlewareUrl = 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/payments/authorize-capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentData.orderId,
          invoiceId: paymentData.invoiceId,
          transactionId: paymentData.transactionId || `CAPTURE-${paymentData.invoiceId}-${Date.now()}`,
          amount: paymentData.amount || 0,
          currency: paymentData.currency || 'CZK',
          paymentMethod: paymentData.paymentMethod,
          notes: `Payment captured for invoice ${paymentData.invoiceId}`,
          skipAuthorize: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addLog('success', `✅ Payment Captured Successfully`);
        addLog('info', `Capture Transaction ID: ${result.transactionId}`);
        addLog('info', `Amount Captured: ${result.amount} ${result.currency}`);
        
        if (result.workflow) {
          addLog('info', `Workflow Status:`);
          addLog('info', `  • Authorize: ${result.workflow.authorizePayment}`);
          addLog('info', `  • Capture: ${result.workflow.capturePayment}`);
          addLog('info', `  • Provision: ${result.workflow.provision}`);
        }
      } else {
        throw new Error(result.error || result.message || 'Failed to capture payment');
      }
    } catch (error) {
      addLog('error', `❌ Failed to capture payment: ${error.message}`);
    } finally {
      setButtonLoading('capturePayment', false);
    }
  };

  // 3. Clear Cart
  const handleClearCart = async () => {
    setButtonLoading('clearCart', true);
    addLog('info', '🔄 Step 3: Clearing Cart...');

    try {
      // Clear localStorage cart data
      localStorage.removeItem('cart');
      localStorage.removeItem('cartItems');
      localStorage.removeItem('orderData');
      localStorage.removeItem('paymentData');
      
      addLog('success', '✅ Cart cleared from localStorage');
      
      // Optional: Call middleware to clear server-side cart if exists
      if (paymentData?.orderId) {
        const middlewareUrl = 'http://localhost:3005';
        const response = await fetch(`${middlewareUrl}/api/cart/clear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: paymentData.orderId
          })
        });

        if (response.ok) {
          addLog('success', '✅ Server-side cart cleared');
        } else {
          addLog('warning', '⚠️ Server-side cart clear failed (not critical)');
        }
      }
      
      addLog('success', '✅ Cart Clear Complete');
    } catch (error) {
      addLog('error', `❌ Failed to clear cart: ${error.message}`);
    } finally {
      setButtonLoading('clearCart', false);
    }
  };

  // 4. Auto-Capture (Combined Add Payment + Capture)
  const handleAutoCapture = async () => {
    if (!paymentData) {
      addLog('error', 'No payment data available');
      return;
    }

    setButtonLoading('autoCapture', true);
    addLog('info', '🔄 Auto-Capture with RealPaymentProcessor...');

    try {
      // Use RealPaymentProcessor for auto-capture
      const paymentProcessor = new RealPaymentProcessor();
      const result = await paymentProcessor.autoCapturePayment(paymentData);

      if (result.success) {
        addLog('success', `✅ Auto-Capture successful: ${result.message}`);
        addLog('info', `   Transaction ID: ${result.transactionId}`);
        addLog('info', `   Amount: ${result.amount} CZK`);
        addLog('info', `   Invoice ID: ${result.invoiceId}`);
      } else {
        throw new Error(result.error || 'Auto-capture failed');
      }

    } catch (error) {
      addLog('error', `❌ Auto-Capture Failed: ${error.message}`);
    } finally {
      setButtonLoading('autoCapture', false);
    }
  };

  // 5. Mark as Paid with RealPaymentProcessor
  const handleMarkAsPaid = async () => {
    if (!paymentData) {
      addLog('error', 'No payment data available');
      return;
    }

    setButtonLoading('markAsPaid', true);
    addLog('info', '🔄 Mark as Paid with RealPaymentProcessor...');

    try {
      // Use RealPaymentProcessor for mark as paid
      const paymentProcessor = new RealPaymentProcessor();
      const result = await paymentProcessor.markInvoicePaid(paymentData);

      if (result.success) {
        addLog('success', `✅ Invoice marked as PAID: ${result.message}`);
        addLog('info', `   Transaction ID: ${result.transactionId}`);
        addLog('info', `   Invoice ID: ${result.invoiceId}`);
      } else {
        throw new Error(result.error || 'Mark paid failed');
      }
    } catch (error) {
      addLog('error', `❌ Failed to mark as paid: ${error.message}`);
    } finally {
      setButtonLoading('markAsPaid', false);
    }
  };

  // 6. Go to Success Page
  const handleGoToSuccessPage = () => {
    addLog('info', '🔄 Step 6: Redirecting to Success Page...');

    // Redirect to order confirmation page with payment data
    const successUrl = `/order-confirmation?invoiceId=${paymentData?.invoiceId}&orderId=${paymentData?.orderId}&amount=${paymentData?.amount}&status=paid`;

    addLog('success', `✅ Redirecting to: ${successUrl}`);

    setTimeout(() => {
      router.push(successUrl);
    }, 1000);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Payment Success Flow - CloudVPS</title>
      </Head>

      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#28a745', marginBottom: '10px' }}>🎉 Payment Successful!</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Complete the payment flow by executing the steps below
        </p>
        {paymentData && (
          <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px', marginTop: '15px' }}>
            <strong>Payment Details:</strong>
            <div style={{ marginTop: '10px', textAlign: 'left', fontSize: '14px' }}>
              <div><strong>Invoice ID:</strong> {paymentData.invoiceId}</div>
              <div><strong>Order ID:</strong> {paymentData.orderId}</div>
              <div><strong>Amount:</strong> {paymentData.amount ? `${paymentData.amount} ${paymentData.currency || 'CZK'}` : 'Not specified'}</div>
              <div><strong>Payment Method:</strong> {paymentData.paymentMethod}</div>
              {paymentData.paymentId && <div><strong>Payment ID:</strong> {paymentData.paymentId}</div>}
              {paymentData.transactionId && <div><strong>Transaction ID:</strong> {paymentData.transactionId}</div>}
            </div>
          </div>
        )}
      </div>

      {/* 6 Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>

        {/* 1. Add Invoice Payment */}
        <button
          onClick={handleAddInvoicePayment}
          disabled={loading.addPayment || !paymentData}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading.addPayment || !paymentData ? 'not-allowed' : 'pointer',
            opacity: loading.addPayment || !paymentData ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading.addPayment ? '⏳ Processing...' : '1️⃣ Add Invoice Payment & Transaction ID'}
        </button>

        {/* 2. Capture Payment */}
        <button
          onClick={handleCapturePayment}
          disabled={loading.capturePayment || !paymentData}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading.capturePayment || !paymentData ? 'not-allowed' : 'pointer',
            opacity: loading.capturePayment || !paymentData ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading.capturePayment ? '⏳ Processing...' : '2️⃣ Capture Payment'}
        </button>

        {/* 3. Auto-Capture (NEW) */}
        <button
          onClick={handleAutoCapture}
          disabled={loading.autoCapture || !paymentData}
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading.autoCapture || !paymentData ? 'not-allowed' : 'pointer',
            opacity: loading.autoCapture || !paymentData ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading.autoCapture ? '⏳ Processing...' : '🚀 Auto-Capture'}
        </button>

        {/* 4. Mark as Paid (NEW) */}
        <button
          onClick={handleMarkAsPaid}
          disabled={loading.markAsPaid || !paymentData}
          style={{
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading.markAsPaid || !paymentData ? 'not-allowed' : 'pointer',
            opacity: loading.markAsPaid || !paymentData ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading.markAsPaid ? '⏳ Processing...' : '💰 Mark as Paid'}
        </button>

        {/* 5. Clear Cart */}
        <button
          onClick={handleClearCart}
          disabled={loading.clearCart}
          style={{
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading.clearCart ? 'not-allowed' : 'pointer',
            opacity: loading.clearCart ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading.clearCart ? '⏳ Processing...' : '🗑️ Clear Cart'}
        </button>

        {/* 6. Go to Success Page */}
        <button
          onClick={handleGoToSuccessPage}
          disabled={!paymentData}
          style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: !paymentData ? 'not-allowed' : 'pointer',
            opacity: !paymentData ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          ✅ Go to Success Page
        </button>
      </div>

      {/* Logs Section */}
      <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>📋 Execution Logs</h3>
        
        <div style={{
          backgroundColor: '#000',
          color: '#00ff00',
          padding: '15px',
          borderRadius: '5px',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: '13px',
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #333'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>Waiting for actions...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ marginBottom: '5px', display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ color: getLogColor(log.type), marginRight: '8px', minWidth: '20px' }}>
                  {getLogIcon(log.type)}
                </span>
                <span style={{ color: '#888', marginRight: '10px', minWidth: '80px' }}>
                  [{log.timestamp}]
                </span>
                <span style={{ color: getLogColor(log.type), flex: 1, whiteSpace: 'pre-wrap' }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Total logs: {logs.length} | Last updated: {logs.length > 0 ? logs[logs.length - 1].timestamp : 'Never'}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h4>📖 Instructions:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h5>🔧 Manual Steps:</h5>
            <ol style={{ marginBottom: '0' }}>
              <li><strong>Add Invoice Payment:</strong> Records the payment in HostBill with transaction ID</li>
              <li><strong>Capture Payment:</strong> Executes the authorize-capture workflow for order provisioning</li>
              <li><strong>Clear Cart:</strong> Removes cart data from localStorage and server</li>
              <li><strong>Go to Success Page:</strong> Redirects to the final order confirmation page</li>
            </ol>
          </div>
          <div>
            <h5>⚡ Quick Actions:</h5>
            <ul style={{ marginBottom: '0' }}>
              <li><strong>🚀 Auto-Capture:</strong> Combines Add Payment + Capture in one action</li>
              <li><strong>💰 Mark as Paid:</strong> Simple HostBill setInvoiceStatus to PAID</li>
            </ul>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
              <strong>Recommended:</strong> Use Auto-Capture for complete workflow or Mark as Paid for simple status update.
            </p>
          </div>
        </div>
        <p style={{ marginTop: '15px', marginBottom: '0', fontSize: '14px', color: '#666' }}>
          <strong>Note:</strong> All actions are logged below. Choose manual steps for detailed control or quick actions for efficiency.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessFlow;
