import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div className="container mx-auto p-4 max-w-2xl">Přesměrování na přihlášení...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Uživatelský panel</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex items-center space-x-4 mb-4">
          <img src={user.picture || '/default-avatar.svg'} alt="Profile" className="w-10 h-10 rounded-full" />
          <div>
            <p className="text-gray-700">Přihlášen jako: {user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">Vítejte v uživatelském panelu! Zde můžete spravovat své objednávky a služby.</p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Odhlásit
        </button>
      </div>
    </div>
  );
}
