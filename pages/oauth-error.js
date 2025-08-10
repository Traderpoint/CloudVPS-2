import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function OAuthError() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    setMounted(true);
    
    // Get error details from URL params
    const { error, error_description } = router.query;
    if (error) {
      setErrorDetails({
        error,
        description: error_description || 'Neznámá chyba při OAuth přihlášení'
      });
    }
  }, [router.query]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (mounted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleBackToTest();
    }
  }, [mounted, countdown]);

  const handleBackToTest = () => {
    router.push('/middleware-oauth-tests');
  };

  const handleTryAgain = () => {
    router.push('/middleware-oauth-tests');
  };

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Načítání... - CloudVPS</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítání...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Přihlášení selhalo - CloudVPS</title>
        <meta name="description" content="Google OAuth přihlášení selhalo" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ❌ Přihlášení selhalo
          </h1>
          <p className="text-gray-600 mb-6">
            Při Google OAuth přihlášení došlo k chybě.
          </p>

          {/* Error Details */}
          {errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-900 mb-3">🔍 Detaily chyby:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-red-800">Typ chyby:</span>
                  <span className="text-red-700 ml-2 font-mono">{errorDetails.error}</span>
                </div>
                <div>
                  <span className="font-medium text-red-800">Popis:</span>
                  <span className="text-red-700 ml-2">{errorDetails.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* Common Causes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-900 mb-3">💡 Možné příčiny:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Uživatel zrušil přihlášení</li>
              <li>• Neplatné OAuth credentials</li>
              <li>• Problém s Google účtem</li>
              <li>• Síťová chyba</li>
              <li>• Nesprávná konfigurace</li>
            </ul>
          </div>

          {/* Auto-redirect countdown */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span className="text-sm font-medium">
                Automatické přesměrování za {countdown} sekund
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleTryAgain}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium"
            >
              🔄 Zkusit znovu
            </button>
            
            <button
              onClick={handleBackToTest}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
            >
              🔙 Zpět na test stránku
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors font-medium"
            >
              🏠 Domovská stránka
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <details className="text-left">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                🔧 Debug informace
              </summary>
              <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded p-3 font-mono">
                <div>URL: {router.asPath}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
                <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              CloudVPS - Google OAuth Test Error Page
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleString('cs-CZ')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
