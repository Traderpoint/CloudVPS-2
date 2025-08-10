import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import CartSidebar from '../components/CartSidebar';
import Link from 'next/link';

export default function Billing() {
  const router = useRouter();
  const { items, affiliateId, affiliateCode } = useCart();
  const [registrationData, setRegistrationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState('+420');
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companySearchError, setCompanySearchError] = useState('');




  // Mock data pro testování - přepíše se při načtení IČO
  const [formData, setFormData] = useState({
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@example.com',
    phone: '+420777123456',
    country: 'Czech Republic',
    address: 'Václavské náměstí 1',
    city: 'Praha',
    region: 'Praha',
    zipCode: '11000',
    // Company fields - přepíše se při IČO vyhledávání
    companyName: 'Testovací firma s.r.o.',
    vatNumber: '12345678',
    ico: '' // IČO pro vyhledávání firmy (zkuste 66520908)
  });

  // Function to search company by IČO via middleware
  const searchCompanyByICO = async (ico) => {
    if (!ico || ico.length < 8) {
      setCompanySearchError('IČO musí mít alespoň 8 číslic');
      return;
    }

    setIsLoadingCompany(true);
    setCompanySearchError('');

    try {
      console.log('🔍 Searching company by IČO via middleware:', ico);

      // Try middleware first, fallback to direct API
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      console.log('🌐 Middleware URL:', middlewareUrl);

      let response;
      let data;

      try {
        // Try middleware first
        response = await fetch(`${middlewareUrl}/api/company-search?ico=${ico}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (!response.ok) {
          throw new Error(`Middleware response: ${response.status}`);
        }

        data = await response.json();
        console.log('✅ Middleware response:', data);

      } catch (middlewareError) {
        console.warn('⚠️ Middleware failed, trying direct API:', middlewareError);

        // Fallback to direct API call
        response = await fetch(`/api/company-search?ico=${ico}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Direct API response: ${response.status}`);
        }

        data = await response.json();
        console.log('✅ Direct API response:', data);
      }

      if (data.success && data.company) {
        const company = data.company;
        console.log('✅ Company found:', company);

        // Update form data with company information - OVERWRITE mock data
        setFormData(prev => ({
          ...prev,
          companyName: company.name || '',
          address: company.address || '',
          city: company.city || '',
          zipCode: company.zipCode || '',
          vatNumber: company.vatNumber || ico
        }));

        setCompanySearchError('');
      } else {
        setCompanySearchError(data.error || 'Firma nebyla nalezena');
      }
    } catch (error) {
      console.error('❌ Error searching company:', error);
      setCompanySearchError(`Chyba při vyhledávání firmy: ${error.message}`);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Handle IČO input change with debouncing
  const handleICOChange = (e) => {
    const ico = e.target.value.replace(/\D/g, ''); // Only numbers
    setFormData(prev => ({ ...prev, ico }));

    // Auto-search when IČO has 8 digits
    if (ico.length === 8) {
      searchCompanyByICO(ico);
    } else if (ico.length > 0 && ico.length < 8) {
      setCompanySearchError('IČO musí mít 8 číslic');
    } else {
      setCompanySearchError('');
    }
  };

  // Load registration data on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('registrationData');
    const oauthSource = sessionStorage.getItem('oauth-source');
    const cartData = localStorage.getItem('cart');

    console.log('🔍 Billing mount - checking data:', {
      hasRegistrationData: !!storedData,
      oauthSource,
      hasCartData: !!cartData,
      cartItems: cartData ? JSON.parse(cartData).items?.length || 0 : 0
    });

    if (storedData) {
      const data = JSON.parse(storedData);
      console.log('✅ Registration data found:', data);
      setRegistrationData(data);

      // Pre-fill data from registration
      setFormData(prev => ({
        ...prev,
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      }));
    } else {
      console.log('❌ No registration data found - redirecting to register');
      // Redirect to registration if no data
      router.push('/register');
    }

    // Označ, že registrationData byla zkontrolována
    setRegistrationDataLoaded(true);
  }, [router]);



  // Check if cart is empty (but don't auto-redirect after registration)
  const [showEmptyCartMessage, setShowEmptyCartMessage] = useState(false);
  const [registrationDataLoaded, setRegistrationDataLoaded] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [initialCartCheckDone, setInitialCartCheckDone] = useState(false);

  // Cart data from cart page
  const [cartData, setCartData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [selectedOS, setSelectedOS] = useState('linux');
  const [selectedApps, setSelectedApps] = useState([]);

  // Sleduj načtení košíku
  useEffect(() => {
    // Počkej delší dobu na načtení košíku z localStorage
    const timer = setTimeout(() => {
      setCartLoaded(true);
      console.log('🛒 Cart loading timeout - items length:', items.length);

      // Debug: Zkontroluj localStorage přímo
      const savedCart = localStorage.getItem('cart');
      console.log('🛒 Direct localStorage check:', {
        hasCart: !!savedCart,
        cartData: savedCart ? JSON.parse(savedCart) : null
      });
    }, 1000); // Zvýšeno na 1000ms pro jistotu

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('🔍 Billing: Cart check -', {
      registrationDataLoaded,
      cartLoaded,
      initialCartCheckDone,
      itemsLength: items.length,
      hasRegistrationData: !!registrationData,
      registrationEmail: registrationData?.email
    });

    // Proveď kontrolu košíku pouze jednou, když se všechno načte
    if (registrationDataLoaded && cartLoaded && !initialCartCheckDone) {
      // Zkontroluj, jestli uživatel přišel z OAuth s košíkem
      const oauthSource = sessionStorage.getItem('oauth-source');
      const cameFromCartWithItems = oauthSource === 'cart-with-items';

      console.log('🔍 OAuth source check:', { oauthSource, cameFromCartWithItems });

      // Vyčisti oauth-source po kontrole
      if (oauthSource) {
        sessionStorage.removeItem('oauth-source');
        console.log('🧹 OAuth source cleared after check');
      }

      if (items.length === 0 && !registrationData) {
        // Only redirect if user didn't just register
        console.log('🔄 Empty cart, no registration data - redirecting to VPS');
        router.push('/vps');
      } else if (items.length === 0 && registrationData && !cameFromCartWithItems) {
        // Show message for registered users with empty cart (but not if they came from cart)
        console.log('⚠️ Empty cart but user just registered - showing message');
        setShowEmptyCartMessage(true);
      } else if (items.length === 0 && registrationData && cameFromCartWithItems) {
        // User came from cart but cart is empty - this shouldn't happen, but don't show error
        console.log('🚨 User came from cart but cart is empty - possible localStorage issue');
        setShowEmptyCartMessage(true);
      } else if (items.length > 0) {
        console.log('✅ Cart has items:', items.map(item => ({ id: item.id, name: item.name })));
        setShowEmptyCartMessage(false); // Skryj zprávu, pokud má košík položky
      }

      // Označ, že počáteční kontrola byla provedena
      setInitialCartCheckDone(true);
    }
  }, [items, router, registrationData, registrationDataLoaded, cartLoaded, initialCartCheckDone]);

  // Sleduj změny košíku po počáteční kontrole - pouze pro přidání položek
  useEffect(() => {
    if (initialCartCheckDone && items.length > 0) {
      console.log('✅ Cart updated after initial check - hiding empty message');
      setShowEmptyCartMessage(false);
    }
  }, [items.length, initialCartCheckDone]);

  // Load cart data and settings from sessionStorage (saved from cart page)
  useEffect(() => {
    const loadCartData = () => {
      try {
        // Load cart settings from sessionStorage
        const cartSettings = sessionStorage.getItem('cartSettings');
        if (cartSettings) {
          const settings = JSON.parse(cartSettings);
          console.log('📅 Loading cart settings from cart page:', settings);

          if (settings.selectedPeriod) {
            setSelectedPeriod(settings.selectedPeriod);
          }
          if (settings.selectedOS) {
            setSelectedOS(settings.selectedOS);
          }
          if (settings.selectedApps) {
            setSelectedApps(settings.selectedApps);
          }
        }

        // Load cart pricing data from sessionStorage
        const savedCartData = sessionStorage.getItem('cartPricingData');
        if (savedCartData) {
          const data = JSON.parse(savedCartData);
          console.log('💰 Loading cart pricing data from cart page:', data);
          setCartData(data);
        }

        console.log('✅ Cart data loaded from cart page');
      } catch (error) {
        console.warn('⚠️ Failed to load cart data from cart page:', error);
      }
    };

    loadCartData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  // Pricing functions that use data from cart page
  const operatingSystems = [
    { id: 'linux', name: 'Linux', priceModifier: 0 },
    { id: 'windows', name: 'Windows Server', priceModifier: 500 }
  ];

  const periods = [
    { value: '1', label: '1 měsíc', discount: 0 },
    { value: '3', label: '3 měsíce', discount: 5 },
    { value: '6', label: '6 měsíců', discount: 10 },
    { value: '12', label: '12 měsíců', discount: 20 },
    { value: '24', label: '24 měsíců', discount: 30 },
    { value: '36', label: '36 měsíců', discount: 40 }
  ];

  // Calculate monthly price for an item (same logic as cart page)
  const calculateMonthlyPrice = (item) => {
    // Use pricing data from middleware API if available
    if (item.allPrices) {
      const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
      const os = operatingSystems.find(os => os.id === selectedOS);

      if (monthlyPrice > 0) {
        const finalPrice = monthlyPrice + (os?.priceModifier || 0);
        console.log(`📊 Billing: ${item.name} - Monthly: ${monthlyPrice} CZK + OS: ${os?.priceModifier || 0} = ${finalPrice} CZK/měs`);
        return finalPrice;
      }
    }

    // Fallback to basic price
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const os = operatingSystems.find(os => os.id === selectedOS);
    const finalPrice = basePrice + (os?.priceModifier || 0);

    console.log(`📊 Billing: ${item.name} - Fallback monthly: ${basePrice} CZK + OS: ${os?.priceModifier || 0} = ${finalPrice} CZK/měs`);
    return finalPrice;
  };

  // Calculate total price for selected period (same logic as cart page)
  const calculatePeriodPrice = (item) => {
    // Use pricing data from middleware API if available
    if (item.allPrices) {
      console.log(`💰 Billing: Using middleware pricing data for ${item.name}:`, item.allPrices);

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
        console.log(`📊 Billing: ${item.name} - Period: ${selectedPeriod}, Real period price: ${periodPrice} CZK + OS period: ${osModifierForPeriod} = ${finalPrice} CZK`);
        return finalPrice;
      } else {
        // For monthly or fallback, calculate monthly × period
        const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
        const monthlyWithOS = monthlyPrice + (os?.priceModifier || 0);
        const finalPrice = monthlyWithOS * parseInt(selectedPeriod);
        console.log(`📊 Billing: ${item.name} - Monthly calculation: ${monthlyWithOS} CZK × ${selectedPeriod} = ${finalPrice} CZK`);
        return finalPrice;
      }
    }

    // Fallback to old calculation method
    const monthlyPrice = calculateMonthlyPrice(item);
    const finalPrice = monthlyPrice * parseInt(selectedPeriod);

    console.log(`📊 Billing: ${item.name} - Fallback period calculation: ${monthlyPrice} CZK × ${selectedPeriod} = ${finalPrice} CZK`);
    return finalPrice;
  };

  // Calculate savings for an item
  const calculateItemSavings = (item) => {
    // Use cart data if available
    if (cartData && cartData.itemSavings) {
      const itemSaving = cartData.itemSavings.find(saving => saving.id === item.id);
      if (itemSaving) {
        console.log(`💰 Billing: Using cart savings for ${item.name}: ${itemSaving.savings} CZK`);
        return itemSaving.savings;
      }
    }

    // Fallback: calculate savings
    const monthlyPrice = calculateMonthlyPrice(item);
    const periodPrice = calculatePeriodPrice(item);
    const originalPrice = monthlyPrice * parseInt(selectedPeriod);
    const fallbackSavings = Math.max(0, originalPrice - periodPrice);
    console.log(`💰 Billing: Using fallback savings for ${item.name}: ${fallbackSavings} CZK`);
    return fallbackSavings;
  };

  // Calculate cart totals
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
    // Use cart data if available
    if (cartData && cartData.totalSavings !== undefined) {
      console.log(`💰 Billing: Using cart total savings: ${cartData.totalSavings} CZK`);
      return cartData.totalSavings;
    }

    // Fallback to calculated savings
    const calculatedTotal = items.reduce((total, item) => {
      return total + calculateItemSavings(item) * item.quantity;
    }, 0);
    console.log(`💰 Billing: Using calculated total savings: ${calculatedTotal} CZK`);
    return calculatedTotal;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'zipCode'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError('Prosím vyplňte všechna povinná pole');
      setIsLoading(false);
      return;
    }

    if (isCompany && !formData.companyName) {
      setError('Prosím vyplňte název společnosti');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create order according to real-payment-flow-test
      console.log('🔄 Creating order in HostBill...');

      // Calculate total price from cart using cart page logic
      const cartTotal = getCartTotal();
      console.log('💰 Cart total for order:', cartTotal, 'CZK');

      // Debug: Log cart items with quantities
      console.log('🛒 Cart items debug:', items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        hostbillPid: item.hostbillPid
      })));

      const orderData = {
        // Customer data - EXACT format from real-payment-flow-test
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.zipCode,
          country: 'CZ',
          company: isCompany ? formData.companyName : ''
        },

        // Items data - Use individual item prices and quantities from cart
        items: items.map(item => {
          // Use calculated period price from cart page logic
          const itemPrice = calculatePeriodPrice(item);

          console.log('📦 Processing cart item:', {
            id: item.id,
            name: item.name,
            originalPrice: item.price,
            parsedPrice: itemPrice,
            quantity: item.quantity || 1,
            actualQuantity: item.quantity,
            quantityType: typeof item.quantity,
            hostbillPid: item.hostbillPid,
            fullItem: item
          });

          const finalProductId = item.hostbillPid || item.id;

          console.log('🔍 Product ID mapping:', {
            itemId: item.id,
            hostbillPid: item.hostbillPid,
            finalProductId: finalProductId,
            quantity: item.quantity || 1
          });

          // Transform billing period from cart settings to HostBill format
          const periodMapping = {
            '1': 'm',    // 1 month = monthly
            '3': 'q',    // 3 months = quarterly
            '6': 's',    // 6 months = semiannually
            '12': 'a',   // 12 months = annually
            '24': 'b',   // 24 months = biennially
            '36': 't'    // 36 months = triennially
          };

          const billingCycle = periodMapping[String(selectedPeriod)] || 'm';

          return {
            productId: finalProductId,
            name: item.name,
            price: itemPrice, // Use calculated period price
            cycle: billingCycle, // Use billing cycle from cart
            quantity: item.quantity || 1, // Use actual quantity from cart
            configOptions: {
              // Map cart item specs to config options
              cpu: item.cpu || '2 vCPU',
              ram: item.ram || '4GB',
              storage: item.storage || '50GB',
              // Add OS selection from cart
              os: selectedOS || 'linux',
              bandwidth: '1TB',
              // Add selected applications
              applications: selectedApps.length > 0 ? selectedApps.join(',') : ''
            }
          };
        }),

        // Additional data - EXACT format from real-payment-flow-test
        affiliate: affiliateId ? { id: affiliateId } : (registrationData?.affiliateId ? { id: registrationData.affiliateId } : { id: process.env.NEXT_PUBLIC_DEFAULT_AFFILIATE_ID || '2' }),
        paymentMethod: '130', // Fixed to use Comgate payment module ID 130
        newsletterSubscribe: false,
        type: 'complete',
        // Add cart total for reference
        cartTotal: cartTotal
      };

      console.log('📤 Sending order data to middleware:', JSON.stringify(orderData, null, 2));
      console.log('🔍 Items quantities check:', orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })));

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Order created successfully:', result);

        // Store billing cart data for payment step
        const billingCartData = {
          items: items,
          selectedPeriod: selectedPeriod,
          selectedOS: selectedOS,
          selectedApps: selectedApps,
          cartTotal: getCartTotal(),
          cartMonthlyTotal: getCartMonthlyTotal(),
          totalSavings: getTotalSavings(),
          itemPricing: items.map(item => ({
            id: item.id,
            name: item.name,
            monthlyPrice: calculateMonthlyPrice(item),
            periodPrice: calculatePeriodPrice(item),
            savings: calculateItemSavings(item),
            quantity: item.quantity
          })),
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('billingCartData', JSON.stringify(billingCartData));
        console.log('💾 Billing cart data saved for payment:', billingCartData);

        // Store order data for payment step
        sessionStorage.setItem('orderData', JSON.stringify({
          ...result,
          billingData: formData,
          registrationData: registrationData
        }));

        // Redirect to payment step
        router.push('/payment-method');
      } else {
        console.error('❌ Order creation failed:', result);
        throw new Error(result.error || 'Nepodařilo se vytvořit objednávku');
      }
    } catch (error) {
      console.error('❌ Error creating order:', error);

      // Show more specific error message if available
      let errorMessage = 'Došlo k chybě při vytváření objednávky. Zkuste to prosím znovu.';

      if (error.message) {
        if (error.message.includes('customer') || error.message.includes('client')) {
          errorMessage = 'Problém s vytvořením zákaznického účtu. Zkuste to prosím znovu nebo kontaktujte podporu.';
        } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = 'Zákazník s touto e-mailovou adresou již existuje. Zkuste se přihlásit nebo použijte jinou e-mailovou adresu.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/register" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zpět
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Billing Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-bold">Fakturační adresa</h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}

              {showEmptyCartMessage && (() => {
                const oauthSource = sessionStorage.getItem('oauth-source');
                const cameFromCartWithItems = oauthSource === 'cart-with-items';

                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Košík je prázdný
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          {cameFromCartWithItems ? (
                            <p>Váš košík se možná ztratil během přihlášení. Zkuste si vybrat VPS konfiguraci znovu.</p>
                          ) : (
                            <p>Váš košík je prázdný. Nejdříve si vyberte VPS konfiguraci.</p>
                          )}
                          <div className="mt-3">
                            <Link
                              href="/vps-setup"
                              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Vybrat VPS konfiguraci
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Jméno
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Aleš"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Příjmení
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ridl"
                    />
                  </div>
                </div>

                {/* Country and Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Země bydliště*
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="Czech Republic">Česká republika</option>
                      <option value="Slovakia">Slovensko</option>
                      <option value="Poland">Polsko</option>
                      <option value="Germany">Německo</option>
                      <option value="Austria">Rakousko</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonní číslo*
                    </label>
                    <div className="flex">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                      >
                        <option value="+420">+420 (ČR)</option>
                        <option value="+421">+421 (SK)</option>
                        <option value="+48">+48 (PL)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+43">+43 (AT)</option>
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="flex-1 px-3 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="123 456 789"
                        pattern="[0-9\s]{9,15}"
                        title="Zadejte platné telefonní číslo (9-15 číslic)"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formát: 123 456 789 (bez předvolby)
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresa*
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Začněte psát adresu..."
                    autoComplete="street-address"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Začněte psát adresu bydliště a vyberte z nabídky pro automatické vyplnění
                  </p>
                </div>

                {/* City, Region, ZIP */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Město*
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Praha"
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                      Kraj/oblast
                    </label>
                    <input
                      type="text"
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Hlavní město Praha"
                      autoComplete="address-level1"
                    />
                  </div>
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                      PSČ*
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="110 00"
                      pattern="[0-9\s]{5,6}"
                      title="Zadejte platné PSČ (např. 110 00)"
                      autoComplete="postal-code"
                    />
                  </div>
                </div>

                {/* Company Details Checkbox */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isCompany"
                    checked={isCompany}
                    onChange={(e) => setIsCompany(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isCompany" className="text-sm font-medium text-gray-700">
                    Přidat firemní údaje
                  </label>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Company Fields */}
                {isCompany && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label htmlFor="ico" className="block text-sm font-medium text-gray-700 mb-2">
                        IČO firmy*
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="ico"
                          name="ico"
                          value={formData.ico}
                          onChange={handleICOChange}
                          required={isCompany}
                          maxLength="8"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="66520908 (zkuste tento IČO)"
                          pattern="[0-9]{8}"
                          title="Zadejte 8-místné IČO"
                        />
                        {isLoadingCompany && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                          </div>
                        )}
                      </div>
                      {companySearchError && (
                        <p className="text-xs text-red-600 mt-1">{companySearchError}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Zadejte IČO pro automatické doplnění údajů firmy
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                          Název firmy*
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required={isCompany}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Systrix s.r.o."
                        />
                      </div>
                      <div>
                        <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          DIČ
                        </label>
                        <div className="flex">
                          <span className="px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-100 text-sm">
                            CZ
                          </span>
                          <input
                            type="text"
                            id="vatNumber"
                            name="vatNumber"
                            value={formData.vatNumber}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="12345678"
                            pattern="[0-9]{8,10}"
                            title="Zadejte platné DIČ (8-10 číslic)"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Nepovinné - pouze pro firmy s DIČ
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <CartSidebar
              showPeriodSelector={true}
              showOSSelector={true}
              selectedPeriod={selectedPeriod}
              selectedOS={selectedOS}
              selectedApps={selectedApps}
              onPeriodChange={setSelectedPeriod}
              onOSChange={setSelectedOS}
              nextStepUrl="/payment-method"
              nextStepText="Pokračovat k platbě"
              onNextStep={handleSubmit}
              isLoading={isLoading}
              // Custom pricing functions from cart page logic
              calculateMonthlyPrice={calculateMonthlyPrice}
              calculatePeriodPrice={calculatePeriodPrice}
              calculateItemSavings={calculateItemSavings}
              getCartTotal={getCartTotal}
              getCartMonthlyTotal={getCartMonthlyTotal}
              getTotalSavings={getTotalSavings}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
