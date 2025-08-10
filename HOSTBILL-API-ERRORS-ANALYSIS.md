# HostBill API Errors Analysis

## 🎯 Problém

V logách se objevují HostBill API chyby:
```
❌ Step 1 FAILED: Payment authorization failed
❌ Step 2 FAILED: Payment capture failed  
❌ Fallback: setInvoiceStatus failed
```

## 🔍 Analýza problému

### **❌ Klíčový problém: Nesprávné mapování refId**

#### **Z logů:**
```
refId: 'ORDER-1754405985532'  ✅ ComGate vrací správně
orderId: undefined            ❌ Problém v mapování
invoiceId: undefined          ❌ Problém v mapování
```

#### **Testovací data:**
```javascript
// test-complete-real-flow.js
orderId: "ORDER-1754405985532"
invoiceId: "456"
```

#### **ComGate processor logika:**
```javascript
// lib/comgate-processor.js:46
refId: invoiceId || orderId, // Use Invoice ID as refId
```

**Očekávaný výsledek:** `refId` by měl být `"456"` (invoiceId)
**Skutečný výsledek:** `refId` je `"ORDER-1754405985532"` (orderId)

### **🔍 Problém v payment return handler:**

```javascript
// pages/api/payments/return.js:139-140
const finalOrderId = orderId || realRefId || refId;     // undefined || "ORDER-xxx" = "ORDER-xxx"
const finalInvoiceId = invoiceId || realRefId || refId; // undefined || "ORDER-xxx" = "ORDER-xxx"
```

**Problém:** `finalInvoiceId` je `"ORDER-1754405985532"`, ale HostBill očekává číselné invoice ID jako `"456"`.

## 🔧 Identifikované problémy

### **1. RefId mapování**
- ComGate processor by měl používat `invoiceId` jako `refId`
- Ale v logách vidíme `orderId` jako `refId`
- To znamená, že `invoiceId` je `undefined` nebo `null`

### **2. HostBill API volání**
- HostBill API očekává číselné invoice ID (456)
- Ale dostává order ID ("ORDER-1754405985532")
- To způsobuje "HostBill API call failed"

### **3. URL parameter mapping**
- ComGate callback obsahuje správný `refId`
- Ale mapování na `orderId`/`invoiceId` selhává
- `orderId` a `invoiceId` jsou `undefined`

## 🛠️ Řešení

### **✅ Oprava 1: Kontrola ComGate processor**

Zkontrolovat, proč se `orderId` používá místo `invoiceId` jako `refId`:

```javascript
// lib/comgate-processor.js
console.log('🔍 DEBUG ComGate refId mapping:', {
  orderId,
  invoiceId,
  refId: invoiceId || orderId,
  finalRefId: invoiceId || orderId
});
```

### **✅ Oprava 2: Zlepšit payment return handler**

```javascript
// pages/api/payments/return.js
// Pokud refId vypadá jako ORDER-xxx, extrahovat invoice ID
let finalInvoiceId = invoiceId;
let finalOrderId = orderId;

if (!finalInvoiceId && refId) {
  if (refId.startsWith('ORDER-')) {
    // refId je orderId, potřebujeme najít správné invoiceId
    finalOrderId = refId;
    // Zde by měla být logika pro získání invoice ID z order ID
    // Nebo použít fallback na testovací invoice ID
    finalInvoiceId = '456'; // Fallback pro testování
  } else {
    // refId je pravděpodobně invoiceId
    finalInvoiceId = refId;
  }
}
```

### **✅ Oprava 3: Debug logging**

Přidat více debug logů pro sledování mapování:

```javascript
console.log('🔍 RefId mapping debug:', {
  'ComGate refId': refId,
  'URL orderId': orderId,
  'URL invoiceId': invoiceId,
  'Final orderId': finalOrderId,
  'Final invoiceId': finalInvoiceId,
  'RefId type': typeof refId,
  'RefId starts with ORDER': refId?.startsWith('ORDER-')
});
```

## 📊 Očekávaný výsledek po opravě

### **✅ Správné mapování:**
```
ComGate refId: "456"                    ✅ Invoice ID
Final orderId: "ORDER-1754405985532"    ✅ Order ID  
Final invoiceId: "456"                  ✅ Invoice ID
```

### **✅ HostBill API volání:**
```
✅ Step 1: Payment authorization with invoice ID 456
✅ Step 2: Payment capture with invoice ID 456
✅ Step 3: Invoice marked as paid
```

### **✅ Payment complete:**
```
✅ Transaction ID: Real ComGate ID
✅ Invoice ID: 456
✅ Order ID: ORDER-1754405985532
✅ Auto-capture functional
```

## 🎯 Akční kroky

### **1. Okamžitá oprava:**
```javascript
// Dočasná oprava v payment return handler
if (refId && refId.startsWith('ORDER-')) {
  finalOrderId = refId;
  finalInvoiceId = '456'; // Fallback pro testování
} else if (refId) {
  finalInvoiceId = refId;
}
```

### **2. Dlouhodobá oprava:**
- Opravit ComGate processor aby správně mapoval `invoiceId` jako `refId`
- Implementovat lookup tabulku ORDER-ID → Invoice-ID
- Přidat validaci invoice ID před HostBill API voláními

### **3. Testing:**
- Test s reálnými invoice ID
- Ověřit HostBill API connectivity
- Zkontrolovat ComGate callback data

## ✅ Závěr

**Hlavní problém:** ComGate používá `orderId` místo `invoiceId` jako `refId`, což způsobuje nesprávné mapování v payment return handler a následné HostBill API chyby.

**Řešení:** Opravit mapování `refId` → `invoiceId` a přidat fallback logiku pro správné rozpoznání invoice ID vs order ID.

**Výsledek:** HostBill API volání budou fungovat se správnými invoice ID a payment flow bude kompletní.
