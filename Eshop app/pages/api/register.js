export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  // Validace vstupních dat
  if (!email || !password || !name) {
    return res.status(400).json({ 
      success: false, 
      error: 'Všechna pole jsou povinná' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'Heslo musí mít alespoň 6 znaků' 
    });
  }

  // Validace emailu
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Neplatný formát emailu' 
    });
  }

  const apiId = process.env.HOSTBILL_API_ID;
  const apiKey = process.env.HOSTBILL_API_KEY;
  const hostbillUrl = process.env.HOSTBILL_API_URL;

  try {
    // Nejprve zkontroluj, zda klient již existuje
    const searchResponse = await fetch(`${hostbillUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_id: apiId,
        api_key: apiKey,
        call: 'getClients',
        email: email
      }),
    });

    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.clients && searchData.clients.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Uživatel s tímto emailem již existuje'
      });
    }

    // Vytvoř nového klienta v HostBill
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const createResponse = await fetch(`${hostbillUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_id: apiId,
        api_key: apiKey,
        call: 'addClient',
        firstname: firstName,
        lastname: lastName,
        email: email,
        password: password,
        country: 'CZ',
        currency: 'CZK',
        status: 'Active'
      }),
    });

    const createData = await createResponse.json();

    if (!createData.success) {
      console.error('❌ Client creation failed:', createData);
      return res.status(400).json({
        success: false,
        error: createData.error || 'Nepodařilo se vytvořit uživatelský účet'
      });
    }

    console.log(`✅ Registration successful for: ${email}`);

    // Vrať data uživatele pro session
    res.status(201).json({
      success: true,
      message: 'Registrace byla úspěšná',
      user: {
        id: createData.client_id,
        email: email,
        name: name,
        firstName: firstName,
        lastName: lastName,
        clientId: createData.client_id,
        registeredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba při komunikaci s HostBill API: ' + error.message 
    });
  }
}
