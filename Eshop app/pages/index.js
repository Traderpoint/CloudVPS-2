import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            E-shop App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Moderní e-shop s integrací HostBill API, Google OAuth a automatickou synchronizací s Pohoda účetním systémem.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-blue-500 text-3xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">Nákupní košík</h3>
            <p className="text-gray-600 mb-4">
              Jednoduché přidávání produktů do košíku s přehledným zobrazením celkové ceny.
            </p>
            <Link href="/cart" className="text-blue-500 hover:text-blue-700 font-medium">
              Zobrazit košík →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-green-500 text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Bezpečné přihlášení</h3>
            <p className="text-gray-600 mb-4">
              Přihlášení přes email/heslo nebo rychle pomocí Google OAuth.
            </p>
            <Link href="/login" className="text-blue-500 hover:text-blue-700 font-medium">
              Přihlásit se →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-500 text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2">ARES integrace</h3>
            <p className="text-gray-600 mb-4">
              Automatické načítání firemních dat z českého obchodního registru podle IČO.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-red-500 text-3xl mb-4">📧</div>
            <h3 className="text-xl font-semibold mb-2">Email notifikace</h3>
            <p className="text-gray-600 mb-4">
              Automatické odesílání potvrzovacích emailů a notifikací o stavu objednávky.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-yellow-500 text-3xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">HostBill API</h3>
            <p className="text-gray-600 mb-4">
              Plná integrace s HostBill systémem pro správu klientů a objednávek.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-indigo-500 text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Pohoda sync</h3>
            <p className="text-gray-600 mb-4">
              Automatická synchronizace objednávek s Pohoda účetním systémem.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Začněte nakupovat
          </h2>
          <p className="text-gray-600 mb-6">
            Prozkoumejte naše produkty a služby. Celý proces od košíku po fakturu je plně automatizovaný.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/cart"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block transition-colors"
            >
              Zobrazit košík
            </Link>
            <Link
              href="/register"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg inline-block transition-colors"
            >
              Registrovat se
            </Link>
            <Link
              href="/login"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg inline-block transition-colors"
            >
              Přihlásit se
            </Link>
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500">
          <p>&copy; 2024 E-shop App. Vytvořeno s Next.js a Tailwind CSS.</p>
        </footer>
      </div>
    </div>
  );
}
