import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import CartSidebar from '../components/CartSidebar';
import Link from 'next/link';
import RealPaymentProcessor from '../lib/real-payment-processor';

export default function Payment() {
  const router = useRouter();
  const { clearCart } = useCart(); // Only need clearCart, items will come from billing
  const [items, setItems] = useState([]); // Load items from billing
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedOS, setSelectedOS] = useState('linux');
  const [selectedApps, setSelectedApps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [billingCartData, setBillingCartData] = useState(null);
  const [customerData, setCustomerData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    country: 'CZ',
    address: '',
    city: '',
    zip: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  // Load billing cart data from sessionStorage
  useEffect(() => {
    const savedBillingCartData = sessionStorage.getItem('billingCartData');

    console.log('🛒 Payment page - Loading billing cart data:', {
      hasBillingCartData: !!savedBillingCartData
    });

    if (savedBillingCartData) {
      try {
        const billingData = JSON.parse(savedBillingCartData);
        console.log('💾 Billing cart data found:', billingData);

        setBillingCartData(billingData);
        setItems(billingData.items || []);
        setSelectedPeriod(billingData.selectedPeriod || '12');
        setSelectedOS(billingData.selectedOS || 'linux');
        setSelectedApps(billingData.selectedApps || []);

        console.log('✅ Payment page loaded from billing:', {
          items: billingData.items?.length || 0,
          period: billingData.selectedPeriod,
          os: billingData.selectedOS,
          total: billingData.cartTotal
        });
      } catch (error) {
        console.error('❌ Error loading billing cart data:', error);
      }
    } else {
      console.log('⚠️ No billing cart data found, payment page may not work correctly');
    }
  }, []);

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Load cart settings from sessionStorage (billing period, OS, apps)
  useEffect(() => {
    const cartSettings = sessionStorage.getItem('cartSettings');

    console.log('🛒 Payment page - Loading cart settings:', {
      hasCartSettings: !!cartSettings
    });

    if (cartSettings) {
      try {
        const settings = JSON.parse(cartSettings);
        console.log('📅 Cart settings found:', settings);

        if (settings.selectedPeriod) {
          setSelectedPeriod(settings.selectedPeriod);
          console.log('✅ Period set from cart:', settings.selectedPeriod);
        }
        if (settings.selectedOS) {
          setSelectedOS(settings.selectedOS);
          console.log('✅ OS set from cart:', settings.selectedOS);
        }
        if (settings.selectedApps) {
          setSelectedApps(settings.selectedApps);
          console.log('✅ Apps set from cart:', settings.selectedApps);
        }
        if (settings.appliedPromo) {
          setAppliedPromo(settings.appliedPromo);
          console.log('✅ Promo set from cart:', settings.appliedPromo);
        }

        // Load product pricing data if available
        if (settings.productPricing) {
          console.log('💰 Product pricing data found in cart settings:', settings.productPricing);

          // Update cart items with pricing data if needed
          items.forEach(item => {
            const productPricing = settings.productPricing[item.id];
            if (productPricing && !item.allPrices) {
              console.log(`📊 Updating item ${item.id} with pricing data:`, productPricing);
              item.allPrices = productPricing.allPrices;
              item.commission = productPricing.commission;
              item.discounts = productPricing.discounts;
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse cart settings:', error);
      }
    } else {
      console.log('⚠️ No cart settings found - using defaults');
    }
  }, []);

  // Pricing functions using billing cart data (moved before use)
  const getTotalPrice = () => {
    if (billingCartData && billingCartData.cartTotal !== undefined) {
      console.log('💰 Payment: Using billing cart total:', billingCartData.cartTotal);
      return billingCartData.cartTotal;
    }

    // Fallback calculation
    if (items.length === 0) {
      return 249; // Mock total for testing
    }

    return items.reduce((total, item) => {
      const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
      return total + (basePrice * item.quantity);
    }, 0);
  };

  const getMonthlyTotal = () => {
    if (billingCartData && billingCartData.cartMonthlyTotal !== undefined) {
      console.log('💰 Payment: Using billing monthly total:', billingCartData.cartMonthlyTotal);
      return billingCartData.cartMonthlyTotal;
    }

    // Fallback calculation
    return items.reduce((total, item) => {
      const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
      return total + (basePrice * item.quantity);
    }, 0);
  };

  const getTotalSavings = () => {
    if (billingCartData && billingCartData.totalSavings !== undefined) {
      console.log('💰 Payment: Using billing total savings:', billingCartData.totalSavings);
      return billingCartData.totalSavings;
    }

    return 0; // No savings if no billing data
  };

  // Calculate savings for individual items using billing data
  const calculateItemSavings = (item) => {
    // First try to use itemPricing from billing data
    if (billingCartData && billingCartData.itemPricing) {
      const itemPricing = billingCartData.itemPricing.find(pricing => pricing.id === item.id);
      if (itemPricing && itemPricing.savings !== undefined) {
        console.log(`💰 Payment: Using billing item savings for ${item.name}: ${itemPricing.savings} CZK`);
        return itemPricing.savings;
      }
    }

    // Fallback: Use real savings if available in item
    if (item.realSavings) {
      const periodMapping = {
        '6': 'semiannually',
        '12': 'annually',
        '24': 'biennially'
      };
      const periodKey = periodMapping[selectedPeriod];
      const realSavings = item.realSavings[periodKey];

      if (realSavings && realSavings.amount > 0) {
        console.log(`💰 Payment: Using real savings for ${item.name} (${selectedPeriod} months): ${realSavings.amount} CZK`);
        return realSavings.amount;
      }
    }

    // Final fallback
    console.log(`💰 Payment: No savings found for ${item.name}`);
    return 0;
  };

  // Debug cart state on mount and changes
  useEffect(() => {
    console.log('🛒 Payment page - Cart state changed:', {
      itemsLength: items.length,
      items: items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
      cartTotal: items.length > 0 ? getTotalPrice() : 'N/A'
    });
  }, [items, getTotalPrice]);

  // Redirect if cart is empty (disabled for testing)
  useEffect(() => {
    // Temporarily disabled for testing
    // if (items.length === 0) {
    //   router.push('/vps');
    // }
  }, [items, router]);

  /**
   * Load available payment methods from API
   */
  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      console.log('🔍 Loading payment methods...');

      const response = await fetch('/api/payments/methods');
      const data = await response.json();

      if (data.success) {
        // Show only enabled payment methods from HostBill
        const availableMethods = (data.methods || []).filter(method => method.enabled);
        setPaymentMethods(availableMethods);

        console.log(`✅ Loaded ${availableMethods.length} active payment methods:`,
          availableMethods.map(m => `${m.id}: ${m.name}`));

        // Auto-select first available method
        if (availableMethods.length > 0) {
          setSelectedPayment(availableMethods[0].id);
        }

        console.log('✅ Payment methods loaded:', availableMethods);
      } else {
        throw new Error(data.error || 'Failed to load payment methods');
      }
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
      // Fallback to static methods
      setPaymentMethods(getStaticPaymentMethods());
      setSelectedPayment('card');
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  /**
   * Get static payment methods as fallback
   */
  const getStaticPaymentMethods = () => {
    return [
      {
        id: 'card',
        name: 'Platební karta',
        icon: '💳',
        description: 'Visa, Mastercard, American Express',
        processingTime: 'Okamžitě'
      },
      {
        id: 'banktransfer',
        name: 'Bankovní převod',
        icon: '🏦',
        description: 'Převod z bankovního účtu',
        processingTime: '1-2 pracovní dny'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '🅿️',
        description: 'Rychlá a bezpečná platba',
        processingTime: 'Okamžitě'
      },
      {
        id: 'crypto',
        name: 'Kryptoměny',
        icon: '₿',
        description: 'Bitcoin, Ethereum a další',
        processingTime: '10-30 minut'
      },
      {
        id: 'payu',
        name: 'PayU',
        icon: '💰',
        description: 'Rychlá a bezpečná platba přes PayU',
        processingTime: 'Okamžitě'
      }
    ];
  };

  // Mock data for testing when cart is empty
  const testItems = items.length === 0 ? [
    {
      id: 1,
      name: 'VPS Start',
      price: '249 Kč/měsíc',
      cpu: '2 CPU',
      ram: '4 GB RAM',
      storage: '50 GB NVMe SSD',
      quantity: 1
    }
  ] : items;

  // Test function for Ansible generation (accessible in browser console)
  if (typeof window !== 'undefined') {
    window.testAnsibleGeneration = async () => {
      const testData = {
        orderId: `TEST-${Date.now()}`,
        serverConfig: {
          hostname: `test-vps-${Date.now()}`,
          operatingSystem: selectedOS,
          applications: selectedApps,
          customerData: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '+420 123 456 789',
            company: 'Test Company',
            address: 'Test Address 123',
            city: 'Praha',
            postalCode: '11000',
            country: 'CZ'
          },
          serverSpecs: testItems[0] || {}
        }
      };

      console.log('🚀 Testing Ansible generation with data:', testData);

      try {
        const response = await fetch('/api/ansible/generate-setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Ansible setup generated successfully!');
          console.log('📄 Full result:', result);

          // Display formatted output
          console.log('\n🎯 Generated Configuration:');
          console.log(`- Order ID: ${result.orderId}`);
          console.log(`- Deployment ID: ${result.deploymentId}`);
          console.log(`- Hostname: ${result.serverConfig?.hostname}`);
          console.log(`- OS: ${result.serverConfig?.operating_system}`);
          console.log(`- Applications: ${result.serverConfig?.applications?.join(', ')}`);
          console.log(`- Customer: ${result.serverConfig?.customer?.name}`);

          return result;
        } else {
          const error = await response.json();
          console.error('❌ Ansible generation failed:', error);
          return null;
        }
      } catch (error) {
        console.error('💥 Request failed:', error);
        return null;
      }
    };
  }



  // Calculate total price with period-based pricing
  const calculateTotalWithPeriod = () => {
    if (items.length === 0) {
      return 0;
    }

    let total = 0;

    items.forEach(item => {
      let itemPrice = 0;

      // Use pricing data from cart item if available
      if (item.allPrices) {
        console.log(`💰 Using pricing data for ${item.name}:`, item.allPrices);

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

        if (periodPrice > 0) {
          itemPrice = periodPrice;
          console.log(`📊 ${item.name} - Period: ${selectedPeriod}, Field: ${priceField}, Price: ${periodPrice} CZK`);
        } else {
          // Fallback to monthly price with discount calculation
          const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
          const periodDiscount = periods.find(p => p.value === selectedPeriod)?.discount || 0;
          itemPrice = monthlyPrice * (1 - periodDiscount / 100);
          console.log(`📊 ${item.name} - Fallback: Monthly ${monthlyPrice} CZK with ${periodDiscount}% discount = ${itemPrice} CZK`);
        }
      } else {
        // Fallback to basic price from cart item
        const basePrice = parseFloat(item.price?.replace(/[^\d]/g, '') || 0);
        const periodDiscount = periods.find(p => p.value === selectedPeriod)?.discount || 0;
        itemPrice = basePrice * (1 - periodDiscount / 100);
        console.log(`📊 ${item.name} - Basic fallback: ${basePrice} CZK with ${periodDiscount}% discount = ${itemPrice} CZK`);
      }

      total += itemPrice * (item.quantity || 1);
    });

    console.log(`💰 Total calculated with period ${selectedPeriod}: ${total} CZK`);
    return Math.round(total);
  };

  const periods = [
    { value: '1', label: '1 měsíc', discount: 0, popular: false },
    { value: '3', label: '3 měsíce', discount: 5, popular: false },
    { value: '6', label: '6 měsíců', discount: 10, popular: false },
    { value: '12', label: '12 měsíců', discount: 20, popular: true },
    { value: '24', label: '24 měsíců', discount: 30, popular: false },
    { value: '36', label: '36 měsíců', discount: 40, popular: false }
  ];

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
      icon: (
        <div className="w-8 h-8 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600">
            <path fill="currentColor" d="M0,0V11.4L9.6,10.2V0ZM10.8,0V10.1L24,8.4V0ZM0,12.6V24L9.6,22.8V12.5ZM10.8,12.4V22.7L24,24V12.3Z"/>
          </svg>
        </div>
      ),
      description: 'Windows Server 2019/2022',
      priceModifier: 500, // +500 Kč/měsíc
      popular: false
    }
  ];

  // Map billing period from numbers to HostBill format
  const mapBillingPeriod = (period) => {
    const periodMapping = {
      '1': 'm',     // 1 měsíc -> monthly
      '3': 'q',     // 3 měsíce -> quarterly
      '6': 's',     // 6 měsíců -> semiannually
      '12': 'a',    // 12 měsíců -> annually
      '24': 'b',    // 24 měsíců -> biennially
      '36': 't',    // 36 měsíců -> triennially
      // Also handle string versions
      'monthly': 'm',
      'quarterly': 'q',
      'semiannually': 's',
      'annually': 'a',
      'biennially': 'b',
      'triennially': 't',
      // Direct values
      'm': 'm',
      'q': 'q',
      's': 's',
      'a': 'a',
      'b': 'b',
      't': 't'
    };

    return periodMapping[String(period)] || 'm'; // Default to monthly
  };

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
    },
    'STUDENT15': {
      type: 'percentage',
      value: 15,
      description: 'Studentská sleva 15%',
      minAmount: 500,
      maxDiscount: 1500,
      validUntil: '2024-12-31',
      active: true
    },
    'FIRSTORDER': {
      type: 'percentage',
      value: 25,
      description: 'Sleva 25% na první objednávku',
      minAmount: 1500,
      maxDiscount: 3000,
      validUntil: '2024-12-31',
      active: true
    }
  };

  const applications = [
    { id: 'wordpress', name: 'WordPress', icon: '🌐', category: 'CMS', description: 'Nejpopulárnější CMS systém' },
    { id: 'woocommerce', name: 'WooCommerce', icon: '🛒', category: 'E-commerce', description: 'E-shop pro WordPress' },
    { id: 'docker', name: 'Docker', icon: '🐳', category: 'DevOps', description: 'Kontejnerizace aplikací' },
    { id: 'nodejs', name: 'Node.js', icon: '💚', category: 'Runtime', description: 'JavaScript runtime prostředí' },
    { id: 'nginx', name: 'Nginx', icon: '⚡', category: 'Web Server', description: 'Vysokovýkonný web server' },
    { id: 'mysql', name: 'MySQL', icon: '🗄️', category: 'Database', description: 'Relační databáze' },
    { id: 'postgresql', name: 'PostgreSQL', icon: '🐘', category: 'Database', description: 'Pokročilá databáze' },
    { id: 'redis', name: 'Redis', icon: '🔴', category: 'Cache', description: 'In-memory databáze' },
    { id: 'php', name: 'PHP', icon: '🐘', category: 'Runtime', description: 'PHP runtime prostředí' },
    { id: 'python', name: 'Python', icon: '🐍', category: 'Runtime', description: 'Python runtime prostředí' },
    { id: 'git', name: 'Git', icon: '📝', category: 'DevOps', description: 'Verzovací systém' },
    { id: 'composer', name: 'Composer', icon: '🎼', category: 'Package Manager', description: 'PHP package manager' },
    { id: 'npm', name: 'NPM', icon: '📦', category: 'Package Manager', description: 'Node.js package manager' },
    { id: 'certbot', name: 'Certbot', icon: '🔒', category: 'Security', description: 'SSL certifikáty zdarma' },
    { id: 'fail2ban', name: 'Fail2Ban', icon: '🛡️', category: 'Security', description: 'Ochrana proti útokům' },
    { id: 'htop', name: 'htop', icon: '📊', category: 'Monitoring', description: 'Systémový monitor' },
    { id: 'vim', name: 'Vim', icon: '✏️', category: 'Editor', description: 'Textový editor' },
    { id: 'curl', name: 'cURL', icon: '🌐', category: 'Network', description: 'HTTP klient' }
  ];



  const calculatePrice = (basePrice, period, discount) => {
    const numericPrice = parseFloat(basePrice.replace(/[^\d]/g, ''));
    const osModifier = operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0;
    const adjustedPrice = numericPrice + osModifier;
    const months = parseInt(period);
    const total = adjustedPrice * months;
    const discountAmount = total * (discount / 100);
    return {
      original: total,
      discounted: total - discountAmount,
      savings: discountAmount,
      monthly: (total - discountAmount) / months,
      osModifier: osModifier
    };
  };

  const toggleApp = (appId) => {
    setSelectedApps(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else if (prev.length < 5) {
        return [...prev, appId];
      }
      return prev;
    });
  };

  const validatePromoCode = async (code) => {
    if (!code.trim()) {
      setPromoError('Zadejte promo kód');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const promo = promoCodes[code.toUpperCase()];

    if (!promo) {
      setPromoError('Neplatný promo kód');
      setIsValidatingPromo(false);
      return;
    }

    if (!promo.active) {
      setPromoError('Tento promo kód již není aktivní');
      setIsValidatingPromo(false);
      return;
    }

    const currentTotal = getTotalForPeriod().total;

    if (currentTotal < promo.minAmount) {
      setPromoError(`Minimální částka pro tento kód je ${promo.minAmount} Kč`);
      setIsValidatingPromo(false);
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'percentage') {
      discountAmount = Math.min((currentTotal * promo.value) / 100, promo.maxDiscount);
    } else {
      discountAmount = Math.min(promo.value, promo.maxDiscount);
    }

    setAppliedPromo({
      ...promo,
      code: code.toUpperCase(),
      discountAmount
    });
    setIsValidatingPromo(false);
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const getTotalForPeriod = () => {
    let total = 0;
    let savings = 0;

    // Use real cart items if available, otherwise use test items
    const itemsToCalculate = items.length > 0 ? items : testItems;

    itemsToCalculate.forEach(item => {
      let itemPrice = 0;
      let itemSavings = 0;

      // Use pricing data from cart item if available (from middleware API)
      if (item.allPrices) {
        console.log(`💰 Using middleware pricing data for ${item.name}:`, item.allPrices);

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
        const monthlyPrice = parseFloat(item.allPrices.monthly || 0);

        if (periodPrice > 0) {
          itemPrice = periodPrice;
          // Calculate savings based on difference from monthly price * months
          const months = parseInt(selectedPeriod);
          const fullMonthlyTotal = monthlyPrice * months;
          itemSavings = Math.max(0, fullMonthlyTotal - periodPrice);
          console.log(`📊 ${item.name} - Period: ${selectedPeriod}, Price: ${periodPrice} CZK, Savings: ${itemSavings} CZK`);
        } else {
          // Fallback to monthly price
          itemPrice = monthlyPrice;
          console.log(`📊 ${item.name} - Fallback to monthly: ${monthlyPrice} CZK`);
        }
      } else {
        // Fallback to old calculatePrice method for items without middleware data
        const calc = calculatePrice(item.price, selectedPeriod, periods.find(p => p.value === selectedPeriod)?.discount || 0);
        itemPrice = calc.discounted;
        itemSavings = calc.savings;
        console.log(`📊 ${item.name} - Fallback calculation: ${itemPrice} CZK, Savings: ${itemSavings} CZK`);
      }

      total += itemPrice * (item.quantity || 1);
      savings += itemSavings * (item.quantity || 1);
    });

    // Apply promo code discount
    let promoDiscount = 0;
    if (appliedPromo) {
      promoDiscount = appliedPromo.discountAmount;
      total = Math.max(0, total - promoDiscount);
    }

    console.log('💰 getTotalForPeriod calculation:', {
      itemsUsed: itemsToCalculate.length > 0 ? 'real cart items' : 'test items',
      itemsCount: itemsToCalculate.length,
      selectedPeriod,
      periodDiscount: periods.find(p => p.value === selectedPeriod)?.discount || 0,
      selectedOS,
      osModifier: operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0,
      subtotal: total + (appliedPromo?.discountAmount || 0),
      savings,
      promoDiscount,
      finalTotal: total
    });

    return { total, savings, promoDiscount };
  };

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      console.log('🚀 Starting Real Payment Flow process...');
      console.log('🛒 Cart state:', {
        itemsLength: items.length,
        items: items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        cartTotal: items.length > 0 ? getTotalPrice() : 'N/A'
      });

      // Generate order ID
      const orderId = `ORDER-${Date.now()}`;

      // Always use getTotalForPeriod which handles both real cart items and test items
      // with proper billing period discounts and OS modifiers
      const calculatedTotal = getTotalForPeriod();
      const total = calculatedTotal.total;

      console.log('💰 Using calculated total with period/OS adjustments:', {
        total: total,
        savings: calculatedTotal.savings,
        promoDiscount: calculatedTotal.promoDiscount,
        currency: 'CZK',
        itemsSource: items.length > 0 ? 'real cart items' : 'test items'
      });

      // Initialize RealPaymentProcessor
      const paymentProcessor = new RealPaymentProcessor();

      // Prepare order data for RealPaymentProcessor
      const orderData = {
        orderId: orderId,
        customerEmail: customerData.email,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        customerPhone: customerData.phone,
        paymentMethod: selectedPayment,
        amount: total,
        currency: 'CZK',
        billingPeriod: selectedPeriod,
        billingCycle: mapBillingPeriod(selectedPeriod),
        selectedOS: selectedOS,
        selectedApps: selectedApps,
        appliedPromo: appliedPromo,
        testMode: true, // Set to false for production
        // Full customer data for order creation
        customer: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          company: customerData.company,
          address: customerData.address,
          city: customerData.city,
          zip: customerData.zip,
          country: customerData.country
        },
        items: items.length > 0 ? items.map(item => {
          // Calculate actual price with period discount and OS modifier
          const calc = calculatePrice(item.price, selectedPeriod, periods.find(p => p.value === selectedPeriod)?.discount || 0);

          return {
            productId: item.id,
            productName: item.name,
            price: calc.discounted, // Use calculated price with discounts
            basePrice: item.price, // Keep original price for reference
            quantity: item.quantity,
            period: selectedPeriod, // Use selected period from cart settings
            billingCycle: mapBillingPeriod(selectedPeriod), // Map to HostBill format
            cycle: mapBillingPeriod(selectedPeriod), // Also add cycle for compatibility
            configOptions: {
              os: selectedOS,
              period: selectedPeriod,
              applications: selectedApps,
              osModifier: operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0,
              periodDiscount: periods.find(p => p.value === selectedPeriod)?.discount || 0,
              ...item.configOptions
            }
          };
        }) : testItems.map(item => {
          // Calculate test item price with period discount and OS modifier
          const calc = calculatePrice(item.price, selectedPeriod, periods.find(p => p.value === selectedPeriod)?.discount || 0);

          return {
            productId: '1', // VPS Basic for testing
            productName: item.name,
            price: calc.discounted, // Use calculated price instead of 1 CZK
            basePrice: item.price,
            quantity: item.quantity || 1,
            period: selectedPeriod,
            billingCycle: mapBillingPeriod(selectedPeriod), // Map to HostBill format
            cycle: mapBillingPeriod(selectedPeriod), // Also add cycle for compatibility
            configOptions: {
              os: selectedOS,
              period: selectedPeriod,
              applications: selectedApps,
              osModifier: operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0,
              periodDiscount: periods.find(p => p.value === selectedPeriod)?.discount || 0
            }
          };
        }),
        payment: {
          method: selectedPayment,
          amount: total, // Use calculated total from cart
          currency: 'CZK'
        },
        metadata: {
          source: 'cloudvps_payment_page',
          promoCode: appliedPromo?.code || null,
          promoDiscount: appliedPromo?.discount || 0
        }
      };

      console.log('📤 Creating order via middleware...', orderData);

      // Create order via middleware (keep existing order creation)
      const orderResponse = await fetch('/api/middleware/create-test-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();

      if (orderResult.success) {
        console.log('✅ Order created successfully:', orderResult);

        const invoiceId = orderResult.orders?.[0]?.orderId || orderResult.clientId;

        // Update orderData with invoiceId for RealPaymentProcessor
        orderData.invoiceId = invoiceId;

        console.log('💳 Initializing payment with RealPaymentProcessor...');
        console.log('💰 Payment amount details:', {
          cartTotal: total,
          selectedMethod: selectedPayment,
          invoiceId: invoiceId,
          orderId: orderId
        });

        // Use RealPaymentProcessor instead of old API
        const paymentResult = await paymentProcessor.initializePayment(orderData);

        if (paymentResult.success) {
          console.log('✅ Payment initialized with RealPaymentProcessor:', paymentResult);
          console.log('🔍 DEBUG: PaymentResult details:', {
            paymentId: paymentResult.paymentId,
            transactionId: paymentResult.transactionId,
            paymentUrl: paymentResult.paymentUrl,
            redirectRequired: paymentResult.redirectRequired,
            orderId: paymentResult.orderId,
            invoiceId: paymentResult.invoiceId
          });

          // Track affiliate conversion
          if (typeof window !== 'undefined' && window.hostbillAffiliate) {
            const selectedOSData = operatingSystems.find(os => os.id === selectedOS);
            const selectedAppsData = selectedApps.map(appId =>
              applications.find(a => a.id === appId)?.name
            ).filter(Boolean);

            window.hostbillAffiliate.trackConversion({
              orderId: orderId,
              amount: total, // Use actual total instead of 1 CZK
              currency: 'CZK',
              products: items.length > 0 ? items.map(item => item.name) : testItems.map(item => item.name),
              os: selectedOSData?.name,
              applications: selectedAppsData,
              period: selectedPeriod
            });
          }

          // Handle payment redirect or manual instructions
          if (paymentResult.redirectRequired && paymentResult.paymentUrl) {
            console.log('🔄 Redirecting to ComGate payment gateway:', paymentResult.paymentUrl);
            console.log('🎯 Real Transaction ID:', paymentResult.transactionId);
            window.location.href = paymentResult.paymentUrl;
          } else {
            // For manual payments, redirect to payment-success-flow with real transaction data
            clearCart('payment_success');
            const successParams = new URLSearchParams({
              transactionId: paymentResult.transactionId,
              paymentId: paymentResult.paymentId,
              orderId: paymentResult.orderId,
              invoiceId: paymentResult.invoiceId,
              amount: paymentResult.amount,
              currency: paymentResult.currency,
              paymentMethod: paymentResult.paymentMethod || selectedPayment,
              status: 'success'
            });
            router.push(`/payment-complete?${successParams.toString()}`);
          }
        } else {
          throw new Error(paymentResult.error || 'Payment initialization failed');
        }
      } else {
        throw new Error(orderResult.error || 'Order creation failed');
      }
    } catch (error) {
      console.error('❌ Order/Payment process failed:', error);
      alert(`Chyba při zpracování objednávky: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Temporarily disabled for testing
  // if (items.length === 0) {
  //   return null; // Will redirect
  // }

  // Note: CartSidebar component handles displaying totals from cart context

  // Debug: Check localStorage directly
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    console.log('🛒 Payment page - Direct localStorage check:', {
      hasCart: !!savedCart,
      cartData: savedCart ? JSON.parse(savedCart) : null,
      itemsFromContext: items.length,
      totalFromContext: items.length > 0 ? getTotalPrice() : 'N/A'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Systrix</span>
            </Link>
            <div className="flex items-center justify-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <span className="w-5 h-5 lg:w-6 lg:h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                <span className="hidden sm:inline">Košík</span>
              </span>
              <span className="text-gray-300">→</span>
              <span className="flex items-center space-x-1 text-primary-600 font-medium">
                <span className="w-5 h-5 lg:w-6 lg:h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                <span className="hidden sm:inline">Platba</span>
              </span>
              <span className="text-gray-300">→</span>
              <span className="flex items-center space-x-1">
                <span className="w-5 h-5 lg:w-6 lg:h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs">3</span>
                <span className="hidden sm:inline">Potvrzení</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Billing Period */}
              <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Vyberte fakturační období</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {periods.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        selectedPeriod === period.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {period.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Nejoblíbenější
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{period.label}</div>
                        {period.discount > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            Ušetříte {period.discount}%
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Operating System Selection */}
              <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Zvolte operační systém</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                  {operatingSystems.map((os) => (
                    <button
                      key={os.id}
                      onClick={() => setSelectedOS(os.id)}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        selectedOS === os.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {os.popular && (
                        <div className="absolute -top-2 left-4">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Doporučeno
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl lg:text-3xl flex items-center justify-center">
                          {typeof os.icon === 'string' ? os.icon : os.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm lg:text-base">{os.name}</span>
                            {os.priceModifier > 0 && (
                              <span className="text-xs lg:text-sm text-orange-600 font-medium mt-1 sm:mt-0">
                                +{os.priceModifier} Kč/měs
                              </span>
                            )}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-600 mt-1">{os.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Applications Selection */}
              <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Výběr aplikací</h2>
                  <div className="text-sm text-gray-600">
                    Vybráno: {selectedApps.length}/5 • <span className="text-green-600 font-medium">Zdarma</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Vyberte až 5 aplikací, které chcete mít předinstalované na vašem VPS serveru.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                  {applications.map((app) => {
                    const isSelected = selectedApps.includes(app.id);
                    const isDisabled = !isSelected && selectedApps.length >= 5;

                    return (
                      <button
                        key={app.id}
                        onClick={() => !isDisabled && toggleApp(app.id)}
                        disabled={isDisabled}
                        className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 lg:space-x-2 mb-1">
                          <span className="text-base lg:text-lg">{app.icon}</span>
                          <span className="font-medium text-gray-900 text-xs lg:text-sm truncate">{app.name}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{app.category}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 lg:line-clamp-none">{app.description}</div>
                      </button>
                    );
                  })}
                </div>

                {selectedApps.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Vybrané aplikace:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedApps.map(appId => {
                        const app = applications.find(a => a.id === appId);
                        return (
                          <span key={appId} className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            <span>{app.icon}</span>
                            <span>{app.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleApp(appId);
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Kontaktní údaje</h2>
                <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jméno *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Vaše jméno"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Příjmení *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Vaše příjmení"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="vas@email.cz"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="+420 123 456 789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Společnost
                      </label>
                      <input
                        type="text"
                        value={customerData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Název společnosti (volitelné)"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Způsob platby</h2>

                {loadingPaymentMethods ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-full p-4 rounded-lg border-2 border-gray-200 animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPayment === method.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <span className="text-xl lg:text-2xl">{method.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm lg:text-base">{method.name}</div>
                              <div className="text-xs lg:text-sm text-gray-600 truncate">{method.description}</div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-xs lg:text-sm text-gray-600">Zpracování</div>
                            <div className="text-xs lg:text-sm font-medium text-gray-900">
                              {method.processingTime || method.processing}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {paymentMethods.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">💳</div>
                        <div>Žádné platební metody nejsou k dispozici</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <CartSidebar
                showPeriodSelector={true}
                showOSSelector={true}
                selectedPeriod={selectedPeriod}
                selectedOS={selectedOS}
                onPeriodChange={setSelectedPeriod}
                onOSChange={setSelectedOS}
                nextStepUrl="/order-confirmation"
                nextStepText="Dokončit objednávku"
                // Custom pricing functions from billing data
                getCartTotal={getTotalPrice}
                getCartMonthlyTotal={getMonthlyTotal}
                getTotalSavings={getTotalSavings}
                calculateItemSavings={calculateItemSavings}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
