/**
 * Kompletní PayU Payment Flow Test
 * 1. Vytvoří objednávku přes middleware
 * 2. Inicializuje PayU platbu
 * 3. Simuluje PayU callback
 * 4. Ověří výsledek
 */

const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

// Ignore SSL certificate errors for test environment
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Konfigurace
const CLOUDVPS_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';
const HOSTBILL_URL = 'https://vps.kabel1it.cz';
const PAYU_MODULE_ID = '10';
const MERCHANT_KEY = 'QyT13U';
const MERCHANT_SALT = 'eCwWELxi'; // PayU test salt

// Test data
const testOrderData = {
  customer: {
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@test.cz',
    phone: '+420123456789',
    address: 'Testovací 123',
    city: 'Praha',
    postalCode: '12000',
    country: 'CZ',
    company: 'Test s.r.o.'
  },
  items: [
    {
      productId: '1',
      name: 'VPS Basic',
      price: '299',
      cycle: 'm',
      quantity: 1,
      configOptions: {
        os: 'ubuntu-20.04',
        ram: '2GB',
        cpu: '1 vCPU',
        storage: '20GB SSD',
        bandwidth: '1TB'
      }
    }
  ],
  addons: [],
  affiliate: null,
  payment: {
    method: 'payu',
    total: 299
  },
  total: 299
};

/**
 * Generuje PayU hash pro callback
 */
