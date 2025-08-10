import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function TestGoogleNextAuth({ serverSession }) {
  const { data: clientSession, status: sessionStatus } = useSession();
  const session = clientSession ?? serverSession;
  const [status, setStatus] = useState('Inicializace NextAuth...');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Sledování session změn
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setStatus('🔄 Načítání session...');
      addLog('NextAuth session se načítá...');
    } else if (sessionStatus === 'authenticated' && session) {
      setStatus('✅ Přihlášen přes NextAuth');
      addLog(`✅ Úspěšně přihlášen: ${session.user.email}`);
      addLog(`👤 Jméno: ${session.user.name}`);
      addLog(`🖼️ Avatar: ${session.user.image}`);
      addLog(`🆔 ID: ${session.user.id}`);
    } else if (sessionStatus === 'unauthenticated') {
      setStatus('❌ Nepřihlášen');
      addLog('Uživatel není přihlášen');
    }
  }, [session, sessionStatus]);

  // NextAuth Google přihlášení
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      addLog('🔄 Starting Google OAuth with NextAuth...');
      
      const result = await signIn('google', { 
        callbackUrl: '/test-google-nextauth',
        redirect: false 
      });
      
      if (result?.error) {
        addLog(`❌ Google OAuth error: ${result.error}`);
        setStatus('❌ Chyba při přihlášení');
      } else {
        addLog('✅ Google OAuth initiated successfully');
        setStatus('🔄 Přesměrovávání...');
      }
    } catch (error) {
      addLog(`❌ Error during Google OAuth: ${error.message}`);
      setStatus('❌ Chyba při přihlášení');
    } finally {
      setIsLoading(false);
    }
  };

  // NextAuth odhlášení
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      addLog('🔄 Signing out...');
      await signOut({ redirect: false });
      addLog('✅ Successfully signed out');
      setStatus('❌ Odhlášen');
    } catch (error) {
      addLog(`❌ Error during sign out: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>NextAuth Google Test - CloudVPS</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6">🧪 NextAuth Google OAuth Test</h1>
            
            {/* Status */}
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h2 className="text-lg font-semibold mb-2">📊 Status:</h2>
              <p className="text-blue-800">{status}</p>
            </div>

            {/* Session Info */}
            {session && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
                <h2 className="text-lg font-semibold mb-2">👤 Session Data:</h2>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>Jméno:</strong> {session.user.name}</p>
                  <p><strong>ID:</strong> {session.user.id}</p>
                  {session.user.image && (
                    <div className="flex items-center space-x-2">
                      <strong>Avatar:</strong>
                      <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Configuration */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">⚙️ Konfigurace NextAuth:</h2>
              <p><strong>Provider:</strong> Google OAuth 2.0</p>
              <p><strong>Client ID:</strong> {process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...</p>
              <p><strong>Domain:</strong> localhost:3000</p>
              <p><strong>Callback URL:</strong> /api/auth/callback/google</p>
              <p><strong>Session Strategy:</strong> JWT</p>
            </div>

            {/* Controls */}
            <div className="mb-6 space-y-4">
              <h2 className="text-lg font-semibold">🎮 Ovládání:</h2>
              
              {!session ? (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? 'Přihlašuji...' : 'Přihlásit se přes Google (NextAuth)'}
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Odhlašuji...' : 'Odhlásit se'}
                </button>
              )}
            </div>

            {/* Debug Logs */}
            <div className="p-4 rounded-lg bg-gray-100 border border-gray-300">
              <h2 className="text-lg font-semibold mb-2">📝 Debug Logs:</h2>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p>Žádné logy zatím...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
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
