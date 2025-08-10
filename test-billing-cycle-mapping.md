# Billing Cycle Mapping Test

## 🎯 **BILLING CYCLE MAPPING OPRAVENO - POUŽÍVÁ selectedPeriod Z CART SETTINGS**

### **Problém identifikován:**
- ❌ **PŘED**: Používal se `item.period` (který neexistuje nebo je nesprávný)
- ✅ **PO**: Používá se `selectedPeriod` z cart settings

### **🔧 Oprava implementována:**

#### **PŘED - nesprávné mapování:**
```javascript
// ŠPATNĚ: Používal item.period (neexistuje)
let billingCycle = item.period || 'm'; // Default to monthly if not set
```

#### **PO - správné mapování:**
```javascript
// SPRÁVNĚ: Používá selectedPeriod z cart settings
const cartPeriod = selectedPeriod || '1'; // Default to 1 month if not set

const periodMapping = {
  '1': 'm',    // 1 month = monthly
  '3': 'q',    // 3 months = quarterly
  '6': 's',    // 6 months = semiannually
  '12': 'a',   // 12 months = annually
  '24': 'b',   // 24 months = biennially
  '36': 't'    // 36 months = triennially
};

const billingCycle = periodMapping[String(cartPeriod)] || 'm';
```

### **🧪 Test Scenarios:**

#### **Test 1: 24 měsíců + Windows**
```javascript
// Cart Settings
selectedPeriod: '24'
selectedOS: 'windows'

// Expected Mapping
cartPeriod: '24'
billingCycle: 'b' (biennially)

// Expected Item Data
{
  productId: '5',
  name: 'VPS Start server',
  price: 559, // Monthly price with discount
  cycle: 'b', // 24 months
  billing_cycle: 'b',
  quantity: 1,
  configOptions: {
    os: 'windows',
    cpu: '2 vCPU',
    ram: '4GB',
    storage: '50GB'
  }
}
```

#### **Test 2: 12 měsíců + Linux**
```javascript
// Cart Settings
selectedPeriod: '12'
selectedOS: 'linux'

// Expected Mapping
cartPeriod: '12'
billingCycle: 'a' (annually)

// Expected Item Data
{
  productId: '5',
  name: 'VPS Start server',
  price: 239, // Monthly price with discount
  cycle: 'a', // 12 months
  billing_cycle: 'a',
  quantity: 1,
  configOptions: {
    os: 'linux',
    cpu: '2 vCPU',
    ram: '4GB',
    storage: '50GB'
  }
}
```

#### **Test 3: 1 měsíc + Linux**
```javascript
// Cart Settings
selectedPeriod: '1'
selectedOS: 'linux'

// Expected Mapping
cartPeriod: '1'
billingCycle: 'm' (monthly)

// Expected Item Data
{
  productId: '5',
  name: 'VPS Start server',
  price: 299, // Full monthly price
  cycle: 'm', // 1 month
  billing_cycle: 'm',
  quantity: 1,
  configOptions: {
    os: 'linux',
    cpu: '2 vCPU',
    ram: '4GB',
    storage: '50GB'
  }
}
```

### **🌐 Browser Test:**

#### **1. Otevři billing stránku:**
```
http://localhost:3000/billing
```

#### **2. Nastav cart settings:**
```javascript
const cartSettings = {
  selectedPeriod: '24',
  selectedOS: 'windows',
  selectedApps: ['wordpress', 'mysql']
};
sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
location.reload();
```

#### **3. Vyplň billing form a klikni "Vytvořit objednávku"**

#### **4. Sleduj console logs:**
```
🔄 Billing cycle mapping (CORRECTED): {
  itemId: 'vps-start',
  itemName: 'VPS Start server',
  selectedPeriod: '24',
  cartPeriod: '24',
  mappedCycle: 'b',
  itemPeriod: 'not set',
  note: 'Using selectedPeriod from cart settings, not item.period'
}

📤 Sending order data to middleware: {
  items: [{
    productId: '5',
    name: 'VPS Start server',
    price: 559,
    cycle: 'b',
    billing_cycle: 'b',
    quantity: 1,
    configOptions: {
      os: 'windows',
      cpu: '2 vCPU',
      ram: '4GB',
      storage: '50GB'
    }
  }],
  cartSettings: {
    selectedPeriod: '24',
    selectedOS: 'windows',
    selectedApps: ['wordpress', 'mysql']
  }
}
```

### **📊 Expected HostBill Order Creation:**

#### **Middleware Log:**
```
📦 Adding item to draft: {
  draftId: 'DRAFT-123',
  productId: '5',
  originalCycle: 'b',
  mappedCycle: 'b',
  itemData: {
    cycle: 'b',
    billing_cycle: 'b'
  }
}
```

#### **HostBill API Call:**
```javascript
{
  call: 'addOrderDraftItem',
  id: 'DRAFT-123',
  prod_type: 'service',
  product: '5',
  cycle: 'b', // 24 months
  qty: 1
}
```

#### **Expected HostBill Invoice:**
```
Product: VPS Start server
Billing Cycle: Biennially (24 months)
Monthly Price: ~559 CZK/month
Total: ~559 × 24 = ~13,416 CZK
```

### **🔍 Verification Steps:**

1. **✅ Cart Settings**: selectedPeriod = '24'
2. **✅ Billing Cycle Mapping**: '24' → 'b'
3. **✅ Item Data**: cycle = 'b', billing_cycle = 'b'
4. **✅ Middleware**: Receives correct billing cycle
5. **✅ HostBill API**: Gets cycle = 'b'
6. **✅ HostBill Invoice**: Shows 24 months billing

### **📋 Debug Checklist:**

- [ ] ✅ **selectedPeriod** z cart settings se používá
- [ ] ✅ **periodMapping** mapuje '24' → 'b'
- [ ] ✅ **items** obsahují správný cycle a billing_cycle
- [ ] ✅ **middleware** dostává správné billing cycle data
- [ ] ✅ **HostBill API** dostává cycle = 'b'
- [ ] ✅ **HostBill faktura** zobrazuje 24 měsíců

### **🎯 Expected Results:**

#### **✅ Console Logs:**
```
🔄 Billing cycle mapping (CORRECTED): {
  selectedPeriod: '24',
  cartPeriod: '24',
  mappedCycle: 'b',
  note: 'Using selectedPeriod from cart settings, not item.period'
}
```

#### **✅ HostBill Invoice:**
- **Product**: VPS Start server
- **Billing Cycle**: Biennially (24 months)
- **Monthly Price**: ~559 CZK/month
- **Total**: ~13,416 CZK

#### **✅ Před vs Po:**

| Aspekt | PŘED | PO |
|--------|------|-----|
| **Billing Cycle Source** | ❌ item.period (neexistuje) | ✅ selectedPeriod (cart settings) |
| **24 měsíců mapping** | ❌ 'm' (monthly) | ✅ 'b' (biennially) |
| **HostBill Invoice** | ❌ 1 month | ✅ 24 months |
| **Invoice Total** | ❌ 299 CZK (1 month) | ✅ ~13,416 CZK (24 months) |

## 🎉 **Shrnutí:**

**✅ Billing cycle mapping opraveno**: Používá selectedPeriod z cart settings
**✅ Správné mapování**: '24' → 'b', '12' → 'a', '1' → 'm'
**✅ HostBill integration**: Dostane správný billing cycle
**✅ Invoice creation**: Faktura na správný počet měsíců

**HostBill nyní dostane správný billing cycle a vytvoří fakturu na 24 měsíců místo 1 měsíc!** 🎯
