import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function PaymentError() {
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    // Extract error details from URL parameters
    const {
      error,
      message,
      orderId,
      invoiceId,
      paymentMethod,
      timestamp
    } = router.query;

    if (error || message) {
      setErrorDetails({
        error,
        message,
        orderId,
        invoiceId,
        paymentMethod,
        timestamp
      });
    }
  }, [router.query]);

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'comgate': return '🌐';
      case 'payu': return '💰';
      case 'paypal': return '🅿️';
      case 'card': return '💳';
      case 'crypto': return '₿';
      case 'banktransfer': return '🏦';
      default: return '💳';
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method?.toLowerCase()) {
      case 'comgate': return 'Comgate Payments';
      case 'payu': return 'PayU';
      case 'paypal': return 'PayPal';
      case 'card': return 'Credit Card';
      case 'crypto': return 'Cryptocurrency';
      case 'banktransfer': return 'Bank Transfer';
      default: return method || 'Unknown';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>Payment Error - Cloud VPS</title>
      </Head>

      <div style={{
        backgroundColor: '#f8d7da',
        border: '2px solid #dc3545',
        borderRadius: '8px',
        padding: '30px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
        <h1 style={{ color: '#721c24', margin: '0 0 15px 0' }}>Payment Error</h1>
        <p style={{ color: '#721c24', fontSize: '18px', margin: 0 }}>
          There was an error processing your payment.
        </p>
      </div>

      {errorDetails && (
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#495057', marginTop: 0 }}>Error Details</h2>
          
          <div style={{ display: 'grid', gap: '15px', fontSize: '16px' }}>
            {errorDetails.error && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Error Code:</strong>
                <span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24',
                  padding: '4px 8px', 
                  borderRadius: '4px' 
                }}>
                  {errorDetails.error}
                </span>
              </div>
            )}

            {errorDetails.message && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong>Message:</strong>
                <span style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '8px 12px', 
                  borderRadius: '4px',
                  maxWidth: '60%',
                  textAlign: 'right'
                }}>
                  {errorDetails.message}
                </span>
              </div>
            )}

            {errorDetails.orderId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Order ID:</strong>
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
                  {errorDetails.orderId}
                </span>
              </div>
            )}

            {errorDetails.invoiceId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Invoice ID:</strong>
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
                  {errorDetails.invoiceId}
                </span>
              </div>
            )}

            {errorDetails.paymentMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Payment Method:</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getPaymentMethodIcon(errorDetails.paymentMethod)}
                  {getPaymentMethodName(errorDetails.paymentMethod)}
                </span>
              </div>
            )}

            {errorDetails.timestamp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Error Time:</strong>
                <span style={{ color: '#6c757d' }}>
                  {new Date(errorDetails.timestamp).toLocaleString('cs-CZ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#495057', marginTop: 0 }}>What can you do?</h3>
        <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
          <li>Try the payment again - this might be a temporary issue</li>
          <li>Try a different payment method if available</li>
          <li>Check your internet connection and try again</li>
          <li>Contact our support team with the error details above</li>
          <li>No charges were made to your account</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', gap: '15px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => router.push('/payment-flow-test')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔄 Try Payment Again
        </button>
        
        <button
          onClick={() => router.push('/contact')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📞 Contact Support
        </button>
        
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
}
