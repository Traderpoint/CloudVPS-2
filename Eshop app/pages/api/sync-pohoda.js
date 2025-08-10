import { create } from 'xmlbuilder2';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, orderId, cartItems, totalPrice, companyData, email, name } = req.body;
  const dativeryApiKey = process.env.DATIVERY_API_KEY;
  const dativeryApiUrl = process.env.DATIVERY_API_URL;
  const pohodaDataFile = process.env.POHODA_DATA_FILE;
  const pohodaUsername = process.env.POHODA_USERNAME;
  const pohodaPassword = process.env.POHODA_PASSWORD;

  try {
    const xmlObj = {
      dataPack: {
        '@version': '2.0',
        '@application': 'Next.js E-shop',
        dataPackItem: {
          '@version': '2.0',
          order: {
            '@action': 'create',
            orderHeader: {
              orderType: 'receivedOrder',
              numberOrder: orderId,
              date: new Date().toISOString().split('T')[0],
              partnerIdentity: {
                name: companyData.obchodniJmeno,
                company: companyData.obchodniJmeno,
                ico: companyData.ico,
                dic: companyData.dic,
                address: {
                  street: companyData.adresa.split(', ')[1] || '',
                  city: companyData.adresa.split(', ')[0] || '',
                },
                email
              },
              totalPrice: totalPrice.toString(),
              currency: 'CZK'
            },
            orderDetail: cartItems.map(item => ({
              orderItem: {
                quantity: item.quantity.toString(),
                text: item.name,
                unitPrice: (item.price / item.quantity).toString(),
                totalPrice: (item.price * item.quantity).toString(),
                stockItem: {
                  code: item.id.toString()
                }
              }
            }))
          }
        }
      }
    };

    const xml = create(xmlObj).end({ prettyPrint: true });

    const response = await fetch(`${dativeryApiUrl}/pohoda/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Bearer ${dativeryApiKey}`
      },
      body: xml,
      credentials: {
        username: pohodaUsername,
        password: pohodaPassword,
        dataFile: pohodaDataFile
      }
    });

    const result = await response.json();
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: result.error || 'Failed to sync with Pohoda' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to communicate with Dativery/Pohoda API: ' + error.message });
  }
}
