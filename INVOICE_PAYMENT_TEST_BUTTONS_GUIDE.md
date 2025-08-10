# Invoice Payment Test - Průvodce tlačítky

## 🎯 **Stránka:** http://localhost:3000/invoice-payment-test

Tato stránka zobrazuje posledních 10 objednávek z HostBill s jejich fakturami a umožňuje testovat různé způsoby plateb.

## 🔄 **Hlavní tlačítko:**

### **🔄 Refresh Data**
- **Funkce:** `loadData()`
- **Co dělá:** 
  - Načte posledních 10 objednávek z HostBill přes middleware
  - Načte dostupné platební metody
  - Aktualizuje zobrazení všech faktur a jejich statusů
- **Kdy použít:** Po provedení platby pro zobrazení aktuálního stavu

---

## 💳 **Tlačítka pro každou fakturu:**

### **1. 💰 Pay (Modrý)**
- **Funkce:** `handlePayInvoice(invoiceId, orderId, amount, selectedMethod)`
- **Co dělá:**
  ```
  1. Inicializuje platbu přes middleware (/api/middleware/initialize-payment)
  2. Pro ComGate: Otevře platební bránu v novém okně
  3. Pro ostatní metody: Zpracuje platbu přímo
  4. Simuluje úspěšnou platbu po 3 sekundách
  5. Označí fakturu jako PAID v HostBill
  6. Přidá platební záznam s transaction ID
  ```
- **Požaduje:** Výběr platební metody z dropdown
- **Výsledek:** Kompletní platební workflow s přesměrováním na bránu

### **2. ✅ Mark as Paid (Zelený)**
- **Funkce:** `handleMarkAsPaid(invoiceId, orderId, amount)`
- **Co dělá:**
  ```
  1. Volá middleware endpoint /api/mark-invoice-paid
  2. Používá HostBill API setInvoiceStatus
  3. Označí fakturu jako "Paid" bez platebního záznamu
  4. Rychlé označení bez transaction ID
  ```
- **Kdy použít:** Rychlé označení faktury jako zaplacené (administrativní účely)
- **Výsledek:** Faktura je označena jako PAID, ale bez platebního záznamu

### **3. ❌ Mark as Unpaid (Červený)**
- **Funkce:** `handleMarkAsUnpaid(invoiceId, orderId, amount)`
- **Co dělá:**
  ```
  1. Volá middleware endpoint /api/mark-invoice-paid
  2. Používá HostBill API setInvoiceStatus
  3. Označí fakturu jako "Unpaid"
  4. Vrátí fakturu do nezaplaceného stavu
  ```
- **Kdy použít:** Storno platby nebo oprava chybně označené faktury
- **Výsledek:** Faktura je označena jako UNPAID

### **4. 🔄 Capture Payment (Tyrkysový)**
- **Funkce:** `handleCapturePayment(invoiceId, orderId, amount)`
- **Co dělá:**
  ```
  1. Volá nový authorize-capture endpoint (/api/middleware/authorize-capture)
  2. Používá skipAuthorize: true (pouze capture)
  3. Přidá platební záznam s transaction ID
  4. Spustí kompletní workflow: Authorize → Capture → Provision
  5. Zobrazí detailní workflow status
  ```
- **Kdy použít:** Test capture payment funkcionality (stejné jako capture-payment-test)
- **Výsledek:** Kompletní platební workflow s detailním reportingem

---

## 📋 **Dropdown menu:**

### **Payment Method Selector**
- **Možnosti:** ComGate, PayU, Manual, Bank Transfer, atd.
- **Funkce:** Určuje, kterou platební metodu použít pro "Pay" tlačítko
- **Výchozí:** ComGate
- **Vliv:** Pouze na "Pay" tlačítko, ostatní tlačítka používají výchozí metody

---

## 🔍 **Rozdíly mezi tlačítky:**

### **Pay vs Mark as Paid:**
| Aspekt | Pay | Mark as Paid |
|--------|-----|--------------|
| **Workflow** | Kompletní platební proces | Pouze změna statusu |
| **Transaction ID** | ✅ Generuje | ❌ Negeneruje |
| **Platební záznam** | ✅ Vytváří | ❌ Nevytváří |
| **Gateway** | ✅ Používá | ❌ Nepoužívá |
| **Rychlost** | 🐌 Pomalejší | 🚀 Rychlejší |

### **Mark as Paid vs Capture Payment:**
| Aspekt | Mark as Paid | Capture Payment |
|--------|--------------|-----------------|
| **API endpoint** | /api/mark-invoice-paid | /api/middleware/authorize-capture |
| **HostBill API** | setInvoiceStatus | addInvoicePayment + setOrderActive |
| **Transaction ID** | ❌ Negeneruje | ✅ Generuje |
| **Workflow reporting** | ❌ Základní | ✅ Detailní |
| **Provisioning** | ❌ Nespouští | ✅ Spouští |

---

## 🎯 **Kdy použít které tlačítko:**

### **🔄 Refresh Data:**
- Po každé platbě pro zobrazení aktuálního stavu
- Při načítání stránky
- Když chceš vidět nejnovější data z HostBill

### **💰 Pay:**
- Test kompletního platebního workflow
- Simulace skutečné platby zákazníka
- Test integrace s platební bránou (ComGate)

### **✅ Mark as Paid:**
- Rychlé administrativní označení faktury
- Když chceš jen změnit status bez platebního záznamu
- Pro testování změn statusů

### **❌ Mark as Unpaid:**
- Storno chybně označené platby
- Reset faktury do původního stavu
- Test změny z PAID na UNPAID

### **🔄 Capture Payment:**
- Test nového authorize-capture workflow
- Když chceš vidět detailní workflow reporting
- Test gateway bypass funkcionality
- Spuštění provisioningu

---

## 📊 **Workflow porovnání:**

```
Pay Button:
User → Select Method → Initialize Payment → Gateway → Return → Mark Paid → Reload

Mark as Paid:
User → Direct Status Change → Reload

Mark as Unpaid:
User → Direct Status Change → Reload

Capture Payment:
User → Authorize-Capture Workflow → Detailed Reporting → Reload
```

## 🎉 **Shrnutí:**

**Invoice Payment Test stránka poskytuje 4 různé způsoby práce s fakturami:**

1. **💰 Pay** - Kompletní platební workflow s gateway
2. **✅ Mark as Paid** - Rychlé administrativní označení
3. **❌ Mark as Unpaid** - Storno/reset faktury
4. **🔄 Capture Payment** - Test nového capture workflow

**Každé tlačítko má svůj specifický účel a používá jiný API endpoint pro různé testovací scénáře!** 🎯
