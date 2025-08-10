# Test Portal .env Analysis

## 🎯 **ANALÝZA VŠECH TESTŮ NA TEST-PORTAL A JEJICH ZÁVISLOSTÍ NA .ENV**

### ✅ **Testy využívající .env na CloudVPS:**

#### **🔗 Middleware Testy (používají MIDDLEWARE_URL):**

1. **🚀 Middleware Connection Test** (`/middleware-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: `/api/middleware/test-affiliate`
   - **Funkce**: Test komunikace s middleware serverem

2. **🎯 Middleware Affiliate Test** (`/middleware-affiliate-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: Volá middleware affiliate endpoints
   - **Funkce**: Test affiliate funkcionalit přes middleware

3. **📦 Middleware Products** (`/middleware-affiliate-products`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: `/api/affiliate/{id}/products` na middleware
   - **Funkce**: Načítání produktů přes middleware

4. **🛒 Middleware Order Test** (`/middleware-order-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: `/api/orders/create` na middleware
   - **Funkce**: Vytváření objednávek přes middleware

5. **💳 Payment Flow Test** (`/payment-flow-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: Middleware payment endpoints
   - **Funkce**: Test payment flow přes middleware

6. **💳 Real Payment Flow Test** (`/real-payment-flow-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: Real payment processing přes middleware
   - **Funkce**: Skutečné platby přes middleware

7. **🚀 Advanced Order Test** (`/advanced-order-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: Advanced order creation přes middleware
   - **Funkce**: Pokročilé objednávky přes middleware

8. **💳 Payment System Test (Middleware)** (`/payment-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: Payment system testing přes middleware
   - **Funkce**: Test payment systému přes middleware

9. **🔍 Payment Methods Test** (`/payment-methods-test`)
   - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
   - **API**: Payment methods přes middleware
   - **Funkce**: Test dostupných payment methods

10. **🔧 Middleware Payment Modules** (`/middleware-payment-modules`)
    - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
    - **API**: Payment modules přes middleware
    - **Funkce**: Test payment modules přes middleware

11. **💰 Middleware Capture Payment Test** (`/capture-payment-test`)
    - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
    - **API**: `/api/middleware/capture-payment`
    - **Funkce**: Test capture payment přes middleware

12. **💰 Invoice Payment Test** (`/invoice-payment-test`)
    - **ENV**: `MIDDLEWARE_URL=http://localhost:3005`
    - **API**: `/api/middleware/recent-orders`, `/api/middleware/mark-invoice-paid`
    - **Funkce**: Test invoice payment a marking

#### **👥 Direct HostBill Testy (používají HOSTBILL_* proměnné):**

13. **🔍 Základní Affiliate Test** (`/affiliate-test`)
    - **ENV**: Používá HostBill affiliate systém (client-side)
    - **Funkce**: Test affiliate tracking a conversions

14. **🛒 Reálný Affiliate Test** (`/affiliate-test-real`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Direct HostBill API calls
    - **Funkce**: Reálný affiliate test s HostBill API

15. **📦 Direct HostBill Products** (`/affiliate-products-test`)
    - **ENV**: `HOSTBILL_API_ID`, `HOSTBILL_API_KEY`, `HOSTBILL_API_URL`
    - **API**: `/api/hostbill/get-affiliate-products`
    - **Funkce**: Načítání produktů přímo z HostBill

16. **🛒 Direct HostBill Order Test** (`/direct-order-test`)
    - **ENV**: `HOSTBILL_API_*` proměnné z `lib/hostbill-config.js`
    - **API**: `/api/hostbill/create-order`
    - **Funkce**: Vytváření objednávek přímo v HostBill

17. **⚡ Direct Advanced Order Test** (`/direct-advanced-order-test`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Advanced HostBill order creation
    - **Funkce**: Pokročilé objednávky přímo v HostBill

18. **💳 Payment System Test (Direct)** (`/payment-test?mode=direct`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Direct HostBill payment processing
    - **Funkce**: Payment system přímo přes HostBill

19. **🎯 Direct HostBill Payment Test** (`/direct-payment-test`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Direct HostBill payment APIs
    - **Funkce**: Přímé payment testy s HostBill

20. **🔍 Real Payment Methods Test** (`/real-payment-methods-test`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: `/api/hostbill/payment-modules`
    - **Funkce**: Načítání real payment methods z HostBill

21. **🏢 HostBill Payment Modules** (`/hostbill-modules-test`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: `/api/hostbill/payment-modules`
    - **Funkce**: Test HostBill payment modules

22. **🛒 Complete Order Workflow Test** (`/complete-order-test`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Complete order workflow s HostBill
    - **Funkce**: Kompletní order workflow test

23. **🔗 CloudVPS ↔ Middleware Integration Test** (`/integration-test`)
    - **ENV**: `MIDDLEWARE_URL` + `HOSTBILL_API_*` proměnné
    - **API**: Integration mezi CloudVPS a Middleware
    - **Funkce**: Test kompletní integrace

#### **🐛 Debug Nástroje:**

24. **🔧 Debug Affiliate Data** (`/debug-affiliate`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Debug affiliate data z HostBill
    - **Funkce**: Debug affiliate informací

25. **🔗 Test HostBill API** (`/api/hostbill/test-affiliate-api`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Direct HostBill API test
    - **Funkce**: Test HostBill API connectivity

26. **📋 Všichni Affiliates** (`/api/hostbill/get-all-affiliates`)
    - **ENV**: `HOSTBILL_API_*` proměnné
    - **API**: Get all affiliates z HostBill
    - **Funkce**: Načítání všech affiliates

### ❌ **Testy NEVYUŽÍVAJÍCÍ .env na CloudVPS:**

#### **🚀 Produkční Aplikace (používají vlastní logic):**

27. **🏠 Hlavní Stránka** (`/`)
    - **ENV**: Žádné specifické .env závislosti
    - **Funkce**: Hlavní stránka aplikace

28. **🛒 Checkout (Middleware)** (`/checkout`)
    - **ENV**: Používá middleware, ale ne přímé .env závislosti
    - **Funkce**: Checkout proces

29. **💰 Ceník** (`/pricing`)
    - **ENV**: Žádné .env závislosti
    - **Funkce**: Zobrazení ceníku

#### **🧪 Ostatní testy:**

30. **🎭 Affiliate Scénáře** (`/affiliate-scenarios`)
    - **ENV**: Žádné přímé .env závislosti
    - **Funkce**: Test různých affiliate scénářů

31. **🔗 Product Mapping Test** (`/product-mapping-test`)
    - **ENV**: Možné middleware závislosti
    - **Funkce**: Test product mapping

32. **🧪 Test Payment Gateway** (`/test-payment-gateway`)
    - **ENV**: Možné payment test proměnné
    - **Funkce**: Test payment gateway

33. **🔐 Google OAuth & Email Tests** (`/middleware-oauth-tests`)
    - **ENV**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
    - **API**: Google OAuth testing
    - **Funkce**: Test Google OAuth integrace

### 📊 **Klíčové .env proměnné používané:**

#### **✅ Middleware proměnné:**
```env
MIDDLEWARE_URL=http://localhost:3005
NEXT_PUBLIC_MIDDLEWARE_URL=http://localhost:3005
MIDDLEWARE_API_SECRET=your_secret_key_here
```

#### **✅ HostBill API proměnné:**
```env
HOSTBILL_URL=https://vps.kabel1it.cz
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=341697c41aeb1c842f0d
HOSTBILL_API_SECRET=341697c41aeb1c842f0d
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
NEXT_PUBLIC_HOSTBILL_DOMAIN=vps.kabel1it.cz
NEXT_PUBLIC_HOSTBILL_URL=https://vps.kabel1it.cz
```

#### **✅ Google OAuth proměnné:**
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cloudvps-nextauth-secret-key-2024
```

#### **✅ Affiliate a Product proměnné:**
```env
DEFAULT_AFFILIATE_ID=2
NEXT_PUBLIC_AFFILIATE_DEBUG=true
PRODUCT_VPS_BASIC=1
PRODUCT_VPS_PRO=2
PRODUCT_VPS_PREMIUM=3
PRODUCT_VPS_ENTERPRISE=4
```

#### **✅ Payment test proměnné:**
```env
PAYMENT_TEST_MODE=true
PAYMENT_TEST_AMOUNT=1
PAYMENT_TEST_CURRENCY=CZK
PAYMENT_SIMULATE_SUCCESS=true
```

### 🎯 **Shrnutí:**

#### **✅ Testy využívající .env: 26 testů**
- **Middleware testy**: 12 testů
- **Direct HostBill testy**: 11 testů
- **Debug nástroje**: 3 testy

#### **❌ Testy nevyužívající .env: 7 testů**
- **Produkční aplikace**: 3 testy
- **Ostatní testy**: 4 testy

#### **📊 Celkem testů na test-portal: 33 testů**
- **79% testů** využívá .env proměnné na CloudVPS
- **21% testů** nevyužívá .env proměnné

**Většina testů na test-portal je závislá na .env konfiguraci CloudVPS!** 🎯
