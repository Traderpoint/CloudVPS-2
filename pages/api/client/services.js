// Client Services API - Proxy to middleware
// GET /api/client/services

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client ID from session/auth context
    const { client_id } = req.query;

    if (!client_id) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required. Please provide client_id parameter.'
      });
    }

    console.log(`🔍 Fetching services for client ID: ${client_id}`);

    // Call middleware API
    const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
    const response = await fetch(`${middlewareUrl}/api/client/services?client_id=${client_id}`);

    if (!response.ok) {
      throw new Error(`Middleware API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(404).json({
        success: false,
        error: data.error || 'Services not found'
      });
    }

    console.log(`✅ Loaded ${data.data.length} services for client ${client_id}`);

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error fetching client services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client services',
      details: error.message
    });
  }
}
