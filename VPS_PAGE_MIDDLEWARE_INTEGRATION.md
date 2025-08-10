# VPS Page Middleware Integration

## 🎯 **VPS STRÁNKA INTEGROVÁNA S MIDDLEWARE API!**

### ✅ **Implementované změny:**

#### **1. ✅ Dynamic product loading:**
- **PŘED**: Hardcoded plány v kódu
- **PO**: Načítání z middleware API (stejná metoda jako middleware-affiliate-products)

#### **2. ✅ Real-time pricing:**
- **PŘED**: Statické ceny (249, 499, 999, 1899 Kč)
- **PO**: Aktuální ceny z HostBill (299, 499, 899, 1599 Kč)

#### **3. ✅ Affiliate integration:**
- **PŘED**: Pouze affiliate tracking
- **PO**: Zobrazení komisí pro affiliate partnery

#### **4. ✅ Multi-period pricing:**
- **PŘED**: Pouze měsíční ceny
- **PO**: Zobrazení ročních a dvouletých cen

### **🔧 Implementace:**

#### **State management:**
```javascript
const [products, setProducts] = useState([]);
const [productsLoading, setProductsLoading] = useState(true);
const [productsError, setProductsError] = useState(null);
```

#### **Product loading:**
```javascript
const loadProducts = async () => {
  const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';
  const mode = affiliateId ? 'affiliate' : 'all';
  const affId = affiliateId || '1';
  const url = `${middlewareUrl}/api/affiliate/${affId}/products?mode=${mode}`;
  
  const response = await fetch(url);
  const result = await response.json();
  
  // Map HostBill products to VPS format
  const mappedProducts = result.products.map(product => ({
    id: parseInt(product.id),
    name: mapping.name,
    cpu: mapping.cpu,
    ram: mapping.ram,
    storage: mapping.storage,
    price: `${product.m || '299'} Kč`, // Real HostBill price
    commission: product.commission,
    allPrices: {
      monthly: product.m || '0',
      annually: product.a || '0',
      biennially: product.b || '0'
    }
  }));
};
```

#### **Product mapping:**
```javascript
const productMapping = {
  '5': { name: 'VPS Start', cpu: '2 jádra', ram: '4 GB', storage: '50 GB', popular: false },
  '10': { name: 'VPS Profi', cpu: '4 jádra', ram: '8 GB', storage: '100 GB', popular: true },
  '11': { name: 'VPS Premium', cpu: '8 jader', ram: '16 GB', storage: '200 GB', popular: false },
  '12': { name: 'VPS Enterprise', cpu: '12 jader', ram: '32 GB', storage: '400 GB', popular: false }
};
```

### **🌐 UI Enhancements:**

#### **Loading state:**
```jsx
{productsLoading ? (
  <div className="text-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
    <p className="text-gray-600">Načítám produkty...</p>
  </div>
) : (
  // Products display
)}
```

#### **Error handling:**
```jsx
{productsError ? (
  <div className="text-center py-8">
    <p className="text-red-600 mb-4">Chyba při načítání produktů: {productsError}</p>
    <button onClick={loadProducts}>Zkusit znovu</button>
  </div>
) : (
  // Products display
)}
```

#### **Enhanced product cards:**
```jsx
{/* Pricing info */}
{plan.allPrices && (
  <div className="mb-2 text-xs text-gray-600">
    {plan.allPrices.annually !== '0' && (
      <div>Ročně: {plan.allPrices.annually} CZK/měsíc</div>
    )}
    {plan.allPrices.biennially !== '0' && (
      <div>2 roky: {plan.allPrices.biennially} CZK/měsíc</div>
    )}
  </div>
)}

{/* Commission info for affiliates */}
{plan.commission && affiliateValidated && (
  <div className="mb-2 text-xs text-green-600 font-semibold">
    💰 Provize: {plan.commission.rate}% = {plan.commission.monthly_amount} CZK/měsíc
  </div>
)}
```

### **🧪 Test Scenarios:**

#### **Test 1: Regular user (no affiliate):**
```
URL: http://localhost:3000/vps

Expected:
- Products loaded from middleware API (mode=all)
- Real HostBill prices displayed
- No commission info shown
- Fallback to hardcoded plans if API fails
```

