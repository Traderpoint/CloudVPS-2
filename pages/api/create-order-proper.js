// Proper order creation API according to your example
// Creates ONE order with multiple products using HostBill addOrder API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customer, items } = req.body;

  // Validation
  if (!customer?.email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing customer email or items data' });
  }

  console.log('🛒 Creating proper order with items:', items);

  // HostBill API configuration
  const HB_API_URL = process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php';
  const HB_API_ID = process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d';
  const HB_API_KEY = process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d';

  try {
    // Build parameters exactly like in your example
    const params = new URLSearchParams({
      call: 'addOrder',
      api_id: HB_API_ID,
      api_key: HB_API_KEY,
      client_email: customer.email,
      gateway: 'banktransfer',        // Payment gateway
      send_email: 0,                  // Don't send email (test mode)
      status: 'pending'               // Order status
    });

    // Add each product as products[product_id]=quantity (your format)
    items.forEach((item) => {
      // Map CloudVPS product ID to HostBill product ID
      const hostbillProductId = mapProductId(item.productId);
      
      console.log('📦 Adding product:', {
        cloudVpsId: item.productId,
        hostbillId: hostbillProductId,
        quantity: item.quantity || 1,
        name: item.name
      });

      params.append(`products[${hostbillProductId}]`, item.quantity || 1);
      
      // Add configuration options if available
      if (item.configOptions) {
        Object.keys(item.configOptions).forEach(key => {
          params.append(`configoptions[${hostbillProductId}][${key}]`, item.configOptions[key]);
        });
      }
    });

    console.log('📤 Sending to HostBill API...');
    console.log('URL:', HB_API_URL);
    console.log('Params:', params.toString());

    // Call HostBill API
    const apiResponse = await fetch(HB_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: params.toString()
    });

    const result = await apiResponse.json();
    console.log('📥 HostBill response:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('✅ Order created successfully!');
      
      return res.status(200).json({ 
        success: true, 
        order_id: result.order_id,
        invoice_id: result.invoice_id,
        invoice_url: result.invoice_url,
        message: 'Order created successfully with all products',
        items_count: items.length,
        hostbill_result: result
      });
    } else {
      console.log('❌ HostBill API failed:', result?.error || result?.message || 'Unknown error');
      
      return res.status(500).json({ 
        error: result?.error || result?.message || 'Order creation failed',
        details: result
      });
    }

  } catch (error) {
    console.error('💥 API Error:', error.message);
    
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}

// Product mapping function (CloudVPS ID -> HostBill ID)
function mapProductId(cloudVpsProductId) {
  const mapping = {
    '1': '5',   // VPS Basic
    '2': '10',  // VPS Pro  
    '3': '11',  // VPS Premium
    '4': '12'   // VPS Enterprise
  };
  
  return mapping[cloudVpsProductId] || cloudVpsProductId;
}
