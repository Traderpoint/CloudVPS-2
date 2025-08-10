// Test registrace pro OAuth testy - pouze pro demo účely
// V produkci by toto bylo připojeno k databázi

let testUsers = [
  {
    id: "1",
    email: "test@cloudvps.cz",
    password: "test123",
    name: "Test User",
    image: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "2", 
    email: "admin@cloudvps.cz",
    password: "admin123",
    name: "Admin User",
    image: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    email: "demo@cloudvps.cz", 
    password: "demo123",
    name: "Demo User",
    image: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Demo",
    createdAt: new Date().toISOString()
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  // Validace
  if (!email || !password || !name) {
    return res.status(400).json({ 
      success: false,
      error: 'Všechna pole jsou povinná',
      details: 'Email, heslo a jméno musí být vyplněny'
    });
  }

  // Kontrola formátu emailu
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Neplatný formát emailu',
      details: 'Zadejte platnou emailovou adresu'
    });
  }

  // Kontrola délky hesla
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false,
      error: 'Heslo je příliš krátké',
      details: 'Heslo musí mít alespoň 6 znaků'
    });
  }

  // Kontrola, zda uživatel již existuje
  const existingUser = testUsers.find(user => user.email === email);
  if (existingUser) {
    console.log('ℹ️ User already exists, returning success for login flow');

    // Vrátíme úspěšnou odpověď s informací o existujícím uživateli
    const { password: _, ...userWithoutPassword } = existingUser;

    return res.status(200).json({
      success: true,
      message: 'Uživatel s tímto emailem již existuje',
      user: userWithoutPassword,
      existingUser: true // Označení, že se jedná o existujícího uživatele
    });
  }

  // Vytvoření nového uživatele
  const newUser = {
    id: (testUsers.length + 1).toString(),
    email,
    password, // V produkci by bylo hashované
    name,
    image: null,
    createdAt: new Date().toISOString()
  };

  // Přidání do "databáze"
  testUsers.push(newUser);

  // Vytvoření klienta v HostBill přes middleware
  try {
    console.log('🔄 Creating client in HostBill for email registration...');

    // Rozdělení jména na křestní jméno a příjmení
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const clientData = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      companyName: '', // Prázdné pro osobní účty
      address: '',
      city: '',
      state: '',
      postcode: '',
      country: 'CZ',
      phonenumber: ''
    };

    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
    const response = await fetch(`${middlewareUrl}/api/client/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData)
    });

    const hostbillResult = await response.json();

    if (hostbillResult.success) {
      console.log('✅ Client created in HostBill:', {
        clientId: hostbillResult.client.id,
        email: email,
        name: name
      });
    } else {
      console.warn('⚠️ Failed to create client in HostBill:', hostbillResult.error);
      // Pokračujeme i když se nepodaří vytvořit klienta v HostBill
    }
  } catch (error) {
    console.error('❌ Error creating client in HostBill:', error.message);
    // Pokračujeme i když se nepodaří vytvořit klienta v HostBill
  }

  // Vrácení úspěšné odpovědi (bez hesla)
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    success: true,
    message: 'Uživatel byl úspěšně zaregistrován',
    user: userWithoutPassword
  });
}

// Export pro použití v authorize funkci
export function getTestUsers() {
  return testUsers;
}
