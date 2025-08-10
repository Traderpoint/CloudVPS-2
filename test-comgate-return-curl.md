# ComGate Return Test - CURL Commands

## 🧪 **Test skutečných ComGate dat pomocí CURL**

Tyto příkazy testují return handler se skutečnými ComGate daty místo fixních 100 CZK.

## 📋 **Test scénáře:**

### **1. Test s minimálními parametry (simuluje ComGate return):**
```bash
curl -i -X GET "http://localhost:3005/api/payments/return?status=success&transactionId=TEST-COMGATE-TX-123&orderId=433&invoiceId=470&paymentMethod=comgate"
```

**Očekávaný výsledek:**
- Status: 302 Redirect
- Location: `http://localhost:3000/payment-success-flow?orderId=433&invoiceId=470&amount=REAL_AMOUNT&currency=CZK&transactionId=TEST-COMGATE-TX-123&paymentId=TEST-COMGATE-TX-123&paymentMethod=comgate`

### **2. Test s amount parametrem (pro porovnání):**
```bash
curl -i -X GET "http://localhost:3005/api/payments/return?status=success&transactionId=TEST-TX-456&orderId=433&invoiceId=470&amount=250&currency=CZK&paymentMethod=comgate"
```

**Očekávaný výsledek:**
- Pokud ComGate API vrátí data: použije se skutečná částka z API
- Pokud ComGate API nevrátí data: použije se amount=250 z URL

### **3. Test s neexistujícím transaction ID:**
```bash
curl -i -X GET "http://localhost:3005/api/payments/return?status=success&transactionId=NONEXISTENT-TX&orderId=433&invoiceId=470&paymentMethod=comgate"
```

**Očekávaný výsledek:**
- ComGate API call selže
- Použijí se fallback hodnoty z URL parametrů

### **4. Test s PayU parametry (pro porovnání):**
```bash
curl -i -X GET "http://localhost:3005/api/payments/return?status=success&mihpayid=PAYU-TX-789&txnid=433&amount=150&paymentMethod=payu"
```

**Očekávaný výsledek:**
- PayU nepoužívá ComGate API
- Použijí se přímo parametry z URL

## 🔍 **Debugging - Co sledovat:**

### **V middleware logs:**
```
🔍 Getting real payment data from ComGate API { transactionId: 'TEST-COMGATE-TX-123' }
✅ Got real ComGate payment data { amount: 299, currency: 'CZK', transactionId: 'TEST-COMGATE-TX-123', refId: '433' }
```

### **V redirect URL:**
```
Location: http://localhost:3000/payment-success-flow?orderId=433&invoiceId=470&amount=299&currency=CZK&transactionId=TEST-COMGATE-TX-123&paymentId=TEST-COMGATE-TX-123&paymentMethod=comgate
```

## 📊 **Test matrix:**

| Test | Transaction ID | Expected Amount Source | Expected Result |
|------|----------------|------------------------|-----------------|
| 1 | TEST-COMGATE-TX-123 | ComGate API | Real amount from API |
| 2 | TEST-TX-456 | ComGate API or URL | API amount or 250 |
| 3 | NONEXISTENT-TX | URL fallback | No amount (undefined) |
| 4 | PAYU-TX-789 | URL only | 150 (from URL) |

## 🎯 **Očekávané chování:**

### **✅ Pro ComGate platby:**
1. Return handler dostane transaction ID
2. Zavolá ComGate API pro získání skutečných dat
3. Použije skutečnou částku z ComGate API
4. Přesměruje na success flow se skutečnými daty

### **✅ Pro ostatní platby:**
1. Return handler použije data z URL parametrů
2. Přesměruje na success flow s URL daty

### **✅ Pro chybné ComGate volání:**
1. ComGate API call selže
2. Použijí se fallback data z URL
3. Přesměruje na success flow s fallback daty

## 🔧 **Implementované změny:**

### **V `/api/payments/return.js`:**
```javascript
// Pro ComGate platby získej skutečná data z API
if (paymentStatus === 'success' && (paymentMethod === 'comgate' || !paymentMethod) && realTransactionId) {
  const ComgateProcessor = require('../../../lib/comgate-processor');
  const comgateProcessor = new ComgateProcessor();
  
  const paymentStatusResult = await comgateProcessor.checkPaymentStatus(realTransactionId);
  
  if (paymentStatusResult.success && paymentStatusResult.paid) {
    realAmount = paymentStatusResult.amount;
    realCurrency = paymentStatusResult.currency;
    realTransactionId = paymentStatusResult.transactionId;
  }
}

// Použij skutečná data v redirect URL
redirectUrl.searchParams.set('amount', realAmount);
redirectUrl.searchParams.set('currency', realCurrency);
redirectUrl.searchParams.set('transactionId', realTransactionId);
```

## 🌐 **Testování v prohlížeči:**

### **Po CURL testu:**
1. **Zkopíruj redirect URL** z CURL response
2. **Otevři URL** v prohlížeči
3. **Zkontroluj payment-success-flow** stránku
4. **Ověř údaje** v payment details sekci

### **Příklad redirect URL:**
```
http://localhost:3000/payment-success-flow?orderId=433&invoiceId=470&amount=299&currency=CZK&transactionId=REAL-COMGATE-TX&paymentId=REAL-COMGATE-TX&paymentMethod=comgate
```

## 📋 **Checklist:**

- [ ] CURL test 1: Minimální parametry
- [ ] CURL test 2: S amount parametrem
- [ ] CURL test 3: Neexistující transaction ID
- [ ] CURL test 4: PayU parametry
- [ ] Zkontrolovat middleware logs
- [ ] Zkontrolovat redirect URL
- [ ] Otevřít success flow v prohlížeči
- [ ] Ověřit skutečné údaje na stránce

## 🎉 **Výsledek:**

**Payment success flow nyní používá skutečné údaje z ComGate API místo fixních 100 CZK!**

- ✅ **ComGate platby**: Skutečná částka z API
- ✅ **Ostatní platby**: Částka z URL parametrů
- ✅ **Fallback**: URL parametry při selhání API
- ✅ **Transparentnost**: Všechny údaje viditelné v logs
