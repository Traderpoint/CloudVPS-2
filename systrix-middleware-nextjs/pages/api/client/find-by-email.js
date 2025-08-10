/**
 * Find client by email API endpoint
 * GET /api/client/find-by-email?email=client@example.com
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email parameter is required'
    });
  }

  try {
    logger.info('🔍 Finding client by email', { email });

    const hostbillClient = new HostBillClient();
    
    // Find client by email
    const client = await hostbillClient.findClientByEmail(email);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
        email: email
      });
    }

    logger.info('✅ Client found by email', {
      email,
      clientId: client.id,
      clientName: `${client.firstname} ${client.lastname}`
    });

    // Get additional client details
    let clientDetails = null;
    try {
      const detailsResult = await hostbillClient.makeApiCall({
        call: 'getClientDetails',
        id: client.id
      });
      
      if (detailsResult && detailsResult.client) {
        clientDetails = detailsResult.client;
      }
    } catch (detailsError) {
      logger.warn('Failed to get client details', {
        clientId: client.id,
        error: detailsError.message
      });
    }

    // Prepare response data
    const responseData = {
      id: client.id,
      email: client.email,
      firstname: client.firstname,
      lastname: client.lastname,
      name: `${client.firstname} ${client.lastname}`,
      companyname: client.companyname || '',
      status: client.status || 'Active',
      datecreated: client.datecreated,
      // Additional details if available
      ...(clientDetails && {
        phone: clientDetails.phonenumber,
        address: clientDetails.address1,
        city: clientDetails.city,
        postcode: clientDetails.postcode,
        country: clientDetails.country,
        state: clientDetails.state,
        currency: clientDetails.currency,
        balance: clientDetails.balance,
        credit: clientDetails.credit
      })
    };

    return res.status(200).json({
      success: true,
      client: responseData,
      source: 'hostbill_middleware',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error finding client by email', {
      email,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to find client',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
