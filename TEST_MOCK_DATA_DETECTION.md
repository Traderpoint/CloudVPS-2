# Test Mock Data Detection

## 🧪 **TEST SCRIPT PRO DETEKCI MOCK DAT**

### **JavaScript Console Test:**

Otevři browser console na `http://localhost:3000/payment` a spusť:

```javascript
// Test 1: Check for mock total (249 CZK)
console.log('🔍 Testing mock data detection...');

// Check if cart is empty and mock data is used
const cartData = localStorage.getItem('cart');
const billingData = sessionStorage.getItem('billingCartData');

console.log('📊 Cart Analysis:', {
  hasCart: !!cartData,
  hasBillingData: !!billingData,
  cartData: cartData ? JSON.parse(cartData) : null,
  billingData: billingData ? JSON.parse(billingData) : null
});

// Test getTotalPrice function (if available)
if (typeof window.getTotalPrice === 'function') {
  const total = window.getTotalPrice();
  console.log('💰 Total Price:', total);
  
  if (total === 249) {
    console.warn('❌ MOCK DATA DETECTED: Using 249 CZK fallback total');
  } else {
    console.log('✅ Real data: Total is not mock value');
  }
}

// Check for test items
const testItemsPattern = /VPS Start.*249.*Kč/;
const pageContent = document.body.innerText;

if (testItemsPattern.test(pageContent)) {
  console.warn('❌ MOCK DATA DETECTED: Test VPS items found on page');
} else {
  console.log('✅ Real data: No test items detected');
}

// Check for mock amounts in network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url.includes('/api/payments/initialize') && options?.body) {
    try {
      const body = JSON.parse(options.body);
      console.log('🔍 Payment Initialize Request:', body);
      
      if (body.amount === 249) {
        console.warn('❌ MOCK DATA DETECTED: Sending 249 CZK to payment API');
      } else if (body.amount === 362) {
        console.warn('❌ MOCK DATA DETECTED: Sending 362 CZK to payment API');
      } else if (body.amount === 1) {
        console.warn('❌ MOCK DATA DETECTED: Sending 1 CZK to payment API');
      } else {
        console.log('✅ Real data: Payment amount looks real:', body.amount);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('✅ Mock data detection setup complete');
console.log('📝 Now try to create an order and watch for mock data warnings');
```

### **Expected Results:**

#### **✅ With Real Cart Data:**
```
📊 Cart Analysis: {
  hasCart: true,
  hasBillingData: true,
  cartData: [real cart items],
  billingData: {cartTotal: real_amount}
}
✅ Real data: Total is not mock value
✅ Real data: No test items detected
✅ Real data: Payment amount looks real: 1500
```

#### **❌ With Mock Data (Empty Cart):**
```
📊 Cart Analysis: {
  hasCart: false,
  hasBillingData: false,
  cartData: null,
  billingData: null
}
❌ MOCK DATA DETECTED: Using 249 CZK fallback total
❌ MOCK DATA DETECTED: Test VPS items found on page
❌ MOCK DATA DETECTED: Sending 249 CZK to payment API
```

### **Manual Test Steps:**

#### **Test 1: Empty Cart Scenario**
```
1. Clear localStorage and sessionStorage
2. Go to http://localhost:3000/payment
3. Run console script above
4. Look for "249 CZK" or "VPS Start" on page
5. Try to submit payment form
6. Check network tab for payment amount
```

#### **Test 2: Real Cart Scenario**
```
1. Go to http://localhost:3000/vps
2. Add VPS to cart
3. Go to payment page
4. Run console script above
5. Should show real amounts (not 249, 362, or 1)
```

#### **Test 3: Return Handler Fallback**
```
1. Test return URL with missing amount:
   http://localhost:3005/api/payments/return?transId=TEST&refId=INV123&status=success
2. Check middleware logs for "362" fallback
3. Should see: "paymentAmount = 362; // Fallback amount"
```

### **Network Monitoring:**

#### **Watch for these URLs:**
- `/api/payments/initialize` - Check amount field
- `/api/payments/return` - Check for 362 fallback
- `/api/invoices/mark-paid` - Check amount field
- `/api/payments/authorize-capture` - Check amount field

#### **Mock Data Indicators:**
- **249** - Mock total from empty cart
- **362** - Fallback amount in return handler
- **1** - Mock affiliate tracking amount
- **"VPS Start"** - Mock test item name
- **"249 Kč/měsíc"** - Mock test item price

### **Browser DevTools Commands:**

#### **Check Cart State:**
```javascript
// Check localStorage
console.log('Cart:', localStorage.getItem('cart'));
console.log('Billing:', sessionStorage.getItem('billingCartData'));

// Check for mock values in page
console.log('Page contains 249:', document.body.innerText.includes('249'));
console.log('Page contains VPS Start:', document.body.innerText.includes('VPS Start'));
```

#### **Monitor Payment Requests:**
```javascript
// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Fetch:', args[0], args[1]?.body);
  return originalFetch.apply(this, args);
};
```

### **Expected Mock Data Locations:**

#### **❌ Frontend (pages/payment.js):**
- Line 135: `return 249; // Mock total for testing`
- Line 301: `price: '249 Kč/měsíc'` (test item)
- Line 885: `amount: 1, // 1 CZK for testing`

#### **❌ Backend (return.js):**
- Line 194: `paymentAmount = 362; // Fallback amount`

#### **✅ Real Data Sources:**
- ComGate API responses
- HostBill API responses  
- URL parameters from payment gateways
- Cart data from localStorage/sessionStorage

### **Fix Priority:**

#### **🔴 HIGH Priority:**
1. **362 CZK fallback** in return handler
2. **249 CZK mock total** when cart empty

#### **🟡 MEDIUM Priority:**
3. **1 CZK affiliate** tracking amount
4. **Static payment methods** fallback

#### **🟢 LOW Priority:**
5. Test item descriptions and names

**Use this test script to verify that payment process uses real data and identify any remaining mock data usage.**
