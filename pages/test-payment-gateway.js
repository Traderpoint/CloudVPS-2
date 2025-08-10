import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function TestPaymentGateway() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    paymentId: 'TEST-LOADING',
    orderId: 'ORDER-LOADING',
    invoiceId: '456',
    method: 'comgate',
    amount: 1000,
    currency: 'CZK',
    successUrl: 'http://localhost:3000/order-confirmation',
    cancelUrl: 'http://localhost:3000/payment'
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [methodsSource, setMethodsSource] = useState('loading');

  // Initialize IDs and load payment methods on component mount (client-side only)
  useEffect(() => {
    // Generate IDs only on client to avoid hydration mismatch
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      paymentId: `TEST-${timestamp}`,
      orderId: `ORDER-${timestamp}`
    }));

    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading payment methods...');

      // Try multiple sources for payment methods (prioritize middleware-payment-modules)
      const sources = [
        { url: '/api/middleware-payment-modules', name: 'Middleware Payment Modules' },
        { url: '/api/payments/methods', name: 'Enhanced API' },
        { url: '/api/payments/direct-methods', name: 'Direct HostBill' },
        { url: '/api/middleware/payment-methods-test', name: 'Middleware Fallback' }
      ];

      let methodsLoaded = false;

      for (const source of sources) {
        try {
          console.log(`🔍 Trying ${source.name}: ${source.url}`);
          const response = await fetch(source.url);
          const data = await response.json();

          if (data.success && data.methods && data.methods.length > 0) {
            console.log(`✅ Loaded ${data.methods.length} methods from ${source.name}`);

            // Normalize method data
            const normalizedMethods = data.methods.map(method => ({
              id: method.id || method.method || method.hostbillId,
              name: method.name,
              icon: method.icon || getDefaultIcon(method.id || method.method),
              enabled: method.enabled !== false,
              type: method.type,
              description: method.description,
              source: source.name
            }));

            setPaymentMethods(normalizedMethods);
            setMethodsSource(source.name + (data.fallback ? ' (fallback)' : ''));

            // Set ComGate as default if available, otherwise first enabled method
            const comgateMethod = normalizedMethods.find(m => m.enabled && (m.id === 'comgate' || m.id === 'ComGate'));
            const firstEnabled = normalizedMethods.find(m => m.enabled);
            const defaultMethod = comgateMethod || firstEnabled;

            if (defaultMethod && (formData.method === 'comgate' || formData.method === 'card')) {
              setFormData(prev => ({ ...prev, method: defaultMethod.id }));
            }

            methodsLoaded = true;
            break;
          }
        } catch (err) {
          console.warn(`❌ Failed to load from ${source.name}:`, err.message);
        }
      }

      if (!methodsLoaded) {
        throw new Error('All payment method sources failed');
      }

    } catch (err) {
      console.error('❌ Failed to load payment methods:', err);
      setError(err.message);

      // Use fallback methods with ComGate as primary
      const fallbackMethods = [
        { id: 'comgate', name: 'ComGate', icon: '🔷', enabled: true, source: 'fallback', description: 'Výchozí platební brána' },
        { id: 'card', name: 'Platební karta', icon: '💳', enabled: true, source: 'fallback' },
        { id: 'paypal', name: 'PayPal', icon: '🅿️', enabled: true, source: 'fallback' },
        { id: 'banktransfer', name: 'Bankovní převod', icon: '🏦', enabled: true, source: 'fallback' },
        { id: 'payu', name: 'PayU', icon: '💰', enabled: true, source: 'fallback' },
        { id: 'crypto', name: 'Kryptoměny', icon: '₿', enabled: true, source: 'fallback' }
      ];

      setPaymentMethods(fallbackMethods);
      setMethodsSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultIcon = (methodId) => {
    const icons = {
      comgate: '🔷',
      'ComGate': '🔷',
      card: '💳',
      paypal: '🅿️',
      banktransfer: '🏦',
      crypto: '₿',
      payu: '💰'
    };
    return icons[methodId] || icons[methodId?.toLowerCase()] || '💰';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openTestGateway = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initializing real payment gateway...', {
        orderId: formData.orderId,
        invoiceId: formData.invoiceId,
        method: formData.method,
        amount: formData.amount,
        currency: formData.currency
      });

      // Call real payment initialization API
      const response = await fetch('/api/middleware/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          invoiceId: formData.invoiceId,
          method: formData.method,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          customerData: {
            email: 'test@example.com',
            name: 'Test Customer'
          },
          testFlow: true, // Mark as test but use real payment gateway
          returnUrl: formData.successUrl,
          cancelUrl: formData.cancelUrl
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Payment gateway initialized successfully:', result);

        if (result.paymentUrl) {
          // Open real payment gateway URL
          console.log('🔗 Opening payment gateway:', result.paymentUrl);
          window.open(result.paymentUrl, '_blank');
        } else {
          console.error('❌ No payment URL received from gateway');
          alert('No payment URL received from gateway. Please try a different payment method.');
        }
      } else {
        console.error('❌ Payment initialization failed:', result.error);
        alert(`Payment initialization failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error initializing payment:', error);
      alert(`Error initializing payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateNewIds = () => {
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      paymentId: `TEST-${timestamp}`,
      orderId: `ORDER-${timestamp}`
    }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>Real Payment Gateway - Cloud VPS</title>
      </Head>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/test-portal')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          ← Back to Test Portal
        </button>
      </div>

      <h1>💳 Real Payment Gateway</h1>
      <p>Přímý přístup k reálným platebním bránám pro zpracování plateb</p>

      {/* Payment Methods Status */}
      <div style={{
        backgroundColor: loading ? '#fff3cd' : error ? '#f8d7da' : '#d4edda',
        border: `1px solid ${loading ? '#ffeaa7' : error ? '#f5c6cb' : '#c3e6cb'}`,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: loading ? '#856404' : error ? '#721c24' : '#155724' }}>
          {loading ? '⏳ Loading Payment Methods...' :
           error ? '❌ Payment Methods Error' :
           `✅ Payment Methods Loaded (${paymentMethods.length})`}
        </h4>
        {loading && (
          <p style={{ margin: 0, color: '#856404' }}>Načítání dostupných platebních metod...</p>
        )}
        {error && (
          <div style={{ color: '#721c24' }}>
            <p style={{ margin: '0 0 10px 0' }}>Chyba při načítání: {error}</p>
            <button
              onClick={loadPaymentMethods}
              style={{
                padding: '5px 10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔄 Zkusit znovu
            </button>
          </div>
        )}
        {!loading && !error && (
          <div style={{ color: '#155724' }}>
            <p style={{ margin: '0 0 5px 0' }}>
              Zdroj: <strong>{methodsSource}</strong> |
              Dostupné metody: <strong>{paymentMethods.filter(m => m.enabled).length}</strong>
            </p>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {paymentMethods.map(method =>
                `${method.icon} ${method.name}${method.enabled ? '' : ' (disabled)'}`
              ).join(' • ')}
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>ℹ️ Informace:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li><strong>Reálné platební brány:</strong> Tlačítko otevře skutečnou platební bránu (ComGate, PayPal, atd.)</li>
          <li><strong>Test režim:</strong> Platby jsou označeny jako testovací, ale používají reálné API</li>
          <li><strong>Automatické přesměrování:</strong> Po dokončení platby budete přesměrováni zpět</li>
          <li><strong>Podporované metody:</strong> ComGate (priorita), PayPal, PayU, Stripe</li>
          <li><strong>Pouze reálné brány:</strong> Žádné simulace - pouze skutečné platební procesory</li>
        </ul>
      </div>

      {/* Configuration Form */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>💳 Payment Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment ID:
            </label>
            <input
              type="text"
              value={formData.paymentId}
              onChange={(e) => handleInputChange('paymentId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Order ID:
            </label>
            <input
              type="text"
              value={formData.orderId}
              onChange={(e) => handleInputChange('orderId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Invoice ID:
            </label>
            <input
              type="text"
              value={formData.invoiceId}
              onChange={(e) => handleInputChange('invoiceId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment Method:
            </label>
            <select
              value={formData.method}
              onChange={(e) => handleInputChange('method', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              disabled={loading}
            >
              {loading ? (
                <option value="">Loading methods...</option>
              ) : paymentMethods.length === 0 ? (
                <option value="">No methods available</option>
              ) : (
                paymentMethods
                  .filter(method => method.enabled)
                  .map(method => (
                    <option key={method.id} value={method.id}>
                      {method.icon} {method.name}
                      {method.description ? ` - ${method.description}` : ''}
                    </option>
                  ))
              )}
            </select>
            {!loading && paymentMethods.length > 0 && (
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                Zdroj: {methodsSource} | Celkem metod: {paymentMethods.length}
                ({paymentMethods.filter(m => m.enabled).length} aktivních)
              </div>
            )}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Amount:
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Currency:
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Redirect URLs:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Success URL:
              </label>
              <input
                type="text"
                value={formData.successUrl}
                onChange={(e) => handleInputChange('successUrl', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Cancel URL:
              </label>
              <input
                type="text"
                value={formData.cancelUrl}
                onChange={(e) => handleInputChange('cancelUrl', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={generateNewIds}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#6c757d80' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          🔄 Generate New IDs
        </button>

        <button
          onClick={loadPaymentMethods}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#17a2b880' : '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Loading...' : '🔄 Reload Payment Methods'}
        </button>

        <button
          onClick={openTestGateway}
          disabled={loading || paymentMethods.length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: (loading || paymentMethods.length === 0) ? '#28a74580' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || paymentMethods.length === 0) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Initializing...' : '💳 Open Payment Gateway'}
        </button>
      </div>

      {/* URL Preview */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🔗 Generated URL:</h4>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          wordBreak: 'break-all',
          color: '#495057'
        }}>
          {`http://localhost:3005/test-payment?${new URLSearchParams({
            paymentId: formData.paymentId,
            orderId: formData.orderId,
            invoiceId: formData.invoiceId,
            method: formData.method,
            amount: formData.amount,
            currency: formData.currency,
            successUrl: encodeURIComponent(formData.successUrl),
            cancelUrl: encodeURIComponent(formData.cancelUrl),
            testMode: 'true'
          }).toString()}`}
        </div>
      </div>
    </div>
  );
}
