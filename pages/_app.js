import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HostBillAffiliate from '../components/HostBillAffiliate';
import AntiWalletInjection from '../components/AntiWalletInjection';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Block MetaMask and other wallet injections
  useEffect(() => {
    // Prevent MetaMask injection
    if (typeof window !== 'undefined') {
      // Block ethereum provider injection
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: false,
        configurable: false
      });

      // Block web3 injection
      Object.defineProperty(window, 'web3', {
        value: undefined,
        writable: false,
        configurable: false
      });

      // Block other common wallet injections
      const walletProperties = ['solana', 'phantom', 'coinbaseWallet', 'trustWallet'];
      walletProperties.forEach(prop => {
        Object.defineProperty(window, prop, {
          value: undefined,
          writable: false,
          configurable: false
        });
      });

      console.log('🚫 Wallet injections blocked - this is a traditional payment system');
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <CartProvider>
          <AntiWalletInjection />
          <div className="flex flex-col min-h-screen">
            <HostBillAffiliate />
            <Navbar />
            <main className="flex-1">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;
