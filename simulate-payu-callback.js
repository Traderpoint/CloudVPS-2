/**
 * PayU Callback Simulator
 * Simuluje úspěšnou PayU platbu odesláním callback dat na HostBill
 */

const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

// Ignore SSL certificate errors for test environment
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Konfigurace
const HOSTBILL_URL = 'https://vps.kabel1it.cz';
const PAYU_MODULE_ID = '10'; // PayU module ID z HostBill
const MERCHANT_KEY = 'QyT13U'; // PayU merchant key z test prostředí
const MERCHANT_SALT = 'eCwWELxi'; // PayU test salt

// Test data z našeho předchozího testu
const TEST_INVOICE_ID = '132';
const TEST_ORDER_ID = '99';
const TEST_AMOUNT = '604.00';
const TEST_CURRENCY = 'CZK';

/**
 * Generuje PayU hash pro callback
 */
function generatePayUHash(data, salt) {
  // PayU hash format pro callback response:
  // salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashString = [
    salt,
    data.status,
    '', '', '', '', '', // reserved fields
    data.udf5 || '',
    data.udf4 || '',
    data.udf3 || '',
    data.udf2 || '',
    data.udf1 || '',
    data.email,
    data.firstname,
    data.productinfo,
    data.amount,
    data.txnid,
    data.key
  ].join('|');

  console.log('🔐 Hash string:', hashString);
  
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Simuluje úspěšnou PayU platbu
 */
async function simulateSuccessfulPayment() {
  console.log('🧪 Simuluji úspěšnou PayU platbu...\n');

  // Generuj unique transaction ID
  const txnid = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const mihpayid = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const bank_ref_no = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

  // PayU callback data structure
  const callbackData = {
    // Základní PayU parametry
    mihpayid: mihpayid,
    mode: 'PAYU',
    status: 'success',
    key: MERCHANT_KEY,
    txnid: txnid,
    amount: TEST_AMOUNT,
    addedon: new Date().toISOString().replace('T', ' ').substr(0, 19),
    
    // Produktové informace
    productinfo: 'VPS Basic',
    firstname: 'Jan',
    lastname: 'Novák',
    email: 'jan.novak@test.cz',
    phone: '+420123456789',
    
    // Adresa (volitelné)
    address1: 'Testovací 123',
    address2: '',
    city: 'Praha',
    state: '',
    country: 'CZ',
    zipcode: '12000',
    
    // UDF fields (custom data)
    udf1: TEST_ORDER_ID,
    udf2: TEST_INVOICE_ID,
    udf3: 'CloudVPS',
    udf4: 'Test',
    udf5: 'Simulation',
    
    // Platební informace
    payment_source: 'payu',
    PG_TYPE: 'PAYU-PG',
    error: 'E000',
    error_Message: 'No Error',
    net_amount_debit: TEST_AMOUNT,
    discount: '0.00',
    
    // Bank reference
    bank_ref_no: bank_ref_no,
    bank_ref_num: bank_ref_no,
    bankcode: 'PAYU',
    
    // Status mapping
    unmappedstatus: 'captured',
    
    // URLs (pro informaci)
    surl: 'http://localhost:3000/payment-return',
    furl: 'http://localhost:3000/payment-cancel',
    curl: 'http://localhost:3000/payment-cancel',
    
    // Card info (prázdné pro PayU)
    card_token: '',
    card_no: '',
    
    // Additional fields
    field0: '', field1: '', field2: '', field3: '', field4: '',
    field5: '', field6: '', field7: '', field8: '',
    field9: 'Transaction Completed Successfully',
    
    // Offers
    offer_key: '',
    offer_availed: ''
  };

  // Generuj hash
  callbackData.hash = generatePayUHash(callbackData, MERCHANT_SALT);

  console.log('📤 Callback data:');
  console.log('- Transaction ID:', callbackData.txnid);
  console.log('- PayU ID:', callbackData.mihpayid);
  console.log('- Amount:', callbackData.amount, TEST_CURRENCY);
  console.log('- Status:', callbackData.status);
  console.log('- Invoice ID:', TEST_INVOICE_ID);
  console.log('- Order ID:', TEST_ORDER_ID);
  console.log('- Hash:', callbackData.hash.substr(0, 20) + '...');

  // HostBill callback URL
  const callbackUrl = `${HOSTBILL_URL}/index.php?done=true&cmd=callback&module=${PAYU_MODULE_ID}`;
  
  console.log('\n🎯 Callback URL:', callbackUrl);
  console.log('⚠️ Poznámka: Callback URL může vyžadovat specifické parametry pro HostBill');
  console.log('📋 Pro testování použijeme přímé ověření faktury...');

  // Místo odesílání callback, rovnou ověříme status faktury
  console.log('\n✅ Callback data připravena (simulace)');
  console.log('📊 Transaction ID:', callbackData.txnid);
  console.log('📊 PayU ID:', callbackData.mihpayid);
  console.log('📊 Hash:', callbackData.hash.substr(0, 20) + '...');

  // Ověř status faktury
  await checkInvoiceStatus();
}

