export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, email } = req.body;
  const apiId = process.env.HOSTBILL_API_ID;
  const apiKey = process.env.HOSTBILL_API_KEY;
  const hostbillUrl = process.env.HOSTBILL_URL;

  try {
    const response = await fetch(`${hostbillUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_id: apiId,
        api_key: apiKey,
        call: 'sendClientEmail',
        client_id: clientId,
        email_type: 'client_welcome',
        to: email
      }),
    });

    const data = await response.json();
    if (data.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: data.error || 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to communicate with HostBill API: ' + error.message });
  }
}
