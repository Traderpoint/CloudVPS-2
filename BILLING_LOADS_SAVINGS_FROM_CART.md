# Billing Loads Savings from Cart

## 🎯 **BILLING NAČÍTÁ VÝŠI SLEV Z /CART STRÁNKY!**

### ✅ **Implementované změny:**

#### **1. ✅ Cart ukládá calculated savings:**
- **PŘED**: Cart počítal slevy, ale neukládal je
- **PO**: Cart ukládá calculated savings do sessionStorage
- **Structure**: Ukládá total savings i individual item savings

#### **2. ✅ Billing načítá savings z cart:**
- **PŘED**: Billing počítal vlastní slevy
- **PO**: Billing načítá slevy ze sessionStorage z cart
- **Fallback**: Graceful fallback na vlastní calculations

#### **3. ✅ Consistent savings:**
- **Same source**: Billing používá stejné slevy jako cart
- **No recalculation**: Žádné rozdíly mezi cart a billing
- **Professional UX**: Konzistentní slevy napříč flow

### **🔧 Implementation Details:**

#### **Cart.js - Save calculated savings:**
```javascript
// pages/cart.js - handleProceedToCheckout()
const handleProceedToCheckout = () => {
  // Calculate and save cart savings for billing
  const cartSavings = {
    totalSavings: items.reduce((total, item) => total + calculateItemSavings(item) * item.quantity, 0),
    itemSavings: items.map(item => ({
      id: item.id,
      name: item.name,
      savings: calculateItemSavings(item),
      quantity: item.quantity,
      totalSavings: calculateItemSavings(item) * item.quantity
    })),
    period: selectedPeriod,
    timestamp: new Date().toISOString()
  };
  sessionStorage.setItem('cartSavings', JSON.stringify(cartSavings));
  console.log('💰 Cart savings calculated and saved for billing:', cartSavings);

  // ... rest of checkout logic
};
```

#### **Billing.js - Load savings from cart:**
```javascript
// pages/billing.js
const [cartSavings, setCartSavings] = useState(null);

// Load cart savings from sessionStorage
useEffect(() => {
  const savedCartSavings = sessionStorage.getItem('cartSavings');
  if (savedCartSavings) {
    const savings = JSON.parse(savedCartSavings);
    setCartSavings(savings);
    console.log('💰 Billing: Loaded cart savings from sessionStorage:', savings);
  } else {
    console.log('⚠️ Billing: No cart savings found in sessionStorage');
  }
}, []);

// Calculate savings for an item using cart savings data
const calculateItemSavings = (item) => {
  // First try to use savings from cart page
  if (cartSavings && cartSavings.itemSavings) {
    const itemSaving = cartSavings.itemSavings.find(saving => saving.id === item.id);
    if (itemSaving) {
      console.log(`💰 Billing: Using cart savings for ${item.name}: ${itemSaving.savings} CZK`);
      return itemSaving.savings;
    }
  }

  // Fallback: Use real savings or calculated savings
  // ... fallback logic
};

const getTotalSavings = () => {
  // First try to use total savings from cart page
  if (cartSavings && cartSavings.totalSavings !== undefined) {
    console.log(`💰 Billing: Using cart total savings: ${cartSavings.totalSavings} CZK`);
    return cartSavings.totalSavings;
  }

  // Fallback to calculated savings
  const calculatedTotal = items.reduce((total, item) => {
    return total + calculateItemSavings(item) * item.quantity;
  }, 0);
  return calculatedTotal;
};
```

### **📊 Data Structure:**

#### **✅ cartSavings object in sessionStorage:**
```javascript
{
  "totalSavings": 1424,  // Total savings for all items
  "itemSavings": [
    {
      "id": 5,
      "name": "VPS Start",
      "savings": 351,      // Savings per unit
      "quantity": 1,
      "totalSavings": 351  // Savings × quantity
    },
    {
      "id": 10,
      "name": "VPS Profi",
      "savings": 1073,
      "quantity": 1,
      "totalSavings": 1073
    }
  ],
  "period": "12",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **🔍 Data Flow:**

#### **✅ Complete savings flow:**
```
1. Cart Page:
   - User selects period, OS, items
   - Cart calculates savings using real savings data
   - calculateItemSavings() returns savings per item
   - User clicks "Pokračovat k objednávce"

2. Cart → sessionStorage:
   - Calculate total savings for all items
   - Create itemSavings array with individual savings
   - Store cartSavings object in sessionStorage
   - Redirect to billing

3. Billing Page:
   - Load cartSavings from sessionStorage
   - Use cart savings for display and calculations
   - Fallback to own calculations if cart savings not available
   - Display consistent savings with cart page

4. CartSidebar in Billing:
   - Use billing's calculateItemSavings (which uses cart savings)
   - Display same savings amounts as cart page
   - Professional and consistent UX
