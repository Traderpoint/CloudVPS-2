import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '🎛️' },
  { name: 'Test Portal', href: '/test-portal', icon: '🧪' },
  { name: 'Payment Gateway', href: '/test-payment-gateway', icon: '💳' },
  { name: 'Payment Modules', href: '/middleware-payment-modules', icon: '🔧' },
  { name: 'Affiliate Tests', href: '/middleware-affiliate-test', icon: '👥' },
  { name: 'Order Tests', href: '/middleware-order-test', icon: '📦' },
  { name: 'Debug Tools', href: '/debug-affiliate', icon: '🐛' },
];

const externalLinks = [
  { name: 'CloudVPS App', href: 'http://localhost:3000', icon: '🏠', description: 'Main CloudVPS Application' },
  { name: 'Partners Portal', href: 'http://localhost:3006', icon: '👥', description: 'Affiliate Partners Portal' },
  { name: 'HostBill Admin', href: 'https://vps.kabel1it.cz/admin', icon: '🏢', description: 'HostBill Administration' },
];

export default function MiddlewareLayout({ children, status = null, onRefresh = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const getStatusColor = () => {
    if (!status) return 'bg-gray-100 text-gray-800';
    return status.hostbill?.connected 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (!status) return 'Loading...';
    return status.hostbill?.connected ? 'Online' : 'Offline';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Systrix Middleware</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <span className="text-2xl">✕</span>
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">🎛️ Systrix Middleware</h1>
          </div>
          
          {/* Status indicator */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {status && (
              <div className="text-xs text-gray-500 mt-1">
                Port: {status.port || '3005'} • Uptime: {status.uptime ? Math.floor(status.uptime / 60) : 0}m
              </div>
            )}
          </div>

          {/* Main navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">
              Main Functions
            </div>
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* External links */}
          <div className="border-t border-gray-200 px-2 py-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">
              External Services
            </div>
            {externalLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                title={item.description}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
                <span className="ml-auto text-xs text-gray-400">↗</span>
              </a>
            ))}
          </div>

          {/* Footer info */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500">
              <div className="font-semibold">Systrix Middleware v2.0</div>
              <div>HostBill API Gateway</div>
              <div className="mt-2">
                {status?.timestamp && (
                  <div>Last update: {new Date(status.timestamp).toLocaleTimeString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <button onClick={() => setSidebarOpen(true)}>
              <span className="text-2xl">☰</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Systrix Middleware</h1>
            <div className="w-6" />
          </div>
        </div>

        {/* Page header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {router.pathname === '/' ? 'Dashboard' : 
                   router.pathname === '/test-portal' ? 'Test Portal' :
                   router.pathname === '/test-payment-gateway' ? 'Payment Gateway Test' :
                   router.pathname === '/middleware-payment-modules' ? 'Payment Modules' :
                   router.pathname === '/middleware-affiliate-test' ? 'Affiliate Tests' :
                   router.pathname === '/middleware-order-test' ? 'Order Tests' :
                   router.pathname === '/debug-affiliate' ? 'Debug Tools' :
                   'Middleware'}
                </h1>
                <p className="text-sm text-gray-500">
                  {router.pathname === '/' ? 'System overview and monitoring' :
                   router.pathname === '/test-portal' ? 'Complete testing environment' :
                   router.pathname === '/test-payment-gateway' ? 'Payment gateway testing' :
                   router.pathname === '/middleware-payment-modules' ? 'Payment module configuration' :
                   router.pathname === '/middleware-affiliate-test' ? 'Affiliate system testing' :
                   router.pathname === '/middleware-order-test' ? 'Order processing tests' :
                   router.pathname === '/debug-affiliate' ? 'Debug and diagnostic tools' :
                   'Middleware management'}
                </p>
              </div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔄 Refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