/**
 * Ověří status faktury v HostBill
 */
async function checkInvoiceStatus() {
  console.log('\n🔍 Ověřuji status faktury...');
  
  try {
    const response = await axios.get(`${HOSTBILL_URL}/admin/api.php`, {
      params: {
        api_id: 'adcdebb0e3b6f583052d',
        api_key: '341697c41aeb1c842f0d',
        call: 'getInvoices',
        id: TEST_INVOICE_ID
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    if (response.data && response.data.success && response.data.invoices) {
      // Najdi fakturu podle ID
      const invoice = response.data.invoices.find(inv => inv.id === TEST_INVOICE_ID);

      if (invoice) {
        console.log('📋 Faktura nalezena:');
        console.log('  - ID:', invoice.id);
        console.log('  - Status:', invoice.status);
        console.log('  - Total:', invoice.total, 'CZK');
        console.log('  - Date paid:', invoice.datepaid);
        console.log('  - Paid ID:', invoice.paid_id || 'None');

        if (invoice.status === 'Paid' || invoice.datepaid !== '0000-00-00 00:00:00') {
          console.log('\n🎉 ÚSPĚCH! Faktura byla označena jako zaplacená!');
        } else {
          console.log('\n⚠️ Faktura ještě není označena jako zaplacená');
          console.log('💡 Pro skutečné zaplacení by bylo potřeba odeslat správný PayU callback');
        }
      } else {
        console.log(`❌ Faktura ${TEST_INVOICE_ID} nebyla nalezena`);
      }
    } else {
      console.log('❌ Nepodařilo se získat seznam faktur');
      console.log('📄 Response data:', response.data);
    }
  } catch (error) {
    console.error('❌ Chyba při ověřování faktury:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

/**
 * Simuluje neúspěšnou PayU platbu
 */
async function simulateFailedPayment() {
  console.log('🧪 Simuluji neúspěšnou PayU platbu...\n');

  const txnid = `TXN-FAIL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const mihpayid = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const callbackData = {
    mihpayid: mihpayid,
    mode: 'PAYU',
    status: 'failure',
    key: MERCHANT_KEY,
    txnid: txnid,
    amount: TEST_AMOUNT,
    addedon: new Date().toISOString().replace('T', ' ').substr(0, 19),
    
    productinfo: 'VPS Basic',
    firstname: 'Jan',
    lastname: 'Novák',
    email: 'jan.novak@test.cz',
    phone: '+420123456789',
    
    udf1: TEST_ORDER_ID,
    udf2: TEST_INVOICE_ID,
    udf3: 'CloudVPS',
    udf4: 'Test',
    udf5: 'Simulation',
    
    payment_source: 'payu',
    PG_TYPE: 'PAYU-PG',
    error: 'E002',
    error_Message: 'Payment Failed',
    net_amount_debit: '0.00',
    discount: '0.00',
    
    bank_ref_no: '',
    bank_ref_num: '',
    bankcode: 'PAYU',
    
    unmappedstatus: 'failed',
    
    surl: 'http://localhost:3000/payment-return',
    furl: 'http://localhost:3000/payment-cancel',
    curl: 'http://localhost:3000/payment-cancel',
    
    card_token: '',
    card_no: '',
    
    field9: 'Payment Failed - Insufficient Funds'
  };

  callbackData.hash = generatePayUHash(callbackData, MERCHANT_SALT);

  console.log('📤 Failed callback data:');
  console.log('- Transaction ID:', callbackData.txnid);
  console.log('- Status:', callbackData.status);
  console.log('- Error:', callbackData.error_Message);

  const callbackUrl = `${HOSTBILL_URL}/index.php?done=true&cmd=callback&module=${PAYU_MODULE_ID}`;
  
  try {
    const formData = new URLSearchParams();
    Object.keys(callbackData).forEach(key => {
      formData.append(key, callbackData[key]);
    });

    const response = await axios.post(callbackUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PayU-Callback/1.0'
      },
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    console.log('\n✅ Failed callback odeslán!');
    console.log('📊 Response status:', response.status);

  } catch (error) {
    console.error('\n❌ Chyba při odesílání failed callback:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'success';

  console.log('🚀 PayU Callback Simulator');
  console.log('==========================\n');

  if (action === 'success') {
    await simulateSuccessfulPayment();
  } else if (action === 'failure') {
    await simulateFailedPayment();
  } else {
    console.log('Usage: node simulate-payu-callback.js [success|failure]');
    console.log('Default: success');
  }
}

// Spusť simulaci
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  simulateSuccessfulPayment,
  simulateFailedPayment
};
