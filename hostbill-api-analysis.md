# HostBill API Analysis - productCloneSettings

## 🔍 OFICIÁLNÍ HOSTBILL API DOKUMENTACE

**URL:** https://api2.hostbillapp.com/services/productCloneSettings.html

### ✅ SPRÁVNÉ SETTINGS ČÍSLOVÁNÍ (podle oficiální dokumentace):

```javascript
settings: [
  1, // 'Connect with app'
  2, // 'Automation' 
  3, // 'Emails'
  4, // 'Components'
  5, // 'Other settings'
  6, // 'Client functions'
  7, // 'Price'
]
```

### ❌ NAŠE SOUČASNÉ NESPRÁVNÉ ČÍSLOVÁNÍ:

```javascript
// Naše současná implementace (NESPRÁVNÁ):
const SETTINGS_LABELS = [
  { id: 1, label: 'General' },                    // ❌ Neexistuje v HostBill API
  { id: 2, label: 'Pricing' },                    // ❌ Mělo by být 7
  { id: 3, label: 'Configuration' },              // ❌ Neexistuje v HostBill API
  { id: 4, label: 'Components (Form fields)' },   // ✅ Správně
  { id: 5, label: 'Emails' },                     // ❌ Mělo by být 3
  { id: 6, label: 'Related products' },           // ❌ Neexistuje v HostBill API
  { id: 7, label: 'Automation scripts' },         // ❌ Mělo by být 2
  { id: 8, label: 'Order process' },              // ❌ Neexistuje v HostBill API
  { id: 9, label: 'Domain settings' }             // ❌ Neexistuje v HostBill API
];
```

## 🔧 POTŘEBNÉ OPRAVY

### ✅ SPRÁVNÉ SETTINGS LABELS (podle HostBill API):

```javascript
const SETTINGS_LABELS = [
  { id: 1, label: 'Connect with app' },
  { id: 2, label: 'Automation' },
  { id: 3, label: 'Emails' },
  { id: 4, label: 'Components' },
  { id: 5, label: 'Other settings' },
  { id: 6, label: 'Client functions' },
  { id: 7, label: 'Price' }
];
```

### 🎯 DŮVOD PROČ COMPONENTS NEFUNGOVALY:

1. **✅ Správný formát:** Používáme správný formát `settings: [4]` jako array
2. **✅ Správné číslo:** Components je skutečně číslo 4
3. **❌ Problém:** Ostatní naše settings čísla jsou nesprávná podle HostBill API
4. **❌ Možný problém:** HostBill API může validovat celý settings array

## 📋 HOSTBILL API SPECIFIKACE

### Required Parameters:
- `source_product_id`: Source product id
- `target_product_ids`: Array of target product ids
- `settings`: Array of settings to copy (1-7)

### Settings Mapping:
1. **Connect with app** - Připojení s aplikací/modulem
2. **Automation** - Automatizační skripty
3. **Emails** - Email šablony
4. **Components** - Komponenty/Form fields ⭐
5. **Other settings** - Ostatní nastavení
6. **Client functions** - Klientské funkce
7. **Price** - Ceny

### Example Request:
```
GET /admin/api.php?api_id=API_ID&api_key=API_KEY&call=productCloneSettings&source_product_id=SOURCE_PRODUCT_ID&target_product_ids=TARGET_PRODUCT_IDS&settings=SETTINGS
```

### Example Response:
```json
{
    "success": true,
    "call": "productCloneSettings",
    "server_time": 1738756897,
    "info": [
        "Connect with app: Copying completed successfully",
        "Automation: Copying completed successfully"
    ]
}
```

## 🚨 KRITICKÉ ZJIŠTĚNÍ

**Naše implementace používá nesprávná čísla settings!**

- Používáme settings 1-9, ale HostBill API podporuje pouze 1-7
- Naše mapování neodpovídá oficiální HostBill dokumentaci
- Components (4) je správně, ale ostatní settings jsou špatně

## 🔧 AKČNÍ PLÁN

1. **✅ Opravit SETTINGS_LABELS** podle oficiální HostBill dokumentace
2. **✅ Aktualizovat UI** aby zobrazovalo správné kategorie
3. **✅ Otestovat components cloning** s opraveným settings array
4. **✅ Aktualizovat dokumentaci** a komentáře v kódu
5. **✅ Informovat uživatele** o změnách v kategoriích

## 💡 VYSVĚTLENÍ PROČ COMPONENTS NEFUNGOVALY

Možné důvody:
1. **HostBill API validace:** API může odmítat neplatná settings čísla (5-9)
2. **Nekompatibilní kombinace:** Nesprávná settings čísla mohla způsobit selhání
3. **API chyba:** Nesprávný settings array mohl způsobit tiché selhání

## 🎯 OČEKÁVANÉ VÝSLEDKY PO OPRAVĚ

Po opravě settings čísel podle oficiální dokumentace:
- ✅ Components (4) by měly fungovat správně
- ✅ Všechny ostatní kategorie budou odpovídat HostBill funkcionalitě
- ✅ API volání budou kompatibilní s oficiální specifikací
- ✅ Lepší error handling a debugging možnosti

## 📚 REFERENCE

- **HostBill API Dokumentace:** https://api2.hostbillapp.com/services/productCloneSettings.html
- **Datum aktualizace:** 2/10/2025, 3:15:57 PM
- **API Endpoint:** productCloneSettings
- **Podporované settings:** 1-7 (ne 1-9 jak jsme používali)
