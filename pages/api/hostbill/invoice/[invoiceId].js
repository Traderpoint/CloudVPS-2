export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { invoiceId } = req.query;

  if (!invoiceId || invoiceId === 'unknown') {
    return res.status(400).json({
      success: false,
      error: 'Invoice ID is required'
    });
  }

  try {
    console.log(`Loading HostBill invoice data for ID: ${invoiceId}`);

    const hostbillUrl = process.env.HOSTBILL_URL || 'https://vps.kabel1it.cz';
    const apiId = process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d';
    const apiKey = process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d';

    const formData = new URLSearchParams({
      api_id: apiId,
      api_key: apiKey,
      call: 'getInvoiceDetails',
      id: invoiceId
    });

    const https = require('https');
    const { URL } = require('url');

    const apiUrl = new URL(`${hostbillUrl}/admin/api.php`);
    const postData = formData.toString();

    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } catch (parseError) {
            reject(new Error(`Failed to parse JSON response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTPS request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });

    if (data.error) {
      throw new Error(`HostBill API error: ${data.error}`);
    }

    let invoice = null;
    if (data.invoice) {
      invoice = {
        ...data.invoice,
        transactions: data.transactions || []
      };
    } else if (data && !data.error) {
      invoice = data;
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
        invoiceId
      });
    }

    const invoiceData = {
      id: invoice.id,
      number: invoice.number || `INV-${invoice.id}`,
      status: invoice.status,
      amount: parseFloat(invoice.grandtotal || invoice.total || invoice.subtotal || 0),
      currency: invoice.currency || 'CZK',
      dateCreated: invoice.date,
      dateDue: invoice.duedate,
      datePaid: invoice.datepaid,
      clientInfo: {
        firstName: invoice.client?.firstname || invoice.firstname,
        lastName: invoice.client?.lastname || invoice.lastname,
        companyName: invoice.client?.companyname || invoice.companyname,
        clientId: invoice.client_id || invoice.client?.id
      },
      subtotal: parseFloat(invoice.subtotal || 0),
      tax: parseFloat(invoice.tax || 0),
      taxRate: parseFloat(invoice.taxrate || 0),
      credit: parseFloat(invoice.credit || 0),
      paymentMethod: invoice.payment_module || invoice.paymentmethod,
      items: invoice.items || [],
      transactions: invoice.transactions || [],
      autoMarkedAsPaid: invoice.status === 'Paid' && (!invoice.transactions || invoice.transactions.length === 0),
      debugInfo: {
        originalTotal: invoice.total,
        originalGrandtotal: invoice.grandtotal,
        originalSubtotal: invoice.subtotal,
        transactionCount: invoice.transactions ? invoice.transactions.length : 0,
        hasTransactions: !!invoice.transactions,
        transactionsType: typeof invoice.transactions,
        allInvoiceFields: Object.keys(invoice)
      }
    };

    return res.status(200).json({
      success: true,
      invoice: invoiceData,
      invoiceId
    });

  } catch (error) {
    console.error(`Error loading HostBill invoice data for ${invoiceId}:`, error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load HostBill invoice data',
      invoiceId
    });
  }
}
