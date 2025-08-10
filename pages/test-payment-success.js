import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const TestPaymentSuccess = () => {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      timestamp
    }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  useEffect(() => {
    addLog('info', '🔍 TEST PAGE: useEffect started');
    
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const search = window.location.search;
      
      addLog('info', `🔍 TEST PAGE: Window location: ${url}`);
      addLog('info', `🔍 TEST PAGE: Search params: ${search}`);
      
      const urlParams = new URLSearchParams(search);
      const transactionId = urlParams.get('transactionId');
      const paymentId = urlParams.get('paymentId');
      const invoiceId = urlParams.get('invoiceId');
      const orderId = urlParams.get('orderId');
      const amount = urlParams.get('amount');
      
      addLog('info', `🔍 TEST PAGE: Extracted transactionId: ${transactionId}`);
      addLog('info', `🔍 TEST PAGE: Extracted paymentId: ${paymentId}`);
      addLog('info', `🔍 TEST PAGE: Extracted invoiceId: ${invoiceId}`);
      addLog('info', `🔍 TEST PAGE: Extracted orderId: ${orderId}`);
      addLog('info', `🔍 TEST PAGE: Extracted amount: ${amount}`);
      
      if (transactionId && paymentId && invoiceId && orderId) {
        const data = {
          transactionId,
          paymentId,
          invoiceId,
          orderId,
          amount: amount ? parseFloat(amount) : null,
          currency: urlParams.get('currency') || 'CZK',
          paymentMethod: urlParams.get('paymentMethod') || 'comgate'
        };
        
        setPaymentData(data);
        addLog('success', `✅ TEST PAGE: Payment data set successfully`);
        addLog('info', `✅ TEST PAGE: Transaction ID: ${data.transactionId}`);
        addLog('info', `✅ TEST PAGE: Payment ID: ${data.paymentId}`);
        addLog('info', `✅ TEST PAGE: Full data: ${JSON.stringify(data, null, 2)}`);
      } else {
        addLog('error', '❌ TEST PAGE: Missing required parameters');
        addLog('error', `❌ TEST PAGE: transactionId: ${transactionId || 'NULL'}`);
        addLog('error', `❌ TEST PAGE: paymentId: ${paymentId || 'NULL'}`);
        addLog('error', `❌ TEST PAGE: invoiceId: ${invoiceId || 'NULL'}`);
        addLog('error', `❌ TEST PAGE: orderId: ${orderId || 'NULL'}`);
      }
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Test Payment Success Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Payment Data Status:</h2>
        {paymentData ? (
          <div style={{ background: '#d4edda', padding: '15px', borderRadius: '5px' }}>
            <h3>✅ Payment Data Found:</h3>
            <pre>{JSON.stringify(paymentData, null, 2)}</pre>
          </div>
        ) : (
          <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '5px' }}>
            <h3>❌ Payment Data Not Found</h3>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Transaction ID Check:</h2>
        <div style={{ 
          background: paymentData?.transactionId ? '#d4edda' : '#f8d7da', 
          padding: '15px', 
          borderRadius: '5px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Transaction ID: {paymentData?.transactionId || 'NULL'}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Payment ID Check:</h2>
        <div style={{ 
          background: paymentData?.paymentId ? '#d4edda' : '#f8d7da', 
          padding: '15px', 
          borderRadius: '5px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Payment ID: {paymentData?.paymentId || 'NULL'}
        </div>
      </div>

      <div>
        <h2>Execution Logs:</h2>
        <div style={{ 
          background: '#000', 
          color: '#00ff00', 
          padding: '15px', 
          borderRadius: '5px',
          fontFamily: 'monospace',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>No logs yet...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ 
                color: log.type === 'error' ? '#ff6b6b' : 
                       log.type === 'success' ? '#51cf66' : '#00ff00',
                marginBottom: '5px'
              }}>
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPaymentSuccess;
