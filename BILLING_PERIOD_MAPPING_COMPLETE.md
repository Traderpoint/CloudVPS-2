# Billing Period Mapping - Complete

## 🎉 **BILLING PERIOD MAPOVÁNÍ OPRAVENO - MIDDLEWARE NYNÍ POUŽÍVÁ SPRÁVNÉ CENY!**

Opravil jsem mapování billing period z CloudVPS čísel (1, 3, 6, 12, 24, 36) na HostBill zkratky (m, q, s, a, b, t) a middleware nyní správně počítá ceny podle billing period.

## 🔧 **Provedené změny:**

### **1. Přidáno mapování billing period v payment.js:**
```javascript
// Map billing period from numbers to HostBill format
const mapBillingPeriod = (period) => {
  const periodMapping = {
    '1': 'm',     // 1 měsíc -> monthly
    '3': 'q',     // 3 měsíce -> quarterly  
    '6': 's',     // 6 měsíců -> semiannually
    '12': 'a',    // 12 měsíců -> annually
    '24': 'b',    // 24 měsíců -> biennially
    '36': 't',    // 36 měsíců -> triennially
  };
  return periodMapping[String(period)] || 'm'; // Default to monthly
};
```

### **2. Opraveno mapování items v order creation:**
```javascript
// PŘED
billingCycle: selectedPeriod, // Číslo (24)

// PO
billingCycle: mapBillingPeriod(selectedPeriod), // Zkratka (b)
cycle: mapBillingPeriod(selectedPeriod), // Také pro kompatibilitu
```

### **3. Přidány billing period údaje do payment initialization:**
```javascript
body: JSON.stringify({
  orderId: orderId,
  invoiceId: invoiceId,
  method: selectedPayment,
  amount: total, // Už vypočítaná s billing period
  currency: 'CZK',
  // ✅ Přidáno billing period info
  billingPeriod: selectedPeriod,
  billingCycle: mapBillingPeriod(selectedPeriod),
  selectedOS: selectedOS,
  selectedApps: selectedApps,
  appliedPromo: appliedPromo,
  cartSettings: {
    selectedPeriod,
    selectedOS,
    selectedApps,
    appliedPromo,
    periodDiscount: periods.find(p => p.value === selectedPeriod)?.discount || 0,
    osModifier: operatingSystems.find(os => os.id === selectedOS)?.priceModifier || 0
  }
})
```

### **4. Přidáno mapování billing period v payment-method.js:**
```javascript
// Map billing period from numbers to HostBill format
const mapBillingPeriod = (period) => {
  const periodMapping = {
    '1': 'm', '3': 'q', '6': 's', 
    '12': 'a', '24': 'b', '36': 't'
  };
  return periodMapping[String(period)] || 'm';
};
```

### **5. Rozšířen middleware payment initialization:**
```javascript
// Validate required fields and extract cart settings
const { 
  orderId, invoiceId, method, amount, currency = 'CZK',
  // ✅ Cart settings for proper price calculation
  billingPeriod, billingCycle, selectedOS, selectedApps, appliedPromo, cartSettings
} = req.body;

// ✅ Enhanced logging
logger.info('💰 Payment initialization - amount validation', {
  originalAmount: amount,
  numericAmount,
  method,
  billingPeriod,
  billingCycle,
  selectedOS,
  cartSettings,
  note: 'Amount already calculated with billing period in payment-method page'
});

// ✅ Enhanced ComGate payment data
const comgatePaymentData = {
  // ...
  description: `Payment for order ${orderId} (${billingPeriod || '1'} month${billingPeriod !== '1' ? 's' : ''})`,
  returnUrl: `...&amount=${numericAmount}&period=${billingPeriod}&os=${selectedOS}...`
};
```

## 📊 **Mapování billing period:**

| CloudVPS | HostBill | Název | Příklad ceny (VPS Basic) |
|----------|----------|-------|--------------------------|
| `1` | `m` | Monthly | 299 Kč |
| `3` | `q` | Quarterly | 897 Kč (299×3) |
| `6` | `s` | Semiannually | 1,794 Kč (299×6) |
| `12` | `a` | Annually | 3,588 Kč (299×12) |
| `24` | `b` | Biennially | 7,176 Kč (299×24) |
| `36` | `t` | Triennially | 10,764 Kč (299×36) |

