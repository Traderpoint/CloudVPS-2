import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useCart } from '../contexts/CartContext';
import Link from 'next/link';

export default function Cart() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotalPrice, updateItemPeriod, removeItem, updateQuantity } = useCart();
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [selectedOS, setSelectedOS] = useState('linux');
  const [selectedApps, setSelectedApps] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/vps');
    }
  }, [items, router]);

  const periods = [
    { value: '1', label: '1 měsíc', discount: 0, popular: false },
    { value: '3', label: '3 měsíce', discount: 5, popular: false },
    { value: '6', label: '6 měsíců', discount: 10, popular: false },
    { value: '12', label: '12 měsíců', discount: 20, popular: true },
    { value: '24', label: '24 měsíců', discount: 30, popular: false },
    { value: '36', label: '36 měsíců', discount: 40, popular: false }
  ];

  // Promo codes database
  const promoCodes = {
    'WELCOME20': {
      type: 'percentage',
      value: 20,
      description: 'Sleva 20% pro nové zákazníky',
      minAmount: 1000,
      maxDiscount: 2000,
      validUntil: '2024-12-31',
      active: true
    },
    'SAVE500': {
      type: 'fixed',
      value: 500,
      description: 'Sleva 500 Kč',
      minAmount: 2000,
      maxDiscount: 500,
      validUntil: '2024-12-31',
      active: true
    }
  };

  const operatingSystems = [
    {
      id: 'linux',
      name: 'Linux',
      icon: '🐧',
      description: 'Ubuntu, CentOS, Debian a další',
      priceModifier: 0,
      popular: true
    },
    {
      id: 'windows',
      name: 'Windows Server',
      icon: '🖥️',
      description: 'Windows Server 2019/2022',
      priceModifier: 500,
      popular: false
    }
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

  const handlePromoCodeSubmit = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingPromo(true);
    setPromoError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const code = promoCodes[promoCode.toUpperCase()];
      if (code && code.active) {
        const total = getTotalPrice();
        if (total >= code.minAmount) {
          setAppliedPromo({
            code: promoCode.toUpperCase(),
            ...code
          });
          setPromoError('');
        } else {
          setPromoError(`Minimální částka pro tento kód je ${code.minAmount} Kč`);
        }
      } else {
        setPromoError('Neplatný slevový kód');
      }
    } catch (error) {
      setPromoError('Chyba při ověřování kódu');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Calculate monthly price for an item
  const calculateMonthlyPrice = (item) => {
    // Use pricing data from middleware API if available
    if (item.allPrices) {
      const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
      const os = operatingSystems.find(os => os.id === selectedOS);

      if (monthlyPrice > 0) {
        const finalPrice = monthlyPrice + (os?.priceModifier || 0);
        console.log(`📊 Cart: ${item.name} - Monthly: ${monthlyPrice} CZK + OS: ${os?.priceModifier || 0} = ${finalPrice} CZK/měs`);
        return finalPrice;
      }
    }

    // Fallback to basic price
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const os = operatingSystems.find(os => os.id === selectedOS);
    const finalPrice = basePrice + (os?.priceModifier || 0);

    console.log(`📊 Cart: ${item.name} - Fallback monthly: ${basePrice} CZK + OS: ${os?.priceModifier || 0} = ${finalPrice} CZK/měs`);
    return finalPrice;
  };

  // Calculate total price for selected period
  const calculatePeriodPrice = (item) => {
    // Use pricing data from middleware API if available
    if (item.allPrices) {
      console.log(`💰 Cart: Using middleware pricing data for ${item.name}:`, item.allPrices);

      // Map selectedPeriod to price field
      const periodMapping = {
        '1': 'monthly',
        '3': 'quarterly',
        '6': 'semiannually',
        '12': 'annually',
        '24': 'biennially',
        '36': 'triennially'
      };

      const priceField = periodMapping[selectedPeriod] || 'monthly';
      const periodPrice = parseFloat(item.allPrices[priceField] || item.allPrices.monthly || 0);
      const os = operatingSystems.find(os => os.id === selectedOS);

      if (periodPrice > 0 && priceField !== 'monthly') {
        // For non-monthly periods, use the real period price + OS modifier for the period
        const osModifierForPeriod = (os?.priceModifier || 0) * parseInt(selectedPeriod);
        const finalPrice = periodPrice + osModifierForPeriod;
        console.log(`📊 Cart: ${item.name} - Period: ${selectedPeriod}, Real period price: ${periodPrice} CZK + OS period: ${osModifierForPeriod} = ${finalPrice} CZK`);
        return finalPrice;
      } else {
        // For monthly or fallback, calculate monthly × period
        const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
        const monthlyWithOS = monthlyPrice + (os?.priceModifier || 0);
        const finalPrice = monthlyWithOS * parseInt(selectedPeriod);
        console.log(`📊 Cart: ${item.name} - Monthly calculation: ${monthlyWithOS} CZK × ${selectedPeriod} = ${finalPrice} CZK`);
        return finalPrice;
      }
    }

    // Fallback to old calculation method
    const monthlyPrice = calculateMonthlyPrice(item);
    const finalPrice = monthlyPrice * parseInt(selectedPeriod);

    console.log(`📊 Cart: ${item.name} - Fallback period calculation: ${monthlyPrice} CZK × ${selectedPeriod} = ${finalPrice} CZK`);
    return finalPrice;
  };

  // Calculate original price (without discount) for comparison
  const calculateOriginalPrice = (item) => {
    if (item.allPrices) {
      const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
      const months = parseInt(selectedPeriod);
      const os = operatingSystems.find(os => os.id === selectedOS);

      // Original price = monthly × months + OS modifier
      return (monthlyPrice * months) + ((os?.priceModifier || 0) * months);
    }

    // Fallback to basic price
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const months = parseInt(selectedPeriod);
    const os = operatingSystems.find(os => os.id === selectedOS);

    return (basePrice * months) + ((os?.priceModifier || 0) * months);
  };

  // Calculate savings for an item using real savings data
  const calculateItemSavings = (item) => {
    // Use real savings if available
    if (item.realSavings) {
      const periodMapping = {
        '6': 'semiannually',
        '12': 'annually',
        '24': 'biennially'
      };
      const periodKey = periodMapping[selectedPeriod];
      const realSavings = item.realSavings[periodKey];

      if (realSavings && realSavings.amount > 0) {
        console.log(`💰 Cart: Using real savings for ${item.name} (${selectedPeriod} months): ${realSavings.amount} CZK`);
        return realSavings.amount;
      }
    }

    // Fallback to calculated savings
    const currentPrice = calculatePeriodPrice(item);
    const originalPrice = calculateOriginalPrice(item);
    const fallbackSavings = Math.max(0, originalPrice - currentPrice);
    console.log(`💰 Cart: Using fallback savings for ${item.name}: ${fallbackSavings} CZK`);
    return fallbackSavings;
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      return total + calculatePeriodPrice(item) * item.quantity;
    }, 0);
  };

  const getCartMonthlyTotal = () => {
    return items.reduce((total, item) => {
      return total + calculateMonthlyPrice(item) * item.quantity;
    }, 0);
  };

  const getTotalSavings = () => {
    return items.reduce((total, item) => {
      return total + calculateItemSavings(item) * item.quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;

    const total = getCartTotal();
    if (appliedPromo.type === 'percentage') {
      const discount = (total * appliedPromo.value) / 100;
      return Math.min(discount, appliedPromo.maxDiscount);
    } else {
      return appliedPromo.value;
    }
  };

  const getFinalTotal = () => {
    return getCartTotal() - calculateDiscount();
  };

  // Calculate total with VAT
  const getFinalTotalWithVAT = () => {
    const VAT_RATE = 0.21; // 21% DPH
    const totalWithoutVAT = getFinalTotal();
    const vatAmount = Math.round(totalWithoutVAT * VAT_RATE);
    return totalWithoutVAT + vatAmount;
  };

  const getVATAmount = () => {
    const VAT_RATE = 0.21; // 21% DPH
    const totalWithoutVAT = getFinalTotal();
    return Math.round(totalWithoutVAT * VAT_RATE);
  };

  const handleProceedToCheckout = () => {
    console.log('🛒 Proceeding to checkout - session status:', status, 'authenticated:', !!session);
    console.log('📅 Selected period:', selectedPeriod, 'Selected OS:', selectedOS);

    // Calculate and save cart savings for billing
    const cartSavings = {
      totalSavings: items.reduce((total, item) => total + calculateItemSavings(item) * item.quantity, 0),
      itemSavings: items.map(item => ({
        id: item.id,
        name: item.name,
        savings: calculateItemSavings(item),
        quantity: item.quantity,
        totalSavings: calculateItemSavings(item) * item.quantity
      })),
      period: selectedPeriod,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('cartSavings', JSON.stringify(cartSavings));
    console.log('💰 Cart savings calculated and saved for billing:', cartSavings);

    // Uložíme zvolené období, OS a aplikace do sessionStorage pro billing
    const cartSettings = {
      selectedPeriod: selectedPeriod,
      selectedOS: selectedOS,
      selectedApps: selectedApps,
      appliedPromo: appliedPromo,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
    console.log('💾 Cart settings saved for billing:', cartSettings);

    // Store additional cart pricing data for billing page
    const cartPricingData = {
      itemPricing: items.map(item => ({
        id: item.id,
        name: item.name,
        monthlyPrice: calculateMonthlyPrice(item),
        periodPrice: calculatePeriodPrice(item),
        savings: calculateItemSavings(item),
        quantity: item.quantity
      })),
      cartTotal: getCartTotal(),
      cartMonthlyTotal: getCartMonthlyTotal(),
      totalSavings: getTotalSavings(),
      selectedPeriod,
      selectedOS,
      selectedApps,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('cartPricingData', JSON.stringify(cartPricingData));
    console.log('💾 Cart pricing data saved for billing:', cartPricingData);

    if (session && status === 'authenticated') {
      // Uživatel je už přihlášen - jdi rovnou na billing
      console.log('✅ User already authenticated, going to billing');

      // Uložíme data z session do sessionStorage pro billing
      const registrationData = {
        email: session.user.email,
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        provider: session.user?.provider || 'google',
        googleId: session.user.id,
        avatar: session.user.image
      };

      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
      console.log('💾 Registration data saved for billing');

      router.push('/billing');
    } else {
      // Uživatel není přihlášen - jdi na registraci
      console.log('❌ User not authenticated, going to register');

      // Označ, že uživatel přišel z cart s košíkem
      sessionStorage.setItem('oauth-source', 'cart-with-items');
      console.log('🛒 Marked oauth source as cart-with-items');

      router.push('/register');
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/vps" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zpět na VPS plány
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Váš košík</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Period Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Vyberte fakturační období</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`p-4 rounded-lg border-2 transition-all min-h-[100px] flex flex-col justify-center items-center text-center ${
                      selectedPeriod === period.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${period.popular ? 'ring-2 ring-orange-200' : ''}`}
                  >
                    {period.popular && (
                      <div className="text-xs font-bold text-orange-600 mb-1">Nejoblíbenější</div>
                    )}
                    <div className="font-semibold">{period.label}</div>
                    {(() => {
                      // Calculate real savings percentage for this period
                      const getRealSavingsPercent = () => {
                        if (items.length > 0 && items[0].realSavings) {
                          const periodMapping = {
                            '6': 'semiannually',
                            '12': 'annually',
                            '24': 'biennially'
                          };
                          const periodKey = periodMapping[period.value];
                          const realSavings = items[0].realSavings[periodKey];
                          return realSavings?.percent || 0;
                        }
                        return period.discount || 0;
                      };

                      const savingsPercent = getRealSavingsPercent();
                      return savingsPercent > 0 && (
                        <div className="text-sm text-green-600">Ušetříte {savingsPercent}%</div>
                      );
                    })()}
                  </button>
                ))}
              </div>
            </div>

            {/* Operating System Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Zvolte operační systém</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {operatingSystems.map((os) => (
                  <div
                    key={os.id}
                    onClick={() => setSelectedOS(os.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOS === os.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{os.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center">
                          {os.name}
                          {os.popular && selectedOS !== os.id && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Doporučeno
                            </span>
                          )}
                          {selectedOS === os.id && (
                            <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                              Vybráno
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{os.description}</div>
                        {os.priceModifier > 0 && (
                          <div className="text-sm text-orange-600">+{os.priceModifier} Kč/měsíc</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Vybrat aplikace</h2>
              <p className="text-gray-600 mb-4">Vyberte až 5 aplikací, které chcete mít předinstalované na vašem VPS serveru.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {applications.map((app) => {
                  const isSelected = selectedApps.includes(app.id);
                  const canSelect = selectedApps.length < 5 || isSelected;

                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedApps(prev => prev.filter(id => id !== app.id));
                        } else if (canSelect) {
                          setSelectedApps(prev => [...prev, app.id]);
                        }
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : canSelect
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{app.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            {app.name}
                            {isSelected && (
                              <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                Vybráno
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{app.description}</div>
                        </div>
                        {isSelected && (
                          <div className="text-primary-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedApps.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Vybrané aplikace ({selectedApps.length}/5):</strong>{' '}
                    {selectedApps.map(id => applications.find(app => app.id === id)?.name).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-4">Shrnutí objednávky</h3>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const monthlyPrice = calculateMonthlyPrice(item);
                  const periodPrice = calculatePeriodPrice(item);
                  const period = periods.find(p => p.value === selectedPeriod);
                  const os = operatingSystems.find(os => os.id === selectedOS);

                  return (
                    <div key={item.id} className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.cpu} • {item.ram} • {item.storage}
                          </p>
                          <p className="text-sm text-gray-600">
                            {period?.label} • {os?.name}
                          </p>

                          {/* Commission info for affiliates */}
                          {item.commission && (
                            <p className="text-xs text-green-600 font-medium">
                              💰 Provize: {item.commission.rate}% = {item.commission.monthly_amount} CZK/měsíc
                            </p>
                          )}
                          {selectedApps.length > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Aplikace:</span> {selectedApps.map(id => applications.find(app => app.id === id)?.name).join(', ')}
                            </p>
                          )}
                          {(() => {
                            // Use real savings if available
                            const getRealSavings = () => {
                              if (item.realSavings) {
                                const periodMapping = {
                                  '6': 'semiannually',
                                  '12': 'annually',
                                  '24': 'biennially'
                                };
                                const periodKey = periodMapping[selectedPeriod];
                                return item.realSavings[periodKey];
                              }
                              return null;
                            };

                            const realSavings = getRealSavings();
                            const fallbackDiscount = period?.discount || 0;

                            const savingsPercent = realSavings?.percent || fallbackDiscount;
                            const savingsAmount = realSavings?.amount || 0;

                            return savingsPercent > 0 && (
                              <p className="text-xs text-green-600">
                                {realSavings ? (
                                  <>Sleva {savingsAmount} CZK ({savingsPercent}%) za {period.label}</>
                                ) : (
                                  <>Sleva {savingsPercent}% za {period.label}</>
                                )}
                              </p>
                            );
                          })()}
                          {os?.priceModifier > 0 && (
                            <p className="text-xs text-orange-600">
                              +{os.priceModifier} Kč za {os.name}
                            </p>
                          )}

                          {/* Quantity controls */}
                          <div className="flex items-center space-x-2 mt-3">
                            <span className="text-sm text-gray-600">Množství:</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-10 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">{Math.round(periodPrice * item.quantity)} Kč</div>
                          <div className="text-xs text-gray-500">{Math.round(monthlyPrice * item.quantity)} Kč/měsíc</div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              {Math.round(monthlyPrice)} Kč/měs × {item.quantity}
                            </div>
                          )}
                          {(() => {
                            const savings = calculateItemSavings(item) * item.quantity;
                            const originalPrice = calculateOriginalPrice(item) * item.quantity;

                            return savings > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400 line-through">
                                  {Math.round(originalPrice)} Kč
                                </div>
                                <div className="text-xs text-green-600 font-medium">
                                  Ušetříte: {Math.round(savings)} Kč
                                </div>
                              </div>
                            );
                          })()}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm mt-1"
                          >
                            Odstranit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Zadejte promo kód"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handlePromoCodeSubmit}
                    disabled={isValidatingPromo}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isValidatingPromo ? '...' : 'Použít'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-sm mt-2">{promoError}</p>
                )}
                {appliedPromo && (
                  <p className="text-green-600 text-sm mt-2">
                    ✅ Sleva {appliedPromo.description} aplikována
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Měsíčně</span>
                  <span>{Math.round(items.reduce((total, item) => total + calculateMonthlyPrice(item) * item.quantity, 0))} Kč</span>
                </div>
                <div className="flex justify-between">
                  <span>Období</span>
                  <span>{periods.find(p => p.value === selectedPeriod)?.label}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Sleva ({appliedPromo.code})</span>
                    <span>-{Math.round(calculateDiscount())} Kč</span>
                  </div>
                )}

                {/* Subtotal without VAT */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Mezisoučet (bez DPH):</span>
                  <span>{Math.round(getFinalTotal())} Kč</span>
                </div>

                {/* VAT amount */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>DPH (21%):</span>
                  <span>{getVATAmount()} Kč</span>
                </div>

                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Celkem vč. DPH za {periods.find(p => p.value === selectedPeriod)?.label}</span>
                    <span>{Math.round(getFinalTotalWithVAT())} Kč</span>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    {Math.round(items.reduce((total, item) => total + calculateMonthlyPrice(item) * item.quantity, 0) * 1.21)} Kč/měsíc vč. DPH
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Ceny jsou uvedeny včetně 21% DPH
                </div>
              </div>

              {/* 30-day guarantee */}
              <div className="flex items-center space-x-2 mb-6 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>30-day money-back guarantee</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Pokračovat k objednávce • {Math.round(getFinalTotalWithVAT())} Kč vč. DPH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
