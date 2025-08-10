import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function VPSDashboard() {
  const router = useRouter();
  const [vpsData, setVpsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Load VPS data on mount
  useEffect(() => {
    const storedVpsData = sessionStorage.getItem('vpsSetupData');
    if (storedVpsData) {
      const data = JSON.parse(storedVpsData);
      setVpsData(data);
    } else {
      // Redirect if no VPS data
      router.push('/vps');
    }
  }, [router]);

  const handleRebootVPS = async () => {
    setIsLoading(true);
    // Simulate reboot
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    alert('VPS has been rebooted successfully');
  };

  const handleStopVPS = async () => {
    setIsLoading(true);
    // Simulate stop
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    alert('VPS has been stopped');
  };

  if (!vpsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'usage', name: 'Server Usage', icon: '📈' },
    { id: 'snapshots', name: 'Snapshots & Backups', icon: '💾' },
    { id: 'actions', name: 'Latest Actions', icon: '📝' },
    { id: 'system', name: 'Operating System', icon: '🖥️' },
    { id: 'help', name: 'Help', icon: '❓' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/vps" className="text-primary-600 hover:text-primary-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {vpsData.hostname || 'test-bruno.com'}
                </h1>
                <p className="text-sm text-gray-600">
                  ssh root@{vpsData.ipAddress || '179.61.219.21'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                ssh root@{vpsData.ipAddress || '179.61.219.21'}
              </span>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm mr-6">
            <div className="p-4">
              <div className="mb-4">
                <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                  <option>{vpsData.hostname || 'test-bruno.com'}</option>
                </select>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* VPS Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">VPS Information</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRebootVPS}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        Reboot VPS
                      </button>
                      <button
                        onClick={handleStopVPS}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                        Stop VPS
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">IP address</div>
                      <div className="font-semibold">{vpsData.ipAddress || '179.61.219.21'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-600">Running</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">VPS uptime</div>
                      <div className="font-semibold">9 minutes</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Current OS</div>
                      <div className="font-semibold">CentOS 7 64bit with cPanel and WHM</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Location</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Netherlands</span>
                        <span className="text-sm">🇳🇱</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Node</div>
                      <div className="font-semibold">nl-srv-ovzcloud-node23b.hostinger.io</div>
                    </div>
                  </div>
                </div>

                {/* VPS Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">VPS overview</h2>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* CPU Usage */}
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${15 * 2.51} ${100 * 2.51}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">15%</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">CPU Usage</div>
                    </div>

                    {/* RAM Usage */}
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${45 * 2.51} ${100 * 2.51}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">45%</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">RAM Usage</div>
                    </div>

                    {/* Disk Usage */}
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#f59e0b"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${25 * 2.51} ${100 * 2.51}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">25%</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">Disk Usage</div>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Plan details</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• SSL Siteseal</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• CPU DOS Certificate</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• 30-day money-back guarantee</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Unlimited bandwidth</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Dedicated IP address</span>
                          <span className="text-green-600">✓</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Vyhody objednávky</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Adresa se 24 hodin</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Podpora 24/7</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• 99.9% uptime záruka</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Bezplatná migrace UP</span>
                          <span className="text-green-600">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">VPS Settings</h2>
                <p className="text-gray-600">VPS settings and configuration options will be available here.</p>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Server Usage</h2>
                <p className="text-gray-600">Detailed server usage statistics and monitoring data.</p>
              </div>
            )}

            {activeTab === 'snapshots' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Snapshots & Backups</h2>
                <p className="text-gray-600">Manage your VPS snapshots and backup configurations.</p>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Latest Actions</h2>
                <p className="text-gray-600">View recent actions and operations performed on your VPS.</p>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Operating System</h2>
                <p className="text-gray-600">Operating system information and management options.</p>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Help & Support</h2>
                <p className="text-gray-600">Get help and support for your VPS server.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
