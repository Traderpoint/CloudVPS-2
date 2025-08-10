import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import Head from 'next/head';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function Register({ serverSession }) {
  const router = useRouter();
  const { data: clientSession, status } = useSession();
  const session = clientSession ?? serverSession;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'register' nebo 'login'
  const [mounted, setMounted] = useState(false);

  // Client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Přesměrování se nyní dělá v oauth-success stránce
  // Tady jen sledujeme session pro debug
  useEffect(() => {
    if (mounted) {
      console.log('🔍 Register page - session status:', !!session);
    }
  }, [mounted, session]);

  // Google OAuth přihlášení pomocí NextAuth
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔄 Starting Google OAuth with NextAuth...');

      // Označ zdroj pro oauth-success (pouze pokud ještě není nastaven)
      const existingOauthSource = sessionStorage.getItem('oauth-source');
      if (!existingOauthSource) {
        sessionStorage.setItem('oauth-source', 'register');
        console.log('🔄 OAuth source set to: register');
      } else {
        console.log('🔄 OAuth source already exists:', existingOauthSource);
      }

      const result = await signIn('google', {
        callbackUrl: '/oauth-success', // Použij oauth-success jako mezikrok
        redirect: true
      });

      if (result?.error) {
        console.error('❌ Google OAuth error:', result.error);
        setError(`Chyba při Google přihlášení: ${result.error}`);
        setIsLoading(false);
      } else {
        console.log('✅ Google OAuth initiated successfully');
        // NextAuth automaticky přesměruje, takže loading zůstane true
      }
    } catch (error) {
      console.error('❌ Error during Google OAuth:', error);
      setError('Chyba při přihlášení přes Google. Zkuste to znovu.');
      setIsLoading(false);
    }
  };




  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  // Email/Password registrace a přihlášení
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Prosím vyplňte email a heslo');
      setIsLoading(false);
      return;
    }

    if (authMode === 'register') {
      if (!formData.name) {
        setError('Prosím vyplňte jméno');
        setIsLoading(false);
        return;
      }

      if (!formData.confirmPassword) {
        setError('Prosím potvrďte heslo');
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Hesla se neshodují');
        setIsLoading(false);
        return;
      }
    }

    if (formData.password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků');
      setIsLoading(false);
      return;
    }

    try {
      if (authMode === 'register') {
        console.log('🔄 Starting email registration...');

        // Registrace přes test-register API
        const response = await fetch('/api/auth/test-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Registration failed');
        }

        if (data.existingUser) {
          console.log('ℹ️ User already exists, proceeding with login...');
          setError(''); // Vyčisti případné chyby
        } else {
          console.log('✅ Registration successful, auto-login...');
        }
      }

      // Přihlášení přes NextAuth credentials
      console.log('🔄 Starting email login...');

      // Zkontroluj, zda má uživatel košík pro rozhodnutí o přesměrování
      const cartRaw = localStorage.getItem('cart');
      let hasCartItems = false;
      let cartItemsCount = 0;
      let cartData = null;

      if (cartRaw) {
        try {
          cartData = JSON.parse(cartRaw);
          // Košík je objekt s vlastností items, ne přímo pole
          const cartItems = cartData.items || [];
          cartItemsCount = cartItems.length;
          hasCartItems = cartItemsCount > 0;
        } catch (error) {
          console.error('❌ Error parsing cart data:', error);
          hasCartItems = false;
          cartItemsCount = 0;
        }
      }

      const callbackUrl = hasCartItems ? '/billing' : '/client-area';

      console.log('🔄 Login redirect decision:', {
        cartRaw: cartRaw,
        cartData: cartData,
        hasCartItems,
        cartItemsCount,
        callbackUrl,
        authMode: authMode
      });

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false // Neautomatické přesměrování
      });

      if (result?.error) {
        console.error('❌ Email auth error:', result.error);
        if (result.error === 'CredentialsSignin') {
          setError('Nesprávný email nebo heslo');
        } else {
          setError(`Chyba při přihlášení: ${result.error}`);
        }
        setIsLoading(false);
      } else if (result?.ok) {
        console.log('✅ Email auth successful, redirecting to:', callbackUrl);

        // Manuální přesměrování podle košíku
        router.push(callbackUrl);
      } else {
        console.error('❌ Unexpected auth result:', result);
        setError('Neočekávaná chyba při přihlášení');
        setIsLoading(false);
      }

    } catch (error) {
      console.error('❌ Email auth error:', error);

      let errorMessage = 'Došlo k chybě. Zkuste to prosím znovu.';

      if (error.message.includes('already exists')) {
        errorMessage = 'Uživatel s touto e-mailovou adresou již existuje.';
        setAuthMode('login'); // Přepneme na login mód
      } else if (error.message.includes('Password')) {
        errorMessage = 'Heslo nesplňuje požadavky. Musí mít alespoň 6 znaků.';
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Neplatný formát emailu.';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };





  // Prevent hydration errors
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Loading... - Cloud VPS</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{authMode === 'register' ? 'Register' : 'Login'} - Cloud VPS</title>
      </Head>



      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-800">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {authMode === 'register' ? 'Register' : 'Login'}
            </h1>
            <p className="text-gray-600 text-sm">
              {authMode === 'register'
                ? 'Create your CloudVPS account'
                : 'Welcome back to CloudVPS'
              }
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'register'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'login'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Login
              </button>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-4">
            {/* Google Sign-In Button - NextAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || status === 'loading'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Přihlašuji...' : 'Continue with Google'}
            </button>


          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {authMode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {/* Test Credentials - pouze pro login */}
            {authMode === 'login' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">🧪 Test Accounts:</h4>
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
              className={`w-full text-white py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                authMode === 'register'
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
              }`}
            >
              {isLoading ? (authMode === 'register' ? 'Creating account...' : 'Signing in...') :
               (authMode === 'register' ? '✨ Create Account' : '🔐 Sign In')}
            </button>
          </form>

          {/* Mode Switch Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {authMode === 'register' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError('');
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Terms */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              By continuing you agree with our{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>{' '}
              and confirm that you have read our{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// jednoduché volání
export const getServerSideProps = getServerSessionProps;
