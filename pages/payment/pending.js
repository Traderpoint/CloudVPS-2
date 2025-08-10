import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function PaymentPending() {
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    // Extract payment details from URL parameters
    const {
      orderId,
      invoiceId,
      transactionId,
      paymentMethod,
      amount,
      currency,
      status,
      timestamp
    } = router.query;

    if (orderId) {
      setPaymentDetails({
        orderId,
        invoiceId,
        transactionId,
        paymentMethod,
        amount,
        currency,
        status,
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
        <title>Payment Pending - Cloud VPS</title>
      </Head>

      <div style={{
        backgroundColor: '#cce5ff',
        border: '2px solid #007bff',
        borderRadius: '8px',
        padding: '30px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
        <h1 style={{ color: '#004085', margin: '0 0 15px 0' }}>Payment Pending</h1>
        <p style={{ color: '#004085', fontSize: '18px', margin: 0 }}>
          Your payment is being processed. Please wait for confirmation.
        </p>
      </div>

      {paymentDetails && (
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#495057', marginTop: 0 }}>Payment Details</h2>
          
          <div style={{ display: 'grid', gap: '15px', fontSize: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Order ID:</strong>
              <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
                {paymentDetails.orderId}
              </span>
            </div>

            {paymentDetails.invoiceId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Invoice ID:</strong>
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
                  {paymentDetails.invoiceId}
                </span>
              </div>
            )}

            {paymentDetails.transactionId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Transaction ID:</strong>
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
                  {paymentDetails.transactionId}
                </span>
              </div>
            )}

            {paymentDetails.paymentMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Payment Method:</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getPaymentMethodIcon(paymentDetails.paymentMethod)}
                  {getPaymentMethodName(paymentDetails.paymentMethod)}
                </span>
              </div>
            )}

            {paymentDetails.amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Amount:</strong>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                  {paymentDetails.amount} {paymentDetails.currency || 'CZK'}
                </span>
              </div>
            )}

            {paymentDetails.timestamp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Initiated:</strong>
                <span style={{ color: '#6c757d' }}>
                  {new Date(paymentDetails.timestamp).toLocaleString('cs-CZ')}
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
        <h3 style={{ color: '#495057', marginTop: 0 }}>What happens next?</h3>
        <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
          <li>Your payment is currently being processed by the payment provider</li>
          <li>This usually takes a few minutes to complete</li>
          <li>You will receive an email confirmation once the payment is processed</li>
          <li>Your service will be activated automatically upon successful payment</li>
          <li>If the payment takes longer than expected, please contact our support team</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', gap: '15px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.reload()}
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
          🔄 Refresh Status
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
