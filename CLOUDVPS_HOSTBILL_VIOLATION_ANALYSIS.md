# CloudVPS HostBill API Violation Analysis

## 🚨 **KRITICKÝ PROBLÉM NALEZEN!**

CloudVPS **PORUŠUJE** základní pravidlo a komunikuje přímo s HostBill API místo přes Middleware!

## 📋 **Analýza porušení:**

### ❌ **Přímé HostBill API volání v CloudVPS:**

#### 1. **API Endpointy s HostBill credentials:**
```
pages/api/hostbill/
├── affiliates.js ❌ (používá HOSTBILL_API_ID, HOSTBILL_API_KEY)
├── create-advanced-order.js ❌
├── create-order.js ❌
├── get-affiliate-products.js ❌
├── get-all-affiliates.js ❌
├── get-all-products.js ❌
├── payment-gateways.js ❌
├── payment-modules.js ✅ (přesměrováno na middleware)
├── products.js ❌
├── test-api-direct.js ❌
├── test-connection.js ❌
├── track-conversion.js ❌
├── track-visit.js ❌
└── ...další
```

#### 2. **Frontend soubory volající /api/hostbill/ endpointy:**
```
pages/complete-order-test.js ❌
  → fetch('/api/hostbill/products')

pages/hostbill-modules-test.js ❌
  → fetch('/api/hostbill/payment-modules')

components/ProductSelector.js ❌
  → fetch('/api/hostbill/create-order')

components/HostBillAffiliate.js ❌
  → fetch('/api/hostbill/track-visit')
  → fetch('/api/hostbill/track-conversion')
```

#### 3. **HostBill credentials v .env:**
```bash
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=341697c41aeb1c842f0d
HOSTBILL_API_SECRET=341697c41aeb1c842f0d
```

## 🎯 **Pravidlo, které je porušeno:**

> **"Veškerá komunikace mezi CloudVPS a HostBill musí jít výhradně přes Middleware a musí být funkční bez fallbacku."**

## 🔧 **Co je potřeba opravit:**

### 1. **Odstranit HostBill credentials z CloudVPS .env**
```bash
# ODSTRANIT tyto řádky z .env:
HOSTBILL_API_URL=...
HOSTBILL_API_ID=...
HOSTBILL_API_KEY=...
HOSTBILL_API_SECRET=...
```

### 2. **Přesměrovat všechny /api/hostbill/ endpointy na middleware**

#### ❌ **PŘED (špatně):**
```javascript
// pages/api/hostbill/products.js
const HOSTBILL_CONFIG = {
  apiUrl: process.env.HOSTBILL_API_URL,
  apiId: process.env.HOSTBILL_API_ID,
  apiKey: process.env.HOSTBILL_API_KEY
};
```

#### ✅ **PO (správně):**
```javascript
// pages/api/hostbill/products.js
export default async function handler(req, res) {
  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
  const response = await fetch(`${middlewareUrl}/api/products`);
  const data = await response.json();
  res.json(data);
}
```

### 3. **Aktualizovat frontend volání**

#### ❌ **PŘED (špatně):**
```javascript
// Volá CloudVPS API, které volá HostBill přímo
const response = await fetch('/api/hostbill/products');
```

#### ✅ **PO (správně):**
```javascript
// Volá CloudVPS API, které přesměruje na middleware
const response = await fetch('/api/products'); // nebo
const response = await fetch('/api/middleware/products');
```

## 📊 **Soubory k opravě:**

### **API Endpointy (18 souborů):**
1. `pages/api/hostbill/affiliates.js`
2. `pages/api/hostbill/create-advanced-order.js`
3. `pages/api/hostbill/create-order.js`
4. `pages/api/hostbill/get-affiliate-products.js`
5. `pages/api/hostbill/get-all-affiliates.js`
6. `pages/api/hostbill/get-all-products.js`
7. `pages/api/hostbill/payment-gateways.js`
8. `pages/api/hostbill/products.js`
9. `pages/api/hostbill/test-api-direct.js`
10. `pages/api/hostbill/test-connection.js`
11. `pages/api/hostbill/track-conversion.js`
12. `pages/api/hostbill/track-visit.js`
13. `pages/api/hostbill/test-getaffiliates.js`
14. `pages/api/hostbill/test-real-order.js`
15. `pages/api/hostbill/test-scenarios.js`
16. `pages/api/hostbill/affiliate-tracking.js`
17. `pages/api/hostbill-test.js`
18. `pages/api/hostbill/payment-modules.js` ✅ (už opraveno)

### **Frontend soubory (4 soubory):**
1. `pages/complete-order-test.js`
2. `pages/hostbill-modules-test.js`
3. `components/ProductSelector.js`
4. `components/HostBillAffiliate.js`

### **Konfigurační soubory:**
1. `.env` - odstranit HostBill credentials

## 🎯 **Priorita oprav:**

### **🔥 VYSOKÁ PRIORITA:**
1. **ProductSelector.js** - používá se pro vytváření objednávek
2. **complete-order-test.js** - testovací workflow
3. **HostBillAffiliate.js** - affiliate tracking

### **🟡 STŘEDNÍ PRIORITA:**
4. **hostbill-modules-test.js** - testovací stránka
5. **API endpointy** - většina jsou testovací

### **🟢 NÍZKÁ PRIORITA:**
6. **Test soubory** - pouze pro development

## ⚠️ **Rizika současného stavu:**

1. **Bezpečnostní riziko** - HostBill credentials v CloudVPS
2. **Porušení architektury** - obchází middleware
3. **Obtížná údržba** - duplikovaná logika
4. **Nespolehlivost** - žádný fallback mechanismus
5. **Debugging problémy** - obtížné trasování chyb

## 🎉 **Výhody po opravě:**

1. **✅ Dodržení architektury** - vše přes middleware
2. **✅ Bezpečnost** - žádné credentials v CloudVPS
3. **✅ Centralizovaná logika** - vše v middleware
4. **✅ Lepší error handling** - jednotné zpracování chyb
5. **✅ Snadnější údržba** - jedna cesta komunikace

## 🚀 **Doporučený postup opravy:**

1. **Fáze 1:** Opravit kritické frontend soubory (ProductSelector, HostBillAffiliate)
2. **Fáze 2:** Přesměrovat API endpointy na middleware
3. **Fáze 3:** Odstranit HostBill credentials z .env
4. **Fáze 4:** Otestovat všechny funkce
5. **Fáze 5:** Smazat nepotřebné /api/hostbill/ soubory

## 📋 **Shrnutí:**

**CloudVPS aktuálně PORUŠUJE základní pravidlo komunikace přes middleware. Je potřeba urgentně opravit 22 souborů a odstranit HostBill credentials z CloudVPS aplikace!**
