// Real authentication API for CloudVPS - NO FALLBACK
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }

  try {
    console.log(`🔐 Login attempt for email: ${email}`);

    // HostBill configuration
    const HOSTBILL_CONFIG = {
      apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
      apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
      apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
    };

    // Try to find client by email in HostBill
    const clientSearchUrl = new URL(HOSTBILL_CONFIG.apiUrl);
    clientSearchUrl.searchParams.append('api_id', HOSTBILL_CONFIG.apiId);
    clientSearchUrl.searchParams.append('api_key', HOSTBILL_CONFIG.apiKey);
    clientSearchUrl.searchParams.append('call', 'getClients');
    clientSearchUrl.searchParams.append('email', email);

    console.log(`🌐 Searching for client: ${email}`);

    const response = await fetch(clientSearchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudVPS-Portal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Client search response: ${data.success}`);

    if (!data.success || !data.clients || data.clients.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const client = data.clients[0];

    // Validate password using HostBill client authentication
    const authUrl = new URL(HOSTBILL_CONFIG.apiUrl);
    authUrl.searchParams.append('api_id', HOSTBILL_CONFIG.apiId);
    authUrl.searchParams.append('api_key', HOSTBILL_CONFIG.apiKey);
    authUrl.searchParams.append('call', 'clientAuth');
    authUrl.searchParams.append('email', email);
    authUrl.searchParams.append('password', password);

    const authResponse = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'CloudVPS-Portal/1.0'
      }
    });

    const authData = await authResponse.json();

    if (!authData.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log(`✅ Login successful for: ${client.firstname} ${client.lastname}`);

    // Return user data for session storage
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: client.id,
        email: client.email,
        firstName: client.firstname,
        lastName: client.lastname,
        company: client.companyname || '',
        phone: client.phonenumber || '',
        address: client.address1 || '',
        city: client.city || '',
        postalCode: client.postcode || '',
        country: client.country || 'CZ',
        loginMethod: 'email',
        loggedInAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Authentication service temporarily unavailable'
    });
  }
}
