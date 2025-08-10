# Test ComGate Return URLs

## 🧪 **TEST URLs PRO SIMULACI COMGATE RETURN**

### **✅ Test URL s různými ComGate parametry:**

#### **1. Test s `id` parametrem (ComGate transaction ID):**
```
http://localhost:3005/api/payments/return?
  status=success&
  id=TXN123456789&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

#### **2. Test s `label` parametrem (ComGate label):**
```
http://localhost:3005/api/payments/return?
  status=success&
  label=LABEL123456&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

#### **3. Test s `REFNO` parametrem (ComGate reference number):**
```
http://localhost:3005/api/payments/return?
  status=success&
  REFNO=REF123456789&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

#### **4. Test s `PAYUID` parametrem (ComGate payment UID):**
```
http://localhost:3005/api/payments/return?
  status=success&
  PAYUID=PAYUID123456&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

#### **5. Test s `transId` parametrem (ComGate trans ID):**
```
http://localhost:3005/api/payments/return?
  status=success&
  transId=TRANS123456&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

#### **6. Test s `refId` parametrem (ComGate ref ID):**
```
http://localhost:3005/api/payments/return?
  status=success&
  refId=REFID123456&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

#### **7. Test s PayU parametry:**
```
http://localhost:3005/api/payments/return?
  status=success&
  txnid=PAYU123456&
  mihpayid=MIHPAY789&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=payu
```

#### **8. Test s generic parametry:**
```
http://localhost:3005/api/payments/return?
  status=success&
  transaction_id=GENERIC123&
  payment_id=PAYMENT456&
  txn_id=TXN789&
  ref_id=REF012&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=generic
```

#### **9. Test s kombinací parametrů:**
```
http://localhost:3005/api/payments/return?
  status=success&
  id=COMGATE123&
  label=LABEL456&
  REFNO=REF789&
  transId=TRANS012&
  orderId=ORD123&
  invoiceId=INV456&
  amount=1000&
  currency=CZK&
  paymentMethod=comgate
```

### **🔍 Očekávané chování:**

#### **✅ Middleware return handler:**
1. **Extrahuje všechny parametry** z URL
2. **Loguje všechny parametry** do console
3. **Určí realTransactionId** podle priority
4. **Přesměruje na CloudVPS** s všemi parametry

#### **✅ Priority transaction ID:**
```javascript
realTransactionId = transactionId || transId || id || label || REFNO || PAYUID || 
                   txnid || mihpayid || transaction_id || payment_id || txn_id || ref_id;
```

#### **✅ CloudVPS payment-complete:**
1. **Zobrazí všechny parametry** v debug sekci
2. **Ukáže transaction ID detection** krok za krokem
3. **Zvýrazní final transaction ID** barevně

### **🧪 Test workflow:**

#### **✅ Krok za krokem test:**
```
1. Otevři jednu z test URLs výše
2. Middleware zpracuje return
3. Loguje všechny parametry do console
4. Přesměruje na http://localhost:3000/payment-complete
5. CloudVPS zobrazí všechny parametry
6. Zkontroluj debug sekci pro transaction ID detection
```

#### **✅ Console logy očekávané:**
```javascript
🔄 Payment return handler called
🔍 All URL parameters received: { status: 'success', id: 'COMGATE123', ... }
🔍 Transaction ID detection from URL parameters: {
  transactionId: undefined,
  transId: undefined,
  id: 'COMGATE123',
  label: 'LABEL456',
  REFNO: 'REF789',
  // ...
  finalTransactionId: 'COMGATE123'
}
🎯 Redirecting to payment-complete page with action buttons
```

### **📊 Debug informace:**

#### **✅ V payment-complete stránce:**
- **All URL Parameters**: Všechny předané parametry
- **Transaction ID Detection**: Krok za krokem detekce
- **Final Transaction ID**: Výsledné transaction ID (ne MISSING)

#### **✅ Očekávané výsledky:**
- **Transaction ID**: Mělo by být vyplněno (ne null)
- **Payment ID**: Mělo by být vyplněno (ne null)
- **Final Transaction ID**: Mělo by být vyplněno (ne MISSING)

## 🎯 **Použití pro debugging:**

### **✅ Pokud stále ukazuje MISSING:**
1. **Zkontroluj middleware console** - jaké parametry přicházejí
2. **Zkontroluj CloudVPS console** - jaké parametry se předávají
3. **Použij debug sekci** na payment-complete stránce
4. **Porovnej s očekávanými parametry** výše

### **✅ Nejčastější ComGate parametry:**
- **`id`** - Hlavní transaction ID
- **`label`** - Label/reference
- **`REFNO`** - Reference number
- **`transId`** - Transaction ID
- **`refId`** - Reference ID

**Test URLs jsou připravené pro debugging transaction ID problému!** 🔧
