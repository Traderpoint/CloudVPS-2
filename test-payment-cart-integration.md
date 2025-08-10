# Payment Cart Integration Test

## 🧪 **Test správného načítání cart settings a výpočtu cen**

### **1. Příprava test dat v sessionStorage:**

Otevři browser console na http://localhost:3000/payment a spusť:

```javascript
// Simuluj cart settings z košíku
const cartSettings = {
  selectedPeriod: '24', // 24 měsíců = 30% sleva
  selectedOS: 'windows', // Windows = +500 Kč/měsíc
  selectedApps: ['wordpress', 'mysql', 'nginx'],
  appliedPromo: {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    discountAmount: 100
  },
  timestamp: new Date().toISOString()
};

sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
console.log('✅ Cart settings saved to sessionStorage');

// Refresh stránku pro načtení settings
location.reload();
```

### **2. Očekávané chování po refresh:**

#### **✅ V console by mělo být:**
```
🛒 Payment page - Loading cart settings: { hasCartSettings: true }
📅 Cart settings found: { selectedPeriod: '24', selectedOS: 'windows', ... }
✅ Period set from cart: 24
✅ OS set from cart: windows
✅ Apps set from cart: ['wordpress', 'mysql', 'nginx']
✅ Promo set from cart: { code: 'WELCOME10', ... }
```

#### **✅ Na stránce by mělo být:**
- **Billing Period**: 24 měsíců (30% sleva)
- **Operating System**: Windows Server (+500 Kč/měsíc)
- **Applications**: WordPress, MySQL, Nginx vybrané
- **Promo Code**: WELCOME10 aplikován

### **3. Test výpočtu cen:**

Spusť v console:

```javascript
// Test výpočtu cen s novými nastaveními
console.log('🧪 Testing price calculation...');

// Simuluj test item
const testItem = {
  id: 1,
  name: 'VPS Start',
  price: '249 Kč/měsíc',
  quantity: 1
};

// Výpočet podle nové logiky
const basePrice = 249; // Kč/měsíc
const period = 24; // měsíců
const periodDiscount = 30; // % (pro 24 měsíců)
const osModifier = 500; // Kč/měsíc (Windows)

const adjustedPrice = basePrice + osModifier; // 249 + 500 = 749 Kč/měsíc
const totalBeforeDiscount = adjustedPrice * period; // 749 * 24 = 17,976 Kč
const discountAmount = totalBeforeDiscount * (periodDiscount / 100); // 17,976 * 0.30 = 5,392.8 Kč
const totalAfterPeriodDiscount = totalBeforeDiscount - discountAmount; // 17,976 - 5,392.8 = 12,583.2 Kč
const promoDiscount = 100; // Kč (WELCOME10)
const finalTotal = totalAfterPeriodDiscount - promoDiscount; // 12,583.2 - 100 = 12,483.2 Kč

console.log('💰 Expected calculation:', {
  basePrice: basePrice + ' Kč/měsíc',
  osModifier: osModifier + ' Kč/měsíc',
  adjustedMonthlyPrice: adjustedPrice + ' Kč/měsíc',
  period: period + ' měsíců',
  periodDiscount: periodDiscount + '%',
  totalBeforeDiscount: totalBeforeDiscount + ' Kč',
  periodDiscountAmount: discountAmount + ' Kč',
  totalAfterPeriodDiscount: totalAfterPeriodDiscount + ' Kč',
  promoDiscount: promoDiscount + ' Kč',
  finalTotal: finalTotal + ' Kč'
});
```

### **4. Ověření v UI:**

#### **✅ Billing Period sekce:**
- Měl by být vybraný **24 měsíců**
- Měla by být zobrazena **30% sleva**
- Badge "Nejpopulárnější" by neměl být vidět (je na 12 měsících)

#### **✅ Operating System sekce:**
- Měl by být vybraný **Windows Server**
- Mělo by být zobrazeno **+500 Kč/měsíc**

#### **✅ Applications sekce:**
- Měly by být vybrané: **WordPress, MySQL, Nginx**
- Ostatní aplikace by měly být nevybrané

#### **✅ Promo Code sekce:**
- Měl by být aplikován **WELCOME10**
- Měla by být zobrazena sleva **100 Kč**

#### **✅ Order Summary (pravá strana):**
- **Subtotal**: Měl by odpovídat výpočtu výše
- **Period Discount**: 30% sleva
- **Promo Discount**: 100 Kč
- **Final Total**: ~12,483 Kč

### **5. Test objednávky:**

Po vyplnění kontaktních údajů a kliknutí "Dokončit a objednat":

#### **✅ V console by mělo být:**
```
🚀 Starting order creation process...
💰 Using calculated total with period/OS adjustments: {
  total: 12483.2,
  savings: 5392.8,
  promoDiscount: 100,
  currency: 'CZK',
  itemsSource: 'test items'
}
```

#### **✅ Order data by měla obsahovat:**
```javascript
{
  items: [{
    productId: '1',
    productName: 'VPS Start',
    price: 12483.2, // Calculated price with all discounts
    basePrice: '249 Kč/měsíc',
    quantity: 1,
    period: '24',
    billingCycle: '24',
    configOptions: {
      os: 'windows',
      period: '24',
      applications: ['wordpress', 'mysql', 'nginx'],
      osModifier: 500,
      periodDiscount: 30
    }
  }],
  payment: {
    method: 'card',
    amount: 12483.2,
    currency: 'CZK'
  }
}
```

### **6. Troubleshooting:**

#### **❌ Pokud se cart settings nenačtou:**
- Zkontroluj sessionStorage: `sessionStorage.getItem('cartSettings')`
- Zkontroluj console logy při načítání stránky
- Ujisti se, že useEffect pro cart settings běží

#### **❌ Pokud se ceny nepočítají správně:**
- Zkontroluj `getTotalForPeriod()` funkci v console
- Ověř `calculatePrice()` funkci s test daty
- Zkontroluj mapování periods a operatingSystems

#### **❌ Pokud se promo kód neaplikuje:**
- Zkontroluj `appliedPromo` state
- Ověř promo kód validaci
- Zkontroluj promo discount výpočet

### **7. Očekávané výsledky:**

- ✅ **Cart settings se načtou** ze sessionStorage
- ✅ **UI se aktualizuje** podle cart settings
- ✅ **Ceny se počítají správně** s period/OS adjustments
- ✅ **Promo kódy fungují** správně
- ✅ **Order data obsahují** všechny správné údaje
- ✅ **Payment flow pokračuje** se správnými cenami

**Po těchto opravách by payment stránka měla používat skutečné údaje z košíku místo fixních testovacích hodnot!** 🎯
