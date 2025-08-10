import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function VPSSetup() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [setupData, setSetupData] = useState({
    operatingSystem: 'ubuntu-20.04',
    hostname: '',
    rootPassword: '',
    confirmPassword: '',
    sshKey: '',
    enableFirewall: true,
    enableBackups: false
  });

  // Load order data on mount
  useEffect(() => {
    const storedOrderData = sessionStorage.getItem('orderData');
    if (storedOrderData) {
      const data = JSON.parse(storedOrderData);
      setOrderData(data);
      
      // Generate default hostname
      const defaultHostname = `vps-${Date.now().toString().slice(-6)}`;
      setSetupData(prev => ({
        ...prev,
        hostname: defaultHostname
      }));
    } else {
      // Redirect if no order data
      router.push('/vps');
    }
  }, [router]);

  const operatingSystems = [
    {
      id: 'ubuntu-20.04',
      name: 'Ubuntu 20.04 LTS',
      icon: '🐧',
      description: 'Nejpopulárnější Linux distribuce',
      category: 'Linux',
      popular: true
    },
    {
      id: 'ubuntu-22.04',
      name: 'Ubuntu 22.04 LTS',
      icon: '🐧',
      description: 'Nejnovější LTS verze Ubuntu',
      category: 'Linux',
      popular: false
    },
    {
      id: 'centos-7',
      name: 'CentOS 7',
      icon: '🔴',
      description: 'Stabilní enterprise distribuce',
      category: 'Linux',
      popular: false
    },
    {
      id: 'debian-11',
      name: 'Debian 11',
      icon: '🌀',
      description: 'Stabilní a bezpečná distribuce',
      category: 'Linux',
      popular: false
    },
    {
      id: 'windows-2019',
      name: 'Windows Server 2019',
      icon: '🪟',
      description: 'Microsoft Windows Server',
      category: 'Windows',
      popular: false
    },
    {
      id: 'windows-2022',
      name: 'Windows Server 2022',
      icon: '🪟',
      description: 'Nejnovější Windows Server',
      category: 'Windows',
      popular: false
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSetupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error when user types
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSetupData(prev => ({
      ...prev,
      rootPassword: password,
      confirmPassword: password
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!setupData.hostname || !setupData.rootPassword) {
      setError('Prosím vyplňte všechna povinná pole');
      setIsLoading(false);
      return;
    }

    if (setupData.rootPassword !== setupData.confirmPassword) {
      setError('Hesla se neshodují');
      setIsLoading(false);
      return;
    }

    if (setupData.rootPassword.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate VPS provisioning
      console.log('🔄 Provisioning VPS with setup data:', setupData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Store setup data
      sessionStorage.setItem('vpsSetupData', JSON.stringify({
        ...setupData,
        orderData: orderData,
        provisionedAt: new Date().toISOString(),
        vpsId: `vps-${Date.now()}`,
        ipAddress: '179.61.219.21',
        status: 'Running'
      }));

      // Redirect to VPS dashboard
      router.push('/vps-dashboard');
    } catch (error) {
      console.error('❌ Error provisioning VPS:', error);
      setError('Došlo k chybě při vytváření VPS. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Now let's set up your VPS server</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Configure Your VPS</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Operating System Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Operating System</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {operatingSystems.map((os) => (
                  <div
                    key={os.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      setupData.operatingSystem === os.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${os.popular ? 'ring-2 ring-green-200' : ''}`}
                    onClick={() => setSetupData(prev => ({ ...prev, operatingSystem: os.id }))}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{os.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center">
                          {os.name}
                          {os.popular && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{os.description}</div>
                        <div className="text-xs text-gray-500">{os.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Server Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Server Configuration</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="hostname" className="block text-sm font-medium text-gray-700 mb-2">
                    Hostname *
                  </label>
                  <input
                    type="text"
                    id="hostname"
                    name="hostname"
                    value={setupData.hostname}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="my-server"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be your server's hostname</p>
                </div>
              </div>
            </div>

            {/* Root Password */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Root Password</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="rootPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Root Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="rootPassword"
                      name="rootPassword"
                      value={setupData.rootPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                      placeholder="Enter strong password"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-600 hover:text-primary-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-sm text-primary-600 hover:text-primary-700 mt-1"
                  >
                    Generate secure password
                  </button>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={setupData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            {/* SSH Key (Optional) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">SSH Key (Optional)</h3>
              <div>
                <label htmlFor="sshKey" className="block text-sm font-medium text-gray-700 mb-2">
                  SSH Public Key
                </label>
                <textarea
                  id="sshKey"
                  name="sshKey"
                  value={setupData.sshKey}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAA... (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add your SSH public key for secure key-based authentication
                </p>
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Options</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableFirewall"
                    name="enableFirewall"
                    checked={setupData.enableFirewall}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="enableFirewall" className="text-sm font-medium text-gray-700">
                    Enable basic firewall (recommended)
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableBackups"
                    name="enableBackups"
                    checked={setupData.enableBackups}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="enableBackups" className="text-sm font-medium text-gray-700">
                    Enable automatic backups (+5 EUR/month)
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating your VPS...</span>
                  </div>
                ) : (
                  'Create VPS Server'
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Your VPS will be ready in 2-5 minutes after creation
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
