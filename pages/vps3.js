import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import VPS3CartSidebar from '../components/VPS3CartSidebar';
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

export default function VPS3() {
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
      window.hostbillAffiliate.trackPageView('/vps3');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Professional Tech Background */}
      <div className="absolute inset-0">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300D4FF' fill-opacity='0.1'%3E%3Cpath d='M40 40c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm20-20c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }} />
        </div>

        {/* Circuit Board Pattern */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none">
          {/* Main Circuit Lines */}
          <g opacity="0.15">
            <path d="M100 100L300 100L300 200L500 200L500 400L700 400L700 600L900 600" stroke="url(#techGradient1)" strokeWidth="2"/>
            <path d="M1100 150L900 150L900 350L700 350L700 550L500 550L500 750" stroke="url(#techGradient2)" strokeWidth="2"/>
            <path d="M200 700L400 700L400 500L600 500L600 300L800 300L800 100L1000 100" stroke="url(#techGradient3)" strokeWidth="2"/>
            <path d="M50 400L150 400L150 600L350 600L350 800" stroke="url(#techGradient4)" strokeWidth="2"/>
          </g>

          {/* Connection Nodes */}
          <g opacity="0.3">
            <circle cx="300" cy="100" r="6" fill="#00D4FF"/>
            <circle cx="500" cy="200" r="6" fill="#00FF88"/>
            <circle cx="700" cy="400" r="6" fill="#FF6B6B"/>
            <circle cx="900" cy="600" r="6" fill="#FFD93D"/>
            <circle cx="1100" cy="150" r="6" fill="#A78BFA"/>
            <circle cx="400" cy="700" r="6" fill="#FB7185"/>
            <circle cx="600" cy="500" r="6" fill="#34D399"/>
            <circle cx="800" cy="300" r="6" fill="#60A5FA"/>
          </g>

          {/* Microchip Rectangles */}
          <g opacity="0.2">
            <rect x="280" y="80" width="40" height="40" rx="8" fill="#00D4FF"/>
            <rect x="480" y="180" width="40" height="40" rx="8" fill="#00FF88"/>
            <rect x="680" y="380" width="40" height="40" rx="8" fill="#FF6B6B"/>
            <rect x="880" y="580" width="40" height="40" rx="8" fill="#FFD93D"/>
            <rect x="1080" y="130" width="40" height="40" rx="8" fill="#A78BFA"/>
            <rect x="380" y="680" width="40" height="40" rx="8" fill="#FB7185"/>
          </g>

          {/* Data Flow Lines */}
          <g opacity="0.1">
            <path d="M0 200L1200 200" stroke="url(#techGradient5)" strokeWidth="1" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M0 400L1200 400" stroke="url(#techGradient6)" strokeWidth="1" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="10;0" dur="3s" repeatCount="indefinite"/>
            </path>
            <path d="M0 600L1200 600" stroke="url(#techGradient7)" strokeWidth="1" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" values="0;10" dur="4s" repeatCount="indefinite"/>
            </path>
          </g>

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="techGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF"/>
              <stop offset="100%" stopColor="#00FF88"/>
            </linearGradient>
            <linearGradient id="techGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA"/>
              <stop offset="100%" stopColor="#FFD93D"/>
            </linearGradient>
            <linearGradient id="techGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FB7185"/>
              <stop offset="100%" stopColor="#34D399"/>
            </linearGradient>
            <linearGradient id="techGradient4" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA"/>
              <stop offset="100%" stopColor="#FF6B6B"/>
            </linearGradient>
            <linearGradient id="techGradient5" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF"/>
              <stop offset="50%" stopColor="#A78BFA"/>
              <stop offset="100%" stopColor="#00FF88"/>
            </linearGradient>
            <linearGradient id="techGradient6" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD93D"/>
              <stop offset="50%" stopColor="#FB7185"/>
              <stop offset="100%" stopColor="#60A5FA"/>
            </linearGradient>
            <linearGradient id="techGradient7" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34D399"/>
              <stop offset="50%" stopColor="#FF6B6B"/>
              <stop offset="100%" stopColor="#00D4FF"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle Tech Elements - Reduced Animation */}
        <div className="absolute inset-0">
          {/* Static Server Racks */}
          <div className="absolute top-20 left-20 w-12 h-20 bg-cyan-400/10 rounded-lg backdrop-blur-sm"></div>
          <div className="absolute top-40 right-32 w-10 h-16 bg-green-400/10 rounded-lg backdrop-blur-sm"></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-24 bg-purple-400/10 rounded-lg backdrop-blur-sm"></div>

          {/* Minimal Network Indicators */}
          <div className="absolute top-32 right-20 w-3 h-3 bg-cyan-400/20 rounded-full"></div>
          <div className="absolute bottom-60 left-1/2 w-4 h-4 bg-purple-400/20 rounded-full"></div>
        </div>

        {/* Subtle Tech Text */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-10 right-10 text-cyan-400 text-xs font-mono">
            Enterprise Infrastructure
          </div>
          <div className="absolute bottom-10 left-10 text-blue-400 text-xs font-mono">
            99.9% Uptime SLA
          </div>
        </div>

        {/* Hexagonal Tech Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 1200 800">
            <defs>
              <pattern id="hexPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,2 50,15 50,37 30,50 10,37 10,15" fill="none" stroke="#00D4FF" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexPattern)"/>
          </svg>
        </div>
      </div>
      {/* Affiliate Banner - Tech Style */}
      {affiliateInfo && affiliateValidated && (
        <div className="relative z-50 bg-gray-900/95 backdrop-blur-sm border-b border-green-500/30 py-4 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-green-500/30">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Přišli jste přes partnera: <span className="font-semibold text-green-400">{affiliateInfo.name}</span>
                </p>
                <p className="text-xs text-gray-400 font-light">
                  Vaše objednávka bude přiřazena k tomuto partnerovi pro sledování provizí
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-xs font-medium border border-green-500/30">
                Partner ID: {affiliateInfo.id}
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Code Display (for debugging) - Tech Style */}
      {(affiliateId || affiliateCode) && process.env.NODE_ENV === 'development' && (
        <div className="relative z-40 bg-gray-900/90 backdrop-blur-sm border-b border-cyan-500/30 text-cyan-400 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-mono">
                  <span className="text-cyan-300">DEBUG:</span> Affiliate ID: {affiliateId}, Code: {affiliateCode}, Validated: {affiliateValidated ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-12 px-4 relative z-10">
        {/* Header - Tech Style */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-2xl mb-8 backdrop-blur-sm border border-cyan-400/30">
            <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-6 text-white tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Systrix VPS3 Hosting
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Výkonný a flexibilní VPS hosting s nejmodernější infrastrukturou.
            <span className="block mt-2 text-cyan-400">Plný root přístup • NVMe SSD • Dedikované IP • 24/7 podpora</span>
          </p>
          <div className="flex items-center justify-center space-x-4">
            <span className="inline-flex items-center px-4 py-2 bg-gray-800/50 backdrop-blur-sm text-cyan-400 rounded-full text-sm font-medium border border-cyan-500/30">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Tech Grid View
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm text-green-400 rounded-full text-sm font-medium border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Systémy online
            </span>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* VPS Plans - Tile Layout */}
          <div className="xl:w-2/3">
            {productsLoading ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 backdrop-blur-sm rounded-2xl mb-8 border border-cyan-500/30">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
                </div>
                <p className="text-gray-300 text-xl font-light">Načítám produkty...</p>
                <p className="text-cyan-400 text-sm mt-2 font-mono">Připojuji se k serveru...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-sm rounded-2xl mb-8 border border-red-500/30">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-4 text-xl font-light">Chyba při načítání produktů</p>
                <p className="text-red-400 mb-8 text-sm font-mono">{productsError}</p>
                <button
                  onClick={loadProducts}
                  className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-medium backdrop-blur-sm"
                >
                  Zkusit znovu
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {products.map((plan) => (
                  <div key={plan.id} className="group bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 relative">
                    {plan.popular && (
                      <div className="absolute top-6 right-6 z-10">
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium rounded-full shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          Nejpopulárnější
                        </span>
                      </div>
                    )}

                    {/* Header - Tech Style */}
                    <div className={`p-8 border-b border-gray-700/50 ${plan.popular ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20' : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20'}`}>
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold mb-4 text-white">{plan.name}</h3>
                        <div className="flex items-baseline justify-center mb-2">
                          <span className="text-4xl font-light text-white">{plan.price.replace(' Kč', '')}</span>
                          <span className="text-lg text-gray-300 ml-2">Kč</span>
                        </div>
                        <div className="text-sm text-gray-400 font-light">bez DPH / měsíc</div>
                      </div>
                    </div>

                    {/* Content - Tech Style */}
                    <div className="p-8">
                      {/* Specifications Grid - Tech Design */}
                      <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="text-center">
                          <div className="w-14 h-14 bg-cyan-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 group-hover:border-cyan-400/50 transition-colors">
                            <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">CPU</p>
                          <p className="text-sm font-semibold text-white">{plan.cpu}</p>
                        </div>
                        <div className="text-center">
                          <div className="w-14 h-14 bg-green-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30 group-hover:border-green-400/50 transition-colors">
                            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {/* RAM Memory Stick Icon */}
                              <rect x="5" y="7" width="14" height="10" rx="1" strokeWidth={1.5}/>
                              <rect x="7" y="9" width="2" height="6" fill="currentColor" opacity="0.8"/>
                              <rect x="10" y="9" width="2" height="6" fill="currentColor" opacity="0.6"/>
                              <rect x="13" y="9" width="2" height="6" fill="currentColor" opacity="0.9"/>
                              <rect x="16" y="9" width="2" height="6" fill="currentColor" opacity="0.7"/>
                              <line x1="6" y1="5" x2="7" y2="5" strokeWidth={2} strokeLinecap="round"/>
                              <line x1="9" y1="5" x2="10" y2="5" strokeWidth={2} strokeLinecap="round"/>
                              <line x1="12" y1="5" x2="13" y2="5" strokeWidth={2} strokeLinecap="round"/>
                              <line x1="15" y1="5" x2="16" y2="5" strokeWidth={2} strokeLinecap="round"/>
                              <line x1="18" y1="5" x2="19" y2="5" strokeWidth={2} strokeLinecap="round"/>
                            </svg>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">RAM</p>
                          <p className="text-sm font-semibold text-white">{plan.ram}</p>
                        </div>
                        <div className="text-center">
                          <div className="w-14 h-14 bg-purple-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30 group-hover:border-purple-400/50 transition-colors">
                            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">DISK</p>
                          <p className="text-sm font-semibold text-white">{plan.storage.includes('SSD') ? plan.storage : `${plan.storage} SSD`}</p>
                        </div>
                      </div>

                      {/* Commission info for affiliates - Tech Style */}
                      {plan.commission && affiliateValidated && (
                        <div className="mb-6 p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl">
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                            <p className="text-sm text-green-400 font-medium">
                              Provize: {plan.commission.rate}% = {plan.commission.monthly_amount} CZK/měsíc
                            </p>
                          </div>
                        </div>
                      )}



                      {/* Savings display - Tech Style */}
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
                              <div key="annual" className="flex items-center justify-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-400 font-medium">
                                  Ušetříte {Math.round(annualSavings)} CZK ročně ({annualSavingsPercent}%)
                                </span>
                              </div>
                            );
                          }
                        }

                        return savings.length > 0 ? (
                          <div className="mb-6 p-4 bg-green-500/20 backdrop-blur-sm rounded-2xl border border-green-500/30">
                            {savings}
                          </div>
                        ) : null;
                      })()}

                      {/* Action Button - Tech Style */}
                      <button
                        onClick={() => handleAddToCart(plan)}
                        className={`w-full py-4 px-6 rounded-2xl font-medium transition-all duration-300 text-sm backdrop-blur-sm border ${
                          affiliateValidated
                            ? 'bg-green-600/90 hover:bg-green-600 text-white border-green-500/50 hover:border-green-400 shadow-lg shadow-green-500/20'
                            : plan.popular
                            ? 'bg-orange-600/90 hover:bg-orange-600 text-white border-orange-500/50 hover:border-orange-400 shadow-lg shadow-orange-500/20'
                            : 'bg-cyan-600/90 hover:bg-cyan-600 text-white border-cyan-500/50 hover:border-cyan-400 shadow-lg shadow-cyan-500/20'
                        }`}
                      >
                        {affiliateValidated ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>Přidat do košíku</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>Přidat do košíku</span>
                          </div>
                        )}
                      </button>

                      {affiliateValidated && (
                        <div className="mt-4 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <p className="text-xs text-green-400 font-medium">
                            Partner provize aktivní
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Features Section - Tech Style */}
            <div className="mt-16 bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-light mb-4 text-white">Enterprise Infrastruktura</h3>
                <p className="text-gray-400 font-light">Profesionální technologie pro vaše projekty</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    ),
                    title: 'Root přístup',
                    desc: 'Plná kontrola serveru',
                    color: 'cyan'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    title: 'Garantovaný výkon',
                    desc: 'Dedikované zdroje',
                    color: 'green'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    ),
                    title: 'NVMe SSD',
                    desc: 'Rychlé disky',
                    color: 'purple'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    title: 'DDoS ochrana',
                    desc: 'Bezpečnost zdarma',
                    color: 'blue'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    ),
                    title: 'Dedikované IP',
                    desc: 'IPv4 a IPv6',
                    color: 'orange'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    title: 'Webová správa',
                    desc: 'Control panel',
                    color: 'pink'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ),
                    title: 'Neomezený přenos',
                    desc: 'Bez limitů',
                    color: 'indigo'
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    title: 'Volba OS',
                    desc: 'Linux distribuce',
                    color: 'yellow'
                  }
                ].map((feature, index) => {
                  const colorClasses = {
                    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400/50',
                    green: 'bg-green-500/20 border-green-500/30 text-green-400 group-hover:border-green-400/50',
                    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400 group-hover:border-purple-400/50',
                    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400 group-hover:border-blue-400/50',
                    orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400 group-hover:border-orange-400/50',
                    pink: 'bg-pink-500/20 border-pink-500/30 text-pink-400 group-hover:border-pink-400/50',
                    indigo: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 group-hover:border-indigo-400/50',
                    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 group-hover:border-yellow-400/50'
                  };

                  return (
                    <div key={index} className="text-center group">
                      <div className={`w-14 h-14 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-colors ${colorClasses[feature.color]}`}>
                        {feature.icon}
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-2">{feature.title}</h4>
                      <p className="text-xs text-gray-400 font-light">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center space-x-4 px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300 font-light">Všechny ceny bez DPH</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span className="text-sm text-gray-300 font-light">Aktivace do 24h</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <span className="text-sm text-gray-300 font-light">Podpora 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Cart */}
          <div className="xl:w-1/3">
            <VPS3CartSidebar />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
