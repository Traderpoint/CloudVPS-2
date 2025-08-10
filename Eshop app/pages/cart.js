import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Cart() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Hosting Basic', price: 1000, quantity: 1 },
    { id: 2, name: 'Domain Registration', price: 300, quantity: 1 },
  ]);
  const router = useRouter();

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleConfirmPurchase = () => {
    sessionStorage.setItem('cart', JSON.stringify({ items: cartItems, totalPrice }));
    router.push('/login');
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Nákupní košík</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-bold mb-4">Položky v košíku</h2>
        {cartItems.map(item => (
          <div key={item.id} className="flex justify-between mb-2">
            <span>{item.name} (x{item.quantity})</span>
            <span>{item.price * item.quantity} Kč</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-4">
          <span>Celkem:</span>
          <span>{totalPrice} Kč</span>
        </div>
        <button
          onClick={handleConfirmPurchase}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Potvrdit nákup
        </button>
      </div>
    </div>
  );
}