function generatePayUHash(data, salt) {
  const hashString = [
    salt,
    data.status,
    '', '', '', '', '',
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

  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Krok 1: Vytvoří objednávku
 */
async function createOrder() {
  console.log('📦 Krok 1: Vytváření objednávky...');
  
  try {
    const response = await axios.post(`${CLOUDVPS_URL}/api/orders/create`, testOrderData, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));

    if (!response.data.success) {
      throw new Error(`Order creation failed: ${response.data.error}`);
    }

    // Extract first order from orders array
    const firstOrder = response.data.orders && response.data.orders[0];
    if (!firstOrder) {
      throw new Error('No orders found in response');
    }

    console.log('✅ Objednávka vytvořena:');
    console.log('  - Order ID:', firstOrder.hostbillOrderId);
    console.log('  - Invoice ID:', firstOrder.invoiceId);
    console.log('  - Total:', firstOrder.price, firstOrder.currency);

    return {
      orderId: firstOrder.hostbillOrderId,
      invoiceId: firstOrder.invoiceId,
      total: parseInt(firstOrder.price)
    };
  } catch (error) {
    console.error('❌ Chyba při vytváření objednávky:', error.message);
    throw error;
  }
}

/**
 * Krok 2: Inicializuje PayU platbu
 */
async function initializePayment(orderData) {
  console.log('\n💳 Krok 2: Inicializace PayU platby...');
  
  try {
    const paymentData = {
      orderId: orderData.orderId,
      invoiceId: orderData.invoiceId,
      method: 'payu',
      amount: orderData.total,
      currency: 'CZK'
    };

    const response = await axios.post(`${CLOUDVPS_URL}/api/payments/initialize`, paymentData, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    console.log('📄 Payment response:', JSON.stringify(response.data, null, 2));

    if (!response.data.success) {
      throw new Error(`Payment initialization failed: ${response.data.error}`);
    }

    const payment = response.data.payment || response.data;
    console.log('✅ Platba inicializována:');
    console.log('  - Payment ID:', payment.paymentId);
    console.log('  - Payment URL:', payment.paymentUrl);
    console.log('  - Redirect required:', payment.redirectRequired);

    return payment;
  } catch (error) {
    console.error('❌ Chyba při inicializaci platby:', error.message);
    throw error;
  }
}

/**
 * Krok 3: Simuluje PayU callback
 */
async function simulatePayUCallback(orderData, paymentData) {
  console.log('\n🔔 Krok 3: Simulace PayU callback...');
  
  try {
    // Generuj unique transaction data
    const txnid = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const mihpayid = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const bank_ref_no = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    // PayU callback data
    const callbackData = {
      mihpayid: mihpayid,
      mode: 'PAYU',
      status: 'success',
      key: MERCHANT_KEY,
      txnid: txnid,
      amount: orderData.total.toString() + '.00',
      addedon: new Date().toISOString().replace('T', ' ').substr(0, 19),
      
      productinfo: 'VPS Basic',
      firstname: testOrderData.customer.firstName,
      lastname: testOrderData.customer.lastName,
      email: testOrderData.customer.email,
      phone: testOrderData.customer.phone,
      
      address1: testOrderData.customer.address,
      address2: '',
      city: testOrderData.customer.city,
      state: '',
      country: testOrderData.customer.country,
      zipcode: testOrderData.customer.postalCode,
      
      udf1: orderData.orderId.toString(),
      udf2: orderData.invoiceId.toString(),
      udf3: 'CloudVPS',
      udf4: 'Test',
      udf5: 'Simulation',
      
      payment_source: 'payu',
      PG_TYPE: 'PAYU-PG',
      error: 'E000',
      error_Message: 'No Error',
      net_amount_debit: orderData.total.toString() + '.00',
      discount: '0.00',
      
      bank_ref_no: bank_ref_no,
      bank_ref_num: bank_ref_no,
      bankcode: 'PAYU',
      
      unmappedstatus: 'captured',
      
      surl: 'http://localhost:3000/payment-return',
      furl: 'http://localhost:3000/payment-cancel',
      curl: 'http://localhost:3000/payment-cancel',
      
      card_token: '',
      card_no: '',
      
      field0: '', field1: '', field2: '', field3: '', field4: '',
      field5: '', field6: '', field7: '', field8: '',
      field9: 'Transaction Completed Successfully',
      
      offer_key: '',
      offer_availed: ''
    };

    // Generuj hash
    callbackData.hash = generatePayUHash(callbackData, MERCHANT_SALT);

    console.log('📤 Odesílám callback:');
    console.log('  - Transaction ID:', callbackData.txnid);
    console.log('  - PayU ID:', callbackData.mihpayid);
    console.log('  - Amount:', callbackData.amount, 'CZK');
    console.log('  - Status:', callbackData.status);

    // Odešli callback na HostBill
    const callbackUrl = `${HOSTBILL_URL}/index.php?done=true&cmd=callback&module=${PAYU_MODULE_ID}`;
    
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

    console.log('✅ Callback úspěšně odeslán!');
    console.log('  - Response status:', response.status);
    
    return {
      txnid: callbackData.txnid,
      mihpayid: callbackData.mihpayid,
      bank_ref_no: callbackData.bank_ref_no
    };
  } catch (error) {
    console.error('❌ Chyba při odesílání callback:', error.message);
    throw error;
  }
}

/**
 * Krok 4: Ověří výsledek
 */
async function verifyResult(orderData) {
  console.log('\n🔍 Krok 4: Ověření výsledku...');
  
  try {
    // Počkej chvilku na zpracování
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Ověř status faktury
    const response = await axios.get(`${HOSTBILL_URL}/admin/api.php`, {
      params: {
        api_id: 'adcdebb0e3b6f583052d',
        api_key: '341697c41aeb1c842f0d',
        call: 'getInvoice',
        id: orderData.invoiceId
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    if (response.data && response.data.status) {
      console.log('📋 Výsledek ověření:');
      console.log('  - Invoice status:', response.data.status);
      console.log('  - Invoice total:', response.data.total);
      console.log('  - Payment status:', response.data.paid || 'Not paid');
      console.log('  - Date paid:', response.data.datepaid || 'Not paid');
      
      if (response.data.status === 'Paid' || response.data.paid === '1') {
        console.log('\n🎉 ÚSPĚCH! Kompletní PayU flow funguje správně!');
        console.log('✅ Objednávka vytvořena');
        console.log('✅ Platba inicializována');
        console.log('✅ Callback zpracován');
        console.log('✅ Faktura označena jako zaplacená');
        return true;
      } else {
        console.log('\n⚠️ Faktura ještě není označena jako zaplacená');
        console.log('Možné příčiny:');
        console.log('- Nesprávný PayU salt pro hash generování');
        console.log('- Chyba v callback URL nebo datech');
        console.log('- HostBill PayU modul není správně nakonfigurován');
        return false;
      }
    } else {
      console.log('❌ Nepodařilo se získat status faktury');
      return false;
    }
  } catch (error) {
    console.error('❌ Chyba při ověřování výsledku:', error.message);
    return false;
  }
}

/**
 * Hlavní test funkce
 */
async function runCompleteTest() {
  console.log('🚀 Kompletní PayU Payment Flow Test');
  console.log('=====================================\n');

  try {
    // Krok 1: Vytvoř objednávku
    const orderData = await createOrder();

    // Krok 2: Inicializuj platbu
    const paymentData = await initializePayment(orderData);

    // Krok 3: Simuluj PayU callback
    const callbackResult = await simulatePayUCallback(orderData, paymentData);

    // Krok 4: Ověř výsledek
    const success = await verifyResult(orderData);

    console.log('\n📊 Shrnutí testu:');
    console.log('================');
    console.log('Order ID:', orderData.orderId);
    console.log('Invoice ID:', orderData.invoiceId);
    console.log('Payment ID:', paymentData.paymentId);
    console.log('Transaction ID:', callbackResult.txnid);
    console.log('Test result:', success ? '✅ ÚSPĚCH' : '❌ NEÚSPĚCH');

    if (!success) {
      console.log('\n💡 Tip: Zkontrolujte PayU salt v konfiguraci');
      console.log('Aktuální salt v kódu: "your_salt_here"');
      console.log('Skutečný salt najdete v HostBill PayU modulu');
    }

  } catch (error) {
    console.error('\n💥 Test selhal:', error.message);
    process.exit(1);
  }
}

// Spusť test
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = {
  runCompleteTest,
  createOrder,
  initializePayment,
  simulatePayUCallback,
  verifyResult
};
