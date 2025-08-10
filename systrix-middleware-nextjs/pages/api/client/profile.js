// Client Profile API - Get client profile from HostBill
// GET /api/client/profile?client_id=123

import { HostBillClient } from '../../../lib/hostbill-client';
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Client ID is required' 
    });
  }

  try {
    logger.info(`🔍 Fetching client profile for ID: ${client_id}`);

    const hostbill = new HostBillClient();
    
    // Get client details from HostBill
    const clientData = await hostbill.makeApiCall({
      call: 'getClientDetails',
      id: client_id
    });

    if (!clientData.success) {
      logger.error(`❌ Failed to fetch client ${client_id}:`, clientData.error);
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const client = clientData.client;

    // Format client profile data
    const clientProfile = {
      id: client.id,
      clientId: `CL${String(client.id).padStart(6, '0')}`,
      firstName: client.firstname || '',
      lastName: client.lastname || '',
      name: `${client.firstname || ''} ${client.lastname || ''}`.trim(),
      email: client.email || '',
      company: client.companyname || '',
      phone: client.phonenumber || '',
      address: client.address1 || '',
      address2: client.address2 || '',
      city: client.city || '',
      state: client.state || '',
      postalCode: client.postcode || '',
      country: client.country || 'CZ',
      registrationDate: client.datecreated || null,
      lastLogin: client.lastlogin || null,
      status: client.status || 'active',
      accountType: client.companyname ? 'business' : 'individual',
      creditBalance: parseFloat(client.credit || 0),
      currency: client.currency || 'CZK',
      language: client.language || 'cs',
      taxExempt: client.taxexempt === '1',
      notes: client.notes || ''
    };

    logger.info(`✅ Client profile loaded: ${clientProfile.name} (${clientProfile.email})`);

    res.status(200).json({
      success: true,
      data: clientProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error fetching client profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client profile',
      details: error.message
    });
  }
}
