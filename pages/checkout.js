import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart, affiliateId, affiliateCode } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Osobní údaje
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Fakturační adresa
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'CZ',
    
    // Platební metoda
    paymentMethod: 'card',
    
    // Souhlas
    termsAccepted: false,
    newsletterSubscribe: false
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/pricing');
    }
  }, [items, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      alert('Musíte souhlasit s obchodními podmínkami');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare order data
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        },
        items: items.map(item => ({
          productId: item.hostbillPid,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price.replace(/[^\d]/g, ''))
        })),
        paymentMethod: formData.paymentMethod,
        total: total,
        affiliate: {
          id: affiliateId,
          code: affiliateCode
        },
        newsletterSubscribe: formData.newsletterSubscribe
      };

      // Send to new order processing API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Order processed successfully:', result.data);

        // Store order details for success page
        sessionStorage.setItem('orderResult', JSON.stringify(result.data));

        // If user selected a payment method other than banktransfer, initialize payment
        const requestedPaymentMethod = result.summary?.requestedPaymentMethod || formData.paymentMethod;
        if (requestedPaymentMethod && requestedPaymentMethod !== 'banktransfer') {
          console.log('🔄 Initializing payment with method:', requestedPaymentMethod);

          // Get the first order and invoice for payment initialization
          const firstOrder = result.orders?.[0];
          if (firstOrder && firstOrder.invoice_id) {
            try {
              const paymentResponse = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: firstOrder.order_id,
                  invoiceId: firstOrder.invoice_id,
                  method: requestedPaymentMethod,
                  amount: total,
                  currency: 'CZK'
                })
              });

              const paymentResult = await paymentResponse.json();

              if (paymentResult.success) {
                console.log('✅ Payment initialized:', paymentResult);

                // Store payment data for success page
                sessionStorage.setItem('paymentData', JSON.stringify(paymentResult));

                // If payment requires redirect, go there immediately
                if (paymentResult.redirectRequired && paymentResult.paymentUrl) {
                  console.log('🔄 Redirecting to payment gateway...');
                  window.location.href = paymentResult.paymentUrl;
                  return; // Don't continue with normal flow
                }
              } else {
                console.warn('⚠️ Payment initialization failed:', paymentResult.error);
                // Continue to success page even if payment init fails
              }
            } catch (paymentError) {
              console.error('❌ Payment initialization error:', paymentError);
              // Continue to success page even if payment init fails
            }
          }
        }

        // Clear cart and redirect to success page
        clearCart('order_success');
        router.push('/order-success');
      } else {
        throw new Error(result.error || 'Objednávka se nezdařila');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Došlo k chybě při zpracování objednávky. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Dokončení objednávky</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="order-2 md:order-1">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Souhrn objednávky</h2>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="text-sm text-gray-600">
                      {item.cpu} • {item.ram} • {item.storage}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-sm text-gray-600">
                        Množství: {item.quantity}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {parseFloat(item.price.replace(/[^\d]/g, '')) * item.quantity} Kč/měsíc
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Celkem:</span>
                <span>{total} Kč/měsíc</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Ceny jsou uvedeny bez DPH
              </div>
            </div>

            {(affiliateId || affiliateCode) && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <div className="text-sm text-green-800">
                  ✓ Affiliate tracking aktivní
                  {affiliateCode && <div>Kód: {affiliateCode}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checkout Form */}
        <div className="order-1 md:order-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-bold mb-4">Osobní údaje</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Jméno *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Příjmení *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h2 className="text-xl font-bold mb-4">Fakturační adresa</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Společnost</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Adresa *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Město *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PSČ *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-xl font-bold mb-4">Platební metoda</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Platební karta
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={formData.paymentMethod === 'bank_transfer'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Bankovní převod
                </label>
              </div>
            </div>

            {/* Agreements */}
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  className="mr-2 mt-1"
                  required
                />
                <span className="text-sm">
                  Souhlasím s <a href="/terms" className="text-primary-600 hover:underline">obchodními podmínkami</a> *
                </span>
              </label>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="newsletterSubscribe"
                  checked={formData.newsletterSubscribe}
                  onChange={handleInputChange}
                  className="mr-2 mt-1"
                />
                <span className="text-sm">
                  Chci dostávat newsletter s novinkami a speciálními nabídkami
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Zpracovávám objednávku...' : 'Dokončit objednávku'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
