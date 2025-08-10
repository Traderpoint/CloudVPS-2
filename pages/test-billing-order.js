import { useState } from 'react';
import Head from 'next/head';

export default function TestBillingOrder() {
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const testOrderCreation = async () => {
    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      // Mock order data similar to billing.js
      const testOrderData = {
        customer: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '777123456',
          address: 'Test Address 123',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
          company: ''
        },
        items: [
          {
            productId: '1',
            name: 'Test VPS',
            price: 499,
            cycle: 'a', // annually
            billing_cycle: 'a',
            quantity: 1,
            configOptions: {
              cpu: '2 vCPU',
              ram: '4GB',
              storage: '50GB',
              os: 'linux',
              bandwidth: '1TB',
              applications: ''
            }
          }
        ],
        affiliate: { id: process.env.NEXT_PUBLIC_DEFAULT_AFFILIATE_ID || '2' },

        // Payment data structure expected by API
        payment: {
          method: 0, // Payment method: 0 instead of 'comgate'
          total: 499
        },

        // Additional fields for compatibility
        paymentMethod: 0, // Backward compatibility
        newsletterSubscribe: false,
        type: 'complete',
        cartTotal: 499,
        total: 499, // Also include total at root level

        cartSettings: {
          selectedPeriod: '12',
          selectedOS: 'linux',
          selectedApps: []
        }
      };

      console.log('🧪 Testing order creation with data:', testOrderData);

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOrderData)
      });

      const result = await response.json();
      setOrderData(result);

      if (result.success) {
        console.log('✅ Test order created successfully:', result);
      } else {
        console.error('❌ Test order creation failed:', result);
        setError(result.error || 'Order creation failed');
      }

    } catch (err) {
      console.error('❌ Test error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Test Billing Order Creation - Cloud VPS</title>
      </Head>

      <h1>🧪 Test Billing Order Creation</h1>
      <p>Test vytvoření objednávky s opravenými parametry</p>

      {/* Test Parameters Display */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔧 Opravené parametry:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li><strong>paymentMethod:</strong> 0 (místo "comgate")</li>
          <li><strong>affiliate.id:</strong> {process.env.NEXT_PUBLIC_DEFAULT_AFFILIATE_ID || '2'} (z .env)</li>
          <li><strong>type:</strong> "complete"</li>
          <li><strong>newsletterSubscribe:</strong> false</li>
        </ul>
      </div>

      {/* Test Button */}
      <button
        onClick={testOrderCreation}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading ? '#ccc' : '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {isLoading ? '⏳ Testování...' : '🧪 Test Order Creation'}
      </button>

      {/* Loading State */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Vytváření testovací objednávky...</h3>
          <p>Odesílání dat na middleware API...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {orderData && (
        <div style={{
          backgroundColor: orderData.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${orderData.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: orderData.success ? '#155724' : '#721c24' 
          }}>
            {orderData.success ? '✅ Order Creation Success' : '❌ Order Creation Failed'}
          </h3>
          
          {orderData.success && (
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Order ID:</strong> {orderData.orderId || 'N/A'}</p>
              <p><strong>Invoice ID:</strong> {orderData.invoiceId || 'N/A'}</p>
              <p><strong>Client ID:</strong> {orderData.clientId || 'N/A'}</p>
              <p><strong>Total Amount:</strong> {orderData.totalAmount || 'N/A'}</p>
            </div>
          )}

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
              View Full Response
            </summary>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(orderData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Environment Info */}
      <div style={{
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>🔗 Environment Info</h4>
        <p><strong>Default Affiliate ID:</strong> {process.env.NEXT_PUBLIC_DEFAULT_AFFILIATE_ID || 'Not set'}</p>
        <p><strong>Middleware URL:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
      </div>

      {/* Quick Links */}
      <div style={{ marginTop: '20px' }}>
        <a
          href="/billing"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Go to Billing Page
        </a>
        <a
          href="/test-portal"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#4caf50',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Back to Test Portal
        </a>
      </div>
    </div>
  );
}
