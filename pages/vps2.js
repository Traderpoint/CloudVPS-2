import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import VPSCartSidebar from '../components/VPSCartSidebar';
import { ToastContainer, useToast } from '../components/Toast';
import { extractAffiliateParams, storeAffiliateData, validateAffiliateId } from '../utils/affiliate';

const plans = [
  {
    id: 1,
    name: 'VPS Start',
    cpu: '2 jádra',
    ram: '4 GB',
    storage: '50 GB',
    price: '249 Kč',
    hostbillPid: 1,
    popular: false
  },
  {
    id: 2,
    name: 'VPS Profi',
    cpu: '4 jádra',
    ram: '8 GB',
    storage: '100 GB',
    price: '499 Kč',
    hostbillPid: 2,
    popular: true
  },
  {
    id: 3,
    name: 'VPS Expert',
    cpu: '8 jader',
    ram: '16 GB',
    storage: '200 GB',
    price: '999 Kč',
    hostbillPid: 3,
    popular: false
  },
  {
    id: 4,
    name: 'VPS Ultra',
    cpu: '12 jader',
    ram: '32 GB',
    storage: '400 GB',
    price: '1899 Kč',
    hostbillPid: 4,
    popular: false
  }
];

export default function VPS2() {
  const router = useRouter();
  const { addItem, affiliateId, affiliateCode, setAffiliate } = useCart();
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [affiliateValidated, setAffiliateValidated] = useState(false);
  const { toasts, addToast, removeToast, showSuccess } = useToast();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Handle affiliate tracking on page load
  useEffect(() => {
    const handleAffiliateTracking = async () => {
      // Extract affiliate parameters from URL
      const affiliateParams = extractAffiliateParams(window.location.href);

      if (affiliateParams.id || affiliateParams.code) {
        console.log('🔍 Affiliate parameters found:', affiliateParams);

        // Store affiliate data
        storeAffiliateData(affiliateParams);

        // Update cart context
        setAffiliate(affiliateParams.id, affiliateParams.code);

        // Validate affiliate ID
        if (affiliateParams.id) {
          try {
            const isValid = await validateAffiliateId(affiliateParams.id);
            if (isValid) {
              console.log('✅ Affiliate validated successfully');
              setAffiliateValidated(true);

              // Get affiliate info for display
              const response = await fetch(`/api/validate-affiliate?id=${affiliateParams.id}`);
              const result = await response.json();
              if (result.success && result.affiliate) {
                setAffiliateInfo(result.affiliate);

                // Show affiliate welcome toast
                addToast(
                  `🎉 Vítejte! Přišli jste přes partnera ${result.affiliate.name}`,
                  'success',
                  5000
                );
              }
            } else {
              console.log('❌ Affiliate validation failed');
              addToast('Neplatný affiliate kód', 'error', 3000);
            }
          } catch (error) {
            console.error('Error validating affiliate:', error);
          }
        }

        // Clean URL (remove affiliate parameters)
        const url = new URL(window.location);
        ['aff', 'affiliate', 'ref', 'aff_code', 'affiliate_code'].forEach(param => {
          url.searchParams.delete(param);
        });
        router.replace(url.pathname + url.search, undefined, { shallow: true });
      }
    };

    if (typeof window !== 'undefined') {
      handleAffiliateTracking();
    }

    // Track page view for affiliate
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      window.hostbillAffiliate.trackPageView('/vps2');
    }
  }, []); // Run only once on mount

  // Load products from middleware API
  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);

    try {
      console.log('🔍 Loading VPS products from middleware API');
      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';

      // Use affiliate mode if affiliate is present, otherwise all mode
      const mode = affiliateId ? 'affiliate' : 'all';
      const affId = affiliateId || '1'; // Default to affiliate 1 for all mode
      const url = `${middlewareUrl}/api/affiliate/${affId}/products?mode=${mode}`;

      console.log(`📡 Fetching products: ${url}`);
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.products) {
        // Map HostBill products to VPS format
        const mappedProducts = result.products.map(product => {
          // Extract specifications from tags (CPU, RAM, SSD)
          const extractSpecsFromTags = (tags) => {
            const specs = { cpu: 'N/A', ram: 'N/A', storage: 'N/A' };

            if (tags && Object.keys(tags).length > 0) {
              Object.entries(tags).forEach(([tagId, tagValue]) => {
                const value = tagValue.toUpperCase();

                if (value.includes('CPU')) {
                  specs.cpu = tagValue;
                } else if (value.includes('RAM')) {
                  specs.ram = tagValue;
                } else if (value.includes('SSD')) {
                  specs.storage = tagValue;
                }
              });
            }

            return specs;
          };

          // Map product IDs to VPS plans (name and popularity only)
          const productMapping = {
            '5': { name: 'VPS Start', popular: false },
            '10': { name: 'VPS Profi', popular: true },
            '11': { name: 'VPS Premium', popular: false },
            '12': { name: 'VPS Enterprise', popular: false }
          };

          const mapping = productMapping[product.id];
          if (!mapping) return null;

          // Extract specs from tags
          const specs = extractSpecsFromTags(product.tags);
          console.log(`📊 Product ${product.id} (${mapping.name}) specs from tags:`, specs);

          return {
            id: parseInt(product.id),
            name: mapping.name,
            cpu: specs.cpu, // From tags
            ram: specs.ram, // From tags
            storage: specs.storage, // From tags
            price: `${product.m || '299'} Kč`, // Use monthly price from HostBill
            hostbillPid: parseInt(product.id),
            popular: mapping.popular,
            commission: product.commission,
            allPrices: {
              monthly: product.m || '0',
              quarterly: product.q || '0',
              semiannually: product.s || '0',
              annually: product.a || '0',
              biennially: product.b || '0',
              triennially: product.t || '0'
            },
            // Store original tags for debugging
            tags: product.tags
          };
        }).filter(Boolean);

        setProducts(mappedProducts);
        console.log('✅ VPS products loaded successfully:', mappedProducts);
      } else {
        throw new Error(result.error || 'Failed to load products');
      }
    } catch (err) {
      setProductsError(err.message);
      console.error('❌ Error loading VPS products:', err);

      // Fallback to hardcoded plans if API fails
      console.log('🔄 Falling back to hardcoded plans');
      setProducts(plans);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load products on component mount and when affiliate changes
  useEffect(() => {
    loadProducts();
  }, [affiliateId]);

  const handleAddToCart = (plan) => {
    // Calculate real savings from pricing data
    const calculateRealSavings = (allPrices) => {
      if (!allPrices || !allPrices.monthly) return {};

      const monthlyPrice = parseFloat(allPrices.monthly);
      const savings = {};

      // Calculate savings for each period
      const periods = [
        { key: 'semiannually', months: 6 },
        { key: 'annually', months: 12 },
        { key: 'biennially', months: 24 }
      ];

      periods.forEach(({ key, months }) => {
        if (allPrices[key] && allPrices[key] !== '0') {
          const periodPrice = parseFloat(allPrices[key]);
          const monthlyTotal = monthlyPrice * months;
          const savingsAmount = monthlyTotal - periodPrice;
          const savingsPercent = Math.round((savingsAmount / monthlyTotal) * 100);

          savings[key] = {
            amount: Math.round(savingsAmount),
            percent: savingsPercent > 0 ? savingsPercent : 0
          };
        } else {
          savings[key] = { amount: 0, percent: 0 };
        }
      });

      return savings;
    };

    const realSavings = calculateRealSavings(plan.allPrices);
    console.log(`💰 Real savings calculated for ${plan.name}:`, realSavings);

    // Add item to cart with complete pricing data and real savings
    addItem({
      id: plan.id,
      name: plan.name,
      cpu: plan.cpu,
      ram: plan.ram,
      storage: plan.storage,
      price: plan.price,
      hostbillPid: plan.hostbillPid,
      // Add complete pricing data from middleware API
      allPrices: plan.allPrices || {
        monthly: plan.price.replace(/[^\d]/g, ''),
        quarterly: '0',
        semiannually: '0',
        annually: '0',
        biennially: '0',
        triennially: '0'
      },
      // Add commission data for affiliates
      commission: plan.commission || null,
      // Add real calculated savings (replaces hardcoded discounts)
      realSavings: realSavings,
      // Keep legacy discounts for backward compatibility
      discounts: {
        quarterly: 0,
        semiannually: realSavings.semiannually?.percent || 0,
        annually: realSavings.annually?.percent || 0,
        biennially: realSavings.biennially?.percent || 0,
        triennially: 0
      }
    });

    // Enhanced affiliate tracking
    console.log('🛒 Item added to cart:', plan.name);

    if (affiliateId || affiliateCode) {
      console.log('🎯 Affiliate tracking - Item added by affiliate:', {
        affiliateId,
        affiliateCode,
        product: plan.name,
        price: plan.price
      });
    }

    // Track affiliate conversion (legacy)
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      window.hostbillAffiliate.trackConversion({
        orderId: `cart-${Date.now()}`,
        amount: parseFloat(plan.price.replace(/[^\d]/g, '')),
        currency: 'CZK',
        products: [plan.name],
        affiliate: {
          id: affiliateId,
          code: affiliateCode
        }
      });
    }

    // Store pricing data in sessionStorage for payment page
    const cartSettings = {
      selectedPeriod: '12', // Default to 12 months
      selectedOS: 'linux', // Default OS
      selectedApps: [],
      // Store complete pricing data for the product
      productPricing: {
        [plan.id]: {
          allPrices: plan.allPrices,
          commission: plan.commission,
          discounts: {
            quarterly: 0,
            semiannually: 5,
            annually: 10,
            biennially: 15,
            triennially: 20
          }
        }
      }
    };

    // Merge with existing cart settings if any
    const existingSettings = sessionStorage.getItem('cartSettings');
    if (existingSettings) {
      try {
        const existing = JSON.parse(existingSettings);
        Object.assign(cartSettings, existing);
        // Merge product pricing data
        if (existing.productPricing) {
          Object.assign(cartSettings.productPricing, existing.productPricing);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse existing cart settings:', error);
      }
    }

    sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
    console.log('💾 Cart settings saved with pricing data:', cartSettings);

    // Show success message with affiliate info
    if (affiliateInfo) {
      console.log(`✅ ${plan.name} přidán do košíku pro partnera ${affiliateInfo.name}`);
      showSuccess(
        `✅ ${plan.name} přidán do košíku! Partner: ${affiliateInfo.name}`,
        4000
      );
    } else {
      showSuccess(`✅ ${plan.name} přidán do košíku!`, 3000);
    }

    // Don't redirect automatically - let user decide when to go to cart
    // router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Affiliate Banner */}
      {affiliateInfo && affiliateValidated && (
        <div className="relative z-50 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  🎉 Přišli jste přes partnera: <span className="font-bold">{affiliateInfo.name}</span>
                </p>
                <p className="text-xs opacity-90">
                  Vaše objednávka bude přiřazena k tomuto partnerovi pro sledování provizí
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                Partner ID: {affiliateInfo.id}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Code Display (for debugging) */}
      {(affiliateId || affiliateCode) && process.env.NODE_ENV === 'development' && (
        <div className="relative z-40 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  <strong>Debug:</strong> Affiliate ID: {affiliateId}, Code: {affiliateCode}, Validated: {affiliateValidated ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Background */}
      <div className="absolute inset-0">
        {/* Decentní modré obláčky */}
        <div className="absolute inset-0">
          {/* Velké obláčky */}
          <div className="absolute top-20 left-10 w-40 h-24 bg-gradient-to-r from-blue-200/20 to-blue-300/15 rounded-full blur-sm"></div>
          <div className="absolute top-32 right-20 w-48 h-28 bg-gradient-to-r from-blue-100/25 to-blue-200/20 rounded-full blur-md"></div>
          <div className="absolute top-60 left-1/3 w-36 h-20 bg-gradient-to-r from-blue-300/15 to-blue-400/10 rounded-full blur-sm"></div>

          {/* Střední obláčky */}
          <div className="absolute top-80 right-1/4 w-32 h-18 bg-gradient-to-r from-blue-200/18 to-blue-300/12 rounded-full blur-sm"></div>
          <div className="absolute top-40 left-1/2 w-28 h-16 bg-gradient-to-r from-blue-100/20 to-blue-200/15 rounded-full blur-md"></div>
          <div className="absolute bottom-40 right-10 w-44 h-26 bg-gradient-to-r from-blue-200/22 to-blue-300/18 rounded-full blur-md"></div>

          {/* Malé obláčky */}
          <div className="absolute bottom-60 left-20 w-24 h-14 bg-gradient-to-r from-blue-300/12 to-blue-400/8 rounded-full blur-sm"></div>
          <div className="absolute bottom-20 left-1/3 w-20 h-12 bg-gradient-to-r from-blue-200/15 to-blue-300/10 rounded-full blur-sm"></div>
          <div className="absolute top-100 right-1/3 w-26 h-15 bg-gradient-to-r from-blue-100/18 to-blue-200/12 rounded-full blur-md"></div>

          {/* Velmi jemné obláčky v pozadí */}
          <div className="absolute top-50 left-1/4 w-60 h-35 bg-gradient-to-r from-blue-50/30 to-blue-100/25 rounded-full blur-lg"></div>
          <div className="absolute bottom-80 right-1/4 w-50 h-30 bg-gradient-to-r from-blue-100/25 to-blue-150/20 rounded-full blur-lg"></div>
        </div>

        {/* Jemný cloud pattern */}
        <div className="absolute inset-0 opacity-8">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230077FF' fill-opacity='0.05'%3E%3Cpath d='M50 80c-8 0-15-7-15-15s7-15 15-15c2 0 4 0 6 1 3-8 11-14 20-14 12 0 22 10 22 22 0 2 0 4-1 6 8 3 14 11 14 20 0 12-10 22-22 22H50z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }} />
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Systrix VPS Hosting</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Výkonný a flexibilní VPS hosting pro maximální svobodu. Plný root přístup,
            NVMe SSD disky, dedikovaná IP adresa a profesionální správa.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              Dlaždicové zobrazení
            </span>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* VPS Plans - Tile Layout */}
          <div className="xl:w-2/3">
            {productsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg">Načítám produkty...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-6 text-lg">Chyba při načítání produktů: {productsError}</p>
                <button
                  onClick={loadProducts}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Zkusit znovu
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((plan) => (
                  <div key={plan.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative">
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-bl-lg text-sm font-bold shadow-lg z-10">
                        Nejpopulárnější
                      </div>
                    )}

                    {/* Header with gradient */}
                    <div className={`p-6 ${plan.popular ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white`}>
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-3xl font-bold mb-1">{plan.price}</div>
                        <div className="text-sm opacity-90">bez DPH / měsíc</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Specifications Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                          <div className="text-2xl mb-2">🖥️</div>
                          <p className="text-xs text-gray-600 mb-1">CPU</p>
                          <p className="text-sm font-bold text-blue-600">{plan.cpu}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                          <div className="text-2xl mb-2">💾</div>
                          <p className="text-xs text-gray-600 mb-1">RAM</p>
                          <p className="text-sm font-bold text-green-600">{plan.ram}</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl">
                          <div className="text-2xl mb-2">💿</div>
                          <p className="text-xs text-gray-600 mb-1">Storage</p>
                          <p className="text-sm font-bold text-purple-600">{plan.storage.includes('SSD') ? plan.storage : `${plan.storage} SSD`}</p>
                        </div>
                      </div>

                      {/* Commission info for affiliates */}
                      {plan.commission && affiliateValidated && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-center">
                            <p className="text-sm text-green-700 font-semibold">
                              💰 Provize: {plan.commission.rate}% = {plan.commission.monthly_amount} CZK/měsíc
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pricing info */}
                      {plan.allPrices && (
                        <div className="mb-4 text-xs text-gray-600 space-y-1">
                          {plan.allPrices.semiannually !== '0' && (
                            <div className="flex justify-between">
                              <span>Půlroční:</span>
                              <span className="font-semibold">
                                {Math.round(parseFloat(plan.allPrices.semiannually) / 6)} CZK/měs
                              </span>
                            </div>
                          )}
                          {plan.allPrices.annually !== '0' && (
                            <div className="flex justify-between">
                              <span>1 rok:</span>
                              <span className="font-semibold">
                                {Math.round(parseFloat(plan.allPrices.annually) / 12)} CZK/měs
                              </span>
                            </div>
                          )}
                          {plan.allPrices.biennially !== '0' && (
                            <div className="flex justify-between">
                              <span>2 roky:</span>
                              <span className="font-semibold">
                                {Math.round(parseFloat(plan.allPrices.biennially) / 24)} CZK/měs
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Savings display */}
                      {(() => {
                        if (!plan.allPrices) return null;

                        const monthlyPrice = parseFloat(plan.allPrices.monthly);
                        const savings = [];

                        // Annual savings (1 year)
                        if (plan.allPrices.annually !== '0') {
                          const annualPrice = parseFloat(plan.allPrices.annually);
                          const annualSavings = (monthlyPrice * 12) - annualPrice;
                          const annualSavingsPercent = Math.round((annualSavings / (monthlyPrice * 12)) * 100);
                          if (annualSavings > 0) {
                            savings.push(
                              <div key="annual" className="text-green-600 font-medium text-xs text-center">
                                Za 1 rok ušetříte: {Math.round(annualSavings)} CZK ({annualSavingsPercent}%)
                              </div>
                            );
                          }
                        }

                        return savings.length > 0 ? (
                          <div className="mb-4 p-2 bg-green-50 rounded-lg">
                            {savings}
                          </div>
                        ) : null;
                      })()}

                      {/* Action Button */}
                      <button
                        onClick={() => handleAddToCart(plan)}
                        className={`w-full py-3 px-4 rounded-xl font-bold shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-sm ${
                          affiliateValidated
                            ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                            : plan.popular
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                        } hover:shadow-xl`}
                      >
                        {affiliateValidated ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Přidat do košíku</span>
                          </div>
                        ) : (
                          'Přidat do košíku'
                        )}
                      </button>

                      {affiliateValidated && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          🎯 Partner provize aktivní
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Features Section */}
            <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-6 text-gray-900 text-center">Klíčové výhody VPS</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🔑', title: 'Root přístup', desc: 'Plná kontrola' },
                  { icon: '⚡', title: 'Garantovaný výkon', desc: 'Dedikované zdroje' },
                  { icon: '💾', title: 'NVMe SSD', desc: 'Rychlé disky' },
                  { icon: '🛡️', title: 'DDoS ochrana', desc: 'Bezpečnost zdarma' },
                  { icon: '🌐', title: 'Dedikované IP', desc: 'IPv4 a IPv6' },
                  { icon: '📊', title: 'Webová správa', desc: 'Control panel' },
                  { icon: '🔄', title: 'Neomezený přenos', desc: 'Bez limitů' },
                  { icon: '🎛️', title: 'Volba OS', desc: 'Linux distribuce' }
                ].map((feature, index) => (
                  <div key={index} className="text-center p-4 rounded-xl hover:bg-primary-50 transition-colors border border-gray-100">
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center text-gray-500">
              <p className="text-sm">Všechny ceny jsou uvedeny bez DPH. Aktivace do 24 hodin, podpora 24/7.</p>
            </div>
          </div>

          {/* Sidebar Cart */}
          <div className="xl:w-1/3">
            <VPSCartSidebar />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
