# VPS Cart Complete Data Flow

## 🎯 **KOMPLETNÍ DATA FLOW: VPS → VPSCartSidebar → Cart**

### ✅ **Data Flow Overview:**

#### **1. ✅ VPS Page:**
- Načte produkty z middleware API
- Extrahuje specs z tags (CPU/RAM/SSD)
- Ukládá kompletní data do cart items

#### **2. ✅ VPSCartSidebar:**
- Používá specs z cart items (z tags)
- Zobrazuje real pricing calculations
- Tlačítko "Pokračovat k objednávce" → `/cart`

#### **3. ✅ Cart Page:**
- Načte kompletní data z cart items
- Používá specs z tags pro zobrazení
- Kompletní checkout process

### **🔧 Implementation Details:**

#### **VPS Page → Cart Items:**
```javascript
// VPS loadProducts - extrakce specs z tags
const extractSpecsFromTags = (tags) => {
  const specs = { cpu: 'N/A', ram: 'N/A', storage: 'N/A' };
  
  if (tags && Object.keys(tags).length > 0) {
    Object.entries(tags).forEach(([tagId, tagValue]) => {
      const value = tagValue.toUpperCase();
      
      if (value.includes('CPU')) specs.cpu = tagValue;
      else if (value.includes('RAM')) specs.ram = tagValue;
      else if (value.includes('SSD')) specs.storage = tagValue;
    });
  }
  
  return specs;
};

// VPS handleAddToCart - ukládá kompletní data
addItem({
  id: plan.id,
  name: plan.name,
  cpu: plan.cpu,        // From tags
  ram: plan.ram,        // From tags
  storage: plan.storage, // From tags
  price: plan.price,
  hostbillPid: plan.hostbillPid,
  allPrices: plan.allPrices, // Real pricing data
  commission: plan.commission,
  tags: plan.tags       // Original tags for debugging
});
```

#### **VPSCartSidebar → Display:**
```jsx
{/* Specs from cart items (from tags) */}
<div className="text-xs text-gray-600 space-y-1 mb-2">
  <div>CPU: {item.cpu}</div>     {/* From tags */}
  <div>RAM: {item.ram}</div>     {/* From tags */}
  <div>Storage: {item.storage}</div> {/* From tags */}
</div>

{/* Link to cart page */}
<Link
  href="/cart"
  className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-bold text-center"
>
  Pokračovat k objednávce
</Link>
```

#### **Cart Page → Complete Data:**
```javascript
// Cart page automatically gets all data from useCart() hook
const { items, getTotalPrice, updateItemPeriod, removeItem, updateQuantity } = useCart();

// Items contain complete data:
// - specs from tags (cpu, ram, storage)
// - real pricing (allPrices)
// - commission data
// - original tags
```

### **📊 Data Structure Flow:**

#### **✅ HostBill Tags → VPS Page:**
```json
{
  "id": "5",
  "name": "VPS Start",
  "tags": {
    "5": "2xCPU",
    "6": "4GB RAM",
    "7": "60GB SSD"
  },
  "m": "299",
  "a": "3237"
}
```

#### **✅ VPS Page → Cart Items:**
```json
{
  "id": 5,
  "name": "VPS Start",
  "cpu": "2xCPU",        // Extracted from tags
  "ram": "4GB RAM",      // Extracted from tags
  "storage": "60GB SSD", // Extracted from tags
  "price": "299 Kč",
  "hostbillPid": 5,
  "allPrices": {
    "monthly": "299",
    "annually": "3237"
  },
  "commission": {
    "rate": "10",
    "monthly_amount": "30"
  },
  "tags": {              // Original tags preserved
    "5": "2xCPU",
    "6": "4GB RAM",
    "7": "60GB SSD"
  }
}
```

#### **✅ Cart Items → VPSCartSidebar:**
```jsx
{/* Uses data from cart items */}
<h4>VPS Start</h4>
<div>CPU: 2xCPU</div>     {/* item.cpu from tags */}
<div>RAM: 4GB RAM</div>   {/* item.ram from tags */}
<div>Storage: 60GB SSD</div> {/* item.storage from tags */}
<div>3237 Kč</div>        {/* Real annual price */}
```

#### **✅ Cart Items → Cart Page:**
```jsx
{/* Same data available on cart page */}
<div className="product-specs">
  <span>CPU: {item.cpu}</span>     {/* From tags */}
  <span>RAM: {item.ram}</span>     {/* From tags */}
  <span>Storage: {item.storage}</span> {/* From tags */}
</div>
```

### **🧪 Complete Test Flow:**

