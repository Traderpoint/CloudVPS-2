# Cloud VPS - Aktuální Workflow a Order Flow

## 🔄 Celkový Workflow Cloud VPS

### 1. **Výběr produktu a konfigurace** (`/vps`, `/cart`)
- Uživatel vybere VPS produkt (Basic, Pro, Premium, Enterprise)
- Konfigurace fakturačního období (1, 3, 6, 12, 24, 36 měsíců)
- Výběr operačního systému (Linux/Windows Server)
- Volba aplikací (cPanel, Plesk, atd.)
- Přidání do košíku

### 2. **Registrace/Přihlášení** (`/register`, `/login`)
- Google OAuth nebo email registrace
- Uložení registračních dat do sessionStorage
- Přesměrování na billing

### 3. **Fakturační údaje** (`/billing`)
- Vyplnění osobních a fakturačních údajů
- Volba platební metody
- Vytvoření objednávky přes `/api/orders/create`

### 4. **Zpracování objednávky** (Middleware)
- Předání objednávky na Middleware (port 3005)
- Zpracování přes `systrix-middleware-nextjs`
- Komunikace s HostBill API

### 5. **Platba** (`/payment`)
- Inicializace platební brány (ComGate, atd.)
- Zpracování platby
- Označení faktury jako PAID v HostBill

### 6. **Potvrzení** (`/order-success`)
- Zobrazení úspěšné objednávky
- Detaily objednávky a platby

## 🛒 Order Flow - Detailní proces

### Fáze 1: Vytvoření objednávky (`/api/orders/create`)

**Vstup:**
```javascript
{
  customer: { firstName, lastName, email, phone, address, city, postalCode, country, company },
  items: [{ productId, name, quantity, price }],
  paymentMethod: 'comgate',
  total: 1234,
  affiliate: { id, code }
}
```

**Proces:**
1. Validace vstupních dat
2. Transformace dat pro middleware
3. Odeslání na `${MIDDLEWARE_URL}/api/process-order`
4. Vrácení výsledku s order_id a invoice_id

### Fáze 2: Middleware zpracování (`systrix-middleware-nextjs`)

**Endpoint:** `/api/process-order`

**Proces:**
1. **Inicializace:** HostBillClient + OrderProcessor
2. **Zpracování:** `processCompleteOrder()`
3. **Výstup:** Kompletní objednávka s fakturou

### Fáze 3: HostBill API operace

#### A) Vytvoření/nalezení klienta
**API Call:** `addClient` nebo `getClients`
```javascript
{
  call: 'addClient',
  firstname: 'Jan',
  lastname: 'Novák',
  email: 'jan@example.com',
  address1: 'Ulice 123',
  city: 'Praha',
  postcode: '12000',
  country: 'CZ'
}
```

#### B) Vytvoření objednávky
**API Call:** `addOrder`
```javascript
{
  call: 'addOrder',
  client_id: '123',
  product: '5', // HostBill Product ID
  cycle: 'm',
  confirm: 1,
  invoice_generate: 1,
  invoice_info: 1,
  affiliate_id: '2' // Pokud je affiliate
}
```

#### C) Přiřazení affiliate (pokud existuje)
**API Call:** `setOrderReferrer`
```javascript
{
  call: 'setOrderReferrer',
  order_id: '456',
  affiliate_id: '2'
}
```

## 💳 Payment Flow - Platební proces

### Fáze 1: Inicializace platby (`/payment`)

**Proces:**
1. Načtení objednávky ze sessionStorage
2. Zobrazení platebních metod
3. Výběr platební metody (ComGate, bankovní převod)
4. Inicializace platební brány

### Fáze 2: Zpracování platby

#### ComGate platba:
1. **Vytvoření platby:** `/api/payments/comgate/create`
2. **Přesměrování:** Na ComGate bránu
3. **Callback:** `/api/payments/comgate/callback`
4. **Verifikace:** Kontrola podpisu a stavu

#### Bankovní převod:
1. **Zobrazení:** Platebních údajů
2. **Čekání:** Na manuální potvrzení
3. **Označení:** Faktury jako PAID administrátorem

### Fáze 3: Označení faktury jako PAID

**API Call:** `setInvoiceStatus`
```javascript
{
  call: 'setInvoiceStatus',
  id: 'invoice_id',
  status: 'Paid'
}
```

**Alternativně:** `addInvoicePayment`
```javascript
{
  call: 'addInvoicePayment',
  id: 'invoice_id',
  amount: '1234.00',
  paymentmodule: 'comgate',
  transnumber: 'TXN123456',
  send_email: 1
}
```

## 🔧 Mapování produktů

### Cloud VPS → HostBill Product ID
```javascript
const PRODUCT_MAPPING = {
  '1': '5',   // VPS Basic → VPS Start
  '2': '10',  // VPS Pro → VPS Profi  
  '3': '11',  // VPS Premium → VPS Premium
  '4': '12'   // VPS Enterprise → VPS Enterprise
};
```

## 📧 Email notifikace

### Automatické emaily z HostBill:
1. **Potvrzení objednávky** - při vytvoření objednávky
2. **Faktura** - při vygenerování faktury
3. **Potvrzení platby** - při označení faktury jako PAID
4. **Aktivace služby** - při aktivaci VPS

## 🔍 Monitoring a logy

### Klíčové logy:
- `🛒 Creating order...` - Vytváření objednávky
- `✅ Order created successfully` - Úspěšné vytvoření
- `💳 Processing payment...` - Zpracování platby
- `✅ Invoice marked as PAID` - Označení faktury

### Error handling:
- Validace vstupních dat
- Retry mechanismus pro API calls
- Fallback na bankovní převod při selhání platební brány
- Detailní error logy pro debugging

## 🎯 Klíčové komponenty systému

### Frontend (Cloud VPS - port 3000):
- **Pages:** `/vps`, `/cart`, `/register`, `/billing`, `/payment`, `/order-success`
- **API Routes:** `/api/orders/create`, `/api/payments/*`
- **Contexts:** CartContext pro správu košíku

### Middleware (port 3005):
- **systrix-middleware-nextjs:** Hlavní middleware pro zpracování objednávek
- **API:** `/api/process-order`, `/api/invoices/*`, `/api/payments/*`
- **Komponenty:** HostBillClient, OrderProcessor, PaymentProcessor

### HostBill (vps.kabel1it.cz):
- **API Endpoint:** `/admin/api.php`
- **Klíčové funkce:** addClient, addOrder, setInvoiceStatus, addInvoicePayment
- **Produkty:** VPS Start (5), VPS Profi (10), VPS Premium (11), VPS Enterprise (12)

## 🔄 Stavové diagramy

### Stav objednávky:
1. **Draft** → Objednávka v košíku
2. **Pending** → Objednávka vytvořena v HostBill
3. **Active** → Objednávka potvrzena a aktivní
4. **Cancelled** → Objednávka zrušena

### Stav faktury:
1. **Unpaid** → Neuhrazená faktura
2. **Paid** → Uhrazená faktura
3. **Cancelled** → Zrušená faktura

### Stav platby:
1. **Pending** → Čeká na zpracování
2. **Processing** → Zpracovává se
3. **Completed** → Dokončena
4. **Failed** → Neúspěšná
