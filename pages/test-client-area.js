import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function TestClientArea() {
  const router = useRouter();
  const [clientId, setClientId] = useState('1'); // Default test client ID
  const [profileData, setProfileData] = useState(null);
  const [servicesData, setServicesData] = useState(null);
  const [invoicesData, setInvoicesData] = useState(null);
  const [ticketsData, setTicketsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testClientAPI = async () => {
    if (!clientId) {
      setError('Please enter a client ID');
      return;
    }

    setLoading(true);
    setError(null);
    setProfileData(null);
    setServicesData(null);
    setInvoicesData(null);
    setTicketsData(null);

    try {
      console.log(`🔍 Testing client API for ID: ${clientId}`);

      // Test all client API endpoints
      const [profileRes, servicesRes, invoicesRes, ticketsRes] = await Promise.all([
        fetch(`/api/client/profile?client_id=${clientId}`),
        fetch(`/api/client/services?client_id=${clientId}`),
        fetch(`/api/client/invoices?client_id=${clientId}`),
        fetch(`/api/client/tickets?client_id=${clientId}`)
      ]);

      // Process profile
      if (profileRes.ok) {
        const profileResult = await profileRes.json();
        setProfileData(profileResult);
        console.log('✅ Profile loaded:', profileResult);
      } else {
        console.error('❌ Profile failed:', profileRes.status);
      }

      // Process services
      if (servicesRes.ok) {
        const servicesResult = await servicesRes.json();
        setServicesData(servicesResult);
        console.log('✅ Services loaded:', servicesResult);
      } else {
        console.error('❌ Services failed:', servicesRes.status);
      }

      // Process invoices
      if (invoicesRes.ok) {
        const invoicesResult = await invoicesRes.json();
        setInvoicesData(invoicesResult);
        console.log('✅ Invoices loaded:', invoicesResult);
      } else {
        console.error('❌ Invoices failed:', invoicesRes.status);
      }

      // Process tickets
      if (ticketsRes.ok) {
        const ticketsResult = await ticketsRes.json();
        setTicketsData(ticketsResult);
        console.log('✅ Tickets loaded:', ticketsResult);
      } else {
        console.error('❌ Tickets failed:', ticketsRes.status);
      }

    } catch (err) {
      console.error('❌ Test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderApiResult = (title, data, color) => {
    if (!data) return null;

    return (
      <div style={{
        backgroundColor: data.success ? '#d4edda' : '#f8d7da',
        border: `1px solid ${data.success ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: data.success ? '#155724' : '#721c24',
          fontSize: '18px'
        }}>
          {data.success ? '✅' : '❌'} {title}
        </h4>
        
        {data.success ? (
          <div>
            <div style={{ marginBottom: '10px', fontSize: '14px' }}>
              <strong>Data Count:</strong> {Array.isArray(data.data) ? data.data.length : 1} items
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                View Raw Data
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '10px'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div style={{ color: '#721c24' }}>
            <strong>Error:</strong> {data.error}
            {data.details && (
              <div style={{ marginTop: '5px', fontSize: '12px' }}>
                <strong>Details:</strong> {data.details}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Test Client Area API - Cloud VPS</title>
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

      <h1>🧪 Test Client Area API</h1>
      <p>Test načítání klientských dat přes middleware API</p>

      {/* API Info */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔌 API Information:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li><strong>Frontend API:</strong> /api/client/* (proxy)</li>
          <li><strong>Middleware API:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}/api/client/*</li>
          <li><strong>Data Source:</strong> Middleware → HostBill API</li>
          <li><strong>Authentication:</strong> Client ID required</li>
        </ul>
      </div>

      {/* Test Controls */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🔧 Test Parameters</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
          <label>
            <strong>Client ID:</strong>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100px'
              }}
              placeholder="Enter client ID"
            />
          </label>
          <button
            onClick={testClientAPI}
            disabled={loading || !clientId}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Testing...' : '🧪 Test Client API'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Testing client API...</h3>
          <p>Fetching data from middleware for client ID: {clientId}</p>
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

      {/* Results */}
      {(profileData || servicesData || invoicesData || ticketsData) && (
        <div>
          <h2>📊 API Test Results</h2>
          {renderApiResult('Client Profile', profileData)}
          {renderApiResult('Client Services', servicesData)}
          {renderApiResult('Client Invoices', invoicesData)}
          {renderApiResult('Client Tickets', ticketsData)}
        </div>
      )}

      {/* Quick Links */}
      <div style={{
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>🔗 Quick Links</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/client-area"
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Client Area (requires login)
          </a>
          <a
            href="/register"
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Login/Register
          </a>
        </div>
      </div>
    </div>
  );
}
