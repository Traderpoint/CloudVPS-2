import Head from 'next/head';
import Link from 'next/link';
import MiddlewareLayout from '../components/MiddlewareLayout';

export default function TestPortal() {
  const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

  // Show configuration error if middleware URL is not set
  if (!middlewareUrl) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ margin: '0 0 15px 0' }}>⚠️ Configuration Error</h2>
          <p style={{ margin: '0 0 15px 0' }}>
            NEXT_PUBLIC_MIDDLEWARE_URL is not configured in environment variables.
          </p>
          <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
            Please set NEXT_PUBLIC_MIDDLEWARE_URL in .env.local file
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>HostBill Test Portal</title>
      </Head>

      <MiddlewareLayout>
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
        
        {/* Configuration Info */}
        <div style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>
            🔧 API Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>HostBill Direct API</h4>
              <div style={{ fontSize: '14px', color: '#0c5460' }}>
                <div><strong>Domain:</strong> {process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN || 'vps.kabel1it.cz'}</div>
                <div><strong>API URL:</strong> {process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz'}/admin/api.php</div>
                <div><strong>API ID:</strong> {process.env.HOSTBILL_API_ID ? `${process.env.HOSTBILL_API_ID.substring(0, 8)}...` : 'adcdebb0...'}</div>
                <div><strong>Status:</strong> <span style={{ color: '#28a745' }}>✅ Configured</span></div>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>Middleware API</h4>
              <div style={{ fontSize: '14px', color: '#0c5460' }}>
                <div><strong>URL:</strong> {middlewareUrl}</div>
                <div><strong>Health:</strong> /health</div>
                <div><strong>Affiliates:</strong> /api/affiliates</div>
                <div><strong>Status:</strong> <span style={{ color: '#28a745' }}>✅ Available</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>
            ⚠️ Testovací prostředí
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>
            Testovací prostředí obsahuje jak middleware testy (doporučené), tak přímé HostBill API testy.
            Všechny API klíče jsou nakonfigurovány v .env.local souboru.
          </p>
        </div>

        {/* Test Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Middleware Tests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
              🔗 Middleware Testy
            </h2>

            {/* Test Mode Info */}
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              <strong>🧪 Test Mode:</strong> Platby používají simulovanou bránu na localhost:3010/test-payment
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e1f5fe',
                border: '2px solid #0288d1',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#0277bd',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                🎛️ Middleware Dashboard
              </Link>

              <Link href="/middleware-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                🚀 Middleware Connection Test
              </Link>

              <Link href="/middleware-affiliate-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1976d2',
                transition: 'all 0.2s'
              }}>
                🎯 Middleware Affiliate Test
              </Link>

              <Link href="/middleware-affiliate-products" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d1ecf1',
                border: '1px solid #17a2b8',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#0c5460',
                transition: 'all 0.2s'
              }}>
                📦 Middleware Products (Affiliate/All)
              </Link>

              <Link href="/middleware-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s'
              }}>
                🛒 Middleware Order Test
              </Link>

              <Link href="/test-client-area" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                👤 Client Area API Test
              </Link>

              <Link href="/test-billing-order" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s'
              }}>
                💳 Billing Order Test
              </Link>

              <Link href="/payment-flow-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                💳 Payment Flow Test
              </Link>

              <Link href="/real-payment-flow-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#6a1b9a',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                💳 Real Payment Flow Test
              </Link>

              <Link href="/product-mapping-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🔗 Product Mapping Test
              </Link>

              <Link href="/advanced-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🚀 Advanced Order Test (Middleware)
              </Link>

              <Link href="/payment-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e1f5fe',
                border: '2px solid #0288d1',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#0277bd',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                💳 Payment System Test (Middleware)
              </Link>

              <Link href="/test-payment-gateway" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🧪 Test Payment Gateway
              </Link>

              <Link href="/payment-methods-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🔍 Payment Methods Test
              </Link>

              <Link href="/product-mapping-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🔗 Product Mapping Test
              </Link>

              <Link href="/advanced-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🚀 Advanced Order Test (Middleware)
              </Link>

              <Link href="/test-client-area" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                👤 Client Area API Test
              </Link>

              <Link href="/test-billing-order" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s'
              }}>
                💳 Billing Order Test
              </Link>

              <Link href="/middleware-payment-modules" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                🔧 Middleware Payment Modules + Comgate Test
              </Link>

              <Link href="/middleware-oauth-tests" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                🔐 Google OAuth & Email Tests
              </Link>

              <Link href="/capture-payment-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                💰 Middleware Capture Payment Test
              </Link>

              <Link href="/invoice-payment-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff8e1',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                💰 Invoice Payment Test (Gateway + Mark as PAID)
              </Link>
            </div>
          </div>

          {/* Direct HostBill Tests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#007bff' }}>
              👥 Direct HostBill Testy
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/affiliate-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1976d2',
                transition: 'all 0.2s'
              }}>
                🔍 Základní Affiliate Test
              </Link>

              <Link href="/affiliate-test-real" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🛒 Reálný Affiliate Test
              </Link>

              <Link href="/affiliate-products-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s'
              }}>
                📦 Direct HostBill Products (Affiliate/All)
              </Link>

              <Link href="/direct-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🛒 Direct HostBill Order Test
              </Link>

              <Link href="/direct-advanced-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#c62828',
                transition: 'all 0.2s'
              }}>
                ⚡ Direct Advanced Order Test
              </Link>

              <Link href="/affiliate-scenarios" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🎭 Affiliate Scénáře
              </Link>

              <Link href="/payment-test?mode=direct" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '2px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                💳 Payment System Test (Direct)
              </Link>

              <Link href="/direct-payment-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fce4ec',
                border: '1px solid #e91e63',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#c2185b',
                transition: 'all 0.2s'
              }}>
                🎯 Direct HostBill Payment Test
              </Link>

              <Link href="/real-payment-methods-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '2px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                🔍 Real Payment Methods Test
              </Link>

              <Link href="/hostbill-modules-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🏢 HostBill Payment Modules
              </Link>

              <Link href="/complete-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff8e1',
                border: '2px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                🛒 Complete Order Workflow Test
              </Link>

              <Link href="/integration-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '3px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                🔗 CloudVPS ↔ Middleware Integration Test
              </Link>
            </div>
          </div>

          {/* Debug Tools */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#dc3545' }}>
              🐛 Debug Nástroje
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/debug-affiliate" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#c62828',
                transition: 'all 0.2s'
              }}>
                🔧 Debug Affiliate Data
              </Link>

              <a href="/api/hostbill/test-affiliate-api" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e1f5fe',
                border: '1px solid #00bcd4',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#00838f',
                transition: 'all 0.2s'
              }}>
                🔗 Test HostBill API
              </a>

              <a href="/api/hostbill/get-all-affiliates" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f1f8e9',
                border: '1px solid #8bc34a',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#558b2f',
                transition: 'all 0.2s'
              }}>
                📋 Všichni Affiliates
              </a>
            </div>
          </div>

          {/* Production Links */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
              🚀 Produkční Aplikace
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="http://localhost:3000" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                🏠 CloudVPS Hlavní Stránka
              </a>

              <a href="http://localhost:3000/checkout" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                🛒 CloudVPS Checkout (Middleware)
              </a>

              <a href="http://localhost:3000/pricing" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                💰 CloudVPS Ceník
              </a>

              <a href="http://localhost:3000/payment-method" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                💳 CloudVPS Payment Method
              </a>

              <a href="http://localhost:3006" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#856404',
                transition: 'all 0.2s'
              }}>
                👥 Partners Portal (Port 3006)
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '50px',
          padding: '20px 0',
          borderTop: '1px solid #dee2e6',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <p style={{ margin: 0 }}>
            Test Portal pro HostBill API | Middleware Port: 3005
          </p>
        </footer>
        </div>
      </MiddlewareLayout>
    </>
  );
}
