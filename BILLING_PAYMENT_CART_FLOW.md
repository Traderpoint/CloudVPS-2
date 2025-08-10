# Billing & Payment Method Cart Flow

## 🎯 **KOMPLETNÍ CART FLOW IMPLEMENTOVÁN!**

### ✅ **Cart Flow Overview:**

#### **1. ✅ /cart → /billing:**
- **Cart settings**: Ukládá `selectedPeriod`, `selectedOS`, `selectedApps`, `appliedPromo`
- **Registration data**: Ukládá user data z OAuth/session
- **Cart items**: Přes `useCart()` hook
- **Redirect**: `router.push('/billing')`

#### **2. ✅ /billing → /payment-method:**
- **Order data**: Ukládá `orderData` s billing info a order details
- **Cart settings**: Přebírá z sessionStorage
- **Cart items**: Přes `useCart()` hook
- **Redirect**: `router.push('/payment-method')`

#### **3. ✅ /payment-method:**
- **Order data**: Načítá z sessionStorage
- **Cart settings**: Načítá z sessionStorage
- **Cart items**: Přes `useCart()` hook
- **Payment processing**: S kompletními daty

### **🔧 Implementation Details:**

#### **Cart → Billing data transfer:**
```javascript
// pages/cart.js - handleProceedToCheckout()
const cartSettings = {
  selectedPeriod: selectedPeriod,
  selectedOS: selectedOS,
  selectedApps: selectedApps,
  appliedPromo: appliedPromo,
  timestamp: new Date().toISOString()
};
sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));

// Registration data for authenticated users
const registrationData = {
  email: session.user.email,
  firstName: session.user.name?.split(' ')[0] || '',
  lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
  provider: session.user?.provider || 'google'
};
sessionStorage.setItem('registrationData', JSON.stringify(registrationData));

router.push('/billing');
```

#### **Billing → Payment-method data transfer:**
```javascript
// pages/billing.js - handleSubmit()
// Store order data for payment step
sessionStorage.setItem('orderData', JSON.stringify({
  ...result,                    // Order creation result from API
  billingData: formData,        // Billing form data
  registrationData: registrationData  // User registration data
}));

router.push('/payment-method');
```

#### **Data loading in billing:**
```javascript
// pages/billing.js - useEffect()
// Load cart settings
const cartSettings = sessionStorage.getItem('cartSettings');
if (cartSettings) {
  const settings = JSON.parse(cartSettings);
  setSelectedPeriod(settings.selectedPeriod);
  setSelectedOS(settings.selectedOS);
  setSelectedApps(settings.selectedApps);
}

// Load registration data
const storedData = sessionStorage.getItem('registrationData');
if (storedData) {
  const data = JSON.parse(storedData);
  setRegistrationData(data);
  // Pre-fill form with registration data
}

// Cart items via useCart() hook
const { items, getTotalPrice, affiliateId } = useCart();
```

#### **Data loading in payment-method:**
```javascript
// pages/payment-method.js - useEffect()
// Load cart settings
const cartSettings = sessionStorage.getItem('cartSettings');
if (cartSettings) {
  const settings = JSON.parse(cartSettings);
  setSelectedPeriod(settings.selectedPeriod);
  setSelectedOS(settings.selectedOS);
  setSelectedApps(settings.selectedApps);
  setAppliedPromo(settings.appliedPromo);
}

// Load order data from billing
const storedOrderData = sessionStorage.getItem('orderData');
if (storedOrderData) {
  const data = JSON.parse(storedOrderData);
  setOrderData(data);
} else {
  // Redirect back to billing if no order data
  router.push('/billing');
}

// Cart items via useCart() hook
const { items, getTotalPrice } = useCart();
```

### **📊 Data Flow Structure:**

#### **✅ Cart → Billing:**
```json
sessionStorage: {
  "cartSettings": {
    "selectedPeriod": "12",
    "selectedOS": "linux",
    "selectedApps": [],
    "appliedPromo": null,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "registrationData": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "provider": "google"
  }
}

Cart Items (via useCart):
[
  {
    "id": 5,
    "name": "VPS Start",
    "cpu": "2xCPU",        // From tags
    "ram": "4GB RAM",      // From tags
    "storage": "60GB SSD", // From tags
    "allPrices": { "monthly": "299", "annually": "3237" }
  }
]
```

