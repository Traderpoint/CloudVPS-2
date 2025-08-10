import { useState } from 'react';
import Head from 'next/head';

export default function MiddlewareTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 Running middleware test...');
      const response = await fetch('/api/middleware/test-affiliate');
      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Middleware test completed:', data);
      } else {
        setError(data.error || 'Test failed');
        console.error('❌ Middleware test failed:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error running middleware test:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Test</title>
      </Head>

      <h1>🔗 Middleware Test</h1>
      <p>Test komunikace s middleware serverem na portu 3005</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runTest}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '⏳ Testing...' : '🚀 Run Middleware Test'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '20px'
        }}>
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          color: '#155724',
          marginBottom: '20px'
        }}>
          <h3>✅ Test Results</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e2e3e5',
        borderRadius: '4px'
      }}>
        <h3>ℹ️ Test Information</h3>
        <ul>
          <li>Tests connection to middleware server</li>
          <li>Validates API endpoints</li>
          <li>Checks affiliate data retrieval</li>
          <li>Verifies response format</li>
        </ul>
      </div>
    </div>
  );
}
