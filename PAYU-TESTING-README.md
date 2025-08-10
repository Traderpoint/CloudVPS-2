# PayU Payment Testing - Kompletní Průvodce

Tento průvodce vám ukáže, jak testovat PayU platby end-to-end včetně simulace callback pro automatické označení faktury jako zaplacené.

## 🎯 Co tyto skripty dělají

### 1. `test-complete-payu-flow.js` - Kompletní test
- ✅ Vytvoří objednávku přes CloudVPS API
- ✅ Inicializuje PayU platbu
- ✅ Simuluje PayU callback na HostBill
- ✅ Ověří, že faktura je označena jako zaplacená

### 2. `simulate-payu-callback.js` - Pouze callback simulace
- 🔔 Simuluje úspěšnou nebo neúspěšnou PayU platbu
- 📤 Odešle callback data na HostBill
- ✅ Označí fakturu jako zaplacenou

### 3. `get-payu-config.js` - Konfigurace helper
- 🔍 Najde PayU modul v HostBill
- 🔐 Pomůže najít správný PayU salt
- 📋 Zobrazí konfiguraci modulů

## 🚀 Rychlý start

### Krok 1: Instalace závislostí
```bash
npm install axios
```

### Krok 2: Zjištění PayU salt
```bash
node get-payu-config.js
```

Tento skript vám pomůže najít správný PayU salt. Hledejte výstup typu:
```
🎯 PayU modul nalezen: PayU (ID: 10)
🔑 Běžné salt hodnoty k vyzkoušení:
  1. eCwWELxi
  2. your_salt_here
  ...
```

### Krok 3: Aktualizace salt
Otevřete `test-complete-payu-flow.js` a `simulate-payu-callback.js` a aktualizujte:
```javascript
const MERCHANT_SALT = 'your_actual_salt_here'; // Nahraďte správným salt
```

### Krok 4: Spuštění kompletního testu
```bash
node test-complete-payu-flow.js
```

## 📋 Detailní použití

### Kompletní PayU flow test
```bash
# Spustí celý proces: objednávka → platba → callback → ověření
node test-complete-payu-flow.js
```

Očekávaný výstup:
```
🚀 Kompletní PayU Payment Flow Test
=====================================

📦 Krok 1: Vytváření objednávky...
✅ Objednávka vytvořena:
  - Order ID: 95
  - Invoice ID: 128
  - Total: 299 CZK

💳 Krok 2: Inicializace PayU platby...
✅ Platba inicializována:
  - Payment ID: PAY-1753825749335-z7mf70bg6
  - Payment URL: https://vps.kabel1it.cz/cart.php?a=checkout&invoiceid=128...
  - Redirect required: true

🔔 Krok 3: Simulace PayU callback...
📤 Odesílám callback:
  - Transaction ID: TXN-1753825749456-abc123
  - PayU ID: 1753825749456789
  - Amount: 299.00 CZK
  - Status: success
✅ Callback úspěšně odeslán!

🔍 Krok 4: Ověření výsledku...
📋 Výsledek ověření:
  - Invoice status: Paid
  - Invoice total: 299.00
  - Payment status: 1
  - Date paid: 2024-01-XX XX:XX:XX

🎉 ÚSPĚCH! Kompletní PayU flow funguje správně!
✅ Objednávka vytvořena
✅ Platba inicializována
✅ Callback zpracován
✅ Faktura označena jako zaplacená
```

### Pouze callback simulace
```bash
# Simuluje úspěšnou platbu
node simulate-payu-callback.js success

# Simuluje neúspěšnou platbu
node simulate-payu-callback.js failure
```

## 🔧 Konfigurace

### Potřebné údaje
Pro správné fungování potřebujete:

1. **PayU Merchant Key**: `QyT13U` (už nastaveno)
2. **PayU Salt**: Musíte zjistit z HostBill admin
3. **PayU Module ID**: `10` (už nastaveno)
4. **HostBill API credentials**: Už nastaveno

### Kde najít PayU salt
1. **HostBill Admin** → **Payment Modules** → **PayU** → **Configuration**
2. Nebo použijte `get-payu-config.js` pro automatické hledání
3. Nebo zkuste běžné hodnoty: `eCwWELxi`, `test_salt`, atd.

## 🐛 Troubleshooting

### Problém: "Faktura není označena jako zaplacená"
**Řešení:**
1. Zkontrolujte PayU salt - musí být správný
2. Ověřte PayU module ID (mělo by být `10`)
3. Zkontrolujte callback URL dostupnost

### Problém: "Callback failed"
**Řešení:**
1. Ověřte, že HostBill je dostupný na `https://vps.kabel1it.cz`
2. Zkontrolujte firewall - callback musí projít
3. Ověřte PayU modul je aktivní v HostBill

### Problém: "Order creation failed"
**Řešení:**
1. Zkontrolujte, že middleware běží na portu 3005
2. Ověřte HostBill API credentials
3. Zkontrolujte produkty v HostBill

## 📊 Struktura callback dat

PayU callback obsahuje tyto klíčové parametry:
```javascript
{
  mihpayid: "1753825749456789",      // PayU transaction ID
  status: "success",                 // success/failure
  txnid: "TXN-1753825749456-abc123", // Merchant transaction ID
  amount: "299.00",                  // Částka
  hash: "6cac0092a7b6bff2e17822...", // Security hash
  udf1: "95",                        // Order ID
  udf2: "128",                       // Invoice ID
  // ... další parametry
}
```

## 🔐 Security hash

PayU hash se generuje podle vzorce:
```
salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
```

Všechny prázdné pole musí být zachována jako prázdné stringy.

## 📝 Logování

Všechny skripty poskytují detailní logování:
- ✅ Úspěšné operace
- ❌ Chyby s detaily
- 📤 Odesílaná data
- 📋 Výsledky ověření

## 🎯 Výsledek

Po úspěšném testu budete mít:
1. **Funkční objednávkový proces** CloudVPS → Middleware → HostBill
2. **Funkční PayU platební inicializaci**
3. **Funkční PayU callback zpracování**
4. **Automatické označení faktury jako zaplacené**

## 📞 Podpora

Pokud máte problémy:
1. Zkontrolujte všechny konfigurace podle tohoto průvodce
2. Spusťte `get-payu-config.js` pro diagnostiku
3. Zkontrolujte logy všech služeb (CloudVPS, Middleware, HostBill)

---

**Tip:** Pro produkční použití nezapomeňte změnit test credentials na produkční a aktualizovat callback URL na produkční doménu.