#### **✅ Billing → Payment-method:**
```json
sessionStorage: {
  "orderData": {
    "success": true,
    "orders": [
      {
        "orderId": "12345",
        "invoiceId": "67890",
        "total": 3237,
        "items": [...]
      }
    ],
    "billingData": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "country": "Czech Republic"
    },
    "registrationData": {
      "email": "user@example.com",
      "provider": "google"
    }
  }
}

// cartSettings remain from previous step
// Cart items remain via useCart hook
```

### **🧪 Complete Flow Test:**

#### **Test 1: Cart → Billing:**
```
1. Na /cart vyber period, OS, apps
2. Klikni "Pokračovat k objednávce"
3. Billing page:
   - ✅ Načte selectedPeriod, selectedOS, selectedApps
   - ✅ Zobrazí správné cart items s specs z tags
   - ✅ Zobrazí správné pricing calculations
   - ✅ Pre-fill registration data (pokud authenticated)
```

#### **Test 2: Billing → Payment-method:**
```
1. Na /billing vyplň billing form
2. Klikni "Pokračovat k platbě"
3. Payment-method page:
   - ✅ Načte orderData z billing
   - ✅ Zobrazí billing summary
   - ✅ Zachová cart settings (period, OS, apps)
   - ✅ Zobrazí správné cart items a pricing
```

#### **Test 3: Data consistency:**
```
1. Zkontroluj specs napříč všemi stránkami:
   - Cart: CPU/RAM/SSD z tags
   - Billing: Same specs z cart items
   - Payment-method: Same specs z cart items
2. Zkontroluj pricing consistency:
   - Cart: Real pricing z middleware
   - Billing: Same pricing calculations
   - Payment-method: Same pricing for payment
```

### **🔍 Debug Information:**

#### **Console logs flow:**
```
Cart:
💾 Cart settings saved for billing: {...}
💾 Registration data saved for billing

Billing:
📅 Cart settings found: {...}
✅ Period set from cart: 12
✅ OS set from cart: linux
✅ Registration data found: {...}
💾 Order data saved for payment-method: {...}

Payment-method:
📅 Payment-method: Cart settings found: {...}
✅ Period set from cart: 12
✅ OS set from cart: linux
💾 Payment-method: Loaded orderData from sessionStorage: {...}
```

#### **SessionStorage verification:**
```javascript
// Check data transfer
console.log('Cart settings:', sessionStorage.getItem('cartSettings'));
console.log('Registration data:', sessionStorage.getItem('registrationData'));
console.log('Order data:', sessionStorage.getItem('orderData'));
```

### **🎯 Benefits:**

#### **✅ Seamless flow:**
- **No data loss**: Všechna data se předávají kompletně
- **Consistent state**: Cart items, settings, pricing napříč stránkami
- **Professional UX**: Smooth transitions bez ztráty kontextu

#### **✅ Data integrity:**
- **Single source**: Cart items z useCart() hook
- **Persistent settings**: SessionStorage pro cart settings
- **Complete context**: Registration, billing, order data

#### **✅ Error handling:**
- **Fallback redirects**: Pokud chybí data, redirect na předchozí step
- **Data validation**: Kontrola dostupnosti dat před použitím
- **Debug support**: Console logs pro troubleshooting

### **📋 Verification Checklist:**

- [ ] ✅ **Cart → Billing**: Cart settings a registration data se předávají
- [ ] ✅ **Billing → Payment-method**: Order data se ukládají a načítají
- [ ] ✅ **Cart items**: useCart() hook funguje napříč stránkami
- [ ] ✅ **Specs consistency**: CPU/RAM/SSD z tags všude stejné
- [ ] ✅ **Pricing consistency**: Real pricing calculations všude
- [ ] ✅ **Settings persistence**: Period, OS, apps se zachovávají
- [ ] ✅ **Error handling**: Redirects při chybějících datech
- [ ] ✅ **Debug logs**: Console logs pro troubleshooting

## 🎉 **Shrnutí:**

**✅ Complete cart flow**: /cart → /billing → /payment-method s kompletními daty
**✅ Data persistence**: SessionStorage pro settings, useCart pro items
**✅ Specs from tags**: CPU/RAM/SSD napříč celým flow
**✅ Real pricing**: HostBill data z middleware API
**✅ Professional UX**: Seamless transitions bez ztráty dat
**✅ Error handling**: Fallback redirects a data validation

**Billing a Payment-method stránky nyní správně přebírají košíky a data od sebe!** 🎯

**Test workflow: Cart → Billing → Payment-method → Complete data flow** 🔧
