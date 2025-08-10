// Client Support Tickets API - Get client tickets from HostBill
// GET /api/client/tickets?client_id=123

import { HostBillClient } from '../../../lib/hostbill-client';
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client_id, limit = 50 } = req.query;

  if (!client_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Client ID is required' 
    });
  }

  try {
    logger.info(`🔍 Fetching tickets for client ID: ${client_id}`);

    const hostbill = new HostBillClient();
    
    // Get client tickets from HostBill
    const ticketsData = await hostbill.makeApiCall({
      call: 'getClientTickets',
      client_id: client_id,
      limit: limit
    });

    if (!ticketsData.success) {
      logger.error(`❌ Failed to fetch tickets for client ${client_id}:`, ticketsData.error);
      return res.status(404).json({
        success: false,
        error: 'Tickets not found'
      });
    }

    const tickets = await Promise.all((ticketsData.tickets || []).map(async (ticket) => {
      try {
        // Get ticket details including messages
        const ticketDetail = await hostbill.makeApiCall({
          call: 'getTicketDetails',
          id: ticket.id
        });

        const detail = ticketDetail.ticket || ticket;
        
        // Parse messages
        const messages = [];
        if (detail.messages && Array.isArray(detail.messages)) {
          detail.messages.forEach((msg, index) => {
            messages.push({
              id: index + 1,
              author: msg.admin ? (msg.admin_name || 'Support Staff') : (msg.client_name || 'Client'),
              authorType: msg.admin ? 'staff' : 'client',
              message: msg.message || msg.body || '',
              timestamp: msg.date || msg.created,
              attachments: msg.attachments || []
            });
          });
        }

        // Determine priority
        let priority = 'medium';
        if (ticket.priority) {
          const p = ticket.priority.toLowerCase();
          if (p.includes('high') || p.includes('urgent')) priority = 'high';
          else if (p.includes('low')) priority = 'low';
        }

        // Determine status
        let status = 'open';
        if (ticket.status) {
          const s = ticket.status.toLowerCase();
          if (s.includes('closed') || s.includes('resolved')) status = 'closed';
          else if (s.includes('waiting') || s.includes('pending')) status = 'waiting_reply';
        }

        // Get related service info
        let serviceName = null;
        let serviceId = null;
        if (ticket.rel_id && ticket.rel_type === 'Accounts') {
          try {
            const accountData = await hostbill.makeApiCall({
              call: 'getAccountDetails',
              id: ticket.rel_id
            });
            if (accountData.success && accountData.account) {
              serviceName = accountData.account.domain || `Service ${ticket.rel_id}`;
              serviceId = ticket.rel_id;
            }
          } catch (error) {
            logger.warn(`⚠️ Could not fetch service details for ticket ${ticket.id}:`, error.message);
          }
        }

        return {
          id: `TIC-${String(ticket.id).padStart(3, '0')}`,
          subject: ticket.subject || 'Support Request',
          status: status,
          priority: priority,
          created: ticket.date || ticket.created,
          lastReply: ticket.lastreply || ticket.updated,
          department: ticket.department || 'Technická podpora',
          assignedTo: ticket.admin_name || 'Nepřiřazeno',
          serviceId: serviceId,
          serviceName: serviceName,
          messages: messages,
          clientId: ticket.client_id,
          relatedType: ticket.rel_type,
          relatedId: ticket.rel_id
        };
      } catch (error) {
        logger.error(`❌ Error processing ticket ${ticket.id}:`, error);
        return {
          id: `TIC-${String(ticket.id).padStart(3, '0')}`,
          subject: ticket.subject || 'Support Request',
          status: 'open',
          priority: 'medium',
          created: ticket.date || ticket.created,
          lastReply: ticket.lastreply || ticket.updated,
          department: 'Technická podpora',
          assignedTo: 'Nepřiřazeno',
          messages: []
        };
      }
    }));

    // Calculate statistics
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      waiting_reply: tickets.filter(t => t.status === 'waiting_reply').length,
      high_priority: tickets.filter(t => t.priority === 'high').length,
      medium_priority: tickets.filter(t => t.priority === 'medium').length,
      low_priority: tickets.filter(t => t.priority === 'low').length
    };

    logger.info(`✅ Loaded ${tickets.length} tickets for client ${client_id}`);

    res.status(200).json({
      success: true,
      data: tickets,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error fetching client tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client tickets',
      details: error.message
    });
  }
}
