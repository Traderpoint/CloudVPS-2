# Testportal - Kompletní testovací prostředí

Tato složka obsahuje všechny test stránky přesunuté z CloudVPS do middleware.

## 📁 Struktura testů

### 🔗 Middleware Testy (doporučené)
- `test-portal.js` - Hlavní testovací portál
- `middleware-test.js` - Test middleware připojení
- `middleware-affiliate-test.js` - Test affiliate systému
- `middleware-affiliate-products.js` - Test affiliate produktů
- `middleware-order-test.js` - Test objednávek
- `middleware-payment-modules.js` - Test platebních modulů
- `payment-flow-test.js` - Test platebního procesu
- `real-payment-flow-test.js` - Test reálných plateb
- `test-payment-gateway.js` - Test platebních bran
- `payment-methods-test.js` - Test platebních metod
- `middleware-oauth-tests.js` - Test OAuth integrace
- `capture-payment-test.js` - Test zachycení plateb
- `invoice-payment-test.js` - Test označení faktur jako zaplacené

### 👥 Direct HostBill Testy
- `affiliate-test.js` - Základní affiliate test
- `affiliate-test-real.js` - Reálný affiliate test
- `affiliate-products-test.js` - Test affiliate produktů
- `direct-order-test.js` - Test přímých objednávek
- `direct-advanced-order-test.js` - Pokročilé testování objednávek
- `affiliate-scenarios.js` - Affiliate scénáře
- `payment-test.js` - Test platebního systému
- `direct-payment-test.js` - Test přímých plateb
- `real-payment-methods-test.js` - Test reálných platebních metod
- `hostbill-modules-test.js` - Test HostBill modulů
- `complete-order-test.js` - Test kompletního workflow
- `integration-test.js` - Test CloudVPS ↔ Middleware integrace

### 🐛 Debug Nástroje
- `debug-affiliate.js` - Debug affiliate dat

## 🎯 Použití

Všechny testy jsou dostupné přes middleware na portu 3005:

### 📍 Hlavní přístupové body:
- **Test Portal**: http://localhost:3005/test-portal
- **Payment Gateway Test**: http://localhost:3005/test-payment-gateway
- **Middleware Payment Modules**: http://localhost:3005/middleware-payment-modules

### 🔧 Konfigurace

Všechny testy používají API klíče z middleware `.env.local`:

```env
# HostBill API
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=341697c41aeb1c842f0d

# ComGate
COMGATE_MERCHANT_ID=498008
COMGATE_SECRET=WCJmtaUl94nEKQGMSj1JaYnOLcJORoVI
```

## ✅ Výhody

1. **Centralizované testování** - Všechny testy na jednom místě
2. **Konzistentní API klíče** - Všechny testy používají middleware .env
3. **Přímý přístup k middleware** - Testy běží v middleware prostředí
4. **Kompletní backup** - Všechny test stránky zachovány v jedné složce

## 📝 Poznámky

- Testy jsou zkopírovány z `pages/` složky middleware
- Všechny odkazy jsou upraveny pro middleware prostředí
- API endpointy používají middleware konfiguraci
- Produkční aplikace odkazují na CloudVPS (port 3000)

---

**Datum vytvoření**: 2025-08-10  
**Zdroj**: CloudVPS Testpotal migrace  
**Middleware port**: 3005
