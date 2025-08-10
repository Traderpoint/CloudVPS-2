/**
 * ComGate Callback/Webhook Handler
 * Receives server-to-server notifications from ComGate with transaction details
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🔔 ComGate callback received', {
      body: req.body,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    });

    // ComGate sends callback data in POST body or query parameters
    const callbackData = {
      ...req.query,
      ...req.body
    };

    const {
      transId,     // ComGate transaction ID
      refId,       // Our reference ID (invoice ID)
      status,      // Payment status
      price,       // Amount in cents
      curr,        // Currency
      method,      // Payment method used
      email,       // Customer email
      test         // Test mode flag
    } = callbackData;

    console.log('📋 ComGate callback data parsed', {
      transId,
      refId,
      status,
      price,
      curr,
      method,
      email,
      test
    });

    // Validate required parameters
    if (!transId) {
      console.error('❌ ComGate callback missing transId');
      return res.status(400).json({ success: false, error: 'Missing transId' });
    }

    if (!refId) {
      console.error('❌ ComGate callback missing refId');
      return res.status(400).json({ success: false, error: 'Missing refId' });
    }

    // Store transaction data in temporary storage for return URL processing
    // This allows the return URL handler to access the transaction ID
    const transactionData = {
      transId,
      refId,
      status,
      price: price ? parseInt(price) : null,
      curr: curr || 'CZK',
      method,
      email,
      test: test === 'true',
      timestamp: new Date().toISOString(),
      source: 'comgate_callback'
    };

    // Store in memory cache (in production, use Redis or database)
    global.comgateTransactions = global.comgateTransactions || new Map();
    global.comgateTransactions.set(refId, transactionData);

    // Also store by transaction ID for lookup
    global.comgateTransactions.set(transId, transactionData);

    console.log('✅ ComGate transaction data stored', {
      refId,
      transId,
      status,
      storageKey: refId
    });

    // ComGate expects simple "OK" response
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ ComGate callback processing error', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Callback processing failed'
    });
  }
}
