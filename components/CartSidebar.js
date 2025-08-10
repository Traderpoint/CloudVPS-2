import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function CartSidebar({
  showPeriodSelector = false,
  showOSSelector = false,
  selectedPeriod = '12',
  selectedOS = 'linux',
  selectedApps = [],
  onPeriodChange = () => {},
  onOSChange = () => {},
  nextStepUrl = '/cart',
  nextStepText = 'Pokračovat k objednávce',
  onNextStep = null,
  isLoading = false,
  // Custom pricing functions (optional)
  calculateMonthlyPrice = null,
  calculatePeriodPrice = null,
  calculateItemSavings = null,
  getCartTotal = null,
  getCartMonthlyTotal = null,
  getTotalSavings = null,
  // VAT control
  disableVATCalculation = false, // If true, assumes prices already include VAT
  // HostBill invoice data
  hostbillInvoiceData = null,
  showHostbillAmount = false
}) {
  const { items, removeItem, clearCart, affiliateId, affiliateCode } = useCart();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Debug košíku v CartSidebar
  useEffect(() => {
    console.log('🛒 CartSidebar: Items updated -', {
      itemCount: items.length,
      items: items.map(item => ({ id: item.id, name: item.name }))
    });
  }, [items]);

  const periods = [
    { value: '1', label: '1 měsíc', discount: 0 },
    { value: '3', label: '3 měsíce', discount: 5 },
    { value: '6', label: '6 měsíců', discount: 10 },
    { value: '12', label: '12 měsíců', discount: 20 },
    { value: '24', label: '24 měsíců', discount: 30 },
    { value: '36', label: '36 měsíců', discount: 40 }
  ];

  const operatingSystems = [
    { id: 'linux', name: 'Linux', priceModifier: 0 },
    { id: 'windows', name: 'Windows Server', priceModifier: 500 }
  ];

  const applications = [
    { id: 'cpanel', name: 'cPanel', icon: '🎛️', description: 'Webový hosting panel' },
    { id: 'plesk', name: 'Plesk', icon: '⚙️', description: 'Hosting control panel' },
    { id: 'wordpress', name: 'WordPress', icon: '📝', description: 'CMS pro weby a blogy' },
    { id: 'woocommerce', name: 'WooCommerce', icon: '🛒', description: 'E-shop pro WordPress' },
    { id: 'mysql', name: 'MySQL', icon: '🗄️', description: 'Databázový server' },
    { id: 'nginx', name: 'Nginx', icon: '🌐', description: 'Webový server' },
    { id: 'apache', name: 'Apache', icon: '🪶', description: 'HTTP webový server' },
    { id: 'docker', name: 'Docker', icon: '🐳', description: 'Kontejnerizace aplikací' },
    { id: 'nodejs', name: 'Node.js', icon: '💚', description: 'JavaScript runtime prostředí' },
    { id: 'php', name: 'PHP', icon: '🐘', description: 'Skriptovací jazyk' },
    { id: 'python', name: 'Python', icon: '🐍', description: 'Programovací jazyk' },
    { id: 'redis', name: 'Redis', icon: '🔴', description: 'In-memory databáze' },
    { id: 'mongodb', name: 'MongoDB', icon: '🍃', description: 'NoSQL databáze' },
    { id: 'postgresql', name: 'PostgreSQL', icon: '🐘', description: 'Pokročilá SQL databáze' },
    { id: 'elasticsearch', name: 'Elasticsearch', icon: '🔍', description: 'Vyhledávací engine' }
  ];

  // Use custom pricing functions if provided, otherwise use default calculations
  const calculateItemPrice = (item) => {
    if (calculatePeriodPrice) {
      return calculatePeriodPrice(item);
    }

    // Default calculation
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const period = periods.find(p => p.value === selectedPeriod);
    const os = operatingSystems.find(os => os.id === selectedOS);

    // Apply period discount
    const discountedPrice = basePrice * (1 - (period?.discount || 0) / 100);

    // Add OS modifier
    const finalPrice = discountedPrice + (os?.priceModifier || 0);

    return finalPrice;
  };

  const getCartTotalPrice = () => {
    if (getCartTotal) {
      return getCartTotal();
    }

    // Default calculation
    return items.reduce((total, item) => {
      return total + calculateItemPrice(item) * item.quantity;
    }, 0);
  };

  const getCartMonthlyPrice = () => {
    if (getCartMonthlyTotal) {
      return getCartMonthlyTotal();
    }

    // Default calculation - monthly price
    return items.reduce((total, item) => {
      const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
      const os = operatingSystems.find(os => os.id === selectedOS);
      return total + (basePrice + (os?.priceModifier || 0)) * item.quantity;
    }, 0);
  };

  const getTotalSavingsAmount = () => {
    if (getTotalSavings) {
      return getTotalSavings();
    }

    // Default calculation - no savings calculation in default mode
    return 0;
  };

  // Calculate total with VAT
  const getCartTotalPriceWithVAT = () => {
    if (disableVATCalculation) {
      // If VAT calculation is disabled, assume the total already includes VAT
      return getCartTotalPrice();
    }

    const VAT_RATE = 0.21; // 21% DPH
    const totalWithoutVAT = getCartTotalPrice();
    const vatAmount = Math.round(totalWithoutVAT * VAT_RATE);
    return totalWithoutVAT + vatAmount;
  };

  const getVATAmount = () => {
    if (disableVATCalculation) {
      // If VAT calculation is disabled, calculate VAT from total that already includes it
      const VAT_RATE = 0.21; // 21% DPH
      const totalWithVAT = getCartTotalPrice();
      const totalWithoutVAT = Math.round(totalWithVAT / (1 + VAT_RATE));
      return totalWithVAT - totalWithoutVAT;
    }

    const VAT_RATE = 0.21; // 21% DPH
    const totalWithoutVAT = getCartTotalPrice();
    return Math.round(totalWithoutVAT * VAT_RATE);
  };

  const getCartMonthlyPriceWithVAT = () => {
    if (disableVATCalculation) {
      // If VAT calculation is disabled, assume monthly price already includes VAT
      return Math.round(getCartMonthlyPrice());
    }

    const VAT_RATE = 0.21; // 21% DPH
    const monthlyWithoutVAT = getCartMonthlyPrice();
    return Math.round(monthlyWithoutVAT * (1 + VAT_RATE));
  };

  const getCartTotalPriceWithoutVAT = () => {
    if (disableVATCalculation) {
      // If VAT calculation is disabled, calculate base price from total that includes VAT
      const VAT_RATE = 0.21; // 21% DPH
      const totalWithVAT = getCartTotalPrice();
      return Math.round(totalWithVAT / (1 + VAT_RATE));
    }

    return getCartTotalPrice();
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  if (items.length === 0) {
    return null; // Don't show sidebar if cart is empty
  }

  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Shrnutí objednávky</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <svg className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className={`${isCollapsed ? 'hidden lg:block' : 'block'}`}>
          {/* Period Selector */}
          {showPeriodSelector && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fakturační období
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label} {period.discount > 0 && `(-${period.discount}%)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* OS Selector */}
          {showOSSelector && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operační systém
              </label>
              <select
                value={selectedOS}
                onChange={(e) => onOSChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                {operatingSystems.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.name} {os.priceModifier > 0 && `(+${os.priceModifier} Kč)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cart Items */}
          <div className="space-y-3 mb-4">
            {items.map((item) => {
              const itemPeriodPrice = calculateItemPrice(item); // This is already period price
              const itemMonthlyPrice = calculateMonthlyPrice ? calculateMonthlyPrice(item) : (parseFloat(item.price.replace(/[^\d]/g, '')) + (operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0));
              const period = periods.find(p => p.value === selectedPeriod);

              return (
                <div key={item.id} className="border-b border-gray-200 pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-600">
                        {item.cpu} • {item.ram} • {item.storage}
                      </p>
                      {/* Vždy zobrazit období, nejen když je showPeriodSelector true */}
                      <p className="text-xs text-gray-600">
                        {period?.label} • {operatingSystems.find(os => os.id === selectedOS)?.name || 'Linux'}
                      </p>
                      {selectedApps.length > 0 && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Aplikace:</span> {selectedApps.map(id => applications.find(app => app.id === id)?.name).join(', ')}
                        </p>
                      )}
                      {(() => {
                        // Use real savings if available from custom functions
                        const getRealSavings = () => {
                          if (calculateItemSavings) {
                            const savings = calculateItemSavings(item);
                            if (savings > 0) {
                              // Calculate percentage from savings
                              const monthlyPrice = calculateMonthlyPrice ? calculateMonthlyPrice(item) : (parseFloat(item.price.replace(/[^\d]/g, '')) + (operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0));
                              const originalPrice = monthlyPrice * parseInt(selectedPeriod);
                              const savingsPercent = Math.round((savings / originalPrice) * 100);
                              return { amount: savings, percent: savingsPercent };
                            }
                          }
                          return null;
                        };

                        const realSavings = getRealSavings();
                        const fallbackDiscount = period?.discount || 0;

                        return (realSavings || fallbackDiscount > 0) && (
                          <p className="text-xs text-green-600">
                            {realSavings ? (
                              <>Sleva {realSavings.amount} CZK ({realSavings.percent}%) za {period.label}</>
                            ) : (
                              <>Sleva {fallbackDiscount}% za {period.label}</>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-semibold text-sm">
                        {Math.round(itemPeriodPrice * item.quantity)} Kč
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(itemMonthlyPrice * item.quantity)} Kč/měsíc
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          {Math.round(itemMonthlyPrice)} Kč/měs × {item.quantity}
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs mt-1"
                      >
                        Odstranit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Affiliate Info */}
          {(affiliateId || affiliateCode) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-xs font-semibold text-green-800">Partnerské sledování aktivní</div>
                  {affiliateCode && (
                    <div className="text-xs text-green-600">Kód: {affiliateCode}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            {disableVATCalculation ? (
              // When VAT calculation is disabled (payment-method page)
              <>
                {/* Subtotal without VAT (calculated from total with VAT) */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                  <span>Mezisoučet (bez DPH):</span>
                  <span>{Math.round(getCartTotalPriceWithoutVAT())} Kč</span>
                </div>

                {/* VAT amount (calculated from total with VAT) */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>DPH (21%):</span>
                  <span>{getVATAmount()} Kč</span>
                </div>

                {/* Total with VAT (from billing data) */}
                <div className="flex justify-between items-center mb-1 border-t pt-2">
                  <span className="font-bold text-gray-900">Celkem vč. DPH za {periods.find(p => p.value === selectedPeriod)?.label}:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {Math.round(getCartTotalPrice())} Kč
                  </span>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {getCartMonthlyPriceWithVAT()} Kč/měsíc vč. DPH
                </div>
              </>
            ) : (
              // Normal VAT calculation (billing page)
              <>
                {/* Subtotal without VAT */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                  <span>Mezisoučet (bez DPH):</span>
                  <span>{Math.round(getCartTotalPrice())} Kč</span>
                </div>

                {/* VAT amount */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>DPH (21%):</span>
                  <span>{getVATAmount()} Kč</span>
                </div>

                {/* Total with VAT */}
                <div className="flex justify-between items-center mb-1 border-t pt-2">
                  <span className="font-bold text-gray-900">Celkem vč. DPH za {periods.find(p => p.value === selectedPeriod)?.label}:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {Math.round(getCartTotalPriceWithVAT())} Kč
                  </span>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {getCartMonthlyPriceWithVAT()} Kč/měsíc vč. DPH
                </div>
              </>
            )}
            {getTotalSavingsAmount() > 0 && (
              <div className="text-xs text-green-600 text-center">
                Ušetříte: {Math.round(getTotalSavingsAmount())} Kč
              </div>
            )}

            {/* HostBill Invoice Amount */}
            {showHostbillAmount && hostbillInvoiceData && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-900">
                      Hodnota v HostBill:
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      {Math.round(hostbillInvoiceData.amount)} {hostbillInvoiceData.currency}
                    </span>
                  </div>
                  <div className="text-xs text-blue-700">
                    Faktura #{hostbillInvoiceData.number || hostbillInvoiceData.id}
                  </div>
                  <div className="text-xs text-blue-600">
                    Status: {hostbillInvoiceData.status}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {onNextStep ? (
              <button
                onClick={onNextStep}
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Vytvářím objednávku...' : nextStepText}
              </button>
            ) : (
              <Link
                href={nextStepUrl}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-primary-700 transition-colors block text-sm"
              >
                {nextStepText}
              </Link>
            )}

            <button
              onClick={clearCart}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Vyprázdnit košík
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-primary-50 rounded-lg">
            <div className="text-xs text-primary-800">
              <div className="font-semibold mb-1">✓ Výhody objednávky:</div>
              <ul className="space-y-0.5">
                <li>• Aktivace do 24 hodin</li>
                <li>• Podpora 24/7</li>
                <li>• 30 dní záruka vrácení peněz</li>
                <li>• Bezplatná migrace dat</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
