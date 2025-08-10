# ComGate Return URL Example

## 🔗 Příklad skutečného ComGate return URL

Po úspěšné ComGate platbě by zákazník byl přesměrován na:

```
http://localhost:3000/payment-success?invoiceId=446&orderId=426&amount=100+CZK&paymentMethod=comgate&status=success&transactionId=COMGATE-TXN-1754325147714&refId=CG-1754325147714&REFNO=REF-1754325147714&label=446
```

## 📋 Rozložené parametry

| Parametr | Hodnota | Popis |
|----------|---------|-------|
| `invoiceId` | `446` | ID faktury |
| `orderId` | `426` | ID objednávky |
| `amount` | `100 CZK` | Částka s měnou |
| `paymentMethod` | `comgate` | Platební metoda |
| `status` | `success` | Status platby |
| `transactionId` | `COMGATE-TXN-1754325147714` | **REAL ComGate transaction ID** |
| `refId` | `CG-1754325147714` | ComGate reference ID |
| `REFNO` | `REF-1754325147714` | ComGate reference number |
| `label` | `446` | Label (obvykle invoice ID) |

## 🔍 Jak payment-success stránka zpracuje parametry

```javascript
// 1. Extrakce všech možných transaction ID formátů
const { 
  transactionId,    // COMGATE-TXN-1754325147714
  refId,           // CG-1754325147714
  REFNO,           // REF-1754325147714
  label            // 446
} = router.query;

// 2. Určení skutečného transaction ID (priorita)
const actualTransactionId = transactionId || refId || REFNO || label;
// Výsledek: "COMGATE-TXN-1754325147714"

// 3. Volání authorize-capture s REAL transaction ID
const workflowData = {
  orderId: "426",
  invoiceId: "446",
  transactionId: "COMGATE-TXN-1754325147714", // ← REAL ComGate ID
  amount: 100,
  currency: "CZK",
  paymentMethod: "comgate"
};
```

## 🎯 Výsledek v HostBill

Po zpracování bude v HostBill:

### Invoice Payment Record:
- **Transaction Number**: `COMGATE-TXN-1754325147714`
- **Amount**: `100.00 CZK`
- **Payment Module**: `comgate`
- **Status**: `Paid`
- **Date**: `2025-08-04`

### Audit Trail:
```
Payment captured via comgate - Transaction: COMGATE-TXN-1754325147714
Real ComGate payment - Transaction: COMGATE-TXN-1754325147714, RefId: CG-1754325147714
```

## 🔧 Pro testování

Můžeš simulovat ComGate return tím, že navštívíš URL:

```
http://localhost:3000/payment-success?invoiceId=446&orderId=426&amount=100&transactionId=TEST-COMGATE-123&status=success
```

Nebo použij test script:
```bash
node test-comgate-payment-flow.js
```

## ✅ Ověření

Po zpracování zkontroluj:

1. **HostBill Admin** → Invoices → Invoice 446 → Payments
   - Měl by být záznam s transaction ID `COMGATE-TXN-1754325147714`

2. **HostBill Admin** → Orders → Order 426
   - Měl by být status `Active`

3. **Browser Console** na payment-success stránce
   - Měly by být logy s REAL transaction ID

## 🎉 Shrnutí

**ComGate return URL nyní správně předává REAL transaction ID** do authorize-capture workflow, což zajišťuje perfektní audit trail a správné propojení mezi ComGate platbou a HostBill záznamem! 🎯