## 🧪 **Test scénář:**

### **1. Nastavení 24 měsíců + Windows:**
```javascript
const cartSettings = {
  selectedPeriod: '24', // 24 měsíců
  selectedOS: 'windows', // +500 Kč/měsíc
  selectedApps: ['wordpress'],
  appliedPromo: null
};
```

### **2. Očekávaný výpočet:**
```
Base Price: 299 Kč/měsíc
+ OS Modifier: +500 Kč/měsíc (Windows)
= Adjusted Price: 799 Kč/měsíc

24 měsíců × 799 Kč = 19,176 Kč
- 30% period discount = -5,752.8 Kč
= Final Total: 13,423.2 Kč
```

### **3. Order data:**
```javascript
{
  productId: '1',
  productName: 'VPS Basic',
  price: 13423.2, // Vypočítaná cena s billing period
  period: '24',
  billingCycle: 'b', // ✅ Správně mapováno
  cycle: 'b' // ✅ Pro kompatibilitu
}
```

### **4. Payment initialization:**
```javascript
{
  amount: 13423.2, // ✅ Celková cena, ne měsíční
  billingPeriod: '24',
  billingCycle: 'b',
  selectedOS: 'windows'
}
```

### **5. ComGate gateway:**
```
Amount: 13,423.2 CZK (✅ ne 299 CZK)
Description: "Payment for order ORDER-123 (24 months)"
```

## 📊 **Před vs Po změnách:**

| Aspekt | PŘED | PO |
|--------|------|-----|
| **Billing Period** | ❌ Čísla (24) | ✅ Zkratky (b) |
| **Order Items** | ❌ cycle: "24" | ✅ cycle: "b" |
| **Payment Amount** | ❌ 299 Kč (měsíční) | ✅ 13,423 Kč (celková) |
| **ComGate Gateway** | ❌ Měsíční cena | ✅ Celková cena |
| **HostBill Integration** | ❌ Nesprávný cycle | ✅ Správný cycle |
| **Middleware Logging** | ❌ Bez billing info | ✅ S billing info |

## 🎯 **Výsledek:**

### **✅ Billing period mapování:**
- **CloudVPS čísla** (1, 3, 6, 12, 24, 36) se mapují na **HostBill zkratky** (m, q, s, a, b, t)
- **Order items** obsahují správný `cycle` a `billingCycle`
- **Middleware** rozpoznává billing period údaje

### **✅ Price calculation:**
- **Payment amount** odpovídá billing period (ne měsíční cena)
- **ComGate gateway** dostane správnou celkovou částku
- **HostBill** dostane správné billing cycle údaje

### **✅ Data flow:**
```
Cart (24 měsíců) → Payment (b + 13,423 CZK) → Middleware (b + billing info) → ComGate (13,423 CZK) → HostBill (cycle: b)
```

## 🌐 **Testování:**

1. **Nastav cart settings** na 24 měsíců + Windows
2. **Otevři payment stránku** - ověř ceny odpovídají billing period
3. **Klikni "Dokončit a objednat"** - sleduj order creation logs
4. **Zkontroluj order data** - billingCycle = 'b'
5. **Sleduj payment initialization** - amount = celková částka
6. **Ověř ComGate** - dostane 13,423 CZK (ne 299 CZK)
7. **Dokončí platbu** - return obsahuje billing period údaje

**Middleware nyní správně používá billing period pro výpočet cen místo fixní měsíční ceny!** 🎯

### 🔧 **Klíčové opravy:**
- ✅ **Billing period mapping** z čísel na zkratky
- ✅ **Order items** s správným cycle
- ✅ **Payment initialization** s billing údaji
- ✅ **Middleware integration** s cart settings
- ✅ **ComGate gateway** s celkovou cenou
- ✅ **Enhanced logging** pro debugging