```

### **🧪 Expected Results:**

#### **✅ VPS Start + VPS Profi example:**
```
Cart Page Calculations:
- VPS Start: 351 CZK savings (from real savings)
- VPS Profi: 1073 CZK savings (from real savings)
- Total savings: 1424 CZK

sessionStorage cartSavings:
{
  "totalSavings": 1424,
  "itemSavings": [
    { "id": 5, "name": "VPS Start", "savings": 351, "quantity": 1, "totalSavings": 351 },
    { "id": 10, "name": "VPS Profi", "savings": 1073, "quantity": 1, "totalSavings": 1073 }
  ],
  "period": "12"
}

Billing Page Display:
- VPS Start: Uses 351 CZK savings (from cart)
- VPS Profi: Uses 1073 CZK savings (from cart)
- Total savings: 1424 CZK (from cart)
- Ušetříte: 1424 CZK (consistent with cart)
```

#### **✅ Console verification:**
```
Cart Page:
💰 Cart savings calculated and saved for billing: { totalSavings: 1424, itemSavings: [...] }

Billing Page:
💰 Billing: Loaded cart savings from sessionStorage: { totalSavings: 1424, itemSavings: [...] }
💰 Billing: Using cart savings for VPS Start: 351 CZK
💰 Billing: Using cart savings for VPS Profi: 1073 CZK
💰 Billing: Using cart total savings: 1424 CZK
```

### **🎯 Benefits:**

#### **✅ Consistent savings:**
- **Same source**: Billing používá stejné slevy jako cart
- **No differences**: Žádné rozdíly mezi cart a billing
- **Trust building**: Zákazník vidí konzistentní slevy

#### **✅ Performance:**
- **No recalculation**: Billing nemusí počítat slevy znova
- **Fast loading**: Rychlé načtení z sessionStorage
- **Efficient**: Využívá už vypočítané hodnoty

#### **✅ Maintainable:**
- **Single source**: Cart jako jediný zdroj pro savings calculations
- **Fallback logic**: Graceful handling pokud cart savings nejsou dostupné
- **Debug friendly**: Console logs pro troubleshooting

### **🧪 Browser Test Steps:**

#### **1. ✅ Test cart → billing savings flow:**
```
1. Otevři http://localhost:3000/cart
2. Zkontroluj savings na cart page:
   - Individual item savings
   - Total savings amount
3. Klikni "Pokračovat k objednávce"
4. Billing page:
   - Zkontroluj, že savings jsou stejné jako na cart
   - Ověř console logs pro cart savings loading
```

#### **2. ✅ Test console logs:**
```
1. Otevři Developer Tools → Console
2. Na cart page klikni "Pokračovat k objednávce"
3. Hledej: "💰 Cart savings calculated and saved for billing"
4. Na billing page hledej: "💰 Billing: Loaded cart savings from sessionStorage"
5. Ověř, že billing používá cart savings
```

#### **3. ✅ Test sessionStorage:**
```
1. Otevři Developer Tools → Application → Session Storage
2. Po přechodu z cart na billing zkontroluj:
   - cartSavings object s totalSavings a itemSavings
   - Správné hodnoty pro každý item
   - Timestamp a period
```

#### **4. ✅ Test fallback logic:**
```
1. Vymaž sessionStorage
2. Jdi přímo na billing page
3. Zkontroluj, že billing používá fallback calculations
4. Ověř console logs pro fallback usage
```

### **📋 Verification Checklist:**

- [ ] ✅ **Cart saves savings**: cartSavings ukládány do sessionStorage
- [ ] ✅ **Billing loads savings**: cartSavings načítány ze sessionStorage
- [ ] ✅ **Individual item savings**: Billing používá cart savings per item
- [ ] ✅ **Total savings**: Billing používá cart total savings
- [ ] ✅ **Consistent display**: Same savings na cart i billing
- [ ] ✅ **Fallback logic**: Graceful handling chybějících cart savings
- [ ] ✅ **Console logs**: Debug logs pro troubleshooting
- [ ] ✅ **SessionStorage structure**: Správná struktura cartSavings

## 🎉 **Shrnutí:**

**✅ Cart saves savings**: Cart ukládá calculated savings do sessionStorage
**✅ Billing loads from cart**: Billing načítá slevy z cart místo vlastních calculations
**✅ Consistent savings**: Stejné slevy na cart i billing stránkách
**✅ Performance optimized**: No recalculation, fast loading z sessionStorage
**✅ Fallback support**: Graceful handling pokud cart savings nejsou dostupné
**✅ Debug friendly**: Console logs pro troubleshooting celého flow

**Billing nyní načítá výši slev z /cart stránky místo vlastních calculations!** 🎯

**Test workflow:**
1. **Cart Page** → Calculate savings → Save to sessionStorage
2. **Billing Page** → Load savings from sessionStorage → Display same amounts
3. **Consistent UX** → Same savings across cart and billing

**Test dostupný na: http://localhost:3000/cart → Billing → Consistent savings** 🔧
