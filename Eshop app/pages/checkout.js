import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Checkout() {
  const [ico, setIco] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedCart = sessionStorage.getItem('cart');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      setError('Košík je prázdný. Vraťte se na stránku košíku.');
    }
  }, [router]);

  const handleIcoChange = (event) => {
    const value = event.target.value;
    if (/^\d{0,8}$/.test(value)) {
      setIco(value);
    }
  };

  const fetchCompanyData = async () => {
    setError(null);
    try {
      const response = await fetch(`https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=${ico}`);
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");
      const obchodniJmeno = xmlDoc.getElementsByTagName("ObchodniJmeno")[0]?.textContent || 'Nenalezeno';
      const sidlo = xmlDoc.getElementsByTagName("Sidlo")[0];
      const adresa = sidlo ? `${sidlo.getElementsByTagName("NazevObce")[0]?.textContent || ''}, ${sidlo.getElementsByTagName("NazevUlice")[0]?.textContent || ''} ${sidlo.getElementsByTagName("CisloDomovni")[0]?.textContent || ''}` : 'Nenalezeno';
      const dic = xmlDoc.getElementsByTagName("Dic")[0]?.textContent || 'Nenalezeno';
      const pravniForma = xmlDoc.getElementsByTagName("PravniForma")[0]?.textContent || 'Nenalezeno';
      const datumVzniku = xmlDoc.getElementsByTagName("DatumVzniku")[0]?.textContent || 'Nenalezeno';

      if (obchodniJmeno !== 'Nenalezeno') {
        setCompanyData({ obchodniJmeno, adresa, dic, pravniForma, datumVzniku });
      } else {
        setError('IČO nenalezeno nebo neplatné.');
      }
    } catch (err) {
      setError('Chyba při načítání dat. Zkuste to znovu.');
    }
  };

  useEffect(() => {
    if (ico.length === 8) {
      fetchCompanyData();
    } else {
      setCompanyData(null);
      setError(null);
    }
  }, [ico]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const createHostbillClientAndOrder = async () => {
    if (!user || !companyData || !cart) {
      setError('Přihlaste se, vyplňte IČO a ověřte košík pro vytvoření klienta a objednávky.');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      let clientId = user.clientId;
      if (!clientId) {
        const clientResponse = await fetch('/api/create-hostbill-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            companyData
          }),
        });

        const clientResult = await clientResponse.json();
        if (!clientResult.clientId) {
          setError('Chyba při vytváření klienta: ' + clientResult.error);
          return;
        }
        clientId = clientResult.clientId;
        sessionStorage.setItem('user', JSON.stringify({ ...user, clientId }));
      }

      const orderResponse = await fetch('/api/create-hostbill-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          cartItems: cart.items,
          totalPrice: cart.totalPrice
        }),
      });

      const orderResult = await orderResponse.json();
      if (!orderResult.orderId) {
        setError('Chyba při vytváření objednávky: ' + orderResult.error);
        return;
      }

      const pohodaResponse = await fetch('/api/sync-pohoda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          orderId: orderResult.orderId,
          cartItems: cart.items,
          totalPrice: cart.totalPrice,
          companyData,
          email: user.email,
          name: user.name
        }),
      });

      const pohodaResult = await pohodaResponse.json();
      if (!pohodaResult.success) {
        setError('Chyba při synchronizaci s Pohodou: ' + pohodaResult.error);
        return;
      }

      if (!user.clientId) {
        const emailResponse = await fetch('/api/send-hostbill-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, email: user.email }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResult.success) {
          setError('Klient a objednávka vytvořeny, ale odeslání potvrzovacího e-mailu selhalo: ' + emailResult.error);
          return;
        }
      }

      setSuccessMessage('Klient, objednávka a synchronizace s Pohodou byly úspěšně dokončeny. Potvrzovací e-mail byl odeslán (pokud jste nový uživatel).');
    } catch (err) {
      setError('Chyba při komunikaci s API: ' + err.message);
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4 max-w-2xl">Přesměrování na přihlášení...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Dokončení nákupu</h1>
      
      {cart && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4">Položky v košíku</h2>
          {cart.items.map(item => (
            <div key={item.id} className="flex justify-between mb-2">
              <span>{item.name} (x{item.quantity})</span>
              <span>{item.price * item.quantity} Kč</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-4">
            <span>Celkem:</span>
            <span>{cart.totalPrice} Kč</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <img src={user.picture || '/default-avatar.svg'} alt="Profile" className="w-10 h-10 rounded-full" />
          <div>
            <p className="text-gray-700">Přihlášen jako: {user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <button
              onClick={handleLogout}
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Zadejte IČO:
          <input
            type="text"
            value={ico}
            onChange={handleIcoChange}
            maxLength="8"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </label>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
      {companyData && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4">Načtená data:</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Název firmy:
              <input
                type="text"
                value={companyData.obchodniJmeno}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Adresa:
              <input
                type="text"
                value={companyData.adresa}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              DIČ:
              <input
                type="text"
                value={companyData.dic}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Právní forma:
              <input
                type="text"
                value={companyData.pravniForma}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Datum vzniku:
              <input
                type="text"
                value={companyData.datumVzniku}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </label>
          </div>
          <button
            onClick={createHostbillClientAndOrder}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            disabled={!user || !companyData || !cart}
          >
            Dokončit registraci a vytvořit objednávku
          </button>
        </div>
      )}
    </div>
  );
}
