/**
 * Original Express-style Dashboard API endpoint for Systrix Middleware NextJS
 * Returns the complete HTML dashboard from systrix-middleware
 */

const HostBillClient = require('../../lib/hostbill-client');
const productMapper = require('../../lib/product-mapper');
const logger = require('../../utils/logger');

// Dashboard stats tracking
let dashboardStats = {
  requests: 0,
  errors: 0,
  startTime: new Date(),
  lastActivity: new Date(),
  recentRequests: []
};

// Generate CloudVPS-style dashboard HTML (original from Express middleware)
function generateCloudVpsDashboard(data) {
  const { status, mapping, hostbillConnected, uptime, lastUpdate, middlewareUrl, dashboardStats } = data;

  const getStatusColor = () => status.online ? '#28a745' : '#dc3545';
  const getStatusText = () => status.online ? 'Online' : 'Offline';

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getCloudVpsProductName = (id) => {
    const names = {
      '1': 'VPS Basic',
      '2': 'VPS Pro',
      '3': 'VPS Premium',
      '4': 'VPS Enterprise'
    };
    return names[id] || 'Unknown Product';
  };

  const getHostBillProductName = (id) => {
    const names = {
      '5': 'VPS Start',
      '10': 'VPS Profi',
      '11': 'VPS Premium',
      '12': 'VPS Enterprise'
    };
    return names[id] || 'Unknown Product';
  };

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #f9fafb;
            min-height: 100vh;
            color: #111827;
        }

        .layout {
            display: flex;
            min-height: 100vh;
        }

        /* Partners Portal Style Sidebar */
        .sidebar {
            width: 16rem;
            background: white;
            border-right: 1px solid #e5e7eb;
            flex-shrink: 0;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .sidebar-header {
            display: flex;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            height: 4rem;
        }

        .sidebar-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #111827;
        }

        .sidebar-nav {
            padding: 1rem 0.5rem;
            flex: 1;
        }

        .nav-item {
            display: flex;
            align-items: center;
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.25rem;
            border-radius: 0.375rem;
            color: #6b7280;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .nav-item:hover {
            background: #f9fafb;
            color: #111827;
        }

        .nav-item.active {
            background: #dbeafe;
            color: #1e40af;
        }

        .nav-icon {
            width: 1.5rem;
            height: 1.5rem;
            margin-right: 0.75rem;
            flex-shrink: 0;
            font-size: 1.5rem;
        }

        /* Partners Portal Style Main Content */
        .main-content {
            flex: 1;
            margin-left: 16rem;
            min-height: 100vh;
        }

        .content-header {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-title h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.25rem;
        }

        .header-title p {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 500;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        /* Partners Portal Style Buttons */
        .btn-primary {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            border: none;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.375rem;
            background: #2563eb;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s ease;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .btn-primary:hover {
            background: #1d4ed8;
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .status-online {
            background: #dcfce7;
            color: #166534;
        }

        .status-offline {
            background: #fecaca;
            color: #b91c1c;
        }

        .last-update {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
        }

        /* Partners Portal Style Content Area */
        .content-area {
            padding: 1.5rem 2rem;
        }

        /* Partners Portal Style Sections */
        .dashboard-section {
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .section-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
            margin-bottom: 1rem;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .action-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1.5rem 1rem;
            border-radius: 0.5rem;
            color: white;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
            font-family: inherit;
            text-align: center;
        }

        .action-tile:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .action-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 3rem;
            height: 3rem;
            border-radius: 0.5rem;
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
            background: rgba(255, 255, 255, 0.2);
        }

        .action-title {
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .action-description {
            font-size: 0.75rem;
            opacity: 0.9;
            font-weight: 400;
        }

        /* Partners Portal Action Colors */
        .action-products {
            background: #2563eb;
        }

        .action-affiliates {
            background: #059669;
        }

        .action-refresh {
            background: #7c3aed;
        }

        .action-status {
            background: #dc2626;
        }

        /* Partners Portal Dashboard Grid */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        }

        .metric-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: all 0.2s ease;
        }

        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .metric-header {
            display: flex;
            align-items: center;
            justify-content: between;
            margin-bottom: 1rem;
        }

        .metric-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            flex: 1;
        }

        .metric-icon {
            width: 2rem;
            height: 2rem;
            border-radius: 0.375rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            color: white;
            flex-shrink: 0;
        }

        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.5rem;
        }

        .metric-details {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .metric-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
        }

        .metric-detail:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-size: 0.875rem;
            font-weight: 400;
            color: #6b7280;
        }

        .detail-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: #111827;
        }



        /* Responsive Design */
        @media (max-width: 1024px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }

            .main-content {
                margin-left: 0;
            }

            .sidebar.open {
                transform: translateX(0);
            }
        }

        @media (max-width: 768px) {
            .content-area {
                padding: 1rem;
            }

            .content-header {
                padding: 1rem;
            }

            .header-content {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .actions-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
            }
        }
    </style>
