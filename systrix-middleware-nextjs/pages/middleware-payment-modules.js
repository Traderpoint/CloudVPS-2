import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function MiddlewarePaymentModulesTest() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [rawModules, setRawModules] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadMiddlewarePaymentModules();
  }, []);

  const loadMiddlewarePaymentModules = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading payment modules via middleware...');
      console.log('🔧 Environment variables:', {
        NEXT_PUBLIC_MIDDLEWARE_URL: process.env.NEXT_PUBLIC_MIDDLEWARE_URL,
        NODE_ENV: process.env.NODE_ENV
      });
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      console.log('🔗 Middleware URL:', middlewareUrl);
      console.log('🌐 Full URL:', `${middlewareUrl}/api/payment-modules`);

      const response = await fetch(`${middlewareUrl}/api/payment-modules`);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Raw response data:', data);

      if (data.success) {
        setModules(data.modules || []);
        setApiInfo(data.apiInfo);
        setRawModules(data.rawModules);
        setStats({
          total: data.total,
          known: data.known,
          unknown: data.unknown
        });
        console.log('✅ Payment modules loaded via middleware:', data.modules);
      } else {
        throw new Error(data.error || 'Failed to load payment modules via middleware');
      }
    } catch (err) {
      console.error('❌ Error loading payment modules via middleware:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatusColor = (module) => {
    if (module.isExternal) {
      return '#9c27b0'; // Purple for external modules
    }
    if (module.enabled) {
      return module.known ? '#28a745' : '#ffc107';
    }
    return '#dc3545';
  };

  const getModuleStatusIcon = (module) => {
    if (module.isExternal) {
      return '🌐';
    }
    if (module.enabled) {
      return module.known ? '✅' : '⚠️';
    }
    return '❌';
  };

  const getModuleStatusText = (module) => {
    if (module.isExternal) {
      return 'External';
    }
    if (module.enabled) {
      return module.known ? 'Active & Mapped' : 'Active (Unknown)';
    }
    return 'Inactive';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Middleware Payment Modules Test - Cloud VPS</title>
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

      <h1>🔧 Middleware Payment Modules Test</h1>
      <p>Platební moduly načtené přes middleware na portu 3005</p>

      {/* Middleware Info */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔌 Middleware Information:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li><strong>Middleware URL:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}</li>
          <li><strong>Endpoint:</strong> /api/payment-modules</li>
          <li><strong>Data Source:</strong> Middleware → HostBill API</li>
          <li><strong>Communication:</strong> EXCLUSIVELY via middleware (no fallback)</li>
        </ul>
      </div>

      {/* API Info */}
      {apiInfo && (
        <div style={{
          backgroundColor: '#f0f8ff',
          border: '1px solid #4169e1',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4169e1' }}>📊 API Information:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#4169e1' }}>
            <li><strong>getPaymentModules Available:</strong> {apiInfo.hasGetPaymentModules ? '✅ Yes' : '❌ No'}</li>
            <li><strong>Server Time:</strong> {new Date(apiInfo.serverTime * 1000).toLocaleString()}</li>
            <li><strong>Source:</strong> HostBill API via Middleware</li>
          </ul>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div style={{
          backgroundColor: '#fff3e0',
          border: '1px solid #ff9800',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>📈 Statistics:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#007bff' }}>{stats.total}</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Modules</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#28a745' }}>{stats.known}</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Known & Mapped</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ffc107' }}>{stats.unknown}</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Unknown</div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={loadMiddlewarePaymentModules}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh Middleware Modules'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          <strong>❌ Error:</strong> {error}
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Make sure middleware is running on port 3005
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Loading payment modules...</h3>
          <p>Fetching data from middleware API...</p>
        </div>
      )}

      {/* Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {modules.map((module) => {
          const statusColor = getModuleStatusColor(module);

          return (
            <div
              key={module.id}
              style={{
                backgroundColor: 'white',
                border: `2px solid ${statusColor}`,
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>{module.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>{module.name}</h3>
                  <small style={{ color: '#6c757d' }}>
                    Module ID: {module.id} | Method: {module.method}
                  </small>
                </div>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: statusColor,
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getModuleStatusIcon(module)} {getModuleStatusText(module)}
                </div>
              </div>

              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                {module.isExternal ? (
                  <>
                    <div><strong>Payment Method:</strong> {module.method}</div>
                    <div><strong>Type:</strong> Standalone Payment Gateway</div>
                    <div><strong>Source:</strong> {module.apiEndpoint || 'External API'}</div>
                    <div><strong>Integration:</strong> Direct API calls via middleware</div>
                    {module.testMode && (
                      <div><strong>Test Mode:</strong> ✅ Enabled</div>
                    )}
                    {module.merchantId && (
                      <div><strong>Merchant ID:</strong> {module.merchantId}</div>
                    )}
                    <div style={{ color: '#9c27b0' }}>
                      <strong>Status:</strong> ✅ Available via Middleware
                    </div>
                  </>
                ) : (
                  <>
                    <div><strong>HostBill Module ID:</strong> {module.hostbillModuleId}</div>
                    <div><strong>Payment Method:</strong> {module.method}</div>
                    <div><strong>Type:</strong> {module.type}</div>
                    <div><strong>Source:</strong> {module.source}</div>
                    <div><strong>Known Mapping:</strong> {module.known ? '✅ Yes' : '❌ No'}</div>
                    {module.enabled && (
                      <div style={{ color: '#28a745' }}>
                        <strong>Status:</strong> ✅ Active via Middleware
                      </div>
                    )}
                  </>
                )}
              </div>

              {module.isExternal && module.integration && (
                <div style={{
                  backgroundColor: '#f3e5f5',
                  border: '1px solid #ce93d8',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>🌟 External Integration:</strong> {module.integration}
                </div>
              )}

              {!module.known && module.enabled && !module.isExternal && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>⚠️ Unknown Module:</strong> This module is active in HostBill but not mapped in middleware.
                  Custom integration may be required.
                </div>
              )}

              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '12px'
              }}>
                <strong>Integration Status:</strong><br/>
                {module.isExternal ? (
                  <span style={{ color: '#9c27b0' }}>
                    ✅ {module.integrationStatus || 'Ready for use - External payment processor integrated via middleware'}
                  </span>
                ) : module.enabled ? (
                  module.known ? (
                    <span style={{ color: '#28a745' }}>
                      ✅ Ready for use - Module is active and properly mapped via middleware
                    </span>
                  ) : (
                    <span style={{ color: '#ffc107' }}>
                      ⚠️ Requires attention - Active but unknown module type
                    </span>
                  )
                ) : (
                  <span style={{ color: '#dc3545' }}>
                    ❌ Not available - Module not active in HostBill
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>



      {modules.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: '#6c757d',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔧</div>
          <div>No payment modules found via middleware</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Check middleware connection and HostBill API
          </div>
        </div>
      )}

      {/* Raw Modules Data */}
      {rawModules && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔍 Raw HostBill Modules Data</h3>
          <pre style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '15px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(rawModules, null, 2)}
          </pre>
        </div>
      )}

      {/* Summary */}
      {modules.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Modules Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#28a745' }}>
                {modules.filter(m => m.enabled && m.known).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Active & Mapped</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ffc107' }}>
                {modules.filter(m => m.enabled && !m.known).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Active (Unknown)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#dc3545' }}>
                {modules.filter(m => !m.enabled).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Inactive</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#007bff' }}>
                {modules.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total</div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔧 Middleware Integration Notes:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2', fontSize: '14px' }}>
              <li>All data is fetched exclusively through middleware (no fallback)</li>
              <li>Middleware communicates directly with HostBill API</li>
              <li>Known modules are pre-mapped for Cloud VPS integration</li>
              <li>Unknown modules may require custom integration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
