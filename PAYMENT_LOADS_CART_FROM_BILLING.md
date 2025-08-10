# Payment Loads Cart from Billing

## 🎯 **PAYMENT-METHOD NAČÍTÁ KOŠÍK Z BILLING STRÁNKY!**

### ✅ **Implementované změny:**

#### **1. ✅ Billing ukládá cart data:**
- **PŘED**: Billing ukládal pouze orderData
- **PO**: Billing ukládá kompletní billingCartData do sessionStorage
- **Structure**: Items, pricing, settings, calculations

#### **2. ✅ Payment načítá z billing:**
- **PŘED**: Payment používal cart context (původní cart)
- **PO**: Payment načítá items a pricing z billing
- **Consistency**: Stejné ceny a slevy jako na billing

#### **3. ✅ Complete pricing integration:**
- **Billing calculations**: Payment používá billing pricing functions
- **Same totals**: Stejné celkové ceny jako na billing
- **Professional flow**: Konzistentní pricing napříč celým flow

### **🔧 Implementation Details:**

#### **Billing.js - Save cart data for payment:**
```javascript
// pages/billing.js - handleSubmit()
const handleSubmit = async (e) => {
  // ... order creation logic

  if (result.success) {
    // Store billing cart data for payment step
    const billingCartData = {
      items: items,
      selectedPeriod: selectedPeriod,
      selectedOS: selectedOS,
      selectedApps: selectedApps,
      cartTotal: getCartTotal(),
      cartMonthlyTotal: getCartMonthlyTotal(),
      totalSavings: getTotalSavings(),
      itemPricing: items.map(item => ({
        id: item.id,
        name: item.name,
        monthlyPrice: calculateMonthlyPrice(item),
        periodPrice: calculatePeriodPrice(item),
        savings: calculateItemSavings(item),
        quantity: item.quantity
      })),
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('billingCartData', JSON.stringify(billingCartData));
    console.log('💾 Billing cart data saved for payment:', billingCartData);

    // Store order data for payment step
    sessionStorage.setItem('orderData', JSON.stringify({
      ...result,
      billingData: formData,
      registrationData: registrationData
    }));

    // Redirect to payment step
    router.push('/payment-method');
  }
};
```

#### **Payment.js - Load cart from billing:**
```javascript
// pages/payment.js
export default function Payment() {
  const { clearCart } = useCart(); // Only need clearCart, items will come from billing
  const [items, setItems] = useState([]); // Load items from billing
  const [billingCartData, setBillingCartData] = useState(null);

  // Load billing cart data from sessionStorage
  useEffect(() => {
    const savedBillingCartData = sessionStorage.getItem('billingCartData');
    
    if (savedBillingCartData) {
      try {
        const billingData = JSON.parse(savedBillingCartData);
        console.log('💾 Billing cart data found:', billingData);
        
        setBillingCartData(billingData);
        setItems(billingData.items || []);
        setSelectedPeriod(billingData.selectedPeriod || '12');
        setSelectedOS(billingData.selectedOS || 'linux');
        setSelectedApps(billingData.selectedApps || []);
        
        console.log('✅ Payment page loaded from billing:', {
          items: billingData.items?.length || 0,
          period: billingData.selectedPeriod,
          os: billingData.selectedOS,
          total: billingData.cartTotal
        });
      } catch (error) {
        console.error('❌ Error loading billing cart data:', error);
      }
    }
  }, []);

  // Pricing functions using billing cart data
  const getTotalPrice = () => {
    if (billingCartData && billingCartData.cartTotal !== undefined) {
      console.log('💰 Payment: Using billing cart total:', billingCartData.cartTotal);
      return billingCartData.cartTotal;
    }
    // Fallback calculation
  };

  const getMonthlyTotal = () => {
    if (billingCartData && billingCartData.cartMonthlyTotal !== undefined) {
      return billingCartData.cartMonthlyTotal;
    }
    // Fallback calculation
  };

  const getTotalSavings = () => {
    if (billingCartData && billingCartData.totalSavings !== undefined) {
      return billingCartData.totalSavings;
    }
    return 0;
  };

  // CartSidebar with billing pricing functions
  return (
    <CartSidebar
      // ... standard props
      // Custom pricing functions from billing data
      getCartTotal={getTotalPrice}
      getCartMonthlyTotal={getMonthlyTotal}
      getTotalSavings={getTotalSavings}
    />
  );
};
```

### **📊 Data Structure:**

#### **✅ billingCartData object in sessionStorage:**
```javascript
{
  "items": [
    {
      "id": 5,
      "name": "VPS Start",
      "price": "299 CZK/měs",
      "quantity": 1,
      "allPrices": { "monthly": "299", "annually": "3237" },
      "realSavings": { "annually": { "amount": 351, "percent": 10 } }
    }
  ],
  "selectedPeriod": "12",
  "selectedOS": "linux",
  "selectedApps": [],
  "cartTotal": 3237,           // Total for selected period
  "cartMonthlyTotal": 299,     // Monthly equivalent
  "totalSavings": 351,         // Total savings amount
  "itemPricing": [
    {
      "id": 5,
      "name": "VPS Start",
      "monthlyPrice": 299,
      "periodPrice": 3237,
      "savings": 351,
      "quantity": 1
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **🔍 Data Flow:**

#### **✅ Complete billing → payment flow:**
```
1. Billing Page:
   - User fills billing form
   - Cart items with real savings loaded
   - Billing calculates pricing using own functions
   - User clicks "Pokračovat k platbě"

