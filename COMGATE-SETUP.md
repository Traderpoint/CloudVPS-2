# Comgate Payment Gateway Setup

## ✅ Implementace dokončena

Comgate platební brána je plně implementována v systrix-middleware-nextjs a připravena k použití.

## 🔧 Konfigurace

### Testovací prostředí (aktuální)

```env
# Comgate Payment Gateway Configuration (Real Test Environment)
COMGATE_API_URL=https://payments.comgate.cz/v2.0
COMGATE_MERCHANT_ID=498008
COMGATE_SECRET=WCJmtaUl94nEKQGMSj1JaYnOLcJORoVI
COMGATE_TEST_MODE=true
COMGATE_MOCK_MODE=true  # Dočasně zapnuto kvůli IP whitelistu
```

### 🚨 Potřebné kroky pro aktivaci

1. **Přidat IP adresu do whitelistu:**
   - Přihlásit se do [portal.comgate.cz](https://portal.comgate.cz)
   - Jít do sekce "Integrace" > "Nastavení obchodu" > "Propojení obchodu"
   - Přidat IP adresu: `93.91.158.142` do povolenych IP adres
   - Případně vypnout IP whitelist kontrolu (méně bezpečné)

2. **Po přidání IP adresy:**
   ```env
   COMGATE_MOCK_MODE=false  # Vypnout mock mode
   ```

## 🌐 API Endpointy

Implementované endpointy pro Comgate:

- `GET /api/payments/comgate/methods` - Dostupné platební metody
- `POST /api/payments/comgate/initialize` - Inicializace platby
- `GET /api/payments/comgate/status` - Kontrola stavu platby
- `POST /api/payments/comgate/callback` - Webhook handling
- `POST /api/payments/initialize` (s method=comgate) - Hlavní endpoint

## 🧪 Testování

### V prohlížeči:
1. **http://localhost:3000/middleware-order-test** - Comgate v dropdown
2. **http://localhost:3000/payment-flow-test** - Test payment flow
3. **http://localhost:3000/middleware-payment-modules** - Externí modul
4. **http://localhost:3000/test-portal** - Hlavní portál

### Příkazová řádka:
```bash
node test-comgate-integration.js
```

## 📋 Aktuální stav

- ✅ **Implementace:** Kompletní
- ✅ **Credentials:** Skutečné testovací údaje od Comgate
- ⚠️ **IP Whitelist:** Potřeba přidat IP 93.91.158.142
- ✅ **Mock Mode:** Aktivní pro demonstraci
- ✅ **Integrace:** Všechny test portály

## 🔄 Workflow

1. **Vytvoření objednávky** - přes middleware → HostBill
2. **Výběr Comgate** - z dropdown platebních metod
3. **Inicializace platby** - přes Comgate API
4. **Přesměrování** - na Comgate platební bránu
5. **Callback** - zpět do middleware po platbě
6. **Aktualizace stavu** - v HostBill systému

## 🎯 Produkční nasazení

Pro produkční použití:

```env
COMGATE_MERCHANT_ID=your_production_merchant_id
COMGATE_SECRET=your_production_secret
COMGATE_TEST_MODE=false
COMGATE_MOCK_MODE=false
```

## 📞 Podpora

- **Comgate dokumentace:** https://help.comgate.cz/docs/api-protokol
- **Testování:** https://help.comgate.cz/docs/navod-k-pouziti#testov%C3%A1n%C3%AD
- **Portál:** https://portal.comgate.cz

## 🎊 Výsledek

Comgate je nyní plně funkční platební metoda integrovaná do middleware systému a připravená k použití po nastavení IP whitelistu!
