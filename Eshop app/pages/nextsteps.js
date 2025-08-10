export default function NextSteps() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Účet aktivován</h1>
      <p className="text-green-500 text-lg mb-4">
        Váš e-mail byl úspěšně potvrzen a účet je nyní aktivní.
      </p>
      <p className="text-gray-700">
        Vaše objednávka byla vytvořena. Nyní můžete pokračovat s nastavením služeb nebo dokončením platby.
      </p>
      <a
        href="/"
        className="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Zpět na hlavní stránku
      </a>
    </div>
  );
}
