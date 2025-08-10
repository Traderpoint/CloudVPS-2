import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

export default function TestCart() {
  const { items, addItem, updateQuantity, removeItem, getTotalPrice } = useCart();

  const vpsPlans = [
    {
      id: 1,
      name: 'VPS Start',
      cpu: '2 jádra',
      ram: '4 GB',
      storage: '50 GB',
      price: '249 Kč',
      hostbillPid: 5
    },
    {
      id: 2,
      name: 'VPS Profi',
      cpu: '4 jádra',
      ram: '8 GB',
      storage: '100 GB',
      price: '499 Kč',
      hostbillPid: 10
    }
  ];

  const handleAddToCart = (plan) => {
    addItem({
      id: plan.id,
      name: plan.name,
      cpu: plan.cpu,
      ram: plan.ram,
      storage: plan.storage,
      price: plan.price,
      hostbillPid: plan.hostbillPid
    });
    console.log('🛒 Added to cart:', plan.name);
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    updateQuantity(itemId, newQuantity);
    console.log('🔄 Updated quantity:', itemId, newQuantity);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Cart Functionality</h1>
      
      {/* Products */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {vpsPlans.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-2">{plan.cpu} • {plan.ram} • {plan.storage}</p>
            <p className="text-lg font-bold mb-4">{plan.price}</p>
            <button
              onClick={() => handleAddToCart(plan)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Přidat do košíku
            </button>
          </div>
        ))}
      </div>

      {/* Cart Display */}
      <div className="border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Košík ({items.length} položek)</h2>
        
        {items.length === 0 ? (
          <p className="text-gray-500">Košík je prázdný</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} className="border-b pb-4 mb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.cpu} • {item.ram} • {item.storage}</p>
                    <p className="text-sm text-gray-600">HostBill PID: {item.hostbillPid}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.price}</p>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="bg-gray-200 px-2 py-1 rounded text-sm"
                      >
                        -
                      </button>
                      <span className="mx-2 font-semibold">Množství: {item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-200 px-2 py-1 rounded text-sm"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 text-sm mt-2"
                    >
                      Odstranit
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xl font-bold">Celkem: {getTotalPrice()} Kč</p>
            </div>
          </>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-8 border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Debug Info</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    </div>
  );
}
