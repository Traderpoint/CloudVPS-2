import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useCart } from '../../contexts/CartContext';

export default function PaymentSuccess() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing payment return...');
  const [captureResult, setCaptureResult] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      processPaymentReturn();
    }
  }, [router.isReady]);

  const processPaymentReturn = async () => {
    try {
      const { orderId, invoiceId, paymentMethod, status: paymentStatus, transactionId, amount, testFlow } = router.query;

      console.log('🔄 Processing payment return from gateway:', {
        orderId,
        invoiceId,
        paymentMethod,
        paymentStatus,
        transactionId,
        amount
      });

      setMessage('Payment return detected - processing...');

      if (!invoiceId) {
        throw new Error('Missing invoice ID in return parameters');
      }

      // Step 1: Check invoice status before calling Capture Payment
      if (paymentStatus === 'success') {
        console.log('🔍 Checking invoice status before capture...');
        setMessage('Payment successful - checking status...');

        // First check if invoice is already paid
        const statusResponse = await fetch(`http://localhost:3005/api/invoices/${invoiceId}/status`);
        const statusResult = await statusResponse.json();

        if (statusResult.success && statusResult.isPaid) {
          console.log('✅ Invoice is already PAID - skipping capture');
          setCaptureResult({
            success: true,
            message: 'Invoice is already marked as PAID',
            currentStatus: 'Paid',
            skippedCapture: true
          });
          setStatus('captured');
          setMessage('Invoice already marked as PAID!');

          // Smaž košík po úspěšné platbě
          console.log('🛒 Payment already processed - clearing cart');
          clearCart('payment_success');
        } else {
          console.log('💰 Invoice not paid yet - calling Capture Payment...');
          setMessage('Payment successful - capturing payment...');

          const captureResponse = await fetch('/api/middleware/capture-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice_id: invoiceId,
              amount: parseFloat(amount) || 604,
              module: paymentMethod === 'comgate' ? 'Comgate' : 'BankTransfer',
              trans_id: transactionId || `REAL-PAYMENT-${invoiceId}`,
              note: `Real payment captured automatically after successful ${paymentMethod} gateway return`
            })
          });

          const captureResult = await captureResponse.json();

          if (captureResult.success) {
            console.log('✅ Capture Payment successful:', captureResult);
            setCaptureResult({
              success: true,
              message: captureResult.message,
              previousStatus: captureResult.data?.previous_status,
              currentStatus: captureResult.data?.current_status,
              transactionId: captureResult.data?.transaction_id
            });
            setStatus('captured');

            // Smaž košík po úspěšné platbě
            console.log('🛒 Payment captured successfully - clearing cart');
            clearCart('payment_success');
            setMessage('Payment captured successfully!');
          } else {
            console.log('❌ Capture Payment failed:', captureResult.error);
            setCaptureResult({
              success: false,
              error: captureResult.error,
              details: captureResult.details
            });
            setStatus('capture_failed');
            setMessage('Payment successful but capture failed');
          }
        }
      } else if (paymentStatus === 'cancelled') {
        setStatus('cancelled');
        setMessage('Payment was cancelled');
      } else if (paymentStatus === 'pending') {
        setStatus('pending');
        setMessage('Payment is pending');
      } else {
        setStatus('failed');
        setMessage('Payment failed or had issues');
      }

      // Step 2: Check if this is test flow or normal flow
      if (testFlow === 'real-payment-flow-test') {
        // Test flow - redirect back to test after 2 seconds
        setTimeout(() => {
          console.log('🔄 Test flow - redirecting back to test page...');

          const redirectUrl = new URL('/real-payment-flow-test', window.location.origin);
          redirectUrl.searchParams.set('status', paymentStatus || 'unknown');
          redirectUrl.searchParams.set('invoiceId', invoiceId);
          redirectUrl.searchParams.set('orderId', orderId || '');
          redirectUrl.searchParams.set('transactionId', transactionId || '');
          redirectUrl.searchParams.set('amount', amount || '604');
          redirectUrl.searchParams.set('paymentMethod', paymentMethod || 'comgate');

          // Add capture result info
          if (captureResult) {
            redirectUrl.searchParams.set('captureStatus', captureResult.success ? 'success' : 'failed');
            if (captureResult.success) {
              redirectUrl.searchParams.set('currentStatus', captureResult.currentStatus || 'Paid');
            }
          }

          redirectUrl.searchParams.set('autoProcessed', 'true');
          redirectUrl.searchParams.set('timestamp', new Date().toISOString());

          console.log('🔗 Redirecting to:', redirectUrl.toString());
          window.location.href = redirectUrl.toString();
        }, 2000);
      } else {
        // Normal flow - redirect to new success page after processing
        console.log('🌐 Normal flow - redirecting to new success page');
        setTimeout(() => {
          const redirectUrl = new URL('/payment-success', window.location.origin);
          redirectUrl.searchParams.set('invoiceId', invoiceId);
          redirectUrl.searchParams.set('orderId', orderId || '');
          redirectUrl.searchParams.set('amount', amount || '');
          redirectUrl.searchParams.set('paymentMethod', paymentMethod || '');

          if (paymentStatus === 'pending') {
            redirectUrl.searchParams.set('status', 'pending');
          }

          console.log('🔗 Redirecting to new success page:', redirectUrl.toString());
          window.location.href = redirectUrl.toString();
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error processing payment return:', error);
      setStatus('error');
      setMessage(`Error: ${error.message}`);
      setProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'captured':
        return '✅';
      case 'cancelled':
        return '⚠️';
      case 'pending':
        return '🕐';
      case 'capture_failed':
        return '⚠️';
      case 'failed':
        return '❌';
      case 'error':
        return '💥';
      default:
        return '🔄';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'captured':
        return '#28a745';
      case 'cancelled':
      case 'capture_failed':
        return '#ffc107';
      case 'failed':
      case 'error':
        return '#dc3545';
      case 'pending':
        return '#17a2b8';
      default:
        return '#007bff';
    }
  };
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center',
      maxWidth: '500px',
      width: '100%'
    },
    spinner: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px'
    },
    icon: {
      fontSize: '60px',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#333'
    },
    message: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px',
      lineHeight: '1.5'
    },
    details: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '15px',
      fontSize: '14px',
      textAlign: 'left',
      marginTop: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Payment Return Processing - Real Payment Flow</title>
      </Head>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.card}>
        {processing && status === 'processing' && (
          <div style={styles.spinner}></div>
        )}

        <div style={{ ...styles.icon, color: getStatusColor() }}>
          {getStatusIcon()}
        </div>

        <h1 style={{ ...styles.title, color: getStatusColor() }}>
          {status === 'processing' && 'Processing Payment Return'}
          {status === 'captured' && 'Payment Captured Successfully!'}
          {status === 'cancelled' && 'Payment Cancelled'}
          {status === 'pending' && 'Payment Pending'}
          {status === 'capture_failed' && 'Payment Successful - Capture Issue'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Processing Error'}
        </h1>

        <p style={styles.message}>
          {message}
        </p>

        {status === 'captured' && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #28a745',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <strong>🎉 Success!</strong><br/>
            Payment has been automatically captured and invoice marked as PAID.
            <br/>
            <small>Redirecting to test page in a moment...</small>
          </div>
        )}

        {status === 'capture_failed' && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <strong>⚠️ Partial Success</strong><br/>
            Payment was successful but automatic capture failed.
            <br/>
            <small>You can manually capture on the test page...</small>
          </div>
        )}

        {captureResult && (
          <div style={styles.details}>
            <strong>📋 Capture Details:</strong><br/>
            {captureResult.success ? (
              <>
                <div><strong>Status:</strong> {captureResult.previousStatus} → {captureResult.currentStatus}</div>
                <div><strong>Transaction ID:</strong> {captureResult.transactionId}</div>
                <div><strong>Message:</strong> {captureResult.message}</div>
              </>
            ) : (
              <>
                <div><strong>Error:</strong> {captureResult.error}</div>
                {captureResult.details && <div><strong>Details:</strong> {captureResult.details}</div>}
              </>
            )}
          </div>
        )}

        <div style={{
          fontSize: '14px',
          color: '#666',
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <strong>ℹ️ What's happening:</strong><br/>
          1. ✅ Payment return detected from gateway<br/>
          2. {status === 'captured' ? '✅' : status === 'capture_failed' ? '⚠️' : '🔄'} Automatic Capture Payment {status === 'captured' ? 'completed' : status === 'capture_failed' ? 'failed' : 'processing'}<br/>
          3. 🔄 Redirecting to Real Payment Flow Test page<br/>
          4. 📊 Final status will be displayed there
        </div>
      </div>
    </div>
  );
}

