export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, companyData } = req.body;
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
        call: 'addClient',
        firstname: name.split(' ')[0],
        lastname: name.split(' ').slice(1).join(' ') || 'Unknown',
        email,
        company: companyData?.obchodniJmeno || '',
        address1: companyData?.adresa || '',
        vat_id: companyData?.dic || '',
        status: 'Pending'
      }),
    });

    const data = await response.json();
    if (data.success) {
      res.status(200).json({ clientId: data.result.id });
    } else {
      res.status(400).json({ error: data.error || 'Failed to create client' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to communicate with HostBill API: ' + error.message });
  }
}
