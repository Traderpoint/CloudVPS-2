import { useState, useEffect } from 'react';
import Head from 'next/head';

// Inline styles to avoid CSP issues
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  button: {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  buttonPrimary: {
    backgroundColor: '#28a745'
  },
  buttonSecondary: {
    backgroundColor: '#007bff'
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  successBox: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px'
  },
  infoBox: {
    backgroundColor: '#e2e3e5',
    border: '1px solid #d6d8db',
    borderRadius: '8px',
    padding: '15px'
  },
  paymentBox: {
    backgroundColor: '#d1ecf1',
    border: '1px solid #bee5eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  detailBox: {
    backgroundColor: 'white',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '15px'
  }
};

export default function MiddlewareOrderTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [formData, setFormData] = useState({
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@test.cz',
    phone: '+420123456789',
    address: 'Testovací ulice 123',
    city: 'Praha',
    postalCode: '11000',
    country: 'CZ',
    company: 'Test s.r.o.',
    productId: '1',
    productName: 'VPS Basic',
    price: 604,
    cycle: 'm',
    affiliateId: '2',
    affiliateCode: 'test-affiliate',
    paymentMethod: 'comgate'
  });

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setPaymentMethodsLoading(true);
      console.log('🔍 Loading payment methods via middleware...');

      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/payment-modules`);
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.modules || []);

        // Auto-select Comgate if available, otherwise first available method
        if (data.modules && data.modules.length > 0) {
          const comgateMethod = data.modules.find(m => m.method === 'comgate');
          const defaultMethod = comgateMethod ? comgateMethod.method : data.modules[0].method;
          setFormData(prev => ({ ...prev, paymentMethod: defaultMethod }));
          console.log('🎯 Auto-selected payment method:', defaultMethod);
        }

        console.log('✅ Payment methods loaded via middleware:', data.modules);
      } else {
        throw new Error(data.error || 'Failed to load payment methods via middleware');
      }
    } catch (err) {
      console.error('❌ Error loading payment methods via middleware:', err);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    let updates = { [field]: value };

    // Auto-update product name and price based on Cloud VPS product ID
    if (field === 'productId') {
      switch (value) {
        case '1':
          updates.productName = 'VPS Basic';
          updates.price = 299;
          break;
        case '2':
          updates.productName = 'VPS Pro';
          updates.price = 499;
          break;
        case '3':
          updates.productName = 'VPS Premium';
          updates.price = 899;
          break;
        case '4':
          updates.productName = 'VPS Enterprise';
          updates.price = 1299;
          break;
      }
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const createTestOrder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🛒 Creating test order via middleware...');
      console.log('🔍 Sending order with product ID:', formData.productId);

      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          company: formData.company
        },
        items: [
          {
            productId: formData.productId, // Use productId for middleware compatibility
            name: formData.productName,
            price: parseFloat(formData.price),
            cycle: formData.cycle,
            quantity: 1,
            configOptions: {
              ram: '4GB',
              cpu: '2',
              storage: '50GB'
            }
          }
        ],
        affiliate: {
          id: formData.affiliateId,
          code: formData.affiliateCode
        },
        paymentMethod: formData.paymentMethod,
        newsletterSubscribe: false,
        type: 'complete'
      };

      console.log('Order data:', orderData);

      const response = await fetch('/api/middleware/create-test-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Test order created via middleware:', data);
      } else {
        setError(data.error || 'Order creation failed');
        console.error('❌ Test order failed via middleware:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error creating test order via middleware:', err);
    } finally {
      setLoading(false);
    }
  };

  const processTestPayment = async () => {
    if (!result || !result.orders || result.orders.length === 0) {
      setError('No order available for payment. Please create an order first.');
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentResult(null);
      setError(null);

      const order = result.orders[0];
      const orderId = order.orderId || order.id;
      const invoiceId = order.invoiceId || orderId;

      console.log('💳 Processing test payment via middleware...', {
        orderId,
        invoiceId,
        method: formData.paymentMethod,
        amount: formData.price
      });

      const paymentData = {
        orderId,
        invoiceId,
        method: formData.paymentMethod,
        amount: parseFloat(formData.price),
        currency: 'CZK',
        customerData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email
        },
        returnUrl: `${window.location.origin}/payment-return?status=success`,
        cancelUrl: `${window.location.origin}/payment-return?status=cancelled`,
        testFlow: true
      };

      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (data.success) {
        setPaymentResult(data);
        console.log('✅ Test payment processed via middleware:', data);
      } else {
        setError(data.error || 'Payment processing failed');
        console.error('❌ Test payment failed via middleware:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error processing test payment via middleware:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const simulatePaymentCallback = async () => {
    if (!result || !result.orders || result.orders.length === 0 || !paymentResult) {
      setError('No payment available for callback simulation');
      return;
    }

    try {
      setPaymentLoading(true);
      setError(null);

      const order = result.orders[0];

      const paymentMethod = formData.paymentMethod;
      console.log(`🔄 Simulating ${paymentMethod.toUpperCase()} callback...`);

      let callbackData;

      if (paymentMethod === 'comgate') {
        // Simulate Comgate callback
        callbackData = {
          transId: paymentResult.transactionId || paymentResult.paymentId,
          status: 'PAID',
          price: formData.price * 100, // Comgate uses cents
          curr: 'CZK',
          refId: order.orderId,
          email: formData.email,
          method: 'CARD_CZ_CSOB_2',
          test: 'true'
        };
      } else {
        // Simulate PayU callback (default)
        callbackData = {
          txnid: paymentResult.paymentId,
          mihpayid: Date.now().toString(),
          status: 'success',
          amount: formData.price,
          productinfo: 'VPS Service',
          firstname: formData.firstName,
          email: formData.email,
          phone: formData.phone,
          hash: 'simulated_hash_' + Date.now()
        };
      }

      console.log('📤 Callback data:', callbackData);

      // Send actual callback to server
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      let callbackEndpoint;

      if (paymentMethod === 'comgate') {
        callbackEndpoint = `${middlewareUrl}/api/payments/comgate/callback`;
      } else {
        callbackEndpoint = `${middlewareUrl}/api/payments/payu/callback`;
      }

      try {
        const callbackResponse = await fetch(callbackEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(callbackData)
        });

        const callbackResult = await callbackResponse.json();

        if (callbackResult.success) {
          console.log('✅ Callback sent successfully:', callbackResult);

          setPaymentStatus({
            status: 'callback_processed',
            message: `${paymentMethod.toUpperCase()} callback processed successfully`,
            data: callbackData,
            invoiceUpdated: callbackResult.invoiceUpdated,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('❌ Callback failed:', callbackResult.error);

          setPaymentStatus({
            status: 'callback_failed',
            message: `${paymentMethod.toUpperCase()} callback failed: ${callbackResult.error}`,
            data: callbackData,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Callback request failed:', error);

        setPaymentStatus({
          status: 'callback_error',
          message: `${paymentMethod.toUpperCase()} callback error: ${error.message}`,
          data: callbackData,
          timestamp: new Date().toISOString()
        });
      }

      // Check invoice status after callback
      setTimeout(() => checkInvoiceStatus(order.invoiceId || order.orderId), 2000);

    } catch (err) {
      setError(err.message);
      console.error(`❌ Error simulating ${formData.paymentMethod} callback:`, err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const checkInvoiceStatus = async (invoiceId) => {
    try {
      console.log('🔍 Checking invoice status for ID:', invoiceId);

      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/invoices/${invoiceId}/status`);

      if (response.ok) {
        const data = await response.json();
        setInvoiceStatus(data);
        console.log('📋 Invoice status:', data);
      } else {
        console.warn('⚠️ Could not fetch invoice status');
      }
    } catch (err) {
      console.warn('⚠️ Error checking invoice status:', err.message);
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Middleware Order & Payment Test</title>
        <meta name="description" content="Complete order and payment flow test via middleware" />
      </Head>

      <h1>🛒 Complete Order & Payment Test</h1>
      <p>Test kompletního procesu objednávky a platby přes middleware na portu 3005</p>

      <div style={styles.infoBox}>
        <h3 style={{ margin: '0 0 10px 0', color: '#383d41' }}>ℹ️ Test Flow</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#383d41' }}>
          <li><strong>Create Order</strong> - Creates order via middleware → HostBill</li>
          <li><strong>Initialize Payment</strong> - Sets up payment gateway (PayU, Comgate, etc.)</li>
          <li><strong>Simulate Callback</strong> - Simulates successful payment callback</li>
          <li><strong>Check Status</strong> - Verifies invoice payment status</li>
        </ol>
      </div>

      {/* Form */}
      <div style={styles.formContainer}>
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>📝 Order Data</h3>

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>
              First Name:
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>
              Last Name:
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>
              Email:
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Product ID:
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            >
              <option value="1">1 - VPS Basic (299 CZK)</option>
              <option value="2">2 - VPS Pro (499 CZK)</option>
              <option value="3">3 - VPS Premium (899 CZK)</option>
              <option value="4">4 - VPS Enterprise (1299 CZK)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Price (CZK):
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Affiliate ID:
            </label>
            <input
              type="text"
              value={formData.affiliateId}
              onChange={(e) => handleInputChange('affiliateId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment Method:
            </label>
            {paymentMethodsLoading ? (
              <div style={{ padding: '8px 12px', color: '#6c757d' }}>
                ⏳ Loading payment methods...
              </div>
            ) : (
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                {paymentMethods.map((method) => (
                  <option key={method.id || method.method} value={method.method}>
                    {method.icon} {method.name} ({method.method})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={createTestOrder}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : styles.buttonPrimary),
              marginRight: '10px'
            }}
          >
            {loading ? '⏳ Creating Order...' : '🚀 Create Test Order'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            ✅ Order Created via Middleware
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Source:</strong> {result.source} |
            <strong> Middleware URL:</strong> {result.middleware_url} |
            <strong> Processing ID:</strong> {result.processingId}
            {result.orders && result.orders.length > 0 && result.orders[0].orderNumber && (
              <span> | <strong> Order Number:</strong> {result.orders[0].orderNumber}</span>
            )}
            {typeof result.affiliateAssigned !== 'undefined' && (
              <span> | <strong> Affiliate Assigned:</strong> {result.affiliateAssigned ? '✅ Yes' : '❌ No'}</span>
            )}
          </div>

          {result.clientId && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>👤 Client</h4>
              <div><strong>ID:</strong> {result.clientId}</div>
              <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>Company:</strong> {formData.company || 'N/A'}</div>
            </div>
          )}

          {result.affiliate && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>👥 Affiliate</h4>
              <div><strong>ID:</strong> {result.affiliate.id}</div>
              <div><strong>Name:</strong> {result.affiliate.name}</div>
              <div><strong>Status:</strong> {result.affiliate.status}</div>
            </div>
          )}

          {result.orders && result.orders.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🛒 Orders ({result.orders.length})</h4>
              {result.orders.map((order, index) => (
                <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e9ecef' }}>
                  <div><strong>Order ID:</strong> {order.orderId}</div>
                  {order.orderNumber && (
                    <div><strong>Order Number:</strong> {order.orderNumber}</div>
                  )}
                  <div><strong>Invoice ID:</strong> {order.invoiceId || 'N/A'}</div>
                  <div><strong>Product:</strong> {order.product || order.productName}</div>
                  <div><strong>Price:</strong> {order.priceFormatted || `${order.price} ${order.currency}`}</div>
                  <div><strong>Status:</strong> {order.status}</div>
                </div>
              ))}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              padding: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Warnings</h4>
              {result.errors.map((error, index) => (
                <div key={index} style={{ color: '#856404' }}>{error}</div>
              ))}
            </div>
          )}

          {/* Test Payment Button */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={processTestPayment}
              disabled={paymentLoading || !result || !result.orders || result.orders.length === 0}
              style={{
                ...styles.button,
                ...(paymentLoading ? styles.buttonDisabled :
                   (!result || !result.orders || result.orders.length === 0) ?
                   { backgroundColor: '#dc3545' } : styles.buttonSecondary),
                marginRight: '10px'
              }}
            >
              {paymentLoading ? '⏳ Processing Payment...' : '💳 Initialize Payment'}
            </button>

            {paymentResult && (
              <>
                <button
                  onClick={simulatePaymentCallback}
                  disabled={paymentLoading}
                  style={{
                    ...styles.button,
                    ...(paymentLoading ? styles.buttonDisabled : { backgroundColor: '#ffc107', color: '#212529' }),
                    marginRight: '10px'
                  }}
                >
                  {paymentLoading ? '⏳ Simulating...' : `🔄 Simulate ${formData.paymentMethod?.toUpperCase() || 'Payment'} Callback`}
                </button>

                <button
                  onClick={() => checkInvoiceStatus(result.orders[0].invoiceId || result.orders[0].orderId)}
                  disabled={paymentLoading}
                  style={{
                    ...styles.button,
                    ...(paymentLoading ? styles.buttonDisabled : { backgroundColor: '#17a2b8' })
                  }}
                >
                  🔍 Check Invoice Status
                </button>
              </>
            )}

            {(!result || !result.orders || result.orders.length === 0) && (
              <div style={{ marginTop: '8px', color: '#dc3545', fontSize: '14px' }}>
                Create an order first to enable payment processing
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Results Display */}
      {paymentResult && (
        <div style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>
            💳 Payment Processed via Middleware
          </h3>

          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#0c5460' }}>
            <strong>Source:</strong> {paymentResult.source} |
            <strong> Timestamp:</strong> {new Date(paymentResult.timestamp).toLocaleString()}
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '1px solid #bee5eb',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>💰 Payment Details</h4>
            <div><strong>Payment ID:</strong> {paymentResult.paymentId}</div>
            <div><strong>Method:</strong> {paymentResult.method}</div>
            <div><strong>Amount:</strong> {paymentResult.amount} {paymentResult.currency}</div>
            <div><strong>Status:</strong> {paymentResult.status}</div>
            {paymentResult.redirectRequired && (
              <div style={{ marginTop: '10px' }}>
                <strong>Redirect Required:</strong> Yes
                <br />
                <strong>Payment URL:</strong>
                <a href={paymentResult.paymentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', marginLeft: '5px' }}>
                  {paymentResult.paymentUrl}
                </a>
              </div>
            )}
          </div>

          {paymentResult.instructions && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              padding: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📋 Payment Instructions</h4>
              <div style={{ color: '#856404' }}>{paymentResult.instructions}</div>
            </div>
          )}
        </div>
      )}

      {/* Payment Status Display */}
      {paymentStatus && (
        <div style={styles.paymentBox}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>
            🔄 PayU Callback Status
          </h3>

          <div style={styles.detailBox}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>📤 Callback Details</h4>
            <div><strong>Status:</strong> {paymentStatus.status}</div>
            <div><strong>Message:</strong> {paymentStatus.message}</div>
            <div><strong>Timestamp:</strong> {new Date(paymentStatus.timestamp).toLocaleString()}</div>
            {paymentStatus.data && (
              <div style={{ marginTop: '10px' }}>
                <strong>Callback Data:</strong>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(paymentStatus.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Status Display */}
      {invoiceStatus && (
        <div style={styles.successBox}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            📋 Invoice Status
          </h3>

          <div style={styles.detailBox}>
            <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>💰 Payment Status</h4>
            <div><strong>Invoice ID:</strong> {invoiceStatus.invoiceId}</div>
            <div><strong>Status:</strong> {invoiceStatus.status}</div>
            <div><strong>Amount:</strong> {invoiceStatus.amount} {invoiceStatus.currency}</div>
            <div><strong>Date Paid:</strong> {invoiceStatus.datePaid || 'Not paid'}</div>
            {invoiceStatus.paymentMethod && (
              <div><strong>Payment Method:</strong> {invoiceStatus.paymentMethod}</div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div style={styles.infoBox}>
        <h3 style={{ margin: '0 0 10px 0', color: '#383d41' }}>ℹ️ Complete Payment Flow Information</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#383d41' }}>
          <li><strong>Step 1:</strong> Create order via middleware → HostBill (real order creation)</li>
          <li><strong>Step 2:</strong> Initialize payment (PayU, Comgate, etc.) → generates payment URL</li>
          <li><strong>Step 3:</strong> Simulate payment callback → mimics successful payment</li>
          <li><strong>Step 4:</strong> Check invoice status → verifies payment completion</li>
          <li>Middleware server must be running on port 3005</li>
          <li>Payment methods are loaded dynamically from middleware</li>
          <li>Order includes affiliate assignment and commission tracking</li>
          <li>All operations use real HostBill API calls</li>
        </ul>
      </div>
    </div>
  );
}
