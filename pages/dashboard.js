import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { getServerSessionProps } from '../lib/getServerSessionProps';

export default function Dashboard({ serverSession }) {
  const { data: clientSession, status } = useSession();
  const session = clientSession ?? serverSession;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      signIn();
    }
  }, [mounted, status]);

  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Head>
        <title>Dashboard - Cloud VPS</title>
        <meta name="description" content="Váš dashboard pro správu Cloud VPS služeb" />
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Welcome Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Vítejte, {session.user.name}!
                </h1>
                <p className="text-gray-600">{session.user.email}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🎉 Úspěšně přihlášen!</h3>
              <p className="text-blue-800">
                Váš účet byl úspěšně vytvořen. Nyní můžete objednat Cloud VPS služby.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href="/vps-setup" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Objednat VPS</h3>
                  <p className="text-gray-600">Vytvořte nový Cloud VPS server</p>
                </div>
              </div>
            </Link>

            <Link href="/billing" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Fakturace</h3>
                  <p className="text-gray-600">Správa faktur a plateb</p>
                </div>
              </div>
            </Link>

            <Link href="/contact" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Podpora</h3>
                  <p className="text-gray-600">Kontaktujte naši podporu</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Services Overview */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vaše služby</h2>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zatím nemáte žádné služby</h3>
              <p className="text-gray-600 mb-6">Začněte objednáním vašeho prvního Cloud VPS serveru</p>
              
              <Link
                href="/vps-setup"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Objednat VPS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// jednoduché volání
export const getServerSideProps = getServerSessionProps;