2. Billing handleSubmit:
   - Create order in HostBill
   - Calculate all pricing data (total, monthly, savings)
   - Save billingCartData to sessionStorage
   - Save orderData to sessionStorage
   - Redirect to /payment-method

3. Payment Page:
   - Load billingCartData from sessionStorage
   - Set items, period, OS, apps from billing data
   - Use billing pricing functions for calculations
   - Display same totals as billing page

4. CartSidebar in Payment:
   - Use payment's pricing functions (which use billing data)
   - Display consistent pricing with billing
   - Professional and accurate UX
```

### **🧪 Expected Results:**

#### **✅ VPS Start example:**
```
Billing Page:
- VPS Start: 3237 CZK (299 CZK/měsíc)
- Sleva: 351 CZK (10%)
- Celkem: 3237 CZK

billingCartData saved:
{
  "cartTotal": 3237,
  "cartMonthlyTotal": 299,
  "totalSavings": 351,
  "itemPricing": [{ "periodPrice": 3237, "monthlyPrice": 299, "savings": 351 }]
}

Payment Page:
- VPS Start: 3237 CZK (299 CZK/měsíc) ✅ (same as billing)
- Sleva: 351 CZK (10%) ✅ (same as billing)
- Celkem: 3237 CZK ✅ (same as billing)
```

#### **✅ Console verification:**
```
Billing Page:
💾 Billing cart data saved for payment: { cartTotal: 3237, totalSavings: 351, ... }

Payment Page:
💾 Billing cart data found: { cartTotal: 3237, totalSavings: 351, ... }
✅ Payment page loaded from billing: { items: 1, period: "12", total: 3237 }
💰 Payment: Using billing cart total: 3237
💰 Payment: Using billing total savings: 351
```

### **🎯 Benefits:**

#### **✅ Consistent pricing:**
- **Same source**: Payment používá billing calculations
- **No recalculation**: Žádné rozdíly mezi billing a payment
- **Professional flow**: Konzistentní pricing napříč celým flow

#### **✅ Complete data transfer:**
- **All pricing**: Total, monthly, savings z billing
- **Item details**: Kompletní pricing per item
- **Settings**: Period, OS, apps z billing

#### **✅ Robust architecture:**
- **Single source**: Billing jako zdroj pro payment pricing
- **Fallback logic**: Graceful handling chybějících dat
- **Debug support**: Console logs pro troubleshooting

### **🧪 Browser Test Steps:**

#### **1. ✅ Test billing → payment flow:**
```
1. Otevři http://localhost:3000/billing
2. Vyplň billing form
3. Zkontroluj pricing na billing:
   - VPS Start: 3237 CZK
   - Sleva: 351 CZK
   - Celkem: 3237 CZK
4. Klikni "Pokračovat k platbě"
5. Payment page:
   - Zkontroluj, že pricing je stejné jako na billing
   - Ověř console logs pro billing data loading
```

#### **2. ✅ Test console logs:**
```
1. Otevři Developer Tools → Console
2. Na billing page klikni "Pokračovat k platbě"
3. Hledej: "💾 Billing cart data saved for payment"
4. Na payment page hledej: "💾 Billing cart data found"
5. Ověř, že payment používá billing data
```

#### **3. ✅ Test sessionStorage:**
```
1. Otevři Developer Tools → Application → Session Storage
2. Po přechodu z billing na payment zkontroluj:
   - billingCartData object s kompletními pricing data
   - orderData object s order details
   - Správné hodnoty pro všechny fields
```

#### **4. ✅ Test pricing consistency:**
```
1. Porovnej pricing mezi billing a payment:
   - Individual item prices
   - Total amounts
   - Monthly equivalents
   - Savings amounts
2. Ověř, že jsou identické
```

### **📋 Verification Checklist:**

- [ ] ✅ **Billing saves cart data**: billingCartData ukládána do sessionStorage
- [ ] ✅ **Payment loads from billing**: Items a pricing z billing
- [ ] ✅ **Consistent pricing**: Same totals na billing i payment
- [ ] ✅ **Complete data transfer**: Items, settings, calculations
- [ ] ✅ **Pricing functions**: Payment používá billing pricing functions
- [ ] ✅ **CartSidebar integration**: Custom functions předány do CartSidebar
- [ ] ✅ **Console logs**: Debug logs pro troubleshooting
- [ ] ✅ **SessionStorage structure**: Správná struktura billingCartData

## 🎉 **Shrnutí:**

**✅ Billing saves complete cart data**: Kompletní pricing a settings do sessionStorage
**✅ Payment loads from billing**: Items a pricing z billing místo cart context
**✅ Consistent pricing flow**: Stejné ceny napříč billing → payment
**✅ Professional UX**: Žádné rozdíly v pricing mezi stránkami
**✅ Robust architecture**: Single source of truth pro payment pricing
**✅ Debug support**: Console logs pro troubleshooting celého flow

**Payment-method nyní načítá košík z billing stránky místo původního cart!** 🎯

**Test workflow:**
1. **Billing Page** → Calculate pricing → Save billingCartData
2. **"Pokračovat k platbě"** → Redirect to payment-method
3. **Payment Page** → Load billing data → Display same pricing
4. **Consistent UX** → Same pricing across billing and payment

**Test dostupný na: http://localhost:3000/billing → Payment → Consistent cart from billing** 🔧
