/**
 * Clear Affiliate Data API Endpoint
 * Clears affiliate cookies and session data
 */

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Clear affiliate cookies
    res.setHeader('Set-Cookie', [
      'affiliate_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'affiliate_code=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'affiliate_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);

    console.log('🧹 Affiliate data cleared');

    return res.status(200).json({
      success: true,
      message: 'Affiliate data cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error clearing affiliate data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear affiliate data',
      details: error.message
    });
  }
}
