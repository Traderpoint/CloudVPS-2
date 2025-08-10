/**
 * Get complete client data API endpoint
 * GET /api/client/complete-data?client_id=123
 * Loads all client data: profile, services, invoices, tickets, stats
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

  const { client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({
      success: false,
      error: 'client_id parameter is required'
    });
  }

  try {
    logger.info('🔍 Loading complete client data', { client_id });

    const hostbillClient = new HostBillClient();
    const result = {
      client: null,
      services: [],
      invoices: [],
      tickets: [],
      stats: {},
      errors: []
    };

    // 1. Load client profile
    try {
      const clientResult = await hostbillClient.makeApiCall({
        call: 'getClientDetails',
        id: client_id
      });

      if (clientResult && clientResult.client) {
        result.client = {
          id: clientResult.client.id,
          firstname: clientResult.client.firstname,
          lastname: clientResult.client.lastname,
          name: `${clientResult.client.firstname} ${clientResult.client.lastname}`,
          email: clientResult.client.email,
          companyname: clientResult.client.companyname || '',
          phone: clientResult.client.phonenumber,
          address: clientResult.client.address1,
          city: clientResult.client.city,
          postcode: clientResult.client.postcode,
          country: clientResult.client.country,
          state: clientResult.client.state,
          status: clientResult.client.status,
          datecreated: clientResult.client.datecreated,
          currency: clientResult.client.currency,
          balance: clientResult.client.balance,
          credit: clientResult.client.credit,
          group_name: clientResult.client.group_name,
          affiliate: clientResult.client.affiliate
        };
        logger.info('✅ Client profile loaded', { client_id });
      } else {
        result.errors.push('Failed to load client profile');
        logger.warn('❌ Failed to load client profile', { client_id });
      }
    } catch (error) {
      result.errors.push(`Client profile error: ${error.message}`);
      logger.error('❌ Error loading client profile', { client_id, error: error.message });
    }

    // 2. Load client services
    try {
      const servicesResult = await hostbillClient.makeApiCall({
        call: 'getClientServices',
        id: client_id
      });

      if (servicesResult && servicesResult.services) {
        result.services = servicesResult.services.map(service => ({
          id: service.id,
          domain: service.domain,
          product_id: service.product_id,
          name: service.name,
          status: service.status,
          billingcycle: service.billingcycle,
          total: service.total,
          nextdue: service.nextdue,
          datecreated: service.datecreated,
          category: service.catname,
          server_id: service.server_id,
          username: service.username,
          autosetup: service.autosetup
        }));
        logger.info('✅ Client services loaded', { client_id, count: result.services.length });
      }
    } catch (error) {
      result.errors.push(`Services error: ${error.message}`);
      logger.error('❌ Error loading client services', { client_id, error: error.message });
    }

    // 3. Load client invoices
    try {
      const invoicesResult = await hostbillClient.makeApiCall({
        call: 'getClientInvoices',
        id: client_id
      });

      if (invoicesResult && invoicesResult.invoices) {
        result.invoices = invoicesResult.invoices.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          total: invoice.total,
          subtotal: invoice.subtotal,
          credit: invoice.credit,
          datecreated: invoice.datecreated,
          duedate: invoice.duedate,
          datepaid: invoice.datepaid,
          currency: invoice.currency,
          gateway_id: invoice.gateway_id
        }));
        logger.info('✅ Client invoices loaded', { client_id, count: result.invoices.length });
      }
    } catch (error) {
      result.errors.push(`Invoices error: ${error.message}`);
      logger.error('❌ Error loading client invoices', { client_id, error: error.message });
    }

    // 4. Load client tickets
    try {
      const ticketsResult = await hostbillClient.makeApiCall({
        call: 'getClientTickets',
        id: client_id
      });

      if (ticketsResult && ticketsResult.tickets) {
        result.tickets = ticketsResult.tickets.map(ticket => ({
          id: ticket.id,
          number: ticket.number,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          department: ticket.department,
          datecreated: ticket.datecreated,
          lastupdate: ticket.lastupdate,
          lastreply: ticket.lastreply
        }));
        logger.info('✅ Client tickets loaded', { client_id, count: result.tickets.length });
      }
    } catch (error) {
      result.errors.push(`Tickets error: ${error.message}`);
      logger.error('❌ Error loading client tickets', { client_id, error: error.message });
    }

    // 5. Calculate stats
    result.stats = {
      totalServices: result.services.length,
      activeServices: result.services.filter(s => s.status === 'Active').length,
      pendingServices: result.services.filter(s => s.status === 'Pending').length,
      suspendedServices: result.services.filter(s => s.status === 'Suspended').length,
      totalInvoices: result.invoices.length,
      paidInvoices: result.invoices.filter(i => i.status === 'Paid').length,
      unpaidInvoices: result.invoices.filter(i => i.status === 'Unpaid').length,
      overdueInvoices: result.invoices.filter(i => i.status === 'Overdue').length,
      totalTickets: result.tickets.length,
      openTickets: result.tickets.filter(t => t.status === 'Open').length,
      closedTickets: result.tickets.filter(t => t.status === 'Closed').length,
      totalBalance: result.client?.balance || 0,
      totalCredit: result.client?.credit || 0
    };

    logger.info('✅ Complete client data loaded', {
      client_id,
      services: result.stats.totalServices,
      invoices: result.stats.totalInvoices,
      tickets: result.stats.totalTickets,
      errors: result.errors.length
    });

    return res.status(200).json({
      success: true,
      data: result,
      client_id: client_id,
      source: 'hostbill_middleware',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error loading complete client data', {
      client_id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to load client data',
      details: error.message,
      client_id: client_id,
      timestamp: new Date().toISOString()
    });
  }
}
