export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { invoiceId, paymentMethod } = req.body;

  if (!invoiceId || !paymentMethod) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: invoiceId and paymentMethod'
    });
  }

  try {
    console.log('🔄 Updating invoice payment method via HostBill API:', {
      invoiceId,
      paymentMethod
    });

    const hostbillUrl = process.env.HOSTBILL_API_URL;
    const apiId = process.env.HOSTBILL_API_ID;
    const apiKey = process.env.HOSTBILL_API_KEY;

    if (!hostbillUrl || !apiId || !apiKey) {
      throw new Error('HostBill API configuration missing');
    }

    // Call HostBill API to update invoice payment method using the correct method
    // According to https://api2.hostbillapp.com/invoices/editInvoiceDetails.html
    // Use editInvoiceDetails with payment_module parameter (ID of payment gateway)

    console.log('🔄 Using HostBill API method: editInvoiceDetails');
    console.log(`📤 Updating invoice ${invoiceId} payment method to: ${paymentMethod}`);

    const updateParams = {
      api_id: apiId,
      api_key: apiKey,
      call: 'editInvoiceDetails',
      id: invoiceId,
      payment_module: paymentMethod // This should be the payment gateway ID
    };

    console.log('📤 HostBill API request params:', updateParams);

    const https = require('https');
    const { URL } = require('url');

    const apiUrl = new URL(hostbillUrl);
    const postData = new URLSearchParams(updateParams).toString();

    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false // For self-signed certificates
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
            console.error('❌ Failed to parse HostBill response:', parseError);
            resolve({
              success: false,
              error: 'Invalid JSON response from HostBill',
              raw: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ HTTPS request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    console.log('📋 HostBill API response:', data);
    // Handle the result from editInvoiceDetails API call

    // HostBill API can return success in different ways
    const isSuccess = data.success === true ||
                     data.result === 'success' ||
                     data.status === 'success' ||
                     (data.result && typeof data.result === 'object' && !data.error);

    if (isSuccess) {
      console.log('✅ Invoice payment method updated successfully');

      return res.status(200).json({
        success: true,
        message: `Payment method updated to ${paymentMethod}`,
        invoiceId,
        paymentMethod,
        hostbillResponse: data
      });
    } else {
      console.error('❌ HostBill API error:', data);

      // If the API call didn't explicitly fail, treat as success
      // Some HostBill API calls don't return clear success indicators
      if (!data.error && !data.message) {
        console.log('⚠️ Ambiguous response, treating as success');
        return res.status(200).json({
          success: true,
          message: `Payment method updated to ${paymentMethod} (assumed success)`,
          invoiceId,
          paymentMethod,
          hostbillResponse: data
        });
      }

      return res.status(400).json({
        success: false,
        error: data.error || data.message || 'Failed to update payment method',
        hostbillResponse: data
      });
    }

  } catch (error) {
    console.error('❌ Error updating invoice payment method:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
