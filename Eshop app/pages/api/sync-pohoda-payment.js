/**
 * Pohoda Payment Sync API
 * POST /api/sync-pohoda-payment
 * Synchronizes payment status updates to Pohoda system
 * This endpoint is called automatically after successful payment processing
 */

import { create } from 'xmlbuilder2';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    orderId, 
    invoiceId, 
    transactionId, 
    paymentMethod, 
    amount, 
    currency, 
    paymentDate, 
    notes, 
    status 
  } = req.body;

  // Environment variables for Dativery/Pohoda integration
  const dativeryApiKey = process.env.DATIVERY_API_KEY;
  const dativeryApiUrl = process.env.DATIVERY_API_URL;
  const pohodaDataFile = process.env.POHODA_DATA_FILE;
  const pohodaUsername = process.env.POHODA_USERNAME;
  const pohodaPassword = process.env.POHODA_PASSWORD;

  console.log('🔄 Pohoda Payment Sync: Processing payment update...', {
    orderId,
    invoiceId,
    transactionId,
    paymentMethod,
    amount,
    status
  });

  // Check if Pohoda sync is configured
  if (!dativeryApiKey || !dativeryApiUrl) {
    console.warn('⚠️ Pohoda Payment Sync: Not configured - skipping sync', {
      hasApiKey: !!dativeryApiKey,
      hasApiUrl: !!dativeryApiUrl
    });
    
    return res.status(200).json({
      success: true,
      message: 'Pohoda sync not configured - payment processed without sync',
      configured: false,
      orderId,
      invoiceId
    });
  }

  try {
    // Create XML for payment update in Pohoda
    const xmlObj = {
      dataPack: {
        '@version': '2.0',
        '@application': 'CloudVPS Payment Sync',
        dataPackItem: {
          '@version': '2.0',
          order: {
            '@action': 'update',
            orderHeader: {
              orderType: 'receivedOrder',
              numberOrder: orderId,
              date: paymentDate || new Date().toISOString().split('T')[0],
              // Payment information
              paymentType: {
                paymentMethod: mapPaymentMethodToPohoda(paymentMethod),
                transactionId: transactionId,
                amount: amount.toString(),
                currency: currency || 'CZK',
                paymentDate: paymentDate || new Date().toISOString().split('T')[0],
                status: status || 'PAID'
              },
              // Order status update
              orderStatus: status === 'PAID' ? 'completed' : 'pending',
              totalPrice: amount.toString(),
              currency: currency || 'CZK',
              // Notes about the payment
              note: notes || `Payment processed: ${transactionId} via ${paymentMethod}`,
              // Mark as paid
              isPaid: status === 'PAID' ? 'true' : 'false'
            }
          }
        }
      }
    };

    console.log('📋 Pohoda Payment Sync: Generated XML structure', {
      orderId,
      paymentMethod: mapPaymentMethodToPohoda(paymentMethod),
      amount,
      status
    });

    // Convert to XML
    const xml = create(xmlObj).end({ prettyPrint: true });
    
    console.log('🔄 Pohoda Payment Sync: Sending to Dativery API...', {
      url: `${dativeryApiUrl}/pohoda/import`,
      orderId,
      xmlLength: xml.length
    });

    // Send to Dativery API
    const response = await fetch(`${dativeryApiUrl}/pohoda/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Bearer ${dativeryApiKey}`,
        'X-Pohoda-DataFile': pohodaDataFile,
        'X-Pohoda-Username': pohodaUsername,
        'X-Pohoda-Password': pohodaPassword
      },
      body: xml
    });

    if (!response.ok) {
      throw new Error(`Dativery API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Pohoda Payment Sync: Successfully synchronized', {
      orderId,
      invoiceId,
      transactionId,
      dativeryResponse: result
    });

    return res.status(200).json({
      success: true,
      message: 'Payment synchronized to Pohoda successfully',
      orderId,
      invoiceId,
      transactionId,
      pohodaOrderId: orderId,
      paymentMethod: mapPaymentMethodToPohoda(paymentMethod),
      amount,
      currency: currency || 'CZK',
      status,
      dativeryResponse: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Pohoda Payment Sync: Failed to synchronize payment', {
      orderId,
      invoiceId,
      transactionId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: `Failed to synchronize payment to Pohoda: ${error.message}`,
      orderId,
      invoiceId,
      transactionId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Map payment method to Pohoda-compatible format
 * @param {string} paymentMethod - Payment method from CloudVPS
 * @returns {string} Pohoda-compatible payment method
 */
function mapPaymentMethodToPohoda(paymentMethod) {
  const mapping = {
    'comgate': 'Platební karta (ComGate)',
    'payu': 'Platební karta (PayU)',
    'banktransfer': 'Bankovní převod',
    'creditcard': 'Platební karta',
    'manual': 'Manuální platba',
    '0': 'Hotovost/Jiné',
    'null': 'Neurčeno'
  };

  return mapping[paymentMethod] || `Platba (${paymentMethod})`;
}

/**
 * Generate payment reference for Pohoda
 * @param {string} transactionId - Transaction ID
 * @param {string} paymentMethod - Payment method
 * @returns {string} Payment reference
 */
function generatePaymentReference(transactionId, paymentMethod) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  return `${paymentMethod.toUpperCase()}-${transactionId}-${timestamp}`;
}
