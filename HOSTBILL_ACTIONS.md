# HostBill API - Detailní akce a workflow

## 🔧 Konfigurace HostBill API

### Přístupové údaje:
```env
HOSTBILL_URL=https://vps.kabel1it.cz
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=341697c41aeb1c842f0d
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
```

### Základní API volání:
```javascript
const apiCall = {
  api_id: 'adcdebb0e3b6f583052d',
  api_key: '341697c41aeb1c842f0d',
  call: 'methodName',
  // další parametry...
};
```

## 👤 Správa klientů

### 1. Vytvoření nového klienta
**API Call:** `addClient`
```javascript
{
  call: 'addClient',
  firstname: 'Jan',
  lastname: 'Novák', 
  email: 'jan.novak@example.com',
  address1: 'Ulice 123',
  city: 'Praha',
  postcode: '12000',
  country: 'CZ',
  phonenumber: '+420123456789',
  password: 'generatedPassword'
}
```
**Výstup:** `{ client_id: '123', success: true }`

### 2. Vyhledání existujícího klienta
**API Call:** `getClients`
```javascript
{
  call: 'getClients',
  email: 'jan.novak@example.com'
}
```
**Výstup:** Seznam klientů nebo prázdný array

### 3. Aktualizace klienta
**API Call:** `editClient`
```javascript
{
  call: 'editClient',
  id: '123',
  firstname: 'Jan',
  lastname: 'Novák'
}
```

## 🛒 Správa objednávek

### 1. Vytvoření objednávky
**API Call:** `addOrder`
```javascript
{
  call: 'addOrder',
  client_id: '123',
  product: '5', // HostBill Product ID
  cycle: 'm', // m=měsíčně, q=čtvrtletně, s=pololetně, a=ročně
  confirm: 1, // Automatické potvrzení
  invoice_generate: 1, // Vygenerovat fakturu
  invoice_info: 1, // Vrátit info o faktuře
  affiliate_id: '2' // Volitelné - affiliate ID
}
```
**Výstup:** 
```javascript
{
  order_id: '456',
  invoice_id: '789',
  total: '1234.00',
  currency: 'CZK'
}
```

### 2. Přiřazení affiliate k objednávce
**API Call:** `setOrderReferrer`
```javascript
{
  call: 'setOrderReferrer',
  order_id: '456',
  affiliate_id: '2'
}
```

### 3. Získání detailů objednávky
**API Call:** `getOrder`
```javascript
{
  call: 'getOrder',
  id: '456'
}
```

### 4. Aktualizace stavu objednávky
**API Call:** `editOrder`
```javascript
{
  call: 'editOrder',
  id: '456',
  status: 'Active' // Pending, Active, Cancelled, Suspended
}
```

## 💰 Správa faktur

### 1. Vytvoření faktury
**API Call:** `addInvoice`
```javascript
{
  call: 'addInvoice',
  client_id: '123',
  status: 'Unpaid',
  items: JSON.stringify([{
    type: 'product',
    product_id: '5',
    description: 'VPS Start',
    amount: 1,
    price: '604.00'
  }])
}
```

### 2. Označení faktury jako PAID
**API Call:** `setInvoiceStatus`
```javascript
{
  call: 'setInvoiceStatus',
  id: '789', // Invoice ID
  status: 'Paid'
}
```
**Výstup:** `"Invoice #789 marked Paid"`

### 3. Přidání platby k faktuře
**API Call:** `addInvoicePayment`
```javascript
{
  call: 'addInvoicePayment',
  id: '789', // Invoice ID
  amount: '604.00',
  paymentmodule: 'comgate', // nebo 'manual', 'banktransfer'
  fee: '0.00',
  date: '2024-01-15', // YYYY-MM-DD
  transnumber: 'TXN123456',
  send_email: 1 // Poslat email notifikaci
}
```

### 4. Získání detailů faktury
**API Call:** `getInvoice`
```javascript
{
  call: 'getInvoice',
  id: '789'
}
```

## 📦 Správa produktů

### 1. Získání všech produktů
**API Call:** `getOrderPages`
```javascript
{
  call: 'getOrderPages'
}
```

### 2. Detail produktu
**API Call:** `getProduct`
```javascript
{
  call: 'getProduct',
  id: '5'
}
```

## 🤝 Správa affiliate

### 1. Vytvoření affiliate
**API Call:** `addAffiliate`
```javascript
{
  call: 'addAffiliate',
  firstname: 'Partner',
  lastname: 'Systrix',
  email: 'partner@systrix.cz',
  commission: '10.00' // Procenta
}
```

### 2. Získání affiliate
**API Call:** `getAffiliates`
```javascript
{
  call: 'getAffiliates',
  id: '2'
}
```

## 🔄 Workflow v praxi

### Kompletní proces objednávky:

1. **Krok 1: Ověření/vytvoření klienta**
   ```javascript
   // Najít existujícího klienta
   const existingClient = await getClients({ email: 'jan@example.com' });
   
   if (!existingClient.length) {
     // Vytvořit nového klienta
     const newClient = await addClient({
       firstname: 'Jan',
       lastname: 'Novák',
       email: 'jan@example.com'
       // další údaje...
     });
   }
   ```

2. **Krok 2: Vytvoření objednávky**
   ```javascript
   const order = await addOrder({
     client_id: clientId,
     product: '5', // VPS Start
     cycle: 'm',
     confirm: 1,
     invoice_generate: 1,
     affiliate_id: '2'
   });
   ```

3. **Krok 3: Zpracování platby**
   ```javascript
   // Po úspěšné platbě označit fakturu jako PAID
   await setInvoiceStatus({
     id: order.invoice_id,
     status: 'Paid'
   });
   
   // NEBO přidat platbu s detaily
   await addInvoicePayment({
     id: order.invoice_id,
     amount: order.total,
     paymentmodule: 'comgate',
     transnumber: transactionId
   });
   ```

4. **Krok 4: Aktivace služby**
   ```javascript
   // HostBill automaticky aktivuje službu po označení faktury jako PAID
   // Odešle také email s přístupovými údaji
   ```

## ⚠️ Důležité poznámky

### Chyby a řešení:
- **"Invalid API credentials"** → Zkontrolovat API_ID a API_KEY
- **"Product not found"** → Ověřit mapování Product ID
- **"Client not found"** → Vytvořit klienta před objednávkou
- **"Invoice already paid"** → Kontrolovat stav faktury před platbou

### Best practices:
- Vždy kontrolovat existenci klienta před vytvořením objednávky
- Používat `confirm: 1` pro automatické potvrzení objednávky
- Nastavit `invoice_generate: 1` pro automatické vytvoření faktury
- Používat `setInvoiceStatus` pro označení faktury jako PAID
- Logovat všechny API volání pro debugging
