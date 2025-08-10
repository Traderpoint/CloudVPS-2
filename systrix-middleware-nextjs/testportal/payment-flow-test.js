import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  button: {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginRight: '10px',
    marginBottom: '10px'
  },
  buttonPrimary: {
    backgroundColor: '#28a745'
  },
  buttonSecondary: {
    backgroundColor: '#007bff'
  },
  buttonWarning: {
    backgroundColor: '#ffc107',
    color: '#212529'
  },
  buttonSuccess: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  buttonInfo: {
    backgroundColor: '#17a2b8'
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
    padding: '15px',
    marginBottom: '20px'
  }
};

export default function PaymentFlowTest() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Max 3 steps now
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [captureStatus, setCaptureStatus] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [returnFromPaymentData, setReturnFromPaymentData] = useState(null);

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
    price: 299,
    cycle: 'm',
    affiliateId: '2',
    affiliateCode: 'test-affiliate',
    paymentMethod: 'comgate'
  });

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();

    // Check if returning from real payment gateway
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const invoiceId = urlParams.get('invoiceId');
    const transactionId = urlParams.get('transactionId');

    if (paymentStatus === 'success' && invoiceId && transactionId) {
      console.log('🔄 Detected return from real payment gateway:', { paymentStatus, invoiceId, transactionId });

      // Set up the order data from URL params
      const amount = urlParams.get('amount') || '604';
      const paymentMethod = urlParams.get('paymentMethod') || 'comgate';

      // Simulate having an order for the capture process
      if (!result?.orders?.[0]) {
        setResult({
          success: true,
          orders: [{
            orderId: `ORDER-${invoiceId}`,
            invoiceId: invoiceId,
            price: parseFloat(amount)
          }]
        });

        setFormData(prev => ({
          ...prev,
          paymentMethod: paymentMethod,
          price: parseFloat(amount)
        }));
      }

      // Automatically handle payment return
      setTimeout(() => {
        handlePaymentReturn();
      }, 1000);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check for return from payment
  useEffect(() => {
    const { status, orderId, invoiceId, transactionId, paymentMethod, amount, currency } = router.query;

    if (status && orderId) {
      console.log('🔄 Detected return from payment:', router.query);

      // Auto-advance to step 4 (verification)
      setStep(4);

      // Set payment result based on status
      if (status === 'success') {
        setPaymentStatus('success');
        setPaymentResult({
          success: true,
          transactionId,
          paymentMethod,
          status: 'completed',
          message: 'Payment completed successfully via external gateway'
        });

        // Immediately load comprehensive invoice status
        console.log('🔍 Loading comprehensive invoice status for successful payment');
        setLoading(true);

        // Load invoice status directly
        loadInvoiceStatus(invoiceId, orderId, amount, currency, paymentMethod, transactionId);
      } else if (status === 'cancelled') {
      } else if (status === 'cancelled') {
        setPaymentStatus('cancelled');
        setError('Payment was cancelled by user');
      } else if (status === 'pending') {
        setPaymentStatus('pending');
        setPaymentResult({
          success: true,
          transactionId,
          paymentMethod,
          status: 'pending',
          message: 'Payment is being processed'
        });
      }

      // Clean URL parameters
      router.replace('/payment-flow-test', undefined, { shallow: true });
    }
  }, [router.query]);

  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      console.log('🔍 Loading payment methods from middleware...');

      const response = await fetch('http://localhost:3005/api/payment-modules');
      const data = await response.json();

      if (data.success && data.modules) {
        setPaymentMethods(data.modules);
        console.log('✅ Payment methods loaded:', data.modules);

        // Set Comgate as default if available, otherwise first available method
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

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
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
              productId: formData.productId, // Use productId for middleware compatibility
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
          affiliate: {
            id: formData.affiliateId,
            code: formData.affiliateCode
          },
          paymentMethod: formData.paymentMethod,
          newsletterSubscribe: false,
          type: 'complete'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data);
        setStep(2);
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
          testFlow: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPaymentResult(data);

        // If payment URL is available, redirect to real payment gateway
        if (data.paymentUrl && data.redirectRequired) {
          console.log('🚀 Redirecting to real payment gateway:', data.paymentUrl);

          // Show confirmation before redirect
          const selectedMethod = paymentMethods.find(m => m.method === formData.paymentMethod);
          const methodName = selectedMethod?.name || formData.paymentMethod.toUpperCase();

          const confirmRedirect = confirm(
            `Redirect to real ${methodName} payment gateway?\n\n` +
            `Payment ID: ${data.paymentId}\n` +
            `Amount: ${formData.price} CZK\n` +
            `Method: ${methodName}\n\n` +
            `Click OK to proceed with real payment, Cancel to stay on test page.`
          );

          if (confirmRedirect) {
            // Redirect to real payment gateway
            window.location.href = data.paymentUrl;
            return; // Don't continue with test flow
          }
        }

        setStep(3);
      } else {
        setError(data.error || 'Payment initialization failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const returnFromPayment = async () => {
    if (!result?.orders?.[0] || !paymentResult) {
      setError('No payment available for return processing');
      return;
    }

    setLoading(true);

    const selectedMethod = paymentMethods.find(m => m.method === formData.paymentMethod);
    const methodName = selectedMethod?.name || formData.paymentMethod.toUpperCase();
    const order = result.orders[0];

    console.log('🔄 Processing return from payment gateway...', order.invoiceId);

    try {
      // Use the working payment return endpoint with actual payment amount
      const returnUrl = `http://localhost:3005/api/payments/return?` +
        `invoiceId=${order.invoiceId}&` +
        `status=success&` +
        `amount=${formData.price}&` + // Use actual payment amount
        `paymentMethod=${formData.paymentMethod}&` +
        `transactionId=TEST-FLOW-${order.invoiceId}`;

      console.log('📤 Processing real test payment return:', returnUrl);

      // Call the working payment return endpoint
      const callbackResponse = await fetch(returnUrl, {
        method: 'GET'
      });

      console.log('📥 Payment return response status:', callbackResponse.status);

      // Check if response is HTML (success page) or JSON
      const contentType = callbackResponse.headers.get('content-type');
      let callbackResult;

      if (contentType && contentType.includes('text/html')) {
        // Success - got HTML page
        callbackResult = {
          success: true,
          message: 'Payment processed successfully - redirected to success page',
          htmlResponse: true
        };
      } else {
        // Try to parse as JSON
        callbackResult = await callbackResponse.json();
      }

      // Log payment return result (for debugging)
      if (callbackResult.success || callbackResult.htmlResponse) {
        console.log('✅ Payment return processed successfully:', callbackResult);
      } else {
        console.log('⚠️ Payment return had issues, but proceeding with capture payment:', callbackResult);
      }

      setPaymentStatus({
        status: 'payment_processed',
        message: `${methodName} payment processed - proceeding to capture payment`,
        timestamp: new Date().toISOString(),
        paymentMethod: formData.paymentMethod,
        invoiceUpdated: false, // Will be updated by capture payment
        htmlResponse: callbackResult.htmlResponse
      });

      // ALWAYS call Capture Payment regardless of payment return result
      console.log('💰 ALWAYS calling Capture Payment (regardless of return result)...', order.invoiceId);

        const captureResult = await capturePayment(
          order.invoiceId,
          formData.price,
          formData.paymentMethod,
          `TEST-FLOW-${order.invoiceId}`,
          `Payment captured after successful ${formData.paymentMethod} test payment`
        );

        if (captureResult.success) {
          console.log('✅ Payment captured successfully - this is the ONLY invoice update');
          console.log('🔍 Capture details:', captureResult);
          console.log('📊 Status change:', captureResult.previousStatus, '→', captureResult.currentStatus);

          // Update payment status to show capture was successful
          setPaymentStatus(prev => ({
            ...prev,
            status: 'payment_captured',
            message: `${methodName} payment captured successfully - invoice marked as PAID`,
            invoiceUpdated: true,
            captureDetails: captureResult
          }));

          // Wait only 1 second for HostBill to process the capture
          setTimeout(() => {
            console.log('🔄 Loading final invoice status after capture payment (1s wait)...');
            loadInvoiceStatus(
              order.invoiceId,
              order.orderId,
              formData.price,
              'CZK',
              formData.paymentMethod,
              `TEST-FLOW-${order.invoiceId}`
            );
          }, 1000); // Wait only 1 second for HostBill to process capture
        } else {
          console.log('❌ Failed to capture payment:', captureResult.error);
          console.log('🔍 Capture error details:', captureResult.details);

          // Update payment status to show capture failed
          setPaymentStatus(prev => ({
            ...prev,
            status: 'capture_failed',
            message: `${methodName} payment processed but capture failed: ${captureResult.error}`,
            invoiceUpdated: false,
            captureError: captureResult
          }));

          // Still load status even if capture failed (1s wait)
          setTimeout(() => {
            loadInvoiceStatus(
              order.invoiceId,
              order.orderId,
              formData.price,
              'CZK',
              formData.paymentMethod,
              `TEST-FLOW-${order.invoiceId}`
            );
          }, 1000); // Wait only 1 second
        }
    } catch (error) {
      console.error('❌ Payment return error:', error);

      setPaymentStatus({
        status: 'payment_error',
        message: `${methodName} payment error: ${error.message}`,
        timestamp: new Date().toISOString(),
        paymentMethod: formData.paymentMethod,
        error: error.message
      });
    }

    setStep(3); // Move to step 3 (final step)
    setLoading(false);
  };

  // Function to handle return from real payment gateway
  const handlePaymentReturn = async () => {
    if (!result?.orders?.[0]) {
      console.log('❌ No order available for payment return handling');
      return;
    }

    const order = result.orders[0];
    const methodName = paymentMethods.find(m => m.method === formData.paymentMethod)?.name || formData.paymentMethod.toUpperCase();

    console.log('🔄 Handling return from real payment gateway...', order.invoiceId);

    try {
      // Simulate successful payment return
      const returnUrl = `http://localhost:3005/api/payments/return?` +
        `invoiceId=${order.invoiceId}&` +
        `status=success&` +
        `amount=${formData.price}&` +
        `paymentMethod=${formData.paymentMethod}&` +
        `transactionId=REAL-PAYMENT-${order.invoiceId}`;

      console.log('📤 Processing real payment return:', returnUrl);

      const callbackResponse = await fetch(returnUrl, { method: 'GET' });
      const contentType = callbackResponse.headers.get('content-type');

      let callbackResult;
      if (contentType && contentType.includes('text/html')) {
        callbackResult = { success: true, htmlResponse: true };
      } else {
        callbackResult = await callbackResponse.json();
      }

      if (callbackResult.success || callbackResult.htmlResponse) {
        console.log('✅ Payment return processed successfully');

        // IMMEDIATELY call Capture Payment
        console.log('💰 IMMEDIATELY calling Capture Payment after real payment return...');

        const captureResult = await capturePayment(
          order.invoiceId,
          formData.price,
          formData.paymentMethod,
          `REAL-PAYMENT-${order.invoiceId}`,
          `Payment captured after successful real ${formData.paymentMethod} payment`
        );

        if (captureResult.success) {
          console.log('✅ Payment captured successfully after real payment');

          setPaymentStatus({
            status: 'payment_captured',
            message: `${methodName} real payment captured successfully - invoice marked as PAID`,
            timestamp: new Date().toISOString(),
            paymentMethod: formData.paymentMethod,
            invoiceUpdated: true,
            captureDetails: captureResult
          });

          // Load final status after 1 second
          setTimeout(() => {
            loadInvoiceStatus(
              order.invoiceId,
              order.orderId,
              formData.price,
              'CZK',
              formData.paymentMethod,
              `REAL-PAYMENT-${order.invoiceId}`
            );
          }, 1000);

          setStep(4); // Move to verification step
        } else {
          console.log('❌ Failed to capture payment after real payment:', captureResult.error);
          setPaymentStatus({
            status: 'capture_failed',
            message: `Real payment processed but capture failed: ${captureResult.error}`,
            timestamp: new Date().toISOString(),
            paymentMethod: formData.paymentMethod,
            invoiceUpdated: false,
            captureError: captureResult
          });
        }
      }
    } catch (error) {
      console.error('❌ Error handling payment return:', error);
      setPaymentStatus({
        status: 'return_failed',
        message: `Failed to process payment return: ${error.message}`,
        timestamp: new Date().toISOString(),
        paymentMethod: formData.paymentMethod,
        invoiceUpdated: false
      });
    }
  };

  // New function to capture payment (mark invoice as paid using proper HostBill API)
  const capturePayment = async (invoiceId, amount, paymentMethod, transactionId, note = 'Payment captured after successful test payment') => {
    console.log('💰 Capturing payment for invoice using HostBill API...');
    console.log('📋 Capture parameters:', { invoiceId, amount, paymentMethod, transactionId, note });

    try {
      const captureResponse = await fetch('/api/middleware/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: parseFloat(amount),
          module: paymentMethod === 'comgate' ? 'Comgate' : 'BankTransfer',
          trans_id: transactionId,
          note: note
        })
      });

      const captureResult = await captureResponse.json();

      if (captureResult.success) {
        console.log('✅ Payment captured successfully using HostBill API');
        console.log('🔍 Capture result:', captureResult);
        console.log('📊 Invoice status changed from:', captureResult.data?.previous_status, 'to:', captureResult.data?.current_status);

        // Set capture status for UI display
        setCaptureStatus({
          success: true,
          message: captureResult.message,
          invoiceId: captureResult.data?.invoice_id,
          amount: captureResult.data?.amount,
          transactionId: captureResult.data?.transaction_id,
          paymentModule: captureResult.data?.payment_module,
          previousStatus: captureResult.data?.previous_status,
          currentStatus: captureResult.data?.current_status,
          capturedAt: captureResult.data?.captured_at,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          message: captureResult.message,
          data: captureResult.data,
          previousStatus: captureResult.data?.previous_status,
          currentStatus: captureResult.data?.current_status
        };
      } else {
        console.log('❌ Failed to capture payment:', captureResult.error);
        console.log('🔍 Capture error details:', captureResult.details);

        // Set capture error status for UI display
        setCaptureStatus({
          success: false,
          error: captureResult.error,
          details: captureResult.details,
          timestamp: new Date().toISOString()
        });

        return {
          success: false,
          error: captureResult.error,
          details: captureResult.details
        };
      }

    } catch (error) {
      console.error('💥 Exception during payment capture:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // New function to load invoice status immediately upon return from payment
  const loadInvoiceStatus = async (invoiceId, orderId, amount, currency, paymentMethod, transactionId) => {
    console.log('🔍 Loading comprehensive invoice status immediately');
    console.log('📋 Parameters:', { invoiceId, orderId, amount, currency, paymentMethod, transactionId });

    setError(null);

    try {
      const url = `http://localhost:3005/api/invoices/${invoiceId}/status`;
      console.log('🌐 Fetching URL:', url);

      const response = await fetch(url);
      console.log('🌐 Response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📋 Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Invoice status loaded successfully');
        console.log('🔍 Invoice status data:', {
          invoiceId: data.invoiceId,
          status: data.status,
          isPaid: data.isPaid,
          amount: data.amount,
          datePaid: data.datePaid
        });

        // Create comprehensive status with payment return info
        const comprehensiveStatus = {
          // Invoice data from API
          ...data,
          // Payment return data
          returnData: {
            orderId,
            invoiceId,
            amount,
            currency,
            paymentMethod,
            transactionId,
            status: 'success',
            timestamp: new Date().toISOString()
          },
          // Formatted display data
          displaySummary: data.summary,
          verificationDetails: {
            invoiceId: data.invoiceId,
            orderNumber: data.orderNumber || orderId || 'N/A', // Fallback to orderId if orderNumber not available
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            isPaid: data.isPaid,
            datePaid: data.datePaid,
            clientInfo: data.clientInfo,
            verifiedAt: new Date().toLocaleString('cs-CZ'),
            // Payment details
            paymentAmount: amount || data.amount, // Use URL amount or fallback to invoice amount
            paymentCurrency: currency || data.currency,
            paymentMethod: paymentMethod,
            transactionId: transactionId
          }
        };

        console.log('🎯 Setting comprehensive invoice status:', {
          isPaid: comprehensiveStatus.isPaid,
          status: comprehensiveStatus.status,
          verificationDetails: comprehensiveStatus.verificationDetails
        });
        console.log('🔍 Full comprehensive status:', comprehensiveStatus);
        setInvoiceStatus(comprehensiveStatus);

        // Don't set returnFromPaymentData - we'll show the comprehensive status instead
        setReturnFromPaymentData(null);

        setStep(5); // Move to final step
        console.log('✅ Comprehensive status loaded and displayed');

      } else {
        console.log('❌ Failed to load invoice status');
        console.log('❌ Response.ok:', response.ok);
        console.log('❌ Data.success:', data.success);

        // Fallback to basic return data if API fails
        setReturnFromPaymentData({
          status: 'success',
          orderId,
          invoiceId,
          transactionId,
          paymentMethod,
          amount,
          currency,
          timestamp: new Date().toISOString(),
          error: 'Could not verify invoice status'
        });

        setError(data.error || data.fallbackMessage || 'Failed to verify invoice status');
      }
    } catch (err) {
      console.log('❌ Exception in loadInvoiceStatus:', err);

      // Fallback to basic return data if network fails
      setReturnFromPaymentData({
        status: 'success',
        orderId,
        invoiceId,
        transactionId,
        paymentMethod,
        amount,
        currency,
        timestamp: new Date().toISOString(),
        error: `Network error: ${err.message}`
      });

      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Keep the old checkStatus for manual button clicks
  const checkStatus = async () => {
    if (!result?.orders?.[0]) return;

    const order = result.orders[0];
    setLoading(true);

    // Use the new loadInvoiceStatus function
    await loadInvoiceStatus(
      order.invoiceId,
      order.orderId,
      order.amount || 'N/A',
      order.currency || 'CZK',
      'manual',
      'MANUAL-CHECK'
    );
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Payment Flow Test - NEW</title>
      </Head>

      <h1>🚀 Complete Payment Flow Test</h1>
      <p>Test kompletního procesu objednávky a platby</p>

      {/* Progress Steps */}
      <div style={styles.infoBox}>
        <h3>📋 Progress Steps:</h3>
        <div>
          <span style={{ color: step >= 1 ? '#28a745' : '#6c757d' }}>
            {step >= 1 ? '✅' : '⏳'} 1. Create Order
          </span>
          {' → '}
          <span style={{ color: step >= 2 ? '#28a745' : '#6c757d' }}>
            {step >= 2 ? '✅' : '⏳'} 2. Initialize Payment
          </span>
          {' → '}
          <span style={{ color: step >= 3 ? '#28a745' : '#6c757d' }}>
            {step >= 3 ? '✅' : '⏳'} 3. Return & Capture Payment
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={styles.formContainer}>
        <h3>📝 Order Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>

          {/* Product Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product:</label>
            <select
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="1">1 - VPS Basic (299 CZK)</option>
              <option value="2">2 - VPS Pro (499 CZK)</option>
              <option value="3">3 - VPS Premium (899 CZK)</option>
              <option value="4">4 - VPS Enterprise (1299 CZK)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (CZK):</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Billing Cycle:</label>
            <select
              value={formData.cycle}
              onChange={(e) => handleInputChange('cycle', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="m">Monthly</option>
              <option value="q">Quarterly</option>
              <option value="s">Semi-Annually</option>
              <option value="a">Annually</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Affiliate ID:</label>
            <input
              type="text"
              value={formData.affiliateId}
              onChange={(e) => handleInputChange('affiliateId', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Affiliate Code:</label>
            <input
              type="text"
              value={formData.affiliateCode}
              onChange={(e) => handleInputChange('affiliateCode', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          {/* Customer Information */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name:</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name:</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone:</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Address:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>City:</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Postal Code:</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Country:</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company:</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment Method:
              {loadingMethods && <span style={{ color: '#6c757d', fontSize: '12px' }}> (Loading...)</span>}
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              disabled={loadingMethods}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: loadingMethods ? '#f8f9fa' : 'white'
              }}
            >
              <option value="">Select payment method...</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.method}>
                  {method.icon} {method.name} ({method.type})
                </option>
              ))}
              {/* Fallback options if methods don't load */}
              {paymentMethods.length === 0 && !loadingMethods && (
                <>
                  <option value="payu">💰 PayU</option>
                  <option value="paypal">🅿️ PayPal</option>
                  <option value="card">💳 Stripe Card</option>
                  <option value="comgate">🌐 Comgate Payments</option>
                  <option value="banktransfer">🏦 Bank Transfer</option>
                  <option value="crypto">₿ Cryptocurrency</option>
                </>
              )}
            </select>
            {formData.paymentMethod && (
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>
                Selected: {paymentMethods.find(m => m.method === formData.paymentMethod)?.name || formData.paymentMethod}
                {formData.paymentMethod === 'comgate' && (
                  <span style={{ color: '#9c27b0', fontWeight: 'bold' }}> (External Gateway)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={createOrder}
          disabled={loading || step > 1}
          style={{
            ...styles.button,
            ...(loading || step > 1 ? styles.buttonDisabled : styles.buttonPrimary)
          }}
        >
          {loading && step === 1 ? '⏳ Creating...' : '🚀 1. Create Order'}
        </button>

        <button
          onClick={initializePayment}
          disabled={loading || step < 2 || step > 2}
          style={{
            ...styles.button,
            ...(loading || step < 2 || step > 2 ? styles.buttonDisabled : styles.buttonSecondary)
          }}
        >
          {loading && step === 2
            ? '⏳ Initializing...'
            : `💳 2. Initialize ${paymentMethods.find(m => m.method === formData.paymentMethod)?.name || formData.paymentMethod.toUpperCase()} Payment`
          }
        </button>

        <button
          onClick={returnFromPayment}
          disabled={loading || step < 3}
          style={{
            ...styles.button,
            ...(loading || step < 3 ? styles.buttonDisabled : styles.buttonSuccess)
          }}
        >
          {loading && step === 3
            ? '⏳ Processing Return & Capture...'
            : `✅ 3. Return from ${paymentMethods.find(m => m.method === formData.paymentMethod)?.name || formData.paymentMethod.toUpperCase()} Payment`
          }
        </button>

        {/* Real Payment Buttons */}
        {paymentResult?.paymentUrl && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                console.log('🚀 Redirecting to real payment gateway...');
                window.location.href = paymentResult.paymentUrl;
              }}
              style={{
                ...styles.button,
                backgroundColor: '#ff6b35',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              💳 Go to Real Payment Gateway
            </button>

            <button
              onClick={handlePaymentReturn}
              disabled={loading}
              style={{
                ...styles.button,
                backgroundColor: '#28a745',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {loading ? '⏳ Processing...' : '✅ I Completed Real Payment'}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '2px solid #28a745',
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
        </div>
      )}

      {paymentResult && (
        <div style={styles.successBox}>
          <h3 style={{ color: '#155724' }}>💳 Payment Initialized</h3>
          <p><strong>Payment ID:</strong> {paymentResult.paymentId}</p>
          <p><strong>Status:</strong> {paymentResult.status}</p>
        </div>
      )}

      {paymentStatus && (
        <div style={{
          ...styles.successBox,
          backgroundColor: paymentStatus.status === 'capture_failed' ? '#f8d7da' :
                          paymentStatus.status === 'payment_captured' ? '#d4edda' : '#e2e3e5',
          border: `2px solid ${paymentStatus.status === 'capture_failed' ? '#dc3545' :
                               paymentStatus.status === 'payment_captured' ? '#28a745' : '#6c757d'}`
        }}>
          <h3 style={{
            color: paymentStatus.status === 'capture_failed' ? '#721c24' :
                   paymentStatus.status === 'payment_captured' ? '#155724' : '#495057'
          }}>
            {paymentStatus.status === 'payment_captured' ? '💰 Payment Captured' :
             paymentStatus.status === 'capture_failed' ? '❌ Capture Failed' :
             paymentStatus.status === 'payment_processed' ? '🔄 Payment Processed' : '🔄 Payment Status'}
          </h3>
          <p><strong>Status:</strong> {paymentStatus.status}</p>
          <p><strong>Message:</strong> {paymentStatus.message}</p>
          {paymentStatus.invoiceUpdated && (
            <div style={{
              backgroundColor: 'rgba(40, 167, 69, 0.1)',
              padding: '8px',
              borderRadius: '4px',
              marginTop: '10px',
              color: '#155724',
              fontWeight: 'bold'
            }}>
              ✅ Invoice successfully updated via Capture Payment
            </div>
          )}
        </div>
      )}

      {/* Capture Payment Status */}
      {captureStatus && (
        <div style={{
          ...styles.successBox,
          backgroundColor: captureStatus.success ? '#d4edda' : '#f8d7da',
          border: `2px solid ${captureStatus.success ? '#28a745' : '#dc3545'}`
        }}>
          <h3 style={{
            color: captureStatus.success ? '#155724' : '#721c24',
            marginBottom: '15px'
          }}>
            {captureStatus.success ? '💰 Payment Captured Successfully' : '❌ Payment Capture Failed'}
          </h3>

          {captureStatus.success ? (
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>📋 Capture Details:</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div><strong>Invoice ID:</strong> {captureStatus.invoiceId}</div>
                <div><strong>Amount:</strong> {captureStatus.amount} CZK</div>
                <div><strong>Transaction ID:</strong> {captureStatus.transactionId}</div>
                <div><strong>Payment Module:</strong> {captureStatus.paymentModule}</div>
                <div><strong>Previous Status:</strong> {captureStatus.previousStatus}</div>
                <div><strong>Current Status:</strong> {captureStatus.currentStatus}</div>
              </div>

              {captureStatus.currentStatus === 'Paid' && (
                <div style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}>
                  🎉 Order moved from "Capture Payment" to "Provision" status!
                </div>
              )}

              <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                <strong>Captured At:</strong> {new Date(captureStatus.capturedAt).toLocaleString('cs-CZ')}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#721c24' }}>
              <div><strong>Error:</strong> {captureStatus.error}</div>
              {captureStatus.details && (
                <div><strong>Details:</strong> {captureStatus.details}</div>
              )}
            </div>
          )}
        </div>
      )}

      {invoiceStatus && (
        <div style={{
          ...styles.successBox,
          backgroundColor: invoiceStatus.isPaid ? '#d4edda' : '#fff3cd',
          border: `2px solid ${invoiceStatus.isPaid ? '#28a745' : '#ffc107'}`
        }}>
          <h3 style={{
            color: invoiceStatus.isPaid ? '#155724' : '#856404',
            marginBottom: '15px'
          }}>
            {invoiceStatus.isPaid ? '✅ Payment Completed & Verified - PAID' : '⚠️ Payment Completed - UNPAID'}
          </h3>

          {/* Main Summary */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: invoiceStatus.isPaid ? '#155724' : '#856404'
          }}>
            {invoiceStatus.displaySummary}
          </div>

          {/* Detailed Information */}
          {invoiceStatus.verificationDetails && (
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div>
                  <strong>📋 Faktura ID:</strong> {invoiceStatus.verificationDetails.invoiceId}
                </div>
                <div>
                  <strong>📋 Order Number:</strong> {invoiceStatus.verificationDetails.orderNumber || invoiceStatus.orderNumber || 'N/A'}
                </div>
                <div>
                  <strong>💰 Částka:</strong> {invoiceStatus.verificationDetails.amount} {invoiceStatus.verificationDetails.currency}
                </div>
                <div>
                  <strong>📊 Status:</strong> {invoiceStatus.verificationDetails.status}
                </div>
                {invoiceStatus.verificationDetails.datePaid && (
                  <div>
                    <strong>📅 Datum zaplacení:</strong> {new Date(invoiceStatus.verificationDetails.datePaid).toLocaleString('cs-CZ')}
                  </div>
                )}
                <div>
                  <strong>🔍 Ověřeno:</strong> {invoiceStatus.verificationDetails.verifiedAt}
                </div>
              </div>

              {/* Payment Details */}
              {invoiceStatus.verificationDetails.paymentMethod && (
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}>
                  <strong>💳 Platební údaje:</strong><br/>
                  <span>Metoda: {invoiceStatus.verificationDetails.paymentMethod}</span><br/>
                  <span>Částka: {invoiceStatus.verificationDetails.paymentAmount} {invoiceStatus.verificationDetails.paymentCurrency}</span><br/>
                  {invoiceStatus.verificationDetails.transactionId && (
                    <span>Transaction ID: {invoiceStatus.verificationDetails.transactionId}</span>
                  )}
                </div>
              )}

              {/* Client Information */}
              {invoiceStatus.verificationDetails.clientInfo && (
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}>
                  <strong>👤 Zákazník:</strong> {' '}
                  {invoiceStatus.verificationDetails.clientInfo.firstName} {invoiceStatus.verificationDetails.clientInfo.lastName}
                  {invoiceStatus.verificationDetails.clientInfo.companyName && (
                    <span> ({invoiceStatus.verificationDetails.clientInfo.companyName})</span>
                  )}
                  <span> - ID: {invoiceStatus.verificationDetails.clientInfo.clientId}</span>
                </div>
              )}

              {/* Status Indicator */}
              <div style={{
                textAlign: 'center',
                padding: '10px',
                backgroundColor: invoiceStatus.isPaid ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {invoiceStatus.isPaid ? (
                  <span style={{ color: '#155724' }}>
                    🎉 FAKTURA ÚSPĚŠNĚ OZNAČENA JAKO PAID
                  </span>
                ) : (
                  <span style={{ color: '#856404' }}>
                    ⏳ FAKTURA ČEKÁ NA ZAPLACENÍ
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show loading indicator while verifying invoice status */}
      {loading && !invoiceStatus && (
        <div style={{
          ...styles.successBox,
          backgroundColor: '#cce5ff',
          border: '2px solid #007bff'
        }}>
          <h3 style={{ color: '#004085' }}>🔍 Ověřuji stav faktury...</h3>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            fontSize: '16px'
          }}>
            <strong>Načítám kompletní informace o platbě a faktuře...</strong>
          </div>
        </div>
      )}

      {/* Fallback: Show basic return info if invoice status loading failed */}
      {returnFromPaymentData && !invoiceStatus && !loading && (
        <div style={{
          ...styles.successBox,
          backgroundColor: returnFromPaymentData.status === 'success' ? '#d4edda' :
                          returnFromPaymentData.status === 'cancelled' ? '#fff3cd' :
                          returnFromPaymentData.status === 'pending' ? '#cce5ff' : '#f8d7da',
          border: `2px solid ${returnFromPaymentData.status === 'success' ? '#28a745' :
                              returnFromPaymentData.status === 'cancelled' ? '#ffc107' :
                              returnFromPaymentData.status === 'pending' ? '#007bff' : '#dc3545'}`
        }}>
          <h3 style={{
            color: returnFromPaymentData.status === 'success' ? '#155724' :
                   returnFromPaymentData.status === 'cancelled' ? '#856404' :
                   returnFromPaymentData.status === 'pending' ? '#004085' : '#721c24'
          }}>
            {returnFromPaymentData.status === 'success' ? '✅ Payment Completed!' :
             returnFromPaymentData.status === 'cancelled' ? '⚠️ Payment Cancelled' :
             returnFromPaymentData.status === 'pending' ? '⏳ Payment Pending' : '❌ Payment Failed'}
          </h3>

          {returnFromPaymentData.error && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>⚠️ Poznámka:</strong> {returnFromPaymentData.error}
            </div>
          )}
          <p><strong>Order ID:</strong> {returnFromPaymentData.orderId}</p>
          <p><strong>Invoice ID:</strong> {returnFromPaymentData.invoiceId}</p>
          {returnFromPaymentData.transactionId && (
            <p><strong>Transaction ID:</strong> {returnFromPaymentData.transactionId}</p>
          )}
          <p><strong>Payment Method:</strong> {returnFromPaymentData.paymentMethod}</p>
          {returnFromPaymentData.amount && (
            <p><strong>Amount:</strong> {returnFromPaymentData.amount} {returnFromPaymentData.currency}</p>
          )}
          <p><strong>Status:</strong> {returnFromPaymentData.status}</p>
          <p><strong>Returned at:</strong> {new Date(returnFromPaymentData.timestamp).toLocaleString('cs-CZ')}</p>

          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>🔄 Test Flow Completed:</strong> User was redirected back from payment gateway to test page.
          </div>
        </div>
      )}
    </div>
  );
}
