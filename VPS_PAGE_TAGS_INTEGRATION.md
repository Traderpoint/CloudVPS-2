# VPS Page Tags Integration

## 🎯 **VPS STRÁNKA POUŽÍVÁ TAGS PRO SPECIFIKACE!**

### ✅ **Implementované změny:**

#### **1. ✅ Dynamic specifications:**
- **PŘED**: Hardcoded specs v productMapping
- **PO**: Extrakce specs z tags (stejně jako middleware-affiliate-products)

#### **2. ✅ Tags extraction logic:**
- **CPU**: Hledá tags obsahující "CPU"
- **RAM**: Hledá tags obsahující "RAM"  
- **Storage**: Hledá tags obsahující "SSD"
- **Fallback**: "N/A" pokud tag není nalezen

#### **3. ✅ Smart display:**
- **No duplication**: Pokud storage už obsahuje "SSD", nepřidává "NVMe SSD"
- **Debug info**: Console logs pro troubleshooting
- **Consistent**: Stejná logika jako middleware-affiliate-products

### **🔧 Implementation:**

#### **Tags extraction function:**
```javascript
const extractSpecsFromTags = (tags) => {
  const specs = { cpu: 'N/A', ram: 'N/A', storage: 'N/A' };
  
  if (tags && Object.keys(tags).length > 0) {
    Object.entries(tags).forEach(([tagId, tagValue]) => {
      const value = tagValue.toUpperCase();
      
      if (value.includes('CPU')) {
        specs.cpu = tagValue;
      } else if (value.includes('RAM')) {
        specs.ram = tagValue;
      } else if (value.includes('SSD')) {
        specs.storage = tagValue;
      }
    });
  }
  
  return specs;
};
```

#### **Product mapping (updated):**
```javascript
// Map product IDs to VPS plans (name and popularity only)
const productMapping = {
  '5': { name: 'VPS Start', popular: false },
  '10': { name: 'VPS Profi', popular: true },
  '11': { name: 'VPS Premium', popular: false },
  '12': { name: 'VPS Enterprise', popular: false }
};

// Extract specs from tags
const specs = extractSpecsFromTags(product.tags);

return {
  id: parseInt(product.id),
  name: mapping.name,
  cpu: specs.cpu,     // From tags
  ram: specs.ram,     // From tags
  storage: specs.storage, // From tags
  // ... rest of product data
  tags: product.tags  // Store for debugging
};
```

#### **Smart storage display:**
```jsx
<span className="text-xs text-gray-700">
  <strong>Storage:</strong> {plan.storage}{plan.storage.includes('SSD') ? '' : ' NVMe SSD'}
</span>
```

### **🧪 Test Scenarios:**

#### **Test 1: VPS Start with tags:**
```
Input tags:
{
  "5": "2xCPU",
  "6": "4GB RAM", 
  "7": "60GB SSD"
}

Expected output:
CPU: 2xCPU
RAM: 4GB RAM
Storage: 60GB SSD (no duplicate "NVMe SSD")

Console: "📊 Product 5 (VPS Start) specs from tags: {cpu: '2xCPU', ram: '4GB RAM', storage: '60GB SSD'}"
```

#### **Test 2: VPS Profi with different format:**
```
Input tags:
{
  "5": "4x CPU",
  "6": "8 GB RAM", 
  "7": "100GB NVMe SSD"
}

Expected output:
CPU: 4x CPU
RAM: 8 GB RAM
Storage: 100GB NVMe SSD (no duplicate)
```

#### **Test 3: Missing tags:**
```
Input tags:
{
  "8": "100Mbps",
  "9": "Linux/Windows"
}

Expected output:
CPU: N/A
RAM: N/A
Storage: N/A NVMe SSD (fallback adds NVMe SSD)
```

#### **Test 4: Partial tags:**
```
Input tags:
{
  "5": "8xCPU",
  "8": "1Gbps"
}

Expected output:
CPU: 8xCPU
RAM: N/A
Storage: N/A NVMe SSD
```

### **📊 Before vs After:**

#### **❌ Before (hardcoded):**
```javascript
const productMapping = {
  '5': { name: 'VPS Start', cpu: '2 jádra', ram: '4 GB', storage: '50 GB', popular: false },
  '10': { name: 'VPS Profi', cpu: '4 jádra', ram: '8 GB', storage: '100 GB', popular: true }
};

// Static specs, no connection to HostBill tags
```

#### **✅ After (dynamic):**
```javascript
const productMapping = {
  '5': { name: 'VPS Start', popular: false },
  '10': { name: 'VPS Profi', popular: true }
};

const specs = extractSpecsFromTags(product.tags);
// Dynamic specs from HostBill tags
```

### **🔍 Debug Information:**

