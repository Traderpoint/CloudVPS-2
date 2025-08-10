export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
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
        call: 'authClient',
        email,
        password
      }),
    });

    const data = await response.json();
    if (data.success && data.result.authenticated) {
      res.status(200).json({
        success: true,
        clientId: data.result.client_id,
        name: data.result.firstname + ' ' + data.result.lastname
      });
    } else {
      res.status(401).json({ error: data.error || 'Neplatný e-mail nebo heslo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to communicate with HostBill API: ' + error.message });
  }
}