#### **Test 2: Affiliate user:**
```
URL: http://localhost:3000/vps?affiliate_id=1

Expected:
- Products loaded with affiliate commission data (mode=affiliate)
- Commission info displayed for validated affiliate
- Green affiliate button styling
- Partner provize aktivní message
```

#### **Test 3: API failure:**
```
Middleware API down or error

Expected:
- Error message displayed
- "Zkusit znovu" button
- Fallback to hardcoded plans
- No app crash
```

### **📊 Expected Results:**

#### **✅ Product pricing (after HostBill update):**
```
VPS Start:     299 CZK/měsíc (was 249 CZK)
VPS Profi:     499 CZK/měsíc (unchanged)
VPS Premium:   899 CZK/měsíc (was 999 CZK)
VPS Enterprise: 1599 CZK/měsíc (was 1899 CZK)
```

#### **✅ Multi-period pricing:**
```
VPS Start:
- Měsíčně: 299 CZK
- Ročně: 3237 CZK (269 CZK/měsíc) - 10% sleva
- 2 roky: 6103 CZK (254 CZK/měsíc) - 15% sleva
```

#### **✅ Affiliate commission (for affiliate #1):**
```
VPS Start: 10% = 30 CZK/měsíc
VPS Profi: 15% = 75 CZK/měsíc
VPS Premium: 20% = 180 CZK/měsíc
VPS Enterprise: 25% = 400 CZK/měsíc
```

### **🔄 Data Flow:**

#### **1. Page Load:**
```
VPS Page → loadProducts() → Middleware API → HostBill API → Real pricing data
```

#### **2. Affiliate Detection:**
```
URL params → setAffiliate() → loadProducts(affiliate mode) → Commission data
```

#### **3. Error Handling:**
```
API Error → Error message → Retry button → Fallback to hardcoded plans
```

### **🎯 Business Benefits:**

#### **✅ Real-time pricing:**
- Ceny se automaticky aktualizují při změně v HostBill
- Konzistentní pricing napříč aplikací
- Centralizované pricing management

#### **✅ Affiliate integration:**
- Affiliate partneři vidí své provize
- Motivace pro affiliate marketing
- Transparentní commission struktura

#### **✅ Multi-period options:**
- Zákazníci vidí slevy za delší závazky
- Vyšší konverze na dlouhodobé plány
- Lepší customer lifetime value

### **📋 Verification Steps:**

#### **1. ✅ Regular user test:**
```
1. Otevři http://localhost:3000/vps
2. Ověř načítání produktů z API
3. Zkontroluj aktuální ceny (299, 499, 899, 1599)
4. Ověř, že se nezobrazují komise
```

#### **2. ✅ Affiliate user test:**
```
1. Otevři http://localhost:3000/vps?affiliate_id=1
2. Ověř affiliate validaci
3. Zkontroluj zobrazení komisí
4. Ověř zelené affiliate tlačítko
```

#### **3. ✅ API failure test:**
```
1. Zastav middleware (port 3005)
2. Otevři VPS stránku
3. Ověř error handling
4. Zkontroluj fallback na hardcoded plány
```

#### **4. ✅ Multi-period pricing test:**
```
1. Nastav ceny pro všechna období v HostBill
2. Reload VPS stránku
3. Ověř zobrazení ročních/dvouletých cen
4. Zkontroluj správnost slev
```

## 🎉 **Shrnutí:**

**✅ VPS stránka integrována**: Používá stejnou metodu jako middleware-affiliate-products
**✅ Real-time pricing**: Aktuální ceny z HostBill místo hardcoded
**✅ Affiliate integration**: Zobrazení komisí pro partnery
**✅ Multi-period pricing**: Roční a dvouleté ceny se slevami
**✅ Error handling**: Graceful fallback při API failure
**✅ Loading states**: Professional UX s loading indikátory

**VPS stránka je nyní plně integrována s middleware API a zobrazuje aktuální data z HostBill!** 🎯

**Test dostupný na: http://localhost:3000/vps**

**Workflow: API Load → Real Pricing → Affiliate Commission → Multi-period Options** 🔧
