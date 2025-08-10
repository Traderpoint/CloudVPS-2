import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function PaymentCancel() {
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
        <title>Payment Cancelled - Cloud VPS</title>
      </Head>

      <div style={{
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
        borderRadius: '8px',
        padding: '30px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
        <h1 style={{ color: '#856404', margin: '0 0 15px 0' }}>Payment Cancelled</h1>
        <p style={{ color: '#856404', fontSize: '18px', margin: 0 }}>
          Your payment was cancelled. No charges were made.
        </p>
      </div>

      {paymentDetails && (
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#495057', marginTop: 0 }}>Order Details</h2>
          
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
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>
                  {paymentDetails.amount} {paymentDetails.currency || 'CZK'}
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
        <h3 style={{ color: '#495057', marginTop: 0 }}>What can you do now?</h3>
        <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
          <li>Try the payment again with the same or different payment method</li>
          <li>Contact our support team if you encountered any issues</li>
          <li>Your order is still pending and can be completed later</li>
          <li>No charges were made to your account</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', gap: '15px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => router.push('/payment-flow-test')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ffc107',
            color: '#212529',
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
