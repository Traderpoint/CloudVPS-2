import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Uložíme session data do sessionStorage pro kompatibilitu
      const user = {
        email: session.user.email,
        name: session.user.name,
        clientId: session.user.clientId,
        picture: session.user.image || '/default-avatar.svg'
      };
      sessionStorage.setItem('user', JSON.stringify(user));

      const cart = sessionStorage.getItem('cart');
      router.push(cart ? '/checkout' : '/dashboard');
    }
  }, [session, status, router]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Nesprávný email nebo heslo');
      } else if (result?.ok) {
        // NextAuth se postará o přesměrování přes useEffect
      }
    } catch (err) {
      setError('Chyba při přihlášení: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const user = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      sub: decoded.sub
    };
    sessionStorage.setItem('user', JSON.stringify(user));
    const cart = sessionStorage.getItem('cart');
    router.push(cart ? '/checkout' : '/dashboard');
  };

  const handleGoogleLoginError = () => {
    setError('Přihlášení přes Google selhalo. Zkuste to znovu.');
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Přihlášení do účtu
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Nebo{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                si vytvořte nový účet
              </Link>
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="jan@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Heslo
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Vaše heslo"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Přihlašuji...' : 'Přihlásit se'}
                </button>
              </div>
            </form>
            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Nebo</span>
                </div>
              </div>
            </div>

            {/* Google OAuth */}
            <div className="mt-6">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap={false}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
