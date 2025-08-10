import { useState, useEffect } from 'react';
import Head from 'next/head';

// Inline styles to avoid CSP issues
const styles = {
  container: {
    padding: '15px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1600px',
    margin: '0 auto',
    fontSize: '13px'
  },
  header: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  title: {
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#666',
    fontSize: '14px'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px'
  },
  ordersContainer: {
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  orderRow: {
    display: 'grid',
    gridTemplateColumns: '60px 100px 150px 120px 80px 80px 120px 180px 200px',
    gap: '8px',
    padding: '12px 8px',
    borderBottom: '1px solid #dee2e6',
    alignItems: 'center',
    fontSize: '12px'
  },
  orderHeader: {
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
    color: '#495057'
  },
  orderData: {
    backgroundColor: '#fff'
  },
  invoiceItem: {
    backgroundColor: '#f8f9fa',
    padding: '4px 6px',
    margin: '1px 0',
    borderRadius: '3px',
    border: '1px solid #dee2e6',
    fontSize: '10px'
  },
  paymentSection: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  select: {
    padding: '4px 6px',
    border: '1px solid #ced4da',
    borderRadius: '3px',
    fontSize: '11px',
    minWidth: '90px',
    maxWidth: '120px'
  },
  button: {
    padding: '4px 8px',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '50px'
  },
  buttonPay: {
    backgroundColor: '#28a745'
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  buttonUpdate: {
    backgroundColor: '#17a2b8'
  },
  statusPaid: {
    color: '#28a745',
    fontWeight: 'bold'
  },
  statusUnpaid: {
    color: '#dc3545',
    fontWeight: 'bold'
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '20px'
  }
};

export default function InvoicePaymentTest() {
  const [orders, setOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState({});

  // Load orders and payment methods on component mount
  useEffect(() => {
    loadData();

    // Check for payment return parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const orderId = urlParams.get('orderId');
    const invoiceId = urlParams.get('invoiceId');
    const transactionId = urlParams.get('transactionId');

    if (paymentStatus && orderId) {
      if (paymentStatus === 'success') {
        alert(`✅ Payment Successful!\n\nOrder: ${orderId}\nInvoice: ${invoiceId || 'N/A'}\nTransaction: ${transactionId || 'N/A'}\n\nInvoice has been marked as PAID.`);
      } else if (paymentStatus === 'cancelled') {
        alert(`❌ Payment Cancelled\n\nOrder: ${orderId}\nPayment was cancelled by user.`);
      } else if (paymentStatus === 'error') {
        alert(`❌ Payment Error\n\nOrder: ${orderId}\nPlease try again or contact support.`);
      }

      // Clean URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load orders and payment methods in parallel
      const [ordersResponse, methodsResponse] = await Promise.all([
        loadOrders(),
        loadPaymentMethods()
      ]);

      if (!ordersResponse.success) {
        throw new Error(ordersResponse.error || 'Failed to load orders');
      }

      if (!methodsResponse.success) {
        console.warn('Failed to load payment methods:', methodsResponse.error);
        // Continue with default payment methods including test methods
        setPaymentMethods([
          { id: 'comgate', name: 'Comgate' },
          { id: 'payu', name: 'PayU' },
          { id: 'manual', name: 'Manual Payment' },
          { id: '0', name: '0 - None/Default' },
          { id: 'banktransfer', name: 'BankTransfer' },
          { id: 'creditcard', name: 'CreditCard' },
          { id: 'null', name: 'null' }
        ]);
      }

    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      console.log('🔍 Loading recent orders via CloudVPS API...');

      const response = await fetch('/api/middleware/recent-orders?limit=10');
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        console.log('✅ Orders loaded:', data.orders?.length || 0);
      }

      return data;
    } catch (err) {
      console.error('❌ Error loading orders:', err);
      return { success: false, error: err.message };
    }
  };

  const loadPaymentMethods = async () => {
    try {
      console.log('🔍 Loading payment methods via CloudVPS API...');

      const response = await fetch('/api/hostbill/payment-modules');
      const data = await response.json();

      let methods = [];

      if (data.success && data.modules) {
        methods = Object.entries(data.modules).map(([id, name]) => ({
          id,
          name
        }));
      }

      // Add additional test payment methods as requested
      const additionalMethods = [
        { id: '0', name: '0 - None/Default' },
        { id: 'banktransfer', name: 'BankTransfer' },
        { id: 'creditcard', name: 'CreditCard' },
        { id: 'null', name: 'null' }
      ];

      // Combine loaded methods with additional test methods
      const allMethods = [...methods, ...additionalMethods];

      // Remove duplicates based on ID
      const uniqueMethods = allMethods.filter((method, index, self) =>
        index === self.findIndex(m => m.id === method.id)
      );

      setPaymentMethods(uniqueMethods);
      console.log('✅ Payment methods loaded (including test methods):', uniqueMethods.length);
      console.log('📋 Available methods:', uniqueMethods.map(m => `${m.id}: ${m.name}`));

      return data;
    } catch (err) {
      console.error('❌ Error loading payment methods:', err);

      // Fallback to test methods only if API fails
      const fallbackMethods = [
        { id: 'comgate', name: 'Comgate' },
        { id: 'payu', name: 'PayU' },
        { id: '0', name: '0 - None/Default' },
        { id: 'banktransfer', name: 'BankTransfer' },
        { id: 'creditcard', name: 'CreditCard' },
        { id: 'null', name: 'null' }
      ];

      setPaymentMethods(fallbackMethods);
      console.log('⚠️ Using fallback payment methods:', fallbackMethods.length);

      return { success: false, error: err.message };
    }
  };

  const handlePayInvoice = async (invoiceId, orderId, amount, paymentMethod) => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    const paymentKey = `${invoiceId}-${orderId}`;
    setPaymentLoading(prev => ({ ...prev, [paymentKey]: true }));

    try {
      console.log('💳 Step 1: Initializing payment gateway for invoice:', {
        invoiceId,
        orderId,
        amount,
        paymentMethod
      });

      // Step 1: Initialize payment with payment gateway
      const initResponse = await fetch('/api/middleware/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          invoiceId,
          method: paymentMethod,
          amount: parseFloat(amount),
          currency: 'CZK',
          customerData: {
            email: 'test@example.com',
            name: 'Test Customer'
          },
          testFlow: true,
          returnUrl: 'http://localhost:3000/invoice-payment-test'
        })
      });

      const initResult = await initResponse.json();

      if (!initResult.success) {
        throw new Error(initResult.error || 'Payment initialization failed');
      }

      console.log('✅ Step 1: Payment gateway initialized:', initResult);

      // Step 2: Handle different payment methods
      if (paymentMethod.toLowerCase() === 'comgate' && initResult.paymentUrl) {
        // For Comgate, redirect to payment gateway
        console.log('🌐 Step 2: Redirecting to Comgate payment gateway...');
        alert(`🌐 Redirecting to Comgate payment gateway...\n\nAfter payment completion, the invoice will be automatically marked as PAID.`);

        // Open payment gateway in new window/tab
        window.open(initResult.paymentUrl, '_blank');

        // For demo purposes, simulate successful payment after a delay
        setTimeout(async () => {
          try {
            console.log('🔄 Step 3: Simulating successful payment return...');
            await simulateSuccessfulPayment(invoiceId, orderId, amount, paymentMethod, initResult.paymentId);
          } catch (simulationError) {
            console.error('❌ Payment simulation error:', simulationError);
          }
        }, 3000); // 3 seconds delay to simulate payment processing

      } else {
        // For other payment methods, directly process payment
        console.log('💰 Step 2: Processing direct payment...');
        await processDirectPayment(invoiceId, orderId, amount, paymentMethod, initResult.paymentId);
      }

    } catch (err) {
      console.error('❌ Payment processing error:', err);
      alert(`❌ Payment failed: ${err.message}`);
      setPaymentLoading(prev => ({ ...prev, [paymentKey]: false }));
    }
  };

  // Simulate successful payment return (for demo purposes)
  const simulateSuccessfulPayment = async (invoiceId, orderId, amount, paymentMethod, paymentId) => {
    const paymentKey = `${invoiceId}-${orderId}`;

    try {
      console.log('✅ Step 3: Payment completed successfully, marking invoice as PAID...');

      const response = await fetch('/api/middleware/mark-invoice-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          transactionId: paymentId || `${paymentMethod.toUpperCase()}-${Date.now()}`,
          paymentMethod,
          amount: parseFloat(amount),
          currency: 'CZK',
          notes: `Payment completed via ${paymentMethod} - Order ${orderId}`
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Invoice marked as PAID successfully:', result);
        alert(`✅ Payment Successful!\n\nInvoice ${invoiceId} has been marked as PAID.\nTransaction ID: ${result.paymentId || paymentId}`);

        // Reload orders to show updated status
        await loadOrders();
      } else {
        throw new Error(result.error || 'Failed to mark invoice as paid');
      }

    } catch (err) {
      console.error('❌ Error marking invoice as paid:', err);
      alert(`❌ Payment completed but failed to mark invoice as paid: ${err.message}`);
    } finally {
      setPaymentLoading(prev => ({ ...prev, [paymentKey]: false }));
    }
  };

  // Mark invoice status (Paid or Unpaid)
  const handleMarkInvoiceStatus = async (invoiceId, orderId, amount, status) => {
    const paymentKey = `${invoiceId}-${orderId}`;

    try {
      setPaymentLoading(prev => ({ ...prev, [paymentKey]: true }));

      console.log(`✅ Marking invoice as ${status.toUpperCase()}...`, {
        invoiceId,
        orderId,
        amount,
        status
      });

      // Call middleware to mark invoice status using setInvoiceStatus method
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      const response = await fetch(`${middlewareUrl}/api/mark-invoice-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          status: status
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Invoice marked as ${status.toUpperCase()} successfully:`, result);
        alert(`✅ Invoice ${invoiceId} marked as ${status.toUpperCase()} successfully!`);

        // Reload data to reflect changes
        await loadData();
      } else {
        throw new Error(result.error || `Failed to mark invoice as ${status.toLowerCase()}`);
      }

    } catch (err) {
      console.error(`❌ Error marking invoice as ${status.toLowerCase()}:`, err);
      alert(`❌ Failed to mark invoice as ${status.toLowerCase()}: ${err.message}`);
    } finally {
      setPaymentLoading(prev => ({ ...prev, [paymentKey]: false }));
    }
  };

  // Convenience functions for backward compatibility and clarity
  const handleMarkAsPaid = (invoiceId, orderId, amount) => {
    return handleMarkInvoiceStatus(invoiceId, orderId, amount, 'Paid');
  };

  const handleMarkAsUnpaid = (invoiceId, orderId, amount) => {
    return handleMarkInvoiceStatus(invoiceId, orderId, amount, 'Unpaid');
  };

  // Update payment method for invoice
  const handleUpdatePaymentMethod = async (invoiceId, orderId, newPaymentMethod) => {
    if (!newPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    const paymentKey = `${invoiceId}-${orderId}`;
    setPaymentLoading(prev => ({ ...prev, [paymentKey]: true }));

    try {
      console.log('🔄 Updating payment method for invoice:', {
        invoiceId,
        orderId,
        newPaymentMethod
      });

      // Call HostBill API to update invoice payment method
      const response = await fetch('/api/hostbill/update-invoice-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          paymentMethod: newPaymentMethod
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Payment method updated successfully:', result);
        alert(`✅ Payment method updated!\n\nInvoice ${invoiceId} payment method changed to: ${newPaymentMethod}`);

        // Reload orders to show updated payment method
        await loadOrders();
      } else {
        throw new Error(result.error || 'Failed to update payment method');
      }

    } catch (err) {
      console.error('❌ Error updating payment method:', err);
      alert(`❌ Failed to update payment method: ${err.message}`);
    } finally {
      setPaymentLoading(prev => ({ ...prev, [paymentKey]: false }));
    }
  };

  // Process direct payment (for non-redirect payment methods)
  const processDirectPayment = async (invoiceId, orderId, amount, paymentMethod, paymentId) => {
    const paymentKey = `${invoiceId}-${orderId}`;

    try {
      console.log('💰 Processing direct payment...');

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mark invoice as paid
      await simulateSuccessfulPayment(invoiceId, orderId, amount, paymentMethod, paymentId);

    } catch (err) {
      console.error('❌ Direct payment processing error:', err);
      alert(`❌ Direct payment failed: ${err.message}`);
      setPaymentLoading(prev => ({ ...prev, [paymentKey]: false }));
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Invoice Payment Test - CloudVPS</title>
        </Head>
        <div style={styles.loadingContainer}>
          <h2>Loading orders and payment methods...</h2>
          <p>Please wait while we fetch the latest data from HostBill via middleware.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Invoice Payment Test - CloudVPS</title>
      </Head>

      <div style={styles.header}>
        <h1 style={styles.title}>Invoice Payment Test</h1>
        <p style={styles.subtitle}>
          Test invoice payment processing via middleware - Last 10 orders with invoices
        </p>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <button 
        style={styles.refreshButton}
        onClick={loadData}
        disabled={loading}
      >
        🔄 Refresh Data
      </button>

      <div style={styles.ordersContainer}>
        {/* Header Row */}
        <div style={{...styles.orderRow, ...styles.orderHeader}}>
          <div>ID</div>
          <div>Order #</div>
          <div>Client</div>
          <div>Product</div>
          <div>Status</div>
          <div>Total</div>
          <div>Date</div>
          <div>Invoices</div>
          <div>Payment</div>
        </div>

        {/* Data Rows */}
        {orders.length === 0 ? (
          <div style={{...styles.orderRow, textAlign: 'center', gridColumn: '1 / -1'}}>
            No orders found
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} style={{...styles.orderRow, ...styles.orderData}}>
              <div>{order.id}</div>
              <div>{order.number}</div>
              <div>
                <div style={{fontSize: '11px', fontWeight: 'bold'}}>{order.client_name || 'N/A'}</div>
                <div style={{fontSize: '10px', color: '#666'}}>{order.client_email || ''}</div>
              </div>
              <div style={{fontSize: '11px'}}>{order.product_name || 'N/A'}</div>
              <div style={{fontSize: '11px'}}>{order.status}</div>
              <div style={{fontSize: '11px', fontWeight: 'bold'}}>{order.total} {order.currency}</div>
              <div style={{fontSize: '10px'}}>{new Date(order.date_created).toLocaleDateString('cs-CZ')}</div>
              <div>
                {order.invoices.length === 0 ? (
                  <div style={{color: '#666', fontSize: '10px'}}>No invoices</div>
                ) : (
                  order.invoices.map((invoice) => (
                    <div key={invoice.id} style={styles.invoiceItem}>
                      <div style={{fontSize: '10px', fontWeight: 'bold'}}>#{invoice.number}</div>
                      <div style={{
                        ...(invoice.status === 'Paid' ? styles.statusPaid : styles.statusUnpaid),
                        fontSize: '10px'
                      }}>
                        {invoice.status} - {invoice.total} CZK
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div>
                {order.invoices.length === 0 ? (
                  <div style={{color: '#666', fontSize: '12px'}}>No invoices to pay</div>
                ) : (
                  order.invoices.map((invoice) => {
                    const paymentKey = `${invoice.id}-${order.id}`;
                    const isLoading = paymentLoading[paymentKey];
                    const isPaid = invoice.status === 'Paid';
                    
                    return (
                      <div key={`${order.id}-${invoice.id}`} style={styles.paymentSection}>
                        <select
                          style={styles.select}
                          id={`method-${order.id}-${invoice.id}`}
                          disabled={isLoading}
                          defaultValue="comgate"
                        >
                          <option value="">Select method</option>
                          {paymentMethods.map((method) => (
                            <option
                              key={method.id}
                              value={method.id}
                            >
                              {method.name}
                            </option>
                          ))}
                        </select>
                        <button
                          style={{
                            ...styles.button,
                            ...(isPaid || isLoading ? styles.buttonDisabled : styles.buttonPay)
                          }}
                          disabled={isPaid || isLoading}
                          onClick={() => {
                            const methodSelect = document.getElementById(`method-${order.id}-${invoice.id}`);
                            const selectedMethod = methodSelect.value;
                            handlePayInvoice(invoice.id, order.id, invoice.total, selectedMethod);
                          }}
                        >
                          {isLoading ? 'Processing...' : isPaid ? 'PAID' : 'Pay'}
                        </button>
                        <button
                          style={{
                            ...styles.button,
                            backgroundColor: '#28a745',
                            color: 'white',
                            marginLeft: '5px',
                            fontSize: '11px',
                            padding: '4px 8px',
                            ...(isLoading ? styles.buttonDisabled : {})
                          }}
                          disabled={isLoading}
                          onClick={() => handleMarkAsPaid(invoice.id, order.id, invoice.total)}
                        >
                          {isLoading ? 'Processing...' : 'Mark as Paid'}
                        </button>
                        <button
                          style={{
                            ...styles.button,
                            backgroundColor: '#dc3545',
                            color: 'white',
                            marginLeft: '3px',
                            fontSize: '11px',
                            padding: '4px 8px',
                            ...(isLoading ? styles.buttonDisabled : {})
                          }}
                          disabled={isLoading}
                          onClick={() => handleMarkAsUnpaid(invoice.id, order.id, invoice.total)}
                        >
                          {isLoading ? 'Processing...' : 'Mark as Unpaid'}
                        </button>
                        <button
                          style={{
                            ...styles.button,
                            ...styles.buttonUpdate,
                            color: 'white',
                            marginLeft: '3px',
                            fontSize: '11px',
                            padding: '4px 8px',
                            ...(isLoading ? styles.buttonDisabled : {})
                          }}
                          disabled={isLoading}
                          onClick={() => {
                            const methodSelect = document.getElementById(`method-${order.id}-${invoice.id}`);
                            const selectedMethod = methodSelect.value;
                            handleUpdatePaymentMethod(invoice.id, order.id, selectedMethod);
                          }}
                        >
                          {isLoading ? 'Processing...' : 'UpdatePaymentMethod'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px'}}>
        <h3>Instructions:</h3>
        <ol>
          <li>This page loads the last 10 orders from HostBill via middleware</li>
          <li>Each order shows associated invoices with their payment status</li>
          <li>Select a payment method and click "Pay" to mark an invoice as PAID</li>
          <li><strong>NEW:</strong> Click "UpdatePaymentMethod" to change the payment method of any invoice (works for both Paid and Unpaid invoices)</li>
          <li>The payment method dropdown is now always enabled, even for Paid invoices</li>
          <li>Use "Mark as Paid" / "Mark as Unpaid" to manually change invoice status</li>
          <li>The system will add a payment record and update the invoice status in HostBill</li>
          <li>Refresh the page to see updated payment statuses and methods</li>
        </ol>
        <p><strong>URL:</strong> <a href="http://localhost:3000/invoice-payment-test" target="_blank">http://localhost:3000/invoice-payment-test</a></p>
        <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px'}}>
          <strong>New Feature:</strong> The "UpdatePaymentMethod" button allows you to change the payment method for any invoice,
          regardless of its payment status. This is useful for updating payment methods after the fact or correcting payment gateway assignments.
        </div>
        <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
          <strong>Available Payment Methods for Testing:</strong>
          <ul style={{margin: '5px 0', paddingLeft: '20px'}}>
            <li><strong>0</strong> - None/Default (resets to no specific gateway)</li>
            <li><strong>banktransfer</strong> - Bank Transfer</li>
            <li><strong>creditcard</strong> - Credit Card</li>
            <li><strong>null</strong> - Null value (for testing edge cases)</li>
            <li><strong>comgate</strong> - ComGate (existing)</li>
            <li><strong>payu</strong> - PayU (existing)</li>
            <li>Plus any other payment methods loaded from HostBill API</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
