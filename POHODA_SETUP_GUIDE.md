# Pohoda SW Setup Guide - Přímá integrace s CloudVPS

## 🎯 **Kompletní návod pro nastavení Pohoda SW**

### ⏱️ **Celkový čas: ~15 minut**

## 1. **🏢 Příprava Pohoda systému (5 minut)**

### **A) Aktivace mServer:**
1. **Spusťte Pohoda** software
2. **Otevřete správnou databázi** pro aktuální rok
3. **Jděte na**: **Nástroje** → **Možnosti** → **mServer**
4. **Zaškrtněte**: ☑️ "Povolit mServer"
5. **Nastavte port**: `444` (výchozí)
6. **Protokol**: `HTTP`
7. **Zaškrtněte**: ☑️ "Povolit XML API"
8. **Klikněte**: **OK**

### **B) Ověření mServer:**
1. **Pohoda** → **Nápověda** → **O aplikaci**
2. **Zkontrolujte**: "mServer běží na portu 444"
3. **Test v prohlížeči**: `http://127.0.0.1:444` (měla by se zobrazit Pohoda stránka)

## 2. **👤 Vytvoření API uživatele (3 minuty)**

### **A) Nový uživatel:**
1. **Pohoda** → **Soubor** → **Uživatelé**
2. **Klikněte**: **Nový**
3. **Uživatelské jméno**: `cloudvps_api`
4. **Celé jméno**: `CloudVPS API Integration`
5. **Heslo**: Vytvořte silné heslo (např. `CloudVPS2024!`)

### **B) Nastavení oprávnění:**
1. **Záložka**: **Oprávnění**
2. **Zaškrtněte**:
   - ☑️ **Faktury** → Čtení
   - ☑️ **Faktury** → Zápis
   - ☑️ **Faktury** → Mazání
   - ☑️ **XML Import/Export**
   - ☑️ **mServer přístup**
3. **Klikněte**: **OK**

## 3. **📋 Zjištění názvu databáze (1 minuta)**

### **A) Název databáze:**
1. **Pohoda** → **Soubor** → **Informace o databázi**
2. **Zkopírujte název**: Obvykle `StwPh_ICO_YYYY.mdb`
   - **ICO**: IČO vaší firmy (např. 12345678)
   - **YYYY**: Rok účetního období (např. 2024)
   - **Příklad**: `StwPh_12345678_2024.mdb`

### **B) Alternativní způsob:**
1. **Windows Explorer** → Složka s Pohoda daty
2. **Hledejte soubor**: `StwPh_*.mdb`
3. **Zkopírujte celý název**

## 4. **⚙️ Konfigurace CloudVPS middleware (2 minuty)**

### **A) Aktualizace .env.local:**
```bash
# Otevřete: systrix-middleware-nextjs/.env.local
# Aktualizujte tyto řádky:

POHODA_MSERVER_URL=http://127.0.0.1:444
POHODA_DATA_FILE=StwPh_12345678_2024.mdb    # Váš skutečný název
POHODA_USERNAME=cloudvps_api                # Váš API uživatel
POHODA_PASSWORD=CloudVPS2024!               # Vaše skutečné heslo
POHODA_SYNC_ENABLED=true
```

### **B) Restart middleware:**
```bash
cd systrix-middleware-nextjs
npm run dev
```

## 5. **🧪 Test integrace (3 minuty)**

### **A) Test připojení:**
```bash
node test-pohoda-direct-integration.js
```

### **B) Očekávané výsledky:**
```
✅ Pohoda Client Status: WORKING
✅ Complete Payment Workflow: WORKING
✅ Automatic Pohoda Sync: ENABLED
✅ mServer Connection: ACTIVE (když Pohoda běží)
```

### **C) Test reálné platby:**
1. **Otevřete**: `http://localhost:3000` (CloudVPS)
2. **Přihlaste se** jako admin
3. **Jděte na**: Payment Success Flow
4. **Zadejte**: Invoice ID `681`
5. **Klikněte**: Mark as Paid
6. **Zkontrolujte logy**: Měli byste vidět Pohoda sync

## 6. **✅ Ověření v Pohoda**

### **A) Kontrola faktury:**
1. **Pohoda** → **Faktury** → **Vydané faktury**
2. **Hledejte fakturu**: Číslo `681`
3. **Ověřte**:
   - ✅ Zákazník správně vyplněn
   - ✅ Položky faktury
   - ✅ Částka a měna
   - ✅ Označeno jako zaplaceno
   - ✅ Transaction ID v poznámkách

### **B) Kontrola platby:**
1. **Otevřete fakturu** → **Záložka Platby**
2. **Ověřte**:
   - ✅ Platební metoda (např. "kartou")
   - ✅ Transaction ID
   - ✅ Datum platby
   - ✅ Částka

## 7. **🔍 Řešení problémů**

### **Pohoda neběží:**
```
❌ Error: fetch failed
✅ Řešení: Spusťte Pohoda software a ověřte mServer
```

### **Nesprávné credentials:**
```
❌ Error: Authentication failed
✅ Řešení: Ověřte username/password v .env.local
```

### **Databáze nenalezena:**
```
❌ Error: Database not found
✅ Řešení: Ověřte POHODA_DATA_FILE název
```

### **XML chyba:**
```
❌ Error: XML parsing error
✅ Řešení: Zkontrolujte invoice data z HostBill
```

## 8. **📊 Monitoring produkce**

### **A) Logy middleware:**
- **Úspěch**: `✅ Pohoda Sync: Invoice synchronized successfully via mServer`
- **Chyba**: `❌ Pohoda Sync: mServer sync failed`
- **Skip**: `⚠️ Pohoda Sync: Not configured - skipping sync`

### **B) Pohoda logy:**
- **Pohoda** → **Nástroje** → **Protokol událostí**
- **Hledejte**: "XML import" nebo "CloudVPS"

### **C) Payment Success Flow:**
- **Real-time logy** zobrazují Pohoda sync výsledky
- **Indikace úspěchu/selhání** synchronizace

## 🎉 **POHODA PŘÍMÁ INTEGRACE - SETUP DOKONČEN!**

### **✅ Po dokončení setup:**
- ✅ **Automatická synchronizace** všech faktur po platbě
- ✅ **Přímé napojení** na Pohoda bez externích služeb
- ✅ **Oficiální XML API** podle Stormware dokumentace
- ✅ **Lokální komunikace** - rychlé a spolehlivé
- ✅ **Production ready** - plně funkční systém

### **🚀 Výsledek:**
**Každá úspěšná platba v CloudVPS automaticky vytvoří fakturu v Pohoda s kompletními daty! 🎯**

### **📋 Checklist dokončení:**
- ☑️ Pohoda mServer aktivován (port 444)
- ☑️ API uživatel vytvořen s oprávněními
- ☑️ Název databáze zjištěn
- ☑️ Environment variables aktualizovány
- ☑️ Middleware restartován
- ☑️ Integrace otestována
- ☑️ Pohoda faktury ověřeny

**Setup je kompletní! 🎉**