</head>
<body>
    <div class="layout">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">🎛️ Middleware</div>
            </div>
            <nav class="sidebar-nav">
                <a href="/" class="nav-item active">
                    <span class="nav-icon">📊</span>
                    Dashboard
                </a>
                <a href="/api/status" class="nav-item">
                    <span class="nav-icon">🔍</span>
                    API Status
                </a>
                <a href="/api/products" class="nav-item">
                    <span class="nav-icon">📦</span>
                    Products
                </a>
                <a href="/api/affiliates" class="nav-item">
                    <span class="nav-icon">👥</span>
                    Affiliates
                </a>
                <a href="http://localhost:3000/test-portal" class="nav-item" target="_blank">
                    <span class="nav-icon">🎯</span>
                    Test Portal
                </a>
                <a href="http://localhost:3006/" class="nav-item" target="_blank">
                    <span class="nav-icon">🌐</span>
                    Partners Portal
                </a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="content-header">
                <div class="header-content">
                    <div>
                        <h1>Systrix Middleware Dashboard</h1>
                        <p>NextJS Implementation - Port ${status.port} - Status: <span class="status-badge ${status.online ? 'status-online' : 'status-offline'}">${getStatusText()}</span></p>
                    </div>
                    <div class="header-actions">
                        <div class="last-update">
                            Last update: ${lastUpdate.toLocaleTimeString()}
                        </div>
                        <button class="btn-primary" onclick="location.reload()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="content-area">
                <!-- Quick Actions -->
                <div class="dashboard-section">
                    <h3 class="section-title">🚀 Quick Actions</h3>
                    <div class="actions-grid">
                        <button class="action-tile action-products" onclick="window.open('/api/products', '_blank')">
                            <div class="action-icon">📦</div>
                            <div class="action-title">View Products</div>
                            <div class="action-description">Browse all products</div>
                        </button>

                        <button class="action-tile action-affiliates" onclick="window.open('/api/affiliates', '_blank')">
                            <div class="action-icon">👥</div>
                            <div class="action-title">Affiliates</div>
                            <div class="action-description">View affiliate data</div>
                        </button>

                        <button class="action-tile action-refresh" onclick="location.reload()">
                            <div class="action-icon">🔄</div>
                            <div class="action-title">Refresh Data</div>
                            <div class="action-description">Update all data</div>
                        </button>

                        <button class="action-tile action-status" onclick="window.open('/api/status', '_blank')">
                            <div class="action-icon">🧪</div>
                            <div class="action-title">API Status</div>
                            <div class="action-description">Check API health</div>
                        </button>
                    </div>
                </div>

                <!-- Key Performance Metrics -->
                <div class="dashboard-section">
                    <h3 class="section-title">📊 Key Performance Metrics</h3>
                    <div class="dashboard-grid">
                        <!-- Server Status -->
                        <div class="metric-card">
                            <div class="metric-header">
                                <div class="metric-title">Server Status</div>
                                <div class="metric-icon" style="background: ${status.online ? '#059669' : '#dc2626'};">🖥️</div>
                            </div>
                            <div class="metric-value">${getStatusText()}</div>
                            <div class="metric-details">
                                <div class="metric-detail">
                                    <span class="detail-label">Port</span>
                                    <span class="detail-value">${status.port}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">Version</span>
                                    <span class="detail-value">${status.version}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">Uptime</span>
                                    <span class="detail-value">${formatUptime(uptime)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Product Mapping -->
                        <div class="metric-card">
                            <div class="metric-header">
                                <div class="metric-title">Product Mapping</div>
                                <div class="metric-icon" style="background: #7c3aed;">🔗</div>
                            </div>
                            <div class="metric-value">${mapping.totalMappings}</div>
                            <div class="metric-details">
                                <div class="metric-detail">
                                    <span class="detail-label">Cloud VPS Products</span>
                                    <span class="detail-value">${mapping.cloudVpsProducts?.length || 0}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">HostBill Products</span>
                                    <span class="detail-value">${mapping.hostbillProducts?.length || 0}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">Status</span>
                                    <span class="detail-value">Active</span>
                                </div>
                            </div>
                        </div>

                        <!-- Configuration -->
                        <div class="metric-card">
                            <div class="metric-header">
                                <div class="metric-title">Configuration</div>
                                <div class="metric-icon" style="background: #f59e0b;">⚙️</div>
                            </div>
                            <div class="metric-value">Development</div>
                            <div class="metric-details">
                                <div class="metric-detail">
                                    <span class="detail-label">Environment</span>
                                    <span class="detail-value">development</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">Port</span>
                                    <span class="detail-value">${status.port}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">URL</span>
                                    <span class="detail-value">${middlewareUrl}</span>
                                </div>
                            </div>
                        </div>

                        <!-- API Health -->
                        <div class="metric-card">
                            <div class="metric-header">
                                <div class="metric-title">API Health</div>
                                <div class="metric-icon" style="background: #2563eb;">🔌</div>
                            </div>
                            <div class="metric-value">${status.online ? 'Healthy' : 'Unhealthy'}</div>
                            <div class="metric-details">
                                <div class="metric-detail">
                                    <span class="detail-label">HostBill API</span>
                                    <span class="detail-value">${hostbillConnected ? 'Connected' : 'Disconnected'}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">Order Processing</span>
                                    <span class="detail-value">${status.online ? 'Available' : 'Unavailable'}</span>
                                </div>
                                <div class="metric-detail">
                                    <span class="detail-label">Product Sync</span>
                                    <span class="detail-value">${mapping.totalMappings > 0 ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            location.reload();
        }, 30000);

        // Enhanced hover effects are handled by CSS
        // Add loading animation to refresh button
        document.querySelector('.btn-primary').addEventListener('click', function() {
            this.innerHTML = '⏳ Refreshing...';
            this.disabled = true;
        });
    </script>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Increment request counter
    dashboardStats.requests++;
    dashboardStats.lastActivity = new Date();

    const hostbillClient = new HostBillClient();
    
    // Get middleware health
    let status = {
      online: false,
      port: process.env.PORT || 3005,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      error: null
    };

    let hostbillConnected = false;
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      status.online = true;
      hostbillConnected = !!testResult;
    } catch (error) {
      status.error = error.message;
    }

    // Get product mapping stats
    const mappingStats = productMapper.getStats();
    const mapping = {
      totalMappings: mappingStats.totalMappings,
      cloudVpsProducts: mappingStats.cloudVpsProducts,
      hostbillProducts: mappingStats.hostbillProducts,
      mappings: mappingStats.mappings || {}
    };

    // Get system stats
    const uptime = Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000);
    const lastUpdate = new Date();

    // Generate CloudVPS-style dashboard HTML
    const dashboardHtml = generateCloudVpsDashboard({
      status,
      mapping,
      hostbillConnected,
      uptime,
      lastUpdate,
      middlewareUrl: `http://localhost:${process.env.PORT || 3005}`,
      dashboardStats
    });

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(dashboardHtml);
  } catch (error) {
    dashboardStats.errors++;
    logger.error('Dashboard error', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
