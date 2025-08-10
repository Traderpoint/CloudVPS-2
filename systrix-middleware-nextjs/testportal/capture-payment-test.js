import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function CapturePaymentTest() {
  const [formData, setFormData] = useState({
    orderId: '426',
    invoiceId: '446',
    transactionId: '',
    amount: '100',
    currency: 'CZK',
    paymentMethod: 'comgate',
    notes: '',
    skipAuthorize: true
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Generate default transaction ID
    setFormData(prev => ({
      ...prev,
      transactionId: `CAPTURE-TEST-${Date.now()}`,
      notes: `Capture payment test - ${new Date().toLocaleString()}`
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCapturePayment = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('💰 Starting capture payment test...', formData);

      // Call middleware on port 3005, not CloudVPS API
      const middlewareUrl = 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/payments/authorize-capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          invoiceId: formData.invoiceId,
          transactionId: formData.transactionId,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          skipAuthorize: formData.skipAuthorize
        })
      });

      const data = await response.json();

      console.log('📥 Capture payment response:', data);

      setResult({
        success: data.success,
        data: data,
        timestamp: new Date().toLocaleString()
      });

    } catch (err) {
      console.error('❌ Capture payment error:', err);
      setResult({
        success: false,
        error: err.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestInvoiceStatus = async () => {
    setLoading(true);

    try {
      console.log('🔍 Checking invoice status...', formData.invoiceId);

      // Call middleware on port 3005, not CloudVPS API
      const middlewareUrl = 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/invoices/${formData.invoiceId}/status`);
      const data = await response.json();

      console.log('📊 Invoice status response:', data);

      setResult({
        success: data.success !== false,
        data: data,
        timestamp: new Date().toLocaleString(),
        type: 'invoice_status'
      });

    } catch (err) {
      console.error('❌ Invoice status error:', err);
      setResult({
        success: false,
        error: err.message,
        timestamp: new Date().toLocaleString(),
        type: 'invoice_status'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewTransactionId = () => {
    const newId = `CAPTURE-TEST-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      transactionId: newId
    }));
  };

  // Inline styles
  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    form: {
      backgroundColor: '#fff',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '14px'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      marginRight: '10px'
    },
    buttonSuccess: {
      backgroundColor: '#28a745'
    },
    buttonWarning: {
      backgroundColor: '#ffc107',
      color: '#212529'
    },
    result: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '20px'
    },
    success: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      color: '#155724'
    },
    error: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      color: '#721c24'
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Capture Payment Test - CloudVPS</title>
      </Head>

      <div style={styles.header}>
        <h1>Capture Payment Test</h1>
        <p>Test capture payment functionality using the new authorize-capture endpoint</p>
      </div>

      <div style={styles.form}>
        <h3>Capture Payment Parameters</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Order ID:</label>
          <input
            style={styles.input}
            type="text"
            name="orderId"
            value={formData.orderId}
            onChange={handleInputChange}
            placeholder="Enter order ID"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Invoice ID:</label>
          <input
            style={styles.input}
            type="text"
            name="invoiceId"
            value={formData.invoiceId}
            onChange={handleInputChange}
            placeholder="Enter invoice ID"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Transaction ID:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              type="text"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleInputChange}
              placeholder="Enter transaction ID"
            />
            <button
              style={{ ...styles.button, ...styles.buttonWarning }}
              onClick={generateNewTransactionId}
              type="button"
            >
              Generate New
            </button>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Amount:</label>
          <input
            style={styles.input}
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            step="0.01"
            min="0"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Payment Method:</label>
          <select
            style={styles.input}
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
          >
            <option value="comgate">ComGate</option>
            <option value="payu">PayU</option>
            <option value="banktransfer">Bank Transfer</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Notes:</label>
          <textarea
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Enter payment notes"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              name="skipAuthorize"
              checked={formData.skipAuthorize}
              onChange={handleInputChange}
            />
            Skip Authorize (Capture Only)
          </label>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            style={{
              ...styles.button,
              ...styles.buttonSuccess,
              ...(loading ? { backgroundColor: '#6c757d', cursor: 'not-allowed' } : {})
            }}
            onClick={handleCapturePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : '💰 Capture Payment'}
          </button>

          <button
            style={{
              ...styles.button,
              ...(loading ? { backgroundColor: '#6c757d', cursor: 'not-allowed' } : {})
            }}
            onClick={handleTestInvoiceStatus}
            disabled={loading}
          >
            {loading ? 'Checking...' : '🔍 Check Invoice Status'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{
          ...styles.result,
          ...(result.success ? styles.success : styles.error)
        }}>
          <h3>
            {result.type === 'invoice_status' ? 'Invoice Status Result' : 'Capture Payment Result'}
            {result.success ? ' ✅' : ' ❌'}
          </h3>
          <p><strong>Timestamp:</strong> {result.timestamp}</p>

          {result.success ? (
            <div>
              <p><strong>Status:</strong> Success</p>

              {result.data.message && (
                <p><strong>Message:</strong> {result.data.message}</p>
              )}

              {result.data.transactionId && (
                <p><strong>Transaction ID:</strong> {result.data.transactionId}</p>
              )}

              {result.data.workflow && (
                <div>
                  <p><strong>Workflow Status:</strong></p>
                  <ul>
                    <li>Authorize Payment: {result.data.workflow.authorizePayment}</li>
                    <li>Capture Payment: {result.data.workflow.capturePayment}</li>
                    <li>Provision: {result.data.workflow.provision}</li>
                  </ul>
                </div>
              )}

              {result.data.nextSteps && (
                <div>
                  <p><strong>Next Steps:</strong></p>
                  <ul>
                    {result.data.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  View Full Response
                </summary>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  padding: '10px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <p><strong>Status:</strong> Failed</p>
              <p><strong>Error:</strong> {result.error || result.data?.error || result.data?.message}</p>

              {result.data && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    View Full Error Response
                  </summary>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    padding: '10px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Enter the Order ID and Invoice ID you want to test</li>
          <li>Optionally modify the transaction ID (or generate a new one)</li>
          <li>Set the amount and payment method</li>
          <li>Choose whether to skip authorization (capture only) or run full workflow</li>
          <li>Click "Capture Payment" to test the payment capture</li>
          <li>Use "Check Invoice Status" to verify the invoice status before/after capture</li>
        </ol>

        <h4>Test Scenarios:</h4>
        <ul>
          <li><strong>Capture Only:</strong> Check "Skip Authorize" to test only payment capture</li>
          <li><strong>Full Workflow:</strong> Uncheck "Skip Authorize" to test authorize + capture + provision</li>
          <li><strong>Gateway Bypass:</strong> The system automatically bypasses gateway issues using direct API calls</li>
        </ul>

        <p><strong>URL:</strong> <a href="http://localhost:3000/capture-payment-test" target="_blank">http://localhost:3000/capture-payment-test</a></p>
      </div>
    </div>
  );
}
