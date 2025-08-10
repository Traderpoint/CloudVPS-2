/**
 * Pohoda Invoice Sync API
 * POST /api/sync-pohoda-invoice
 * Synchronizes complete invoice data to Pohoda system after successful payment
 * This creates/updates invoice in Pohoda with payment information
 */

import { create } from 'xmlbuilder2';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    invoiceId,
    orderId,
    transactionId,
    paymentMethod,
    amount,
    currency,
    paymentDate,
    notes,
    customerData,
    invoiceItems,
    fetchCustomerData
  } = req.body;

  // Environment variables for Dativery/Pohoda integration
  const dativeryApiKey = process.env.DATIVERY_API_KEY;
  const dativeryApiUrl = process.env.DATIVERY_API_URL;
  const pohodaDataFile = process.env.POHODA_DATA_FILE;
  const pohodaUsername = process.env.POHODA_USERNAME;
  const pohodaPassword = process.env.POHODA_PASSWORD;

  console.log('🧾 Pohoda Invoice Sync: Processing invoice synchronization...', {
    invoiceId,
    orderId,
    transactionId,
    paymentMethod,
    amount,
    hasCustomerData: !!customerData,
    itemsCount: invoiceItems?.length || 0
  });

  // Check if Pohoda sync is configured
  if (!dativeryApiKey || !dativeryApiUrl) {
    console.warn('⚠️ Pohoda Invoice Sync: Not configured - skipping sync', {
      hasApiKey: !!dativeryApiKey,
      hasApiUrl: !!dativeryApiUrl
    });
    
    return res.status(200).json({
      success: true,
      message: 'Pohoda sync not configured - invoice processed without sync',
      configured: false,
      invoiceId,
      orderId
    });
  }

  try {
    // Fetch customer data from HostBill if requested
    let finalCustomerData = customerData;
    let finalInvoiceItems = invoiceItems;

    if (fetchCustomerData && invoiceId) {
      console.log('🔍 Fetching invoice details from HostBill for complete sync...');

      try {
        // Call HostBill API to get invoice details
        const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
        const invoiceResponse = await fetch(`${middlewareUrl}/api/invoices/${invoiceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();

          if (invoiceData.success && invoiceData.invoice) {
            const invoice = invoiceData.invoice;

            finalCustomerData = {
              name: `${invoice.firstname || ''} ${invoice.lastname || ''}`.trim(),
              company: invoice.companyname || '',
              email: invoice.email || '',
              phone: invoice.phonenumber || '',
              ico: invoice.taxid || '',
              dic: invoice.taxid2 || '',
              address: {
                street: invoice.address1 || '',
                city: invoice.city || '',
                zip: invoice.postcode || ''
              }
            };

            if (invoice.items && Array.isArray(invoice.items)) {
              finalInvoiceItems = invoice.items.map(item => ({
                id: item.id,
                name: item.description || `Položka ${item.id}`,
                quantity: parseInt(item.qty) || 1,
                price: parseFloat(item.amount) || 0,
                unitPrice: parseFloat(item.amount) / (parseInt(item.qty) || 1),
                vatRate: '21'
              }));
            }

            console.log('✅ Invoice details fetched successfully', {
              invoiceId,
              customerName: finalCustomerData.name,
              itemsCount: finalInvoiceItems?.length || 0
            });
          }
        }
      } catch (fetchError) {
        console.warn('⚠️ Failed to fetch invoice details from HostBill, using provided data', {
          invoiceId,
          error: fetchError.message
        });
      }
    }

    // Create XML for invoice in Pohoda
    const xmlObj = {
      dataPack: {
        '@version': '2.0',
        '@application': 'CloudVPS Invoice Sync',
        dataPackItem: {
          '@version': '2.0',
          invoice: {
            '@action': 'create',
            invoiceHeader: {
              invoiceType: 'issuedInvoice',
              number: invoiceId,
              date: paymentDate || new Date().toISOString().split('T')[0],
              dateDue: paymentDate || new Date().toISOString().split('T')[0],
              // Customer information
              partnerIdentity: finalCustomerData ? {
                name: finalCustomerData.company || finalCustomerData.name,
                company: finalCustomerData.company,
                ico: finalCustomerData.ico,
                dic: finalCustomerData.dic,
                address: finalCustomerData.address ? {
                  street: finalCustomerData.address.street,
                  city: finalCustomerData.address.city,
                  zip: finalCustomerData.address.zip
                } : undefined,
                email: finalCustomerData.email,
                phone: finalCustomerData.phone
              } : {
                name: `Zákazník faktury ${invoiceId}`,
                email: 'unknown@cloudvps.cz'
              },
              // Payment information
              paymentType: {
                paymentMethod: mapPaymentMethodToPohoda(paymentMethod),
                transactionId: transactionId,
                amount: amount.toString(),
                currency: currency || 'CZK',
                paymentDate: paymentDate || new Date().toISOString().split('T')[0]
              },
              // Invoice totals
              totalPrice: amount.toString(),
              currency: currency || 'CZK',
              // Mark as paid
              isPaid: 'true',
              paymentStatus: 'paid',
              // Notes
              note: notes || `CloudVPS invoice ${invoiceId} - Payment: ${transactionId} via ${paymentMethod}`,
              // Reference to original order
              orderNumber: orderId || invoiceId
            },
            // Invoice items (if provided)
            invoiceDetail: finalInvoiceItems && finalInvoiceItems.length > 0 ?
              finalInvoiceItems.map(item => ({
                invoiceItem: {
                  quantity: item.quantity?.toString() || '1',
                  text: item.name || item.description || `Položka ${item.id}`,
                  unitPrice: (item.unitPrice || (item.price / (item.quantity || 1))).toString(),
                  totalPrice: (item.price || item.totalPrice).toString(),
                  stockItem: item.id ? {
                    code: item.id.toString()
                  } : undefined,
                  // VAT information
                  vatRate: item.vatRate || '21', // Default 21% VAT
                  vatAmount: item.vatAmount || ((item.price || 0) * 0.21).toString()
                }
              })) : 
              // Default single item if no items provided
              [{
                invoiceItem: {
                  quantity: '1',
                  text: `CloudVPS služby - Faktura ${invoiceId}`,
                  unitPrice: amount.toString(),
                  totalPrice: amount.toString(),
                  stockItem: {
                    code: `CLOUDVPS-${invoiceId}`
                  },
                  vatRate: '21',
                  vatAmount: (amount * 0.21).toString()
                }
              }]
          }
        }
      }
    };

    console.log('📋 Pohoda Invoice Sync: Generated XML structure', {
      invoiceId,
      orderId,
      paymentMethod: mapPaymentMethodToPohoda(paymentMethod),
      amount,
      itemsCount: finalInvoiceItems?.length || 1,
      hasCustomer: !!finalCustomerData
    });

    // Convert to XML
    const xml = create(xmlObj).end({ prettyPrint: true });
    
    console.log('🔄 Pohoda Invoice Sync: Sending to Dativery API...', {
      url: `${dativeryApiUrl}/pohoda/import`,
      invoiceId,
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
    
    console.log('✅ Pohoda Invoice Sync: Successfully synchronized', {
      invoiceId,
      orderId,
      transactionId,
      dativeryResponse: result
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice synchronized to Pohoda successfully',
      invoiceId,
      orderId,
      transactionId,
      pohodaInvoiceId: invoiceId,
      paymentMethod: mapPaymentMethodToPohoda(paymentMethod),
      amount,
      currency: currency || 'CZK',
      dativeryResponse: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Pohoda Invoice Sync: Failed to synchronize invoice', {
      invoiceId,
      orderId,
      transactionId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: `Failed to synchronize invoice to Pohoda: ${error.message}`,
      invoiceId,
      orderId,
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
