export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, cartItems, totalPrice } = req.body;
  const apiId = process.env.HOSTBILL_API_ID;
  const apiKey = process.env.HOSTBILL_API_KEY;
  const hostbillUrl = process.env.HOSTBILL_URL;

  try {
    const items = cartItems.map(item => ({
      item_id: item.id,
      quantity: item.quantity,
      description: item.name,
      price: item.price
    }));

    const response = await fetch(`${hostbillUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_id: apiId,
        api_key: apiKey,
        call: 'addOrder',
        client_id: clientId,
        total: totalPrice,
        items: JSON.stringify(items),
        status: 'Pending'
      }),
    });

    const data = await response.json();
    if (data.success) {
      res.status(200).json({ orderId: data.result.id });
    } else {
      res.status(400).json({ error: data.error || 'Failed to create order' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to communicate with HostBill API: ' + error.message });
  }
}
