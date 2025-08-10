# Debug Return Handler

## 🔍 **CURL test pro debugging return handleru**

### **Test 1: S amount parametrem**
```bash
curl -i -X GET "http://localhost:3005/api/payments/return?status=success&transactionId=TEST-REAL-AMOUNT&orderId=433&invoiceId=470&amount=299&currency=CZK&paymentMethod=comgate"
```

**Očekávaný výsledek:**
- Status: 302 Redirect
- Location: `http://localhost:3000/payment-success-flow?orderId=433&invoiceId=470&amount=299&currency=CZK&transactionId=TEST-REAL-AMOUNT&paymentId=TEST-REAL-AMOUNT&paymentMethod=comgate`

### **Test 2: Bez amount parametru**
```bash
curl -i -X GET "http://localhost:3005/api/payments/return?status=success&transactionId=TEST-NO-AMOUNT&orderId=433&invoiceId=470&paymentMethod=comgate"
```

**Očekávaný výsledek:**
- Status: 302 Redirect
- Location: `http://localhost:3000/payment-success-flow?orderId=433&invoiceId=470&transactionId=TEST-NO-AMOUNT&paymentId=TEST-NO-AMOUNT&paymentMethod=comgate`
- **Bez amount parametru** v URL

### **Co sledovat v middleware logs:**
```
🔍 Getting real payment data from ComGate API { transactionId: 'TEST-REAL-AMOUNT' }
⚠️ Could not get ComGate payment data, using URL parameters
🔄 Processing payment return { paymentStatus: 'success', orderId: '433', invoiceId: '470', transactionId: 'TEST-REAL-AMOUNT', paymentMethod: 'comgate', amount: 299, currency: 'CZK' }
```

### **Debugging checklist:**
- [ ] Return handler dostane správné parametry
- [ ] ComGate API call se pokusí (ale selže pro test TX ID)
- [ ] Použijí se fallback hodnoty z URL
- [ ] Redirect URL obsahuje všechny parametry
- [ ] Payment-success-flow dostane správná data

### **Možné problémy:**
1. **Return handler** nepředává amount do redirect URL
2. **Payment-success-flow** nesprávně parsuje URL parametry
3. **ComGate API** vrací jiná data než očekáváme
4. **URL encoding** problém s parametry

### **Rychlý test v prohlížeči:**
Po CURL testu zkopíruj redirect URL a otevři v prohlížeči:
```
http://localhost:3000/payment-success-flow?orderId=433&invoiceId=470&amount=299&currency=CZK&transactionId=TEST-REAL-AMOUNT&paymentId=TEST-REAL-AMOUNT&paymentMethod=comgate
```

Zkontroluj, zda se zobrazí **299 CZK** místo **100 CZK**.
