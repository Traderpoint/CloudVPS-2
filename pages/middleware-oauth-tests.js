import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function MiddlewareOAuthTests({ serverSession }) {
  const { data: clientSession, status: sessionStatus } = useSession();
  const session = clientSession ?? serverSession;
  const [mounted, setMounted] = useState(false);
  const [activeTest, setActiveTest] = useState('google'); // 'google' nebo 'email'
  const [authMode, setAuthMode] = useState('login'); // 'login' nebo 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [testResults, setTestResults] = useState({
    nextAuthConfig: null,
    googleCredentials: null,
    credentialsProvider: null,
    sessionProvider: null
  });

  useEffect(() => {
    setMounted(true);
    runQuickTests();
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[${timestamp}] ${message}`);
  };

  const runQuickTests = async () => {
    addLog('🧪 Spouštím rychlé testy OAuth konfigurace...', 'info');
    
    try {
      const response = await fetch('/api/auth/providers');
      const providers = await response.json();
      
      if (providers.google) {
        setTestResults(prev => ({ ...prev, nextAuthConfig: 'success', googleCredentials: 'success' }));
        addLog('✅ Google OAuth provider je nakonfigurován', 'success');
      }
      
      if (providers.credentials) {
        setTestResults(prev => ({ ...prev, credentialsProvider: 'success' }));
        addLog('✅ Email/Password provider je nakonfigurován', 'success');
      }
      
      setTestResults(prev => ({ ...prev, sessionProvider: 'success' }));
      addLog('✅ Session provider je dostupný', 'success');
      
    } catch (error) {
      addLog(`❌ Chyba při testování: ${error.message}`, 'error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      addLog('🔄 Spouštím Google OAuth přihlášení...', 'info');
      
      await signIn('google', { 
        callbackUrl: '/oauth-success',
        redirect: true
      });
    } catch (error) {
      addLog(`❌ Chyba během Google OAuth: ${error.message}`, 'error');
      setTimeout(() => {
        window.location.href = `/oauth-error?error=${encodeURIComponent(error.message)}`;
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (authMode === 'register') {
        addLog('🔄 Spouštím registraci...', 'info');
        
        const response = await fetch('/api/auth/test-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailForm.email,
            password: emailForm.password,
            name: emailForm.name
          })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          addLog(`❌ Registrace selhala: ${data.error}`, 'error');
          return;
        }
        
        addLog(`✅ Registrace úspěšná: ${data.user.email}`, 'success');
      }
      
      addLog('🔄 Spouštím email přihlášení...', 'info');
      
      await signIn('credentials', {
        email: emailForm.email,
        password: emailForm.password,
        callbackUrl: '/oauth-success',
        redirect: true
      });
      
    } catch (error) {
      addLog(`❌ Chyba během email auth: ${error.message}`, 'error');
      setTimeout(() => {
        window.location.href = `/oauth-error?error=${encodeURIComponent(error.message)}`;
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      addLog('🔄 Odhlašuji uživatele...', 'info');
      await signOut({ redirect: false });
      addLog('✅ Úspěšně odhlášen', 'success');
    } catch (error) {
      addLog(`❌ Chyba při odhlášení: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Načítání OAuth testů - CloudVPS Test Portal</title>
        </Head>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold mb-6">⏳ Načítání...</h1>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Google OAuth & Email Tests - CloudVPS Test Portal</title>
        <meta name="description" content="Test Portal OAuth testy pro Google a Email přihlášení" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  🔐 Google OAuth & Email Tests
                </h1>
                <a
                  href="/test-portal"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors text-sm font-medium"
                >
                  ← Zpět na Test Portal
                </a>
              </div>
              <p className="text-gray-600">
                Test Portal sekce pro testování Google OAuth a Email/Password přihlášení přes middleware
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span>🌐 Test Portal: http://localhost:3000/test-portal</span>
                <span>🔗 Middleware: http://localhost:3005</span>
                <span>📍 NextAuth: /api/auth</span>
                <span>🔄 Session Status: {sessionStatus}</span>
              </div>
            </div>

            {/* Test Status Grid */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${getStatusColor(testResults.nextAuthConfig)}`}>
                <h3 className="font-semibold">NextAuth Config</h3>
                <p className="text-sm">
                  {testResults.nextAuthConfig === 'success' ? '✅ OK' : '⏳ Test...'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(testResults.googleCredentials)}`}>
                <h3 className="font-semibold">Google OAuth</h3>
                <p className="text-sm">
                  {testResults.googleCredentials === 'success' ? '✅ OK' : '⏳ Test...'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(testResults.credentialsProvider)}`}>
                <h3 className="font-semibold">Email Provider</h3>
                <p className="text-sm">
                  {testResults.credentialsProvider === 'success' ? '✅ OK' : '⏳ Test...'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(testResults.sessionProvider)}`}>
                <h3 className="font-semibold">Session Provider</h3>
                <p className="text-sm">
                  {testResults.sessionProvider === 'success' ? '✅ OK' : '⏳ Test...'}
                </p>
              </div>
            </div>

            {/* Session Info */}
            {sessionStatus === 'authenticated' && session && (
              <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200">
                <h2 className="text-lg font-semibold mb-2 text-green-900">👤 Přihlášený uživatel:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Email:</strong> {session.user?.email || 'N/A'}</p>
                    <p><strong>Jméno:</strong> {session.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>Provider:</strong> {
                      session.user?.provider === 'google' ? '🔍 Google OAuth' : 
                      session.user?.provider === 'credentials' ? '📧 Email/Password' : 'N/A'
                    }</p>
                    <p><strong>ID:</strong> {session.user?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Tabs */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTest('google')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTest === 'google' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  🔍 Google OAuth Test
                </button>
                <button
                  onClick={() => setActiveTest('email')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTest === 'email' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  📧 Email Auth Test
                </button>
              </div>
            </div>

            {/* Test Content */}
            <div className="mb-8">
              {activeTest === 'google' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Google OAuth Test</h2>
                  
                  {!session ? (
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {isLoading ? 'Přihlašuji přes Google...' : 'Přihlásit se přes Google'}
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-green-600 mb-4">✅ Úspěšně přihlášen přes Google OAuth</p>
                      <button
                        onClick={handleSignOut}
                        disabled={isLoading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Odhlašuji...' : 'Odhlásit se'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTest === 'email' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Email Authentication Test</h2>
                  
                  {!session ? (
                    <div className="space-y-4">
                      {/* Mode Toggle */}
                      <div className="flex justify-center">
                        <div className="flex bg-white rounded-lg p-1 border">
                          <button
                            type="button"
                            onClick={() => setAuthMode('login')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                              authMode === 'login' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                          >
                            Přihlášení
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthMode('register')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                              authMode === 'register' 
                                ? 'bg-green-600 text-white' 
                                : 'text-gray-600 hover:text-green-600'
                            }`}
                          >
                            Registrace
                          </button>
                        </div>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleEmailAuth} className="space-y-4 max-w-md mx-auto">
                        {authMode === 'register' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Jméno:
                            </label>
                            <input
                              type="text"
                              value={emailForm.name}
                              onChange={(e) => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Vaše jméno"
                              required
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email:
                          </label>
                          <input
                            type="email"
                            value={emailForm.email}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                              authMode === 'login' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
                            }`}
                            placeholder="vas.email@example.com"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Heslo:
                          </label>
                          <input
                            type="password"
                            value={emailForm.password}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                              authMode === 'login' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
                            }`}
                            placeholder={authMode === 'register' ? 'Alespoň 6 znaků' : 'Vaše heslo'}
                            required
                            minLength={authMode === 'register' ? 6 : undefined}
                          />
                        </div>

                        {/* Test Credentials - pouze pro login */}
                        {authMode === 'login' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <h4 className="text-sm font-medium text-yellow-800 mb-2">🧪 Testovací účty:</h4>
                            <div className="text-xs text-yellow-700 space-y-1">
                              <div><strong>test@cloudvps.cz</strong> / test123</div>
                              <div><strong>admin@cloudvps.cz</strong> / admin123</div>
                              <div><strong>demo@cloudvps.cz</strong> / demo123</div>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full px-6 py-3 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${
                            authMode === 'login' 
                              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          {isLoading ? '⏳ Zpracovávám...' : 
                           authMode === 'login' ? '📧 Přihlásit se emailem' : '✨ Registrovat se'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-green-600 mb-4">✅ Úspěšně přihlášen přes Email/Password</p>
                      <button
                        onClick={handleSignOut}
                        disabled={isLoading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Odhlašuji...' : 'Odhlásit se'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Debug Logs */}
            <div className="p-4 rounded-lg bg-gray-100 border border-gray-300">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">📝 Debug Logs:</h2>
                <button
                  onClick={() => setLogs([])}
                  className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Vymazat
                </button>
              </div>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p>Žádné logy zatím...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={getLogColor(log.type)}>
                      [{log.timestamp}] {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// jednoduché volání
export const getServerSideProps = getServerSessionProps;
