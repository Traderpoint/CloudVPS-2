import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const DebugUrlParams = () => {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('🔍 DEBUG PAGE: Router query:', router.query);
    console.log('🔍 DEBUG PAGE: Router ready:', router.isReady);
    console.log('🔍 DEBUG PAGE: Window location:', typeof window !== 'undefined' ? window.location.href : 'N/A');

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const extractedParams = {
        invoiceId: urlParams.get('invoiceId'),
        orderId: urlParams.get('orderId'),
        amount: urlParams.get('amount'),
        paymentId: urlParams.get('paymentId'),
        transactionId: urlParams.get('transactionId'),
        paymentMethod: urlParams.get('paymentMethod'),
        currency: urlParams.get('currency'),
        status: urlParams.get('status')
      };

      console.log('🔍 DEBUG PAGE: Extracted params:', extractedParams);

      setDebugInfo({
        routerQuery: router.query,
        routerReady: router.isReady,
        windowLocation: window.location.href,
        extractedParams,
        urlSearchParams: window.location.search
      });
    }
  }, [router.query, router.isReady]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 URL Parameters Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Router Query:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {JSON.stringify(debugInfo.routerQuery, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Router Ready:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {String(debugInfo.routerReady)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Window Location:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {debugInfo.windowLocation}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>URL Search Params:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {debugInfo.urlSearchParams}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Extracted Parameters:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {JSON.stringify(debugInfo.extractedParams, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Transaction ID Check:</h2>
        <div style={{ background: debugInfo.extractedParams?.transactionId ? '#d4edda' : '#f8d7da', padding: '10px' }}>
          Transaction ID: {debugInfo.extractedParams?.transactionId || 'NULL'}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Payment ID Check:</h2>
        <div style={{ background: debugInfo.extractedParams?.paymentId ? '#d4edda' : '#f8d7da', padding: '10px' }}>
          Payment ID: {debugInfo.extractedParams?.paymentId || 'NULL'}
        </div>
      </div>
    </div>
  );
};

export default DebugUrlParams;
