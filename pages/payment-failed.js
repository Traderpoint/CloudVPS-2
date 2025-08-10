import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PaymentFailed() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get order data from URL parameters
    const { invoiceId, orderId, amount, paymentMethod, reason } = router.query;
    
    if (invoiceId && orderId) {
      setOrderData({
        invoiceId,
        orderId,
        amount,
        paymentMethod,
        reason: reason || 'unknown'
      });
    }
    
    setIsLoading(false);
  }, [router.query]);

  const getErrorMessage = (reason) => {
    switch (reason) {
      case 'cancelled':
        return 'Platba byla zrušena uživatelem.';
      case 'declined':
        return 'Platba byla zamítnuta bankou nebo platební bránou.';
      case 'timeout':
        return 'Platba vypršela z důvodu překročení časového limitu.';
      case 'insufficient_funds':
        return 'Nedostatečné prostředky na účtu.';
      case 'invalid_card':
        return 'Neplatné údaje platební karty.';
      default:
        return 'Platba se nezdařila z neznámého důvodu.';
    }
  };

  const getErrorTitle = (reason) => {
    switch (reason) {
      case 'cancelled':
        return 'Platba zrušena';
      case 'declined':
        return 'Platba zamítnuta';
      case 'timeout':
        return 'Platba vypršela';
      default:
        return 'Platba se nezdařila';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Platba se nezdařila - Cloud VPS</title>
        <meta name="description" content="Vaše platba se nezdařila" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {getErrorTitle(orderData?.reason)}
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-8">
              {getErrorMessage(orderData?.reason)} Můžete zkusit platbu znovu nebo zvolit jinou platební metodu.
            </p>

            {/* Order Details */}
            {orderData && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaily objednávky</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Číslo objednávky:</span>
                    <span className="font-medium">{orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Číslo faktury:</span>
                    <span className="font-medium">{orderData.invoiceId}</span>
                  </div>
                  {orderData.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Částka:</span>
                      <span className="font-medium">{orderData.amount} CZK</span>
                    </div>
                  )}
                  {orderData.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platební metoda:</span>
                      <span className="font-medium capitalize">{orderData.paymentMethod}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stav:</span>
                    <span className="font-medium text-red-600">Neúspěšná</span>
                  </div>
                </div>
              </div>
            )}

            {/* What to do next */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">Co můžete udělat?</h3>
              <ul className="space-y-2 text-yellow-800">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Zkuste platbu znovu s jinou platební metodou
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Zkontrolujte údaje platební karty
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Kontaktujte svou banku pro ověření transakce
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Kontaktujte naši podporu pro pomoc
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/payment-method?invoiceId=${orderData?.invoiceId}&orderId=${orderData?.orderId}`}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Zkusit znovu
              </Link>
              <Link
                href="/contact"
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Kontaktovat podporu
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 px-8 py-3 font-medium"
              >
                Zpět na hlavní stránku
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
