// Client Profile API - Proxy to middleware
// GET /api/client/profile

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client ID from session/auth context
    // For now, we'll use a query parameter or default client
    const { client_id } = req.query;

    if (!client_id) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required. Please provide client_id parameter.'
      });
    }

    console.log(`🔍 Fetching client profile for ID: ${client_id}`);

    // Call middleware API
    const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
    const response = await fetch(`${middlewareUrl}/api/client/profile?client_id=${client_id}`);

    if (!response.ok) {
      throw new Error(`Middleware API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(404).json({
        success: false,
        error: data.error || 'Client not found'
      });
    }

    console.log(`✅ Client profile loaded: ${data.data.name}`);

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error fetching client profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client profile',
      details: error.message
    });
  }
}
