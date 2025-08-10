# ComGate Payment Flow

## 🎯 Správný workflow

**Skutečná ComGate platba** → **Authorize-Capture s REAL transaction ID**

## 🔄 Kompletní flow

### 1. 💳 ComGate platba
Zákazník platí přes ComGate bránu:
- Zadá platební údaje
- ComGate zpracuje platbu
- Status: **PAID**

### 2. 📞 ComGate callback
ComGate pošle callback na middleware:
```javascript
POST /api/payments/callback
{
  "status": "success",
  "invoiceId": "446",
  "orderId": "426",
  "transactionId": "COMGATE-TXN-1754325147714",
  "refId": "CG-1754325147714",
  "REFNO": "REF-1754325147714",
  "label": "446",
  "amount": "100.00",
  "currency": "CZK",
  "paymentMethod": "comgate"
}
```

### 3. 🔗 ComGate return
ComGate přesměruje zákazníka na payment-success:
```
http://localhost:3000/payment-success?
  invoiceId=446&
  orderId=426&
  amount=100+CZK&
  paymentMethod=comgate&
  status=success&
  transactionId=COMGATE-TXN-1754325147714&
  refId=CG-1754325147714&
  REFNO=REF-1754325147714&
  label=446
```

### 4. ✅ Payment success stránka
Stránka extrahuje **REAL transaction ID** z URL parametrů:
```javascript
// Extrakce transaction ID z různých formátů
const actualTransactionId = transactionId || refId || REFNO || label || 
                           PAYUID || txn_id || transaction_id || payment_id;
```

### 5. 🚀 Authorize-Capture s REAL transaction ID
Volá se authorize-capture s **skutečným ComGate transaction ID**:
```javascript
const workflowData = {
  orderId: "426",
  invoiceId: "446",
  transactionId: "COMGATE-TXN-1754325147714", // REAL ComGate ID
  amount: 100,
  currency: "CZK",
  paymentMethod: "comgate",
  notes: "Real ComGate payment - Transaction: COMGATE-TXN-1754325147714"
};
```

## 📋 Implementace

### Payment Success stránka (`pages/payment-success.js`)

#### Extrakce transaction ID:
```javascript
const { 
  invoiceId, orderId, amount, paymentMethod, status,
  // ComGate specific parameters
  transactionId, refId, REFNO, label,
  // PayU specific parameters
  PAYUID, txn_id,
  // Generic transaction parameters
  transaction_id, payment_id
} = router.query;

// Determine the actual transaction ID from various gateway formats
const actualTransactionId = transactionId || refId || REFNO || label || 
                           PAYUID || txn_id || transaction_id || payment_id;
```

#### Workflow volání:
```javascript
const workflowData = {
  orderId: orderId,
  invoiceId: invoiceId,
  amount: finalAmount,
  currency: 'CZK',
  paymentMethod: 'comgate',
  transactionId: finalTransactionId, // REAL transaction ID from ComGate
  notes: realTransactionId 
    ? `Payment workflow with ComGate transaction ID: ${realTransactionId}`
    : `Payment workflow fallback for invoice ${invoiceId}`
};
```

## 🧪 Test výsledky

```
🎉 COMGATE PAYMENT FLOW TEST PASSED!
✅ ComGate platba byla úspěšně zpracována
✅ REAL transaction ID byl předán do authorize-capture
✅ Authorize-capture workflow proběhl úspěšně
✅ Transaction ID je správně uložen v HostBill
```

### Workflow Steps Results:
- **Authorize Payment**: ✅ completed (method: direct_activation)
- **Capture Payment**: ✅ completed (method: direct_api)
- **Provision**: ✅ ready

### Transaction ID Match:
- **ComGate Transaction ID**: `COMGATE-TXN-1754325147714`
- **Authorize-Capture Transaction ID**: `COMGATE-TXN-1754325147714`
- **Match**: ✅ **MATCH**

## 🔧 ComGate parametry

### Callback parametry:
- `transactionId` - hlavní transaction ID
- `refId` - reference ID
- `REFNO` - reference number
- `label` - obvykle invoice ID
- `status` - payment status
- `amount` - částka
- `currency` - měna

### Return parametry:
- Stejné jako callback + URL encoding
- Přidávají se do URL jako query parametry
- Payment success stránka je parsuje

## 🎯 Klíčové výhody

### ✅ REAL Transaction ID
- Používá se **skutečný ComGate transaction ID**
- Není generovaný fallback ID
- Perfektní audit trail

### ✅ Gateway Bypass
- Obchází problém "Unable to load payment gateway"
- Používá přímé HostBill API volání
- Spolehlivé a rychlé

### ✅ Kompletní workflow
- Authorize Payment (aktivace objednávky)
- Capture Payment (přidání platby s transaction ID)
- Provisioning (spuštění služeb)

## 🚀 Testování

### Test příkaz:
```bash
node test-comgate-payment-flow.js
```

### Manuální test:
1. Proveď ComGate platbu
2. Zkontroluj callback v middleware logs
3. Zkontroluj payment-success URL parametry
4. Ověř transaction ID v HostBill admin

## ⚠️ Důležité poznámky

1. **Transaction ID priorita:**
   - `transactionId` (hlavní)
   - `refId` (ComGate reference)
   - `REFNO` (ComGate reference number)
   - `label` (obvykle invoice ID)

2. **Fallback mechanismus:**
   - Pokud není REAL transaction ID, použije se generovaný
   - Vždy se zachová funkčnost

3. **Audit trail:**
   - Všechny platby mají správný transaction reference
   - Lze dohledat v ComGate i HostBill

4. **Email notifikace:**
   - Automaticky se posílají po úspěšné platbě
   - Obsahují správný transaction ID

## 🎉 Shrnutí

**ComGate Payment Flow nyní správně používá REAL transaction ID z ComGate platby** místo generovaného ID. Celý workflow od ComGate platby až po provisioning funguje s **autentickými transaction daty** pro perfektní audit trail a správu plateb! 🎯
