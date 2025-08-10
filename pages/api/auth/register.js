// Real registration API for CloudVPS - NO FALLBACK
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      error: 'All fields are required' 
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      error: 'Passwords do not match' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'Password must be at least 6 characters long' 
    });
  }

  try {
    console.log(`📝 Registration attempt for email: ${email}`);

    // HostBill configuration
    const HOSTBILL_CONFIG = {
      apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
      apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
      apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
    };

    // First check if client already exists
    const clientSearchUrl = new URL(HOSTBILL_CONFIG.apiUrl);
    clientSearchUrl.searchParams.append('api_id', HOSTBILL_CONFIG.apiId);
    clientSearchUrl.searchParams.append('api_key', HOSTBILL_CONFIG.apiKey);
    clientSearchUrl.searchParams.append('call', 'getClients');
    clientSearchUrl.searchParams.append('email', email);

    const searchResponse = await fetch(clientSearchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudVPS-Portal/1.0'
      }
    });

    const searchData = await searchResponse.json();

    if (searchData.success && searchData.clients && searchData.clients.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new client in HostBill
    const createUrl = new URL(HOSTBILL_CONFIG.apiUrl);
    createUrl.searchParams.append('api_id', HOSTBILL_CONFIG.apiId);
    createUrl.searchParams.append('api_key', HOSTBILL_CONFIG.apiKey);
    createUrl.searchParams.append('call', 'addClient');
    createUrl.searchParams.append('email', email);
    createUrl.searchParams.append('password', password);
    createUrl.searchParams.append('firstname', email.split('@')[0]); // Use email prefix as firstname
    createUrl.searchParams.append('lastname', 'User'); // Default lastname
    createUrl.searchParams.append('country', 'CZ');
    createUrl.searchParams.append('currency', 'CZK');

    console.log(`🌐 Creating client in HostBill: ${email}`);

    const createResponse = await fetch(createUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudVPS-Portal/1.0'
      }
    });

    const createData = await createResponse.json();

    if (!createData.success) {
      console.error('❌ Client creation failed:', createData);
      return res.status(400).json({
        success: false,
        error: createData.error || 'Failed to create user account'
      });
    }

    console.log(`✅ Registration successful for: ${email}`);

    // Return user data for session storage
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: createData.client_id,
        email: email,
        firstName: email.split('@')[0],
        lastName: 'User',
        registeredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Registration service temporarily unavailable'
    });
  }
}
