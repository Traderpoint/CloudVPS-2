import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function OAuthSuccess() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detekce zdroje a automatické přesměrování pro webovky
  useEffect(() => {
    const oauthSource = sessionStorage.getItem('oauth-source');
    const isFromClientArea = oauthSource === 'client-area';



    if (mounted && session && status === 'authenticated') {
      // Zkontroluj zdroj OAuth
      const referrer = document.referrer;

      const isFromRegister = referrer.includes('/register') || oauthSource === 'register';
      const isFromCartWithItems = oauthSource === 'cart-with-items';

      // Check if user has items in cart - only redirect to billing if they do
      let hasCartItems = false;
      let cartItemsCount = 0;
      let cartData = null;

      const cartRaw = localStorage.getItem('cart');
      if (cartRaw) {
        try {
          cartData = JSON.parse(cartRaw);
          // Košík je objekt s vlastností items, ne přímo pole
          const cartItems = cartData.items || [];
          cartItemsCount = cartItems.length;
          hasCartItems = cartItemsCount > 0;
        } catch (error) {
          console.error('❌ Error parsing cart data in oauth-success:', error);
          hasCartItems = false;
          cartItemsCount = 0;
        }
      }

      console.log('🔍 OAuth source detection:', {
        referrer,
        oauthSource,
        isFromRegister,
        isFromCartWithItems,
        hasCartItems,
        cartItemsCount,
        cartData: cartData
      });

      if ((isFromRegister && hasCartItems) || isFromCartWithItems) {
        console.log('✅ OAuth from webovky with cart items, redirecting to billing...');

        // Uložíme data z Google OAuth do sessionStorage
        const registrationData = {
          email: session.user.email,
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          provider: session.user?.provider || 'google',
          googleId: session.user.id,
          avatar: session.user.image
        };

        sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
        // NEMAZEJ oauth-source zde - billing stránka ho potřebuje pro kontrolu košíku
        console.log('💾 Registration data saved, redirecting to billing...');

        // Nastav redirecting state
        setRedirecting(true);

        // Rovnou přesměruj na billing (bez zobrazení oauth-success)
        router.push('/billing');
        return; // Zastav další zpracování
      } else if (isFromRegister && !hasCartItems) {
        console.log('✅ OAuth from register without cart items, redirecting to client-area...');

        // Uložíme data z Google OAuth do sessionStorage
        const registrationData = {
          email: session.user.email,
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          provider: session.user?.provider || 'google',
          googleId: session.user.id,
          avatar: session.user.image
        };

        sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
        sessionStorage.removeItem('oauth-source'); // Vyčisti oauth-source
        console.log('💾 Registration data saved, redirecting to client-area...');

        // Nastav redirecting state
        setRedirecting(true);

        // Přesměruj na client-area
        router.push('/client-area');
        return; // Zastav další zpracování
      } else {
        console.log('✅ OAuth from test page, staying on oauth-success');
      }
    }

    if (isFromClientArea) {
        console.log('✅ OAuth from client-area logout, redirecting to home...');
        sessionStorage.removeItem('oauth-source'); // Vyčisti oauth-source
        setRedirecting(true);
        router.push('/');
        return; // Zastav další zpracování
      }
  }, [mounted, session, status, router]);

  const handleBackToTest = () => {
    router.push('/middleware-oauth-tests');
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/middleware-oauth-tests');
  };

  if (!mounted || redirecting) {
    return (
      <>
        <Head>
          <title>{redirecting ? 'Přesměrování...' : 'Načítání...'} - CloudVPS</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {redirecting ? 'Přesměrování na objednávku...' : 'Načítání...'}
            </p>
            {redirecting && (
              <p className="text-sm text-gray-500 mt-2">
                Budete automaticky přesměrováni na dokončení objednávky
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Zkontroluj, jestli je to test případ
  const oauthSource = typeof window !== 'undefined' ? sessionStorage.getItem('oauth-source') : null;
  const isTestCase = !oauthSource || (!oauthSource.includes('register') && !oauthSource.includes('cart-with-items'));

  // Pokud není test případ, zobraz loading (už se přesměrovává)
  if (!isTestCase) {
    return (
      <>
        <Head>
          <title>Přesměrování... - CloudVPS</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Přesměrování na objednávku...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Úspěšné přihlášení - CloudVPS</title>
        <meta name="description" content="Google OAuth přihlášení bylo úspěšné" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Úspěšně přihlášeno!
          </h1>
          <p className="text-gray-600 mb-6">
            Google OAuth přihlášení proběhlo úspěšně.
          </p>

          {/* User Info */}
          {status === 'authenticated' && session && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">👤 Informace o uživateli:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-600">{session.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Jméno:</span>
                  <span className="text-gray-600">{session.user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">ID:</span>
                  <span className="text-gray-600 font-mono text-xs">{session.user?.id || 'N/A'}</span>
                </div>
                {session.user?.image && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">Avatar:</span>
                    <img 
                      src={session.user.image} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm font-medium">
                Session Status: {status === 'authenticated' ? '✅ Aktivní' : '❌ Neaktivní'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBackToTest}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium"
            >
              🔙 Zpět na test stránku
            </button>
            
            {status === 'authenticated' && (
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors font-medium"
              >
                🚪 Odhlásit se
              </button>
            )}
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
            >
              🏠 Domovská stránka
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              CloudVPS - Google OAuth Test Success Page
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
