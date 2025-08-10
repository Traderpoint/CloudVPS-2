// HostBill Affiliates API - Direct connection
// Provides affiliate data for CloudVPS frontend

import https from 'https';
import { URL } from 'url';

const HOSTBILL_CONFIG = {
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 CloudVPS → HostBill: Getting affiliates');

    const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);
    const postData = new URLSearchParams({
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      call: 'getAffiliates'
    }).toString();

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

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (response.statusCode !== 200) {
      throw new Error(`HostBill API responded with status: ${response.statusCode}`);
    }

    const result = JSON.parse(response.data);
    
    if (!result.success) {
      throw new Error(`HostBill API error: ${result.error || 'Unknown error'}`);
    }

    console.log('✅ CloudVPS → HostBill: Affiliates retrieved');
    console.log('👥 Affiliates count:', result.affiliates?.length || 0);

    res.json({
      success: true,
      affiliates: result.affiliates || [],
      count: result.affiliates?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CloudVPS → HostBill: Affiliates error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get affiliates',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
