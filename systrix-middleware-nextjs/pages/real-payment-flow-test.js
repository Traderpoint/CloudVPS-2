import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function RealPaymentFlowTestSimple() {
  const [step, setStep] = useState(1); // Max 3 steps: 1. Create Order, 2. Initialize Payment, 3. Complete Real Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [captureStatus, setCaptureStatus] = useState(null);
  const [finalStatus, setFinalStatus] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  const [formData, setFormData] = useState({
    firstName: 'Real',
    lastName: 'Payment',
    email: 'real.payment@test.cz',
    phone: '+420123456789',
    address: 'Test Address 123',
    city: 'Praha',
    postalCode: '12000',
    country: 'CZ',
    company: 'Real Payment s.r.o.',
    productId: '1',
    productName: 'VPS Basic',
    price: 604,
    cycle: 'm',
    paymentMethod: 'comgate'
  });

  // Load payment methods on component mount and check for payment return
  useEffect(() => {
    loadPaymentMethods();

    // Check if returning from real payment gateway
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const invoiceId = urlParams.get('invoiceId');
    const orderId = urlParams.get('orderId');
    const transactionId = urlParams.get('transactionId');
    const amount = urlParams.get('amount');
    const paymentMethod = urlParams.get('paymentMethod');

    if (paymentStatus && invoiceId) {
      console.log('🔄 Detected return from REAL payment gateway:', {
        paymentStatus, invoiceId, orderId, transactionId, amount, paymentMethod
      });

      const autoProcessed = urlParams.get('autoProcessed');
      const captureStatus = urlParams.get('captureStatus');
      const currentStatus = urlParams.get('currentStatus');

      // Set up the order data from URL params
      setResult({
        success: true,
        orders: [{
          orderId: orderId || `ORDER-${invoiceId}`,
          invoiceId: invoiceId,
          price: parseFloat(amount) || 604
        }]
      });

      setFormData(prev => ({
        ...prev,
        paymentMethod: paymentMethod || 'comgate',
        price: parseFloat(amount) || 604
      }));

      // Set payment result
      setPaymentResult({
        success: true,
        paymentUrl: null,
        transactionId: transactionId,
        status: paymentStatus
      });

      if (paymentStatus === 'success') {
        console.log('✅ Payment was successful, checking if auto-processed...');

        if (autoProcessed === 'true') {
          console.log('🎉 Payment was auto-processed by return handler');
          console.log('📋 Moving to step 3 immediately');

          setCaptureStatus({
            success: true,
            autoProcessed: true,
            message: '🎉 Payment was automatically processed by return handler',
            timestamp: new Date().toISOString()
          });

          // Move to step 3 immediately
          setStep(3);

          // Check final status after shorter delay
          console.log('⏱️ Checking final status in 1 second...');
          setTimeout(async () => {
            try {
              console.log('🔍 Fetching invoice status from middleware...');
              const statusResponse = await fetch(`http://localhost:3005/api/invoices/${invoiceId}/status`);
              const statusResult = await statusResponse.json();

              console.log('📊 Invoice status result:', statusResult);

              if (statusResult.success && statusResult.isPaid) {
                console.log('✅ Auto-processed payment: Invoice is PAID');
                setFinalStatus({
                  success: true,
                  isPaid: true,
                  status: statusResult.status,
                  message: '✅ Invoice is marked as PAID after auto-processing',
                  timestamp: new Date().toISOString()
                });
              } else {
                console.log('⚠️ Auto-processed payment: Invoice status unclear');
                setFinalStatus({
                  success: false,
                  isPaid: false,
                  status: statusResult.status || 'Unknown',
                  message: '⚠️ Payment processed but invoice status unclear',
                  timestamp: new Date().toISOString()
                });
              }
            } catch (error) {
              console.error('❌ Error checking final status:', error);
              setFinalStatus({
                success: false,
                isPaid: false,
                status: 'Error',
                message: `❌ Error checking status: ${error.message}`,
                timestamp: new Date().toISOString()
              });
            }
          }, 1000); // Zkráceno z 2000 na 1000ms

        } else {
          console.log('💰 Payment successful but needs manual capture');
          setStep(3); // Move to capture step

          // Check final status after a delay
          setTimeout(async () => {
            try {
              const statusResponse = await fetch(`http://localhost:3005/api/invoices/${invoiceId}/status`);
              const statusResult = await statusResponse.json();

              if (statusResult.success) {
                setFinalStatus({
                  success: true,
                  isPaid: statusResult.isPaid,
                  status: statusResult.status,
                  message: statusResult.isPaid ?
                    '✅ Invoice is marked as PAID' :
                    '⏳ Invoice is not yet marked as PAID',
                  timestamp: new Date().toISOString()
                });
              }
            } catch (error) {
              console.error('❌ Error checking final status:', error);
            }
          }, 1000);
        }
      } else if (paymentStatus === 'cancelled') {
        console.log('❌ Payment was cancelled');
        setError('Payment was cancelled by user');
      } else if (paymentStatus === 'pending') {
        console.log('⏳ Payment is pending');
        setError('Payment is pending - please wait for confirmation');
      }

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      console.log('🔍 Loading payment methods from middleware...');

      const response = await fetch('http://localhost:3005/api/payment-modules');
      const data = await response.json();

      if (data.success && data.modules) {
        setPaymentMethods(data.modules);
        console.log('✅ Payment methods loaded:', data.modules);

        // Set Comgate as default if available
        if (data.modules.length > 0) {
          const comgateMethod = data.modules.find(m => m.method === 'comgate');
          const defaultMethod = comgateMethod ? comgateMethod.method : data.modules[0].method;
          setFormData(prev => ({ ...prev, paymentMethod: defaultMethod }));
          console.log('🎯 Default payment method set:', defaultMethod);
        }
      } else {
        console.error('❌ Failed to load payment methods:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleInputChange = (field, value) => {
    let updates = { [field]: value };

    // Auto-update product name and price based on product ID
    if (field === 'productId') {
      const productMap = {
        '1': { name: 'VPS Basic', price: 299 },
        '2': { name: 'VPS Pro', price: 599 },
        '3': { name: 'VPS Expert', price: 999 },
        '4': { name: 'VPS Enterprise', price: 1899 }
      };

      const product = productMap[value];
      if (product) {
        updates.productName = product.name;
        updates.price = product.price;
      }
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🚀 Creating order for real payment flow...');

      const response = await fetch('http://localhost:3005/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
              productId: formData.productId,
              name: formData.productName,
              price: parseFloat(formData.price),
              cycle: formData.cycle,
              quantity: 1,
              configOptions: {
                cpu: '2 vCPU',
                ram: '4GB',
                storage: '50GB'
              }
            }
          ],
          affiliate: null,
          paymentMethod: formData.paymentMethod,
          newsletterSubscribe: false,
          type: 'complete'
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        setStep(2);
        console.log('✅ Order created successfully:', data.orders[0]);
      } else {
        setError(data.error || 'Order creation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = async () => {
    if (!result?.orders?.[0]) return;

    setLoading(true);
    setError(null);

    try {
      const order = result.orders[0];

      const response = await fetch('http://localhost:3005/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          invoiceId: order.invoiceId,
          method: formData.paymentMethod,
          amount: formData.price,
          currency: 'CZK',
          testFlow: false, // This is for REAL payment
          // Custom return URL to come back to this test page
          returnUrl: `${window.location.origin}/real-payment-flow-test?status=success&invoiceId=${order.invoiceId}&orderId=${order.orderId}&amount=${formData.price}&paymentMethod=${formData.paymentMethod}`,
          cancelUrl: `${window.location.origin}/real-payment-flow-test?status=cancelled&invoiceId=${order.invoiceId}&orderId=${order.orderId}&amount=${formData.price}&paymentMethod=${formData.paymentMethod}`,
          pendingUrl: `${window.location.origin}/real-payment-flow-test?status=pending&invoiceId=${order.invoiceId}&orderId=${order.orderId}&amount=${formData.price}&paymentMethod=${formData.paymentMethod}`
        })
      });

      const data = await response.json();
      if (data.success) {
        setPaymentResult(data);
        console.log('✅ Payment initialized for real flow:', data);

        // If payment URL is available, AUTOMATICALLY redirect to real payment gateway
        if (data.paymentUrl && data.redirectRequired) {
          console.log('🚀 AUTOMATICALLY redirecting to REAL payment gateway:', data.paymentUrl);

          const selectedMethod = paymentMethods.find(m => m.method === formData.paymentMethod);
          const methodName = selectedMethod?.name || formData.paymentMethod.toUpperCase();

          // Show confirmation before redirect
          const confirmRedirect = confirm(
            `Redirect to REAL ${methodName} payment gateway?\n\n` +
            `⚠️ WARNING: This is a REAL payment - you will be charged!\n\n` +
            `Transaction ID: ${data.transactionId}\n` +
            `Amount: ${formData.price} CZK\n` +
            `Method: ${methodName}\n\n` +
            `After completing payment, you will automatically return to this page.\n` +
            `The page will then show the payment status and allow you to capture the payment.\n\n` +
            `Continue with REAL payment?`
          );

          if (confirmRedirect) {
            console.log('✅ User confirmed - redirecting to REAL payment gateway');
            window.location.href = data.paymentUrl;
            return; // Don't continue with test flow
          } else {
            setStep(3); // Stay on test page
          }
        } else {
          setStep(3);
        }
      } else {
        setError(data.error || 'Payment initialization failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    },
    header: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto 20px auto'
    },
    section: {
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      maxWidth: '800px',
      margin: '0 auto 20px auto'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'all 0.2s'
    },
    buttonPrimary: {
      backgroundColor: '#007bff',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#6c757d',
      color: 'white',
      cursor: 'not-allowed'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '10px'
    },
    select: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '10px'
    },
    errorBox: {
      backgroundColor: '#f8d7da',
      border: '1px solid #dc3545',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      color: '#721c24'
    },
    successBox: {
      backgroundColor: '#d4edda',
      border: '2px solid #28a745',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Real Payment Flow Test - HostBill Integration</title>
      </Head>

      <div style={styles.header}>
        <h1 style={{ margin: '0 0 10px 0' }}>💳 Real Payment Flow Test</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Test kompletního flow s reálnou platební bránou a Capture Payment
        </p>
      </div>

      {/* Progress Steps */}
      <div style={styles.section}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>📋 Progress</h2>
        <div>
          <span style={{ color: step >= 1 ? '#28a745' : '#6c757d' }}>
            {step >= 1 ? '✅' : '⏳'} 1. Create Order
          </span>
          {' → '}
          <span style={{ color: step >= 2 ? '#28a745' : '#6c757d' }}>
            {step >= 2 ? '✅' : '⏳'} 2. Initialize Real Payment & Auto Capture
          </span>
          {' → '}
          <span style={{ color: step >= 3 ? '#28a745' : '#6c757d' }}>
            {step >= 3 ? '✅' : '⏳'} 3. Complete Real Payment
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <h4 style={{ margin: '0 0 10px 0' }}>❌ Error</h4>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Step 1: Create Order */}
      {step === 1 && (
        <div style={styles.section}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>
            🛒 Krok 1: Vytvoření objednávky
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Jméno:</label>
              <input
                style={styles.input}
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Příjmení:</label>
              <input
                style={styles.input}
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input
              style={styles.input}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Produkt:</label>
              <select
                style={styles.select}
                value={formData.productId}
                onChange={(e) => handleInputChange('productId', e.target.value)}
              >
                <option value="1">VPS Basic - 299 CZK</option>
                <option value="2">VPS Pro - 599 CZK</option>
                <option value="3">VPS Expert - 999 CZK</option>
                <option value="4">VPS Enterprise - 1899 CZK</option>
              </select>

              <select
                style={styles.select}
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                disabled={loadingMethods}
              >
                {loadingMethods ? (
                  <option>Loading payment methods...</option>
                ) : (
                  paymentMethods.map(method => (
                    <option key={method.method} value={method.method}>
                      {method.name} ({method.method})
                    </option>
                  ))
                )}
              </select>

              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                marginTop: '10px'
              }}>
                <strong>Cena:</strong> {formData.price} CZK<br/>
                <strong>Platební metoda:</strong> {paymentMethods.find(m => m.method === formData.paymentMethod)?.name || formData.paymentMethod}
              </div>
            </div>
          </div>

          <button
            onClick={createOrder}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : styles.buttonPrimary),
              marginTop: '20px'
            }}
          >
            {loading ? '⏳ Creating Order...' : '🚀 1. Create Order'}
          </button>
        </div>
      )}

      {/* Step 2: Initialize Payment */}
      {step === 2 && result && (
        <div style={styles.section}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>
            💳 Krok 2: Inicializace reálné platby
          </h2>

          <div style={styles.successBox}>
            <h3 style={{ color: '#155724', margin: '0 0 15px 0' }}>✅ Objednávka vytvořena</h3>
            <div style={{ fontSize: '14px' }}>
              <div><strong>Order ID:</strong> {result.orders[0].orderId}</div>
              <div><strong>Invoice ID:</strong> {result.orders[0].invoiceId}</div>
              <div><strong>Amount:</strong> {formData.price} CZK</div>
              <div><strong>Payment Method:</strong> {paymentMethods.find(m => m.method === formData.paymentMethod)?.name}</div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>⚠️ Reálná platba</h4>
            <p style={{ margin: 0, color: '#856404' }}>
              Toto inicializuje REÁLNOU platbu přes {paymentMethods.find(m => m.method === formData.paymentMethod)?.name} bránu.
              Po inicializaci budete přesměrováni na platební bránu pro dokončení platby.
            </p>
          </div>

          <button
            onClick={initializePayment}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : styles.buttonPrimary)
            }}
          >
            {loading ? '⏳ Initializing...' : '🚀 2. Initialize REAL Payment'}
          </button>
        </div>
      )}
    </div>
  );
}
