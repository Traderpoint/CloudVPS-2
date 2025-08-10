# Payment Method Cart Integration Test

## 🧪 **Test správného načítání cart settings na payment-method stránce**

### **1. Příprava test dat:**

Otevři browser console na http://localhost:3000/payment-method a spusť:

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

// Simuluj order data (pokud není k dispozici)
const orderData = {
  orders: [{
    id: '433',
    invoiceId: '470',
    totalAmount: 0, // Nechej 0 aby se použil výpočet z košíku
    status: 'Draft'
  }]
};

sessionStorage.setItem('orderData', JSON.stringify(orderData));
console.log('✅ Order data saved to sessionStorage');

// Refresh stránku pro načtení settings
location.reload();
```

### **2. Očekávané chování po refresh:**

#### **✅ V console by mělo být:**
```
🛒 Payment-method: Loading cart settings: { hasCartSettings: true }
📅 Cart settings found: { selectedPeriod: '24', selectedOS: 'windows', ... }
✅ Period set from cart: 24
✅ OS set from cart: windows
✅ Apps set from cart: ['wordpress', 'mysql', 'nginx']
✅ Promo set from cart: { code: 'WELCOME10', ... }
```

#### **✅ V CartSidebar (pravá strana) by mělo být:**
- **Billing Period**: 24 měsíců (30% sleva)
- **Operating System**: Windows Server (+500 Kč/měsíc)
- **Applications**: WordPress, MySQL, Nginx vybrané
- **Promo Code**: WELCOME10 aplikován (-100 Kč)
- **Správná celková cena** s všemi slevami

### **3. Test výpočtu cen při platbě:**

Po kliknutí na "Dokončit a odeslat" spusť v console:

```javascript
// Sleduj výpočet cen
console.log('🧪 Testing payment amount calculation...');

// Očekávaný výpočet:
const basePrice = 249; // Kč/měsíc (VPS Start)
const period = 24; // měsíců
const periodDiscount = 30; // % (pro 24 měsíců)
const osModifier = 500; // Kč/měsíc (Windows)
const promoDiscount = 100; // Kč (WELCOME10)

const adjustedPrice = basePrice + osModifier; // 249 + 500 = 749 Kč/měsíc
const totalBeforeDiscount = adjustedPrice * period; // 749 * 24 = 17,976 Kč
const periodDiscountAmount = totalBeforeDiscount * (periodDiscount / 100); // 17,976 * 0.30 = 5,392.8 Kč
const totalAfterPeriodDiscount = totalBeforeDiscount - periodDiscountAmount; // 17,976 - 5,392.8 = 12,583.2 Kč
const finalTotal = totalAfterPeriodDiscount - promoDiscount; // 12,583.2 - 100 = 12,483.2 Kč

console.log('💰 Expected payment calculation:', {
  basePrice: basePrice + ' Kč/měsíc',
  osModifier: osModifier + ' Kč/měsíc',
  adjustedMonthlyPrice: adjustedPrice + ' Kč/měsíc',
  period: period + ' měsíců',
  periodDiscount: periodDiscount + '%',
  totalBeforeDiscount: totalBeforeDiscount + ' Kč',
  periodDiscountAmount: periodDiscountAmount + ' Kč',
  totalAfterPeriodDiscount: totalAfterPeriodDiscount + ' Kč',
  promoDiscount: promoDiscount + ' Kč',
  finalTotal: finalTotal + ' Kč'
});
```

### **4. Ověření v payment initialization:**

Po kliknutí "Dokončit a odeslat" by v console mělo být:

```
💰 Calculated amount with cart settings: {
  baseAmount: 12583.2,
  promoDiscount: 100,
  finalAmount: 12483.2,
  selectedPeriod: '24',
  selectedOS: 'windows',
  periodDiscount: 30,
  osModifier: 500
}

🔄 Initializing payment with method: comgate
📋 Payment data: {
  orderId: '433',
  invoiceId: '470',
  amount: 12483.2,
  currency: 'CZK',
  method: 'comgate'
}
```

### **5. Test různých scénářů:**

#### **Scénář A: Bez promo kódu**
```javascript
const cartSettings = {
  selectedPeriod: '12', // 12 měsíců = 20% sleva
  selectedOS: 'linux', // Linux = +0 Kč/měsíc
  selectedApps: ['wordpress'],
  appliedPromo: null // Žádný promo kód
};
// Očekávaná cena: 249 * 12 * 0.8 = 2,390.4 Kč
```

#### **Scénář B: Nejdelší období**
```javascript
const cartSettings = {
  selectedPeriod: '36', // 36 měsíců = 40% sleva
  selectedOS: 'windows', // Windows = +500 Kč/měsíc
  selectedApps: ['wordpress', 'mysql', 'nginx', 'redis'],
  appliedPromo: {
    code: 'BIGDISCOUNT',
    discountAmount: 500
  }
};
// Očekávaná cena: (249 + 500) * 36 * 0.6 - 500 = 15,694.4 Kč
```

#### **Scénář C: Nejkratší období**
```javascript
const cartSettings = {
  selectedPeriod: '1', // 1 měsíc = 0% sleva
  selectedOS: 'linux', // Linux = +0 Kč/měsíc
  selectedApps: [],
  appliedPromo: null
};
// Očekávaná cena: 249 * 1 = 249 Kč
```

### **6. Troubleshooting:**

#### **❌ Pokud se cart settings nenačtou:**
- Zkontroluj sessionStorage: `sessionStorage.getItem('cartSettings')`
- Zkontroluj console logy při načítání stránky
- Ujisti se, že useEffect pro cart settings běží

#### **❌ Pokud se ceny nepočítají správně:**
- Zkontroluj `getCartTotalWithSettings()` funkci
- Ověř `calculateItemPrice()` funkci s test daty
- Zkontroluj periods a operatingSystems definice

#### **❌ Pokud CartSidebar neukazuje správné ceny:**
- Zkontroluj props předávané do CartSidebar
- Ověř, že appliedPromo je správně předáno
- Zkontroluj CartSidebar komponentu

### **7. Očekávané výsledky:**

- ✅ **Cart settings se načtou** ze sessionStorage
- ✅ **CartSidebar zobrazí správné ceny** s period/OS adjustments
- ✅ **Promo kódy se aplikují** správně
- ✅ **Payment amount se počítá** s cart settings
- ✅ **Payment initialization** používá správnou částku
- ✅ **Redirect na ComGate** s reálnou částkou

### **8. Finální test:**

Po dokončení všech kroků:

1. **Načti cart settings** pomocí test scriptu
2. **Ověř UI** - CartSidebar ukazuje správné ceny
3. **Klikni "Dokončit a odeslat"** - sleduj console logy
4. **Ověř payment amount** - měl by odpovídat výpočtu
5. **Pokračuj na ComGate** - částka by měla být správná

**Po těchto opravách by payment-method stránka měla používat skutečné údaje z košíku včetně billing period a správných cen!** 🎯
