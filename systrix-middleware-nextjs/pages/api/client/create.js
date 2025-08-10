const HostBillClient = require('../../../lib/hostbill-client');

const hostbillClient = new HostBillClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const clientData = req.body;
    
    console.log('🔄 Creating new client in HostBill:', {
      email: clientData.email,
      firstName: clientData.firstName,
      lastName: clientData.lastName
    });

    // Validate required fields
    if (!clientData.email || !clientData.firstName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Email and firstName are required'
      });
    }

    // Create client in HostBill
    const client = await hostbillClient.createClient(clientData);

    if (client) {
      console.log('✅ Client created successfully:', {
        clientId: client.id,
        email: client.email
      });

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        client: client
      });
    } else {
      console.error('❌ Failed to create client - no client returned');
      res.status(500).json({
        success: false,
        error: 'Failed to create client',
        details: 'HostBill API did not return client data'
      });
    }

  } catch (error) {
    console.error('❌ Error creating client:', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
