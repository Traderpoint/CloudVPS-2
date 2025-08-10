/**
 * Dashboard page for Systrix Middleware NextJS
 * Displays middleware status and management interface with Partners Portal style sidebar
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import MiddlewareLayout from '../components/MiddlewareLayout';

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStatus}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Systrix Middleware Dashboard</title>
        <meta name="description" content="Systrix Middleware Dashboard - NextJS" />
      </Head>

      <MiddlewareLayout status={status} onRefresh={fetchStatus}>

        {/* Loading State */}
        {loading && !status && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-lg text-gray-600">Loading dashboard data...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="text-2xl mr-3">❌</div>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchStatus}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        {status && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Server Status */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🖥️</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Server Status
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {status?.server?.status || 'Running'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Uptime: </span>
                    <span className="font-medium text-gray-900">
                      {status?.uptime ? formatUptime(status.uptime) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

            {/* HostBill Connection */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🔌</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        HostBill API
                      </dt>
                      <dd className={`text-lg font-medium ${
                        status?.hostbill?.connected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {status?.hostbill?.connected ? 'Connected' : 'Disconnected'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-gray-500">URL: </span>
                  <span className="font-medium text-gray-900 text-xs">
                    {status?.hostbill?.api_url || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Mapping */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🔗</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Product Mappings
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {status?.mapping?.totalMappings || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-gray-500">Status: </span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚙️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Environment
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {status?.server?.environment || 'Unknown'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-gray-500">Version: </span>
                  <span className="font-medium text-gray-900">
                    {status?.server?.version || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                🚀 Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href="/api/products"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  📦 View Products
                </a>
                <a
                  href="/api/affiliates"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  👥 View Affiliates
                </a>
                <a
                  href="/api/status"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  📊 API Status
                </a>
                <a
                  href="/api/test-connection"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  🧪 Test Connection
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                🚀 Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href="/test-portal"
                  className="block p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                >
                  🧪 Test Portal
                </a>
                <a
                  href="/test-payment-gateway"
                  className="block p-4 bg-purple-50 border-2 border-purple-200 rounded-lg text-center text-purple-700 font-semibold hover:bg-purple-100 transition-colors"
                >
                  💳 Payment Gateway Test
                </a>
                <a
                  href="/middleware-payment-modules"
                  className="block p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center text-green-700 font-semibold hover:bg-green-100 transition-colors"
                >
                  🔧 Payment Modules
                </a>
                <a
                  href="/api/health"
                  target="_blank"
                  className="block p-4 bg-orange-50 border-2 border-orange-200 rounded-lg text-center text-orange-700 font-semibold hover:bg-orange-100 transition-colors"
                >
                  ❤️ Health Check
                </a>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                ℹ️ System Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Update</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Middleware URL</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {status?.middlewareUrl || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Requests</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {status?.dashboardStats?.requests || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Errors</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {status?.dashboardStats?.errors || 0}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          </div>
        )}
      </MiddlewareLayout>
    </>
  );
}
