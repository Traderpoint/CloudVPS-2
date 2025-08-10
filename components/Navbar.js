import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useAuth } from '../contexts/AuthContext';
import ShoppingCart, { CartIcon } from './ShoppingCart';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { user: authUser, isAuthenticated, logout: authLogout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Determine which user to show (NextAuth session or our custom auth)
  const currentUser = session?.user || authUser;
  const isUserLoggedIn = !!session || isAuthenticated;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className="bg-white shadow py-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/systrix-logo.svg"
              alt="Systrix"
              width={160}
              height={42}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div className="flex space-x-6">
            <Link href="/cloud" className="hover:text-primary-500">Cloud</Link>
            <Link href="/vps" className="hover:text-primary-500">VPS</Link>
            <Link href="/vps2" className="hover:text-primary-500 text-blue-600 font-semibold">VPS 2</Link>
            <Link href="/vps3" className="hover:text-primary-500 text-purple-600 font-semibold">VPS 3</Link>
            <Link href="/pricing" className="hover:text-primary-500">Ceník</Link>
            <Link href="/about" className="hover:text-primary-500">O nás</Link>
            <Link href="/contact" className="hover:text-primary-500">Kontakt</Link>
            {process.env.NODE_ENV === 'development' && (
              <Link href="/test-portal" className="hover:text-red-500 text-red-600 font-semibold">
                🧪 Test
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <CartIcon onClick={() => setIsCartOpen(true)} />

            {/* User Authentication Section */}
            {isUserLoggedIn ? (
              <>
                {/* Klientská sekce tlačítko pro přihlášené uživatele */}
                <Link
                  href="/client-area"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                  <span>🖥️</span>
                  <span className="hidden md:inline font-medium">Klientská sekce</span>
                </Link>

                <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {currentUser?.name || currentUser?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500">
                      Přihlášen {authUser ? '(Email)' : '(Google)'}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {currentUser?.name || 'Uživatel'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentUser?.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {authUser ? 'Email přihlášení' : 'Google OAuth'}
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>👤</span>
                        <span>Můj profil</span>
                      </div>
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>📦</span>
                        <span>Moje objednávky</span>
                      </div>
                    </Link>
                    <Link
                      href="/client-area"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🖥️</span>
                        <span>Klientská sekce</span>
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);

                        // Clear registration data from sessionStorage
                        sessionStorage.removeItem('registrationData');
                        console.log('🧹 Cleared registration data from sessionStorage');

                        if (session) {
                          // NextAuth logout
                          signOut({ callbackUrl: '/' });
                        } else {
                          // Custom auth logout
                          authLogout();
                          window.location.href = '/';
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-red-600"
                    >
                      <div className="flex items-center space-x-2">
                        <span>🚪</span>
                        <span>Odhlásit se</span>
                      </div>
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <Link
                href="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 flex items-center space-x-2"
              >
                <span>🔐</span>
                <span>Přihlásit se</span>
              </Link>
            )}

            {/* Client Section Dropdown - pouze pro nepřihlášené uživatele */}
            {!isUserLoggedIn && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-xl shadow hover:bg-primary-700 flex items-center space-x-2"
                >
                  <span>🖥️</span>
                  <span>Klientská sekce</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isClientDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">Přístup ke klientské sekci</div>
                      <div className="text-xs text-gray-500">Přihlaste se pro správu služeb</div>
                    </div>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                      onClick={() => setIsClientDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🔐</span>
                        <span>Přihlásit se / Registrovat</span>
                      </div>
                    </Link>

                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}
