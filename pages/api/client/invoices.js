// Client Invoices API - Proxy to middleware
// GET /api/client/invoices

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client ID from session/auth context
    const { client_id, limit } = req.query;

    if (!client_id) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required. Please provide client_id parameter.'
      });
    }

    console.log(`🔍 Fetching invoices for client ID: ${client_id}`);

    // Call middleware API
    const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
    const url = `${middlewareUrl}/api/client/invoices?client_id=${client_id}${limit ? `&limit=${limit}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Middleware API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(404).json({
        success: false,
        error: data.error || 'Invoices not found'
      });
    }

    console.log(`✅ Loaded ${data.data.length} invoices for client ${client_id}`);

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error fetching client invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client invoices',
      details: error.message
    });
  }
}