#### **Console logs:**
```
📡 Fetching products: http://localhost:3005/api/affiliate/1/products?mode=affiliate
✅ VPS products loaded successfully: [...]
📊 Product 5 (VPS Start) specs from tags: {cpu: '2xCPU', ram: '4GB RAM', storage: '60GB SSD'}
📊 Product 10 (VPS Profi) specs from tags: {cpu: '4xCPU', ram: '8GB RAM', storage: '100GB SSD'}
```

#### **Product structure:**
```javascript
{
  id: 5,
  name: "VPS Start",
  cpu: "2xCPU",        // From tags
  ram: "4GB RAM",      // From tags
  storage: "60GB SSD", // From tags
  price: "299 Kč",
  allPrices: {...},
  tags: {              // Original tags stored
    "5": "2xCPU",
    "6": "4GB RAM",
    "7": "60GB SSD"
  }
}
```

### **🎯 Benefits:**

#### **✅ Consistency:**
- **Same source**: VPS page i middleware-affiliate-products používají stejná data
- **Same logic**: Stejná extraction logic pro specs
- **Real data**: Specs z HostBill tags místo hardcoded

#### **✅ Maintainability:**
- **Single source**: Specs se mění pouze v HostBill tags
- **No duplication**: Žádné hardcoded specs v kódu
- **Automatic updates**: Změny v HostBill se projeví automaticky

#### **✅ Flexibility:**
- **Dynamic**: Specs se mohou lišit podle produktu
- **Fallback**: Graceful handling chybějících tags
- **Debug friendly**: Console logs pro troubleshooting

### **🧪 Browser Test Steps:**

#### **1. ✅ Test specs extraction:**
```
1. Otevři http://localhost:3000/vps
2. Zkontroluj VPS Start specifikace:
   - CPU: 2xCPU (from tags)
   - RAM: 4GB RAM (from tags)
   - Storage: 60GB SSD (from tags, no duplicate)
3. Ověř console logs
```

#### **2. ✅ Test different products:**
```
1. Zkontroluj VPS Profi, Premium, Enterprise
2. Ověř, že každý má specs z vlastních tags
3. Zkontroluj správné extraction
4. Ověř no duplication v storage
```

#### **3. ✅ Test fallback:**
```
1. Pokud produkt nemá CPU/RAM/SSD tags
2. Ověř zobrazení "N/A"
3. Zkontroluj fallback "NVMe SSD" pro storage
4. Ověř graceful handling
```

#### **4. ✅ Test consistency:**
```
1. Porovnej specs na VPS page vs middleware-affiliate-products
2. Ověř, že používají stejná data
3. Zkontroluj consistency extraction logic
4. Ověř same source (HostBill tags)
```

### **📋 Expected Results:**

#### **✅ VPS Start:**
```
VPS Page Display:
✓ CPU: 2xCPU
✓ RAM: 4GB RAM  
✓ Storage: 60GB SSD

Console:
📊 Product 5 (VPS Start) specs from tags: {cpu: '2xCPU', ram: '4GB RAM', storage: '60GB SSD'}
```

#### **✅ VPS Profi:**
```
VPS Page Display:
✓ CPU: 4xCPU
✓ RAM: 8GB RAM
✓ Storage: 100GB SSD

Console:
📊 Product 10 (VPS Profi) specs from tags: {cpu: '4xCPU', ram: '8GB RAM', storage: '100GB SSD'}
```

### **📋 Verification Checklist:**

- [ ] ✅ **Dynamic specs**: Extrakce z tags místo hardcoded
- [ ] ✅ **CPU extraction**: Správné hledání "CPU" v tags
- [ ] ✅ **RAM extraction**: Správné hledání "RAM" v tags
- [ ] ✅ **Storage extraction**: Správné hledání "SSD" v tags
- [ ] ✅ **No duplication**: Storage bez duplicate "NVMe SSD"
- [ ] ✅ **Fallback**: "N/A" pro chybějící tags
- [ ] ✅ **Debug logs**: Console logs pro troubleshooting
- [ ] ✅ **Consistency**: Same logic jako middleware-affiliate-products

## 🎉 **Shrnutí:**

**✅ Dynamic specifications**: VPS page používá tags místo hardcoded specs
**✅ Consistent extraction**: Stejná logika jako middleware-affiliate-products
**✅ Smart display**: No duplication, proper fallbacks
**✅ Real data**: Specs z HostBill tags, automatic updates
**✅ Debug support**: Console logs pro troubleshooting
**✅ Maintainable**: Single source of truth v HostBill

**VPS stránka nyní dynamicky načítá specifikace z HostBill tags!** 🎯

**Test dostupný na: http://localhost:3000/vps → Dynamic specs from tags** 🔧