#### **Test 1: VPS → VPSCartSidebar:**
```
1. Otevři http://localhost:3000/vps
2. Klikni "Přidat do košíku" na VPS Start
3. VPSCartSidebar se zobrazí s:
   - CPU: 2xCPU (from tags)
   - RAM: 4GB RAM (from tags)
   - Storage: 60GB SSD (from tags)
   - Real pricing: 3237 Kč annual
```

#### **Test 2: VPSCartSidebar → Cart:**
```
1. V VPSCartSidebar klikni "Pokračovat k objednávce"
2. Redirect na /cart page
3. Cart page zobrazí:
   - Same specs from tags
   - Same pricing data
   - Complete product information
```

#### **Test 3: Data consistency:**
```
1. Porovnej specs na VPS page vs VPSCartSidebar vs Cart page
2. Ověř, že všechny používají stejná data z tags
3. Zkontroluj pricing consistency
4. Ověř commission data flow
```

### **🔍 Debug Information:**

#### **Console logs flow:**
```
VPS Page:
📊 Product 5 (VPS Start) specs from tags: {cpu: '2xCPU', ram: '4GB RAM', storage: '60GB SSD'}
💾 Cart settings saved with pricing data: {...}

VPSCartSidebar:
💰 VPSCartSidebar: Using middleware pricing data for VPS Start: {...}
📊 VPSCartSidebar: VPS Start - Period: 12, Real period price: 3237 CZK

Cart Page:
💰 Using middleware pricing data for VPS Start: {...}
📊 VPS Start - Period: 12, Real price: 3237 CZK, Final: 3237 CZK
```

#### **Data validation points:**
```javascript
// VPS Page
console.log('📊 Product specs from tags:', specs);

// VPSCartSidebar  
console.log('💰 VPSCartSidebar: Using middleware pricing data:', item.allPrices);

// Cart Page
console.log('💰 Cart: Item data:', item);
```

### **🎯 Benefits:**

#### **✅ Single source of truth:**
- **HostBill tags**: Jediný zdroj pro specs
- **Middleware API**: Jediný zdroj pro pricing
- **Cart context**: Jediný zdroj pro cart data

#### **✅ Data consistency:**
- **Same specs**: VPS, VPSCartSidebar, Cart používají stejná data
- **Same pricing**: Real HostBill prices všude
- **Same logic**: Consistent extraction a calculations

#### **✅ Complete data flow:**
- **No data loss**: Všechna data se předávají kompletně
- **No duplication**: Žádné hardcoded specs
- **Real-time**: Změny v HostBill se projeví všude

### **📋 Verification Steps:**

#### **1. ✅ VPS Page specs:**
```
1. Zkontroluj, že VPS Start zobrazuje specs z tags
2. Ověř console log: "📊 Product specs from tags"
3. Zkontroluj, že specs nejsou hardcoded
```

#### **2. ✅ VPSCartSidebar specs:**
```
1. Přidej item do košíku
2. Zkontroluj VPSCartSidebar specs
3. Ověř, že používá item.cpu, item.ram, item.storage
4. Zkontroluj pricing calculations
```

#### **3. ✅ Cart page specs:**
```
1. Klikni "Pokračovat k objednávce"
2. Zkontroluj cart page specs
3. Ověř consistency s VPSCartSidebar
4. Zkontroluj complete data flow
```

#### **4. ✅ Data consistency:**
```
1. Porovnej specs napříč všemi komponenty
2. Ověř pricing consistency
3. Zkontroluj commission data
4. Ověř debug logs
```

### **📊 Expected Results:**

#### **✅ VPS Start complete flow:**
```
VPS Page:
✓ CPU: 2xCPU (from tags)
✓ RAM: 4GB RAM (from tags)  
✓ Storage: 60GB SSD (from tags)
✓ Price: 299 Kč/měsíc

VPSCartSidebar:
✓ CPU: 2xCPU (from cart item)
✓ RAM: 4GB RAM (from cart item)
✓ Storage: 60GB SSD (from cart item)
✓ Total: 3237 Kč (real annual price)

Cart Page:
✓ Same specs from cart item
✓ Same pricing data
✓ Complete checkout process
```

## 🎉 **Shrnutí:**

**✅ Complete data flow**: VPS → VPSCartSidebar → Cart s kompletními daty
**✅ Specs from tags**: Všechny komponenty používají specs z HostBill tags
**✅ Real pricing**: Consistent pricing data napříč celým flow
**✅ No data loss**: Kompletní data se předávají bez ztráty
**✅ Single source**: HostBill jako jediný zdroj pro specs a pricing
**✅ Debug support**: Console logs pro troubleshooting celého flow

**Kompletní data flow je implementován - VPS načte data z tags a předá je přes košík na cart stránku!** 🎯

**Test workflow: VPS (tags) → Add to Cart → VPSCartSidebar (specs) → Cart Page (complete data)** 🔧
