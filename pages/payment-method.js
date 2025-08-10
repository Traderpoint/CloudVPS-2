import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useCart } from '../contexts/CartContext';
import ShoppingCart, { CartIcon } from '../components/ShoppingCart';
import CartSidebar from '../components/CartSidebar';
import RealPaymentProcessor from '../lib/real-payment-processor';

export default function PaymentMethod() {
  const router = useRouter();
  const { clearCart } = useCart(); // Only need clearCart, items will come from billing
  const [items, setItems] = useState([]); // Load items from billing
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('comgate');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('12'); // Default period
  const [selectedOS, setSelectedOS] = useState('linux'); // Default OS
  const [selectedApps, setSelectedApps] = useState([]); // Default apps
  const [appliedPromo, setAppliedPromo] = useState(null); // Applied promo code
  const [billingCartData, setBillingCartData] = useState(null); // Load from billing
  const [hostbillInvoiceData, setHostbillInvoiceData] = useState(null); // HostBill invoice data
  const [loadingInvoiceData, setLoadingInvoiceData] = useState(false); // Loading state for invoice data

  // Periods with discounts (same as in cart.js)
  const periods = [
    { value: '1', label: '1 měsíc', discount: 0, popular: false },
    { value: '3', label: '3 měsíce', discount: 5, popular: false },
    { value: '6', label: '6 měsíců', discount: 10, popular: false },
    { value: '12', label: '12 měsíců', discount: 20, popular: true },
    { value: '24', label: '24 měsíců', discount: 30, popular: false },
    { value: '36', label: '36 měsíců', discount: 40, popular: false }
  ];

  // Operating systems with price modifiers (same as in cart.js)
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

  // Calculate prices for both ComGate (total) and HostBill (monthly)
  const calculateItemPrices = (item) => {
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const period = periods.find(p => p.value === selectedPeriod);
    const os = operatingSystems.find(os => os.id === selectedOS);
    const billingPeriodMonths = parseInt(selectedPeriod);

    // Calculate monthly price with OS modifier
    const monthlyPriceWithOS = basePrice + (os?.priceModifier || 0);

    // Calculate total BEFORE discount (correct approach)
    const totalBeforeDiscount = monthlyPriceWithOS * billingPeriodMonths;

    // Apply period discount to TOTAL (not monthly)
    const totalAfterDiscount = totalBeforeDiscount * (1 - (period?.discount || 0) / 100);

    // Calculate monthly price with discount for HostBill
    const monthlyPriceWithDiscount = totalAfterDiscount / billingPeriodMonths;

    console.log('💰 calculateItemPrices debug (CORRECTED):', {
      itemName: item.name || 'Unknown',
      basePrice: basePrice + ' CZK/měsíc',
      osModifier: (os?.priceModifier || 0) + ' CZK/měsíc',
      monthlyPriceWithOS: monthlyPriceWithOS + ' CZK/měsíc',
      billingPeriod: billingPeriodMonths + ' měsíců',
      totalBeforeDiscount: totalBeforeDiscount + ' CZK',
      periodDiscount: (period?.discount || 0) + '%',
      totalAfterDiscount: totalAfterDiscount.toFixed(2) + ' CZK',
      totalAfterDiscountRounded: Math.round(totalAfterDiscount) + ' CZK (for ComGate)',
      monthlyPriceWithDiscount: monthlyPriceWithDiscount.toFixed(2) + ' CZK/měsíc (for HostBill)'
    });

    return {
      monthlyPrice: monthlyPriceWithDiscount, // Pro HostBill (neokrouhleno pro přesnost)
      totalPrice: Math.round(totalAfterDiscount) // Pro ComGate (zaokrouhleno)
    };
  };

  // Pricing functions using billing cart data
  const getTotalPrice = () => {
    if (billingCartData && billingCartData.cartTotal !== undefined) {
      console.log('💰 Payment-method: Using billing cart total:', billingCartData.cartTotal);
      return billingCartData.cartTotal;
    }

    // Fallback calculation
    if (items.length === 0) {
      return 0;
    }

    return items.reduce((total, item) => {
      const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
      return total + (basePrice * item.quantity);
    }, 0);
  };

  // Get total price with VAT for payment gateway
  // Note: billing already sends price WITH VAT, so we just return it
  const getTotalPriceWithVAT = () => {
    if (billingCartData && billingCartData.cartTotal !== undefined) {
      console.log('💰 Payment-method: Using billing cart total WITH VAT:', billingCartData.cartTotal);
      return billingCartData.cartTotal; // Already includes VAT from billing
    }

    // Fallback: calculate VAT only if no billing data
    const VAT_RATE = 0.21; // 21% DPH
    const totalWithoutVAT = getTotalPrice();
    const vatAmount = Math.round(totalWithoutVAT * VAT_RATE);
    return totalWithoutVAT + vatAmount;
  };

  const getMonthlyTotal = () => {
    if (billingCartData && billingCartData.cartMonthlyTotal !== undefined) {
      console.log('💰 Payment-method: Using billing monthly total:', billingCartData.cartMonthlyTotal);
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
      console.log('💰 Payment-method: Using billing total savings:', billingCartData.totalSavings);
      return billingCartData.totalSavings;
    }

    return 0; // No savings if no billing data
  };

  // Calculate monthly price for individual items using billing data
  const calculateMonthlyPrice = (item) => {
    // First try to use itemPricing from billing data
    if (billingCartData && billingCartData.itemPricing) {
      const itemPricing = billingCartData.itemPricing.find(pricing => pricing.id === item.id);
      if (itemPricing && itemPricing.monthlyPrice !== undefined) {
        console.log(`💰 Payment-method: Using billing monthly price for ${item.name}: ${itemPricing.monthlyPrice} CZK`);
        return itemPricing.monthlyPrice;
      }
    }

    // Fallback calculation
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const os = operatingSystems.find(os => os.id === selectedOS);
    const finalPrice = basePrice + (os?.priceModifier || 0);
    console.log(`💰 Payment-method: Using fallback monthly price for ${item.name}: ${finalPrice} CZK`);
    return finalPrice;
  };

  // Calculate period price for individual items using billing data
  const calculatePeriodPrice = (item) => {
    // First try to use itemPricing from billing data
    if (billingCartData && billingCartData.itemPricing) {
      const itemPricing = billingCartData.itemPricing.find(pricing => pricing.id === item.id);
      if (itemPricing && itemPricing.periodPrice !== undefined) {
        console.log(`💰 Payment-method: Using billing period price for ${item.name}: ${itemPricing.periodPrice} CZK`);
        return itemPricing.periodPrice;
      }
    }

    // Fallback calculation
    const monthlyPrice = calculateMonthlyPrice(item);
    const finalPrice = monthlyPrice * parseInt(selectedPeriod);
    console.log(`💰 Payment-method: Using fallback period price for ${item.name}: ${finalPrice} CZK`);
    return finalPrice;
  };

  // Calculate savings for individual items using billing data
  const calculateItemSavings = (item) => {
    // First try to use itemPricing from billing data
    if (billingCartData && billingCartData.itemPricing) {
      const itemPricing = billingCartData.itemPricing.find(pricing => pricing.id === item.id);
      if (itemPricing && itemPricing.savings !== undefined) {
        console.log(`💰 Payment-method: Using billing item savings for ${item.name}: ${itemPricing.savings} CZK`);
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
        console.log(`💰 Payment-method: Using real savings for ${item.name} (${selectedPeriod} months): ${realSavings.amount} CZK`);
        return realSavings.amount;
      }
    }

    // Final fallback
    console.log(`💰 Payment-method: No savings found for ${item.name}`);
    return 0;
  };

  // Legacy functions for backward compatibility
  const getCartTotalForComGate = () => getTotalPriceWithVAT(); // Use price with VAT for payment gateway
  const getCartMonthlyForHostBill = () => getMonthlyTotal();
  const getCartTotalWithSettings = () => getTotalPriceWithVAT(); // Use price with VAT

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

  // Load HostBill invoice data
  const loadHostbillInvoiceData = async (invoiceId) => {
    if (!invoiceId || invoiceId === 'unknown') {
      console.log('⚠️ No valid invoice ID provided for HostBill data loading');
      return;
    }

    setLoadingInvoiceData(true);
    try {
      console.log(`🔍 Loading HostBill invoice data for ID: ${invoiceId}`);

      const response = await fetch(`/api/hostbill/invoice/${invoiceId}`);
      const data = await response.json();

      if (data.success && data.invoice) {
        console.log('✅ HostBill invoice data loaded:', data.invoice);
        setHostbillInvoiceData(data.invoice);
      } else {
        console.error('❌ Failed to load HostBill invoice data:', data.error);
        setHostbillInvoiceData(null);
      }
    } catch (error) {
      console.error('❌ Error loading HostBill invoice data:', error);
      setHostbillInvoiceData(null);
    } finally {
      setLoadingInvoiceData(false);
    }
  };

  // Load billing cart data from sessionStorage
  useEffect(() => {
    const savedBillingCartData = sessionStorage.getItem('billingCartData');

    console.log('🛒 Payment-method: Loading billing cart data:', {
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

        console.log('✅ Payment-method loaded from billing:', {
          items: billingData.items?.length || 0,
          period: billingData.selectedPeriod,
          os: billingData.selectedOS,
          total: billingData.cartTotal
        });
      } catch (error) {
        console.error('❌ Error loading billing cart data:', error);
      }
    } else {
      console.log('⚠️ No billing cart data found, payment-method may not work correctly');
    }
  }, []);

  // Load order data and payment methods on mount
  useEffect(() => {

    const storedOrderData = sessionStorage.getItem('orderData');
    if (storedOrderData) {
      const data = JSON.parse(storedOrderData);
      console.log('💾 Payment-method: Loaded orderData from sessionStorage:', data);
      setOrderData(data);
    } else {
      // Try to get data from URL parameters (for retry scenarios)
      const { invoiceId, orderId, amount, paymentMethod } = router.query;
      if (invoiceId && orderId) {
        console.log('📋 Loading order data from URL parameters for retry...');
        // Create minimal order data from URL parameters
        const urlOrderData = {
          orders: [{
            invoiceId: invoiceId,
            hostbillOrderId: orderId,
            total: amount || 299,
            price: amount || 299
          }],
          billingData: {
            // We don't have billing data from URL, but payment can still proceed
            firstName: 'Zákazník',
            lastName: 'Opakování platby'
          }
        };
        setOrderData(urlOrderData);

        // Pre-select payment method if provided
        if (paymentMethod) {
          setSelectedPayment(paymentMethod);
        }
      } else {
        // Redirect to billing if no order data available
        router.push('/billing');
      }
    }

    loadPaymentMethods();
  }, [router]);

  // Load HostBill invoice data when orderData changes
  useEffect(() => {
    if (orderData && orderData.orders && orderData.orders.length > 0) {
      const firstOrder = orderData.orders[0];
      const invoiceId = firstOrder.invoiceId ||
                       firstOrder.invoice_id ||
                       firstOrder.orderDetails?.invoice_id ||
                       firstOrder.orderDetails?.metadata?.invoice_id;

      if (invoiceId && invoiceId !== 'unknown') {
        console.log(`🔍 Found invoice ID in order data: ${invoiceId}, loading HostBill data...`);
        loadHostbillInvoiceData(invoiceId);
      } else {
        console.log('⚠️ No valid invoice ID found in order data');
      }
    }
  }, [orderData]);

  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      console.log('🔍 Loading payment methods from middleware...');

      // Use same approach as middleware-payment-modules test
      console.log('🔧 Environment variables:', {
        NEXT_PUBLIC_MIDDLEWARE_URL: process.env.NEXT_PUBLIC_MIDDLEWARE_URL,
        NODE_ENV: process.env.NODE_ENV
      });

      const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
      console.log('🔗 Middleware URL:', middlewareUrl);
      console.log('🌐 Full URL:', `${middlewareUrl}/api/payment-modules`);

      const response = await fetch(`${middlewareUrl}/api/payment-modules`);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Raw response data:', data);

      if (data.success && data.modules) {
        // Transform middleware response to expected format
        const availableMethods = data.modules
          .filter(module => module.enabled) // Only enabled modules
          .map(module => ({
            id: module.method,
            name: module.name,
            method: module.method,
            type: module.type,
            enabled: module.enabled,
            icon: module.icon,
            description: module.description || getMethodDescription(module.method),
            processingTime: 'Okamžitě',
            hostbillModuleId: module.hostbillModuleId,
            isExternal: module.isExternal,
            status: module.status
          }));

        // Put Comgate first as requested
        const sortedMethods = availableMethods.sort((a, b) => {
          if (a.method === 'comgate' || a.method === 'comgate_advanced') return -1;
          if (b.method === 'comgate' || b.method === 'comgate_advanced') return 1;
          return 0;
        });

        setPaymentMethods(sortedMethods);
        console.log('✅ Payment methods loaded from middleware:', sortedMethods);

        // Set Comgate as default if available
        if (sortedMethods.length > 0) {
          const comgateMethod = sortedMethods.find(m =>
            m.method === 'comgate' || m.method === 'comgate_advanced'
          );
          const defaultMethod = comgateMethod ? comgateMethod.method : sortedMethods[0].method;
          setSelectedPayment(defaultMethod);
          console.log('🎯 Default payment method set:', defaultMethod);
        }
      } else {
        console.error('❌ Failed to load payment methods from middleware:', data.error);
        setError('Nepodařilo se načíst platební metody. Zkuste to prosím znovu.');
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('❌ Error loading payment methods from middleware:', error);
      setError('Chyba při načítání platebních metod. Zkontrolujte připojení a zkuste to znovu.');
      setPaymentMethods([]);
    } finally {
      setLoadingMethods(false);
    }
  };

  const getMethodDescription = (method) => {
    const descriptions = {
      'comgate': 'Visa, Mastercard, American Express',
      'comgate_advanced': 'Pokročilé platby přes Comgate',
      'payu': 'Rychlé online platby',
      'card': 'Platební karty s 3D Secure',
      'paypal': 'Platba přes PayPal účet',
      'stripe': 'Bezpečné platby kartou'
    };
    return descriptions[method] || 'Online platba';
  };



  const handleSubmitPayment = async () => {
    if (!orderData || !selectedPayment) {
      setError('Chybí údaje objednávky nebo platební metoda');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Starting Real Payment Flow from payment-method page...');
      console.log('📋 OrderData available:', orderData);
      console.log('💳 Selected payment method:', selectedPayment);

      // Initialize RealPaymentProcessor
      const paymentProcessor = new RealPaymentProcessor();

      // Step 2: Extract order data for RealPaymentProcessor
      const firstOrder = orderData.orders?.[0];
      console.log('📦 First order data:', firstOrder);

      if (!firstOrder) {
        throw new Error('Chybí údaje objednávky');
      }

      // Extract payment data with fallbacks (updated for Draft Order API)
      const invoiceId = firstOrder.invoiceId ||
                       firstOrder.invoice_id ||
                       firstOrder.orderDetails?.invoice_id ||
                       firstOrder.orderDetails?.metadata?.invoice_id ||
                       'unknown';
      const orderId = firstOrder.hostbillOrderId ||
                     firstOrder.orderId ||
                     firstOrder.order_id ||
                     firstOrder.orderDetails?.id ||
                     invoiceId; // Use invoiceId as fallback

      // Use HostBill invoice amount if available, otherwise fallback to calculated amount
      let amount;
      let comgateAmount = getCartTotalForComGate();
      let hostbillMonthlyAmount = getCartMonthlyForHostBill();

      if (hostbillInvoiceData && hostbillInvoiceData.amount > 0) {
        // Use HostBill invoice amount as the primary source
        amount = hostbillInvoiceData.amount;
        console.log('💰 Using HostBill invoice amount:', amount, hostbillInvoiceData.currency);
      } else {
        // Fallback to calculated amount
        // Apply promo discount to ComGate amount
        if (appliedPromo && appliedPromo.discountAmount) {
          comgateAmount = Math.max(0, comgateAmount - appliedPromo.discountAmount);
        }
        amount = comgateAmount;
        console.log('💰 Using calculated amount (HostBill data not available):', amount, 'CZK');
      }

      console.log('💰 Payment calculation for RealPaymentProcessor:', {
        orderDataAmount: firstOrder.totalAmount || firstOrder.total || firstOrder.price || 0,
        calculatedComgateAmount: comgateAmount + ' CZK (total for ' + selectedPeriod + ' months)',
        hostbillMonthlyAmount: hostbillMonthlyAmount + ' CZK/month',
        hostbillInvoiceAmount: hostbillInvoiceData ? hostbillInvoiceData.amount + ' ' + hostbillInvoiceData.currency : 'N/A',
        usingHostbillAmount: !!(hostbillInvoiceData && hostbillInvoiceData.amount > 0),
        promoDiscount: appliedPromo?.discountAmount || 0,
        selectedPeriod: selectedPeriod + ' months',
        selectedOS,
        periodDiscount: periods.find(p => p.value === selectedPeriod)?.discount || 0,
        osModifier: operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0,
        finalAmount: amount
      });

      // Validate required fields
      if (!invoiceId || invoiceId === 'unknown') {
        throw new Error('Chybí ID faktury');
      }
      if (!amount || amount <= 0) {
        throw new Error('Chybí nebo neplatná částka');
      }

      console.log('💰 Payment data for RealPaymentProcessor:', {
        orderId,
        invoiceId,
        amount,
        method: selectedPayment
      });

      // Prepare order data for RealPaymentProcessor
      const realPaymentOrderData = {
        orderId: orderId,
        invoiceId: invoiceId,
        customerEmail: orderData.customer?.email || 'test@example.com',
        customerName: `${orderData.customer?.firstName || 'Test'} ${orderData.customer?.lastName || 'Customer'}`,
        customerPhone: orderData.customer?.phone || '',
        paymentMethod: selectedPayment,
        amount: amount,
        currency: 'CZK',
        billingPeriod: selectedPeriod,
        billingCycle: mapBillingPeriod(selectedPeriod),
        selectedOS: selectedOS,
        selectedApps: selectedApps,
        appliedPromo: appliedPromo,
        testMode: false, // This is for REAL payment from payment-method page
        // Additional context
        comgateAmount: comgateAmount,
        hostbillMonthlyAmount: hostbillMonthlyAmount,
        cartSettings: {
          selectedPeriod,
          selectedOS,
          selectedApps,
          appliedPromo,
          periodDiscount: periods.find(p => p.value === selectedPeriod)?.discount || 0,
          osModifier: operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0
        }
      };

      console.log('💳 Initializing payment with RealPaymentProcessor...');

      // Use RealPaymentProcessor instead of direct API call
      const paymentResult = await paymentProcessor.initializePayment(realPaymentOrderData);

      if (paymentResult.success) {
        console.log('✅ Payment initialized with RealPaymentProcessor:', paymentResult);
        console.log('🎯 Real Transaction ID:', paymentResult.transactionId);

        if (paymentResult.paymentUrl && paymentResult.redirectRequired) {
          console.log('🚀 Redirecting to ComGate payment gateway:', paymentResult.paymentUrl);
          console.log('💳 Payment method:', paymentResult.paymentMethod);

          // Clear cart before redirect (payment initiated successfully)
          clearCart('payment_initiated');

          // Direct redirect to ComGate payment gateway
          window.location.href = paymentResult.paymentUrl;
        } else {
          // For manual payments, redirect to payment-success-flow with real transaction data
          console.log('ℹ️ Manual payment method, redirecting to payment-success-flow');

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

          clearCart('payment_success');
          router.push(`/payment-complete?${successParams.toString()}`);
        }
      } else {
        throw new Error(paymentResult.error || 'Nepodařilo se inicializovat platbu');
      }
    } catch (error) {
      console.error('❌ RealPaymentProcessor initialization error:', error);
      setError(`Došlo k chybě při inicializaci platby: ${error.message}. Zkuste to prosím znovu.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderData) {
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
        <title>Platební metoda - Cloud VPS</title>
        <meta name="description" content="Vyberte si platební metodu pro vaši objednávku" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header s košíkem */}
          <div className="mb-8 flex justify-between items-center">
            <Link href="/billing" className="inline-flex items-center text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zpět na fakturační údaje
            </Link>

            {/* Košík */}
            <div className="relative">
              <CartIcon onClick={() => setIsCartOpen(!isCartOpen)} />
              <ShoppingCart
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                showPaymentButton={true}
                onPayment={handleSubmitPayment}
                isPaymentLoading={isLoading}
                selectedPayment={selectedPayment}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Levá strana - Fakturační údaje a platební metoda */}
            <div className="lg:col-span-2">
              {/* Souhrn fakturačních údajů - pouze pokud jsou k dispozici */}
              {orderData.billingData?.firstName && orderData.billingData?.lastName && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">Fakturační adresa</h3>
                        <p className="text-sm text-gray-600">
                          {orderData.billingData.firstName} {orderData.billingData.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{orderData.billingData?.country}</p>
                      </div>
                    </div>
                    <Link href="/billing" className="text-primary-600 hover:text-primary-700 text-sm">
                      Upravit
                    </Link>
                  </div>
                </div>
              )}

              {/* Informace o opakování platby */}
              {!orderData.billingData?.firstName && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Opakování platby</h3>
                      <p className="text-sm text-yellow-700">
                        Opakujete platbu pro existující objednávku. Vyberte platební metodu a dokončete platbu.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Platební metoda */}
              <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-xl font-bold">Platba</h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}

              {loadingMethods ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Načítání platebních metod...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-gray-600 mb-4">Žádné platební metody nejsou momentálně dostupné.</p>
                  <button
                    onClick={loadPaymentMethods}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Zkusit znovu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">Vyberte platební metodu:</p>
                  
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id || method.method}
                      type="button"
                      className={`w-full text-left border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPayment === (method.method || method.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPayment(method.method || method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{method.icon || '💳'}</div>
                          <div>
                            <div className="font-semibold">{method.name}</div>
                            <div className="text-sm text-gray-600">{method.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(method.method || method.id) === 'comgate' && (
                            <div className="flex space-x-2">
                              {/* Visa logo */}
                              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                                VISA
                              </div>
                              {/* Mastercard logo */}
                              <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                MC
                              </div>
                              {/* American Express logo */}
                              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                                AMEX
                              </div>
                            </div>
                          )}
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>


                    </button>
                  ))}



                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Šifrované a bezpečné platby</span>
                    </div>
                  </div>

                  <div className="mt-6 text-xs text-gray-500">
                    <p>
                      Dokončením objednávky souhlasíte s našimi{' '}
                      <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                        Obchodními podmínkami
                      </Link>{' '}
                      a potvrzujete, že jste si přečetli naše{' '}
                      <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                        Zásady ochrany osobních údajů
                      </Link>
                      . Opakované platby můžete kdykoli zrušit.
                    </p>
                  </div>




                </div>
              )}
              </div>
            </div>

          {/* Pravá strana - Souhrn objednávky */}
          <div className="lg:col-span-1">
            <CartSidebar
              selectedPeriod={selectedPeriod}
              selectedOS={selectedOS}
              selectedApps={selectedApps}
              appliedPromo={appliedPromo}
              onPeriodChange={setSelectedPeriod}
              onOSChange={setSelectedOS}
              nextStepUrl=""
              nextStepText="Dokončit a odeslat"
              onNextStep={handleSubmitPayment}
              isLoading={isLoading}
              showPeriodSelector={false}
              showOSSelector={false}
              // Custom pricing functions from billing data (already WITH VAT)
              calculateMonthlyPrice={calculateMonthlyPrice}
              calculatePeriodPrice={calculatePeriodPrice}
              calculateItemSavings={calculateItemSavings}
              getCartTotal={getTotalPriceWithVAT} // Use price WITH VAT from billing
              getCartMonthlyTotal={getMonthlyTotal}
              getTotalSavings={getTotalSavings}
              // Disable VAT calculation in CartSidebar since billing already includes VAT
              disableVATCalculation={true}
              // HostBill invoice data
              hostbillInvoiceData={hostbillInvoiceData}
              showHostbillAmount={true}
            />
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
