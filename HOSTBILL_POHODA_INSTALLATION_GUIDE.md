# HostBill Pohoda Module - Instalační návod

## 🎯 **Kompletní návod na instalaci Pohoda modulu do HostBill**

### ⏱️ **Celkový čas: ~20 minut**

## **📋 Přehled instalace:**

1. **Příprava souborů** (2 minuty)
2. **Instalace do HostBill** (3 minuty)
3. **Konfigurace Pohoda SW** (10 minut)
4. **Konfigurace HostBill** (3 minuty)
5. **Test a ověření** (2 minuty)

---

## **1. 📁 Příprava souborů (2 minuty)**

### **A) Zkopírování modulu:**
```bash
# Zkopírujte celou složku hostbill-pohoda-module do HostBill
# Cílová cesta: /path/to/hostbill/modules/addons/pohoda/

# Linux/Mac:
cp -r hostbill-pohoda-module/ /var/www/hostbill/modules/addons/pohoda/

# Windows:
xcopy hostbill-pohoda-module\ C:\inetpub\wwwroot\hostbill\modules\addons\pohoda\ /E /I
```

### **B) Ověření struktury:**
```
/var/www/hostbill/modules/addons/pohoda/
├── pohoda.php              # Hlavní modul
├── pohoda-client.php       # mServer client
├── pohoda-xml-generator.php # XML generátor
├── hooks.php               # Automatické hooks
├── admin.php               # Admin interface
├── install.php             # Instalační skript
├── test-module.php         # Test suite
└── README.md               # Dokumentace
```

### **C) Nastavení oprávnění (Linux):**
```bash
# Nastavte správná oprávnění
chown -R www-data:www-data /var/www/hostbill/modules/addons/pohoda/
chmod -R 644 /var/www/hostbill/modules/addons/pohoda/
chmod 755 /var/www/hostbill/modules/addons/pohoda/
```

---

## **2. 🚀 Instalace do HostBill (3 minuty)**

### **A) Spuštění instalačního skriptu:**
```bash
# Přejděte do HostBill root adresáře
cd /var/www/hostbill

# Spusťte instalaci
php modules/addons/pohoda/install.php install
```

### **B) Očekávaný výstup:**
```
🚀 Installing HostBill Pohoda Integration Module...
1️⃣ Creating database tables...
✅ Database tables created successfully
2️⃣ Registering module in HostBill...
✅ Module registered successfully
3️⃣ Setting default configuration...
✅ Default configuration set
4️⃣ Registering hooks...
✅ Hooks registered successfully

🎉 HostBill Pohoda Integration Module installed successfully!
```

### **C) Aktivace v HostBill Admin:**
1. **Přihlaste se** do HostBill Admin
2. **Jděte na**: **System Settings** → **Addon Modules**
3. **Najděte**: "Pohoda Integration"
4. **Klikněte**: **Activate**
5. **Ověřte**: Status "Active" se zeleným indikátorem

---

## **3. ⚙️ Konfigurace Pohoda SW (10 minut)**

### **A) Aktivace mServer (3 minuty):**
1. **Spusťte Pohoda** software
2. **Otevřete správnou databázi** pro aktuální rok
3. **Jděte na**: **Nástroje** → **Možnosti** → **mServer**
4. **Zaškrtněte**: ☑️ **"Povolit mServer"**
5. **Nastavte port**: `444` (výchozí)
6. **Protokol**: `HTTP`
7. **Zaškrtněte**: ☑️ **"Povolit XML API"**
8. **Klikněte**: **OK**

### **B) Ověření mServer (1 minuta):**
1. **Pohoda** → **Nápověda** → **O aplikaci**
2. **Zkontrolujte**: "mServer běží na portu 444"
3. **Test v prohlížeči**: `http://127.0.0.1:444`
   - **Měla by se zobrazit**: Pohoda mServer stránka
   - **Pokud ne**: Restartujte Pohoda

### **C) Vytvoření API uživatele (3 minuty):**
1. **Pohoda** → **Soubor** → **Uživatelé**
2. **Klikněte**: **Nový**
3. **Vyplňte**:
   - **Uživatelské jméno**: `hostbill_api`
   - **Celé jméno**: `HostBill API Integration`
   - **Heslo**: Vytvořte silné heslo (např. `HostBill2024!`)
   - **Potvrdit heslo**: Stejné heslo

### **D) Nastavení oprávnění API uživatele (2 minuty):**
1. **Záložka**: **Oprávnění**
2. **Zaškrtněte tyto oprávnění**:
   - ☑️ **Faktury** → **Čtení**
   - ☑️ **Faktury** → **Zápis**
   - ☑️ **Faktury** → **Mazání**
   - ☑️ **XML Import/Export**
   - ☑️ **mServer přístup**
   - ☑️ **Adresář** → **Čtení** (pro zákaznická data)
3. **Klikněte**: **OK**

### **E) Zjištění názvu databáze (1 minuta):**
1. **Pohoda** → **Soubor** → **Informace o databázi**
2. **Zkopírujte název databáze**: Obvykle `StwPh_ICO_YYYY.mdb`
   - **ICO**: IČO vaší firmy (např. 12345678)
   - **YYYY**: Rok účetního období (např. 2024)
   - **Příklad**: `StwPh_12345678_2024.mdb`

**Alternativní způsob:**
1. **Windows Explorer** → Složka s Pohoda daty
2. **Hledejte soubor**: `StwPh_*.mdb`
3. **Zkopírujte celý název**

---

## **4. 🔧 Konfigurace HostBill (3 minuty)**

### **A) Přístup ke konfiguraci:**
1. **HostBill Admin** → **Addon Modules**
2. **Najděte**: "Pohoda Integration"
3. **Klikněte**: **Configure** (ikona ozubeného kola)

### **B) Vyplnění konfigurace:**

#### **mServer Connection:**
- **mServer URL**: `http://127.0.0.1:444`
- **Username**: `hostbill_api` (API uživatel z Pohoda)
- **Password**: `HostBill2024!` (heslo API uživatele)
- **Data File**: `StwPh_12345678_2024.mdb` (váš skutečný název)

#### **Synchronization Settings:**
- ☑️ **Auto Sync Invoices**: Zapnuto
- ☑️ **Auto Sync Payments**: Zapnuto  
- ☑️ **Sync Customer Data**: Zapnuto
- ☐ **Debug Mode**: Vypnuto (zapněte jen pro debugging)

### **C) Uložení konfigurace:**
1. **Klikněte**: **Save Configuration**
2. **Ověřte**: Zelená zpráva "Configuration saved successfully"

---

## **5. 🧪 Test a ověření (2 minuty)**

### **A) Test připojení:**
1. **V HostBill konfiguraci** klikněte: **Test Connection**
2. **Očekávaný výsledek**: ✅ "Connection to Pohoda mServer successful!"
3. **Pokud chyba**: Zkontrolujte Pohoda mServer a credentials

### **B) Test automatické synchronizace:**
1. **Vytvořte testovací fakturu** v HostBill:
   - **Clients** → **View/Search Clients** → Vyberte zákazníka
   - **Create Invoice** → Vyplňte položky → **Save**
2. **Zkontrolujte logy**:
   - **HostBill** → **Utilities** → **Activity Log**
   - **Hledejte**: "Pohoda: Invoice XXX synced successfully"
3. **Ověřte v Pohoda**:
   - **Pohoda** → **Faktury** → **Vydané faktury**
   - **Najděte fakturu** s číslem z HostBill

### **C) Test platby:**
1. **Označte fakturu jako zaplacenou** v HostBill:
   - **Billing** → **View Invoice** → **Mark Paid**
2. **Zkontrolujte logy**: "Pohoda: Payment for invoice XXX synced successfully"
3. **Ověřte v Pohoda**: Faktura by měla být označena jako zaplacená

---

## **6. 🔧 Konfigurace Middleware (1 minuta)**

### **Nastavení POHODA_MIDDLEWARE_MODE:**

#### **Pro HostBill modul (DOPORUČENO):**
```env
# V systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=NO
```

#### **Pro Middleware řešení:**
```env
# V systrix-middleware-nextjs/.env.local  
POHODA_MIDDLEWARE_MODE=YES
```

### **Restart middleware:**
```bash
cd systrix-middleware-nextjs
npm run dev
```

---

## **7. 📊 Ověření funkčnosti**

### **A) HostBill Admin Dashboard:**
1. **Addon Modules** → **Pohoda Integration** → **Configure**
2. **Zkontrolujte statistiky**:
   - **Total Synced**: Počet synchronizovaných faktur
   - **Successful**: Úspěšné synchronizace
   - **Failed**: Neúspěšné synchronizace
   - **Last Sync**: Čas poslední synchronizace

### **B) Pohoda ověření:**
1. **Pohoda** → **Faktury** → **Vydané faktury**
2. **Filtr**: Hledejte faktury s poznámkou "HostBill"
3. **Ověřte**:
   - ✅ Správné zákaznické údaje
   - ✅ Správné položky a částky
   - ✅ Transaction ID v poznámkách
   - ✅ Status platby (pokud byla platba)

### **C) Activity Log monitoring:**
1. **HostBill** → **Utilities** → **Activity Log**
2. **Filtr**: "Pohoda"
3. **Očekávané zprávy**:
   - `Pohoda: Invoice XXX synced successfully via HostBill hook`
   - `Pohoda: Payment for invoice XXX synced successfully via HostBill hook`

---

## **8. 🔍 Řešení problémů**

### **Časté chyby a řešení:**

#### **❌ "Connection refused"**
- **Problém**: Pohoda mServer neběží
- **Řešení**: 
  1. Spusťte Pohoda software
  2. Ověřte mServer: Nástroje → Možnosti → mServer
  3. Zkontrolujte port 444: `http://127.0.0.1:444`

#### **❌ "Authentication failed"**
- **Problém**: Nesprávné username/password
- **Řešení**:
  1. Ověřte API uživatele v Pohoda
  2. Zkontrolujte heslo v HostBill konfiguraci
  3. Ověřte oprávnění API uživatele

#### **❌ "Database not found"**
- **Problém**: Nesprávný název databáze
- **Řešení**:
  1. Pohoda → Soubor → Informace o databázi
  2. Zkopírujte přesný název (StwPh_ICO_YYYY.mdb)
  3. Aktualizujte v HostBill konfiguraci

#### **❌ "Module not found"**
- **Problém**: Soubory nejsou správně zkopírovány
- **Řešení**:
  1. Ověřte cestu: `/path/to/hostbill/modules/addons/pohoda/`
  2. Zkontrolujte oprávnění souborů
  3. Spusťte instalaci znovu

#### **❌ "Hooks not working"**
- **Problém**: Hooks nejsou registrovány
- **Řešení**:
  1. Spusťte: `php install.php install`
  2. Restartujte web server
  3. Ověřte v Activity Log

### **Debug mode:**
1. **Zapněte Debug Mode** v HostBill konfiguraci
2. **Zkontrolujte logy**: Activity Log → filtr "Pohoda"
3. **Pohoda logy**: Admin → Pohoda Integration → View Logs

---

## **9. 📋 Checklist dokončení**

### **✅ Instalace dokončena když:**
- ☑️ **Soubory zkopírovány** do správné složky
- ☑️ **Instalační skript spuštěn** bez chyb
- ☑️ **Modul aktivován** v HostBill Admin
- ☑️ **Pohoda mServer běží** na portu 444
- ☑️ **API uživatel vytvořen** s oprávněními
- ☑️ **Konfigurace vyplněna** v HostBill
- ☑️ **Test připojení úspěšný** ✅
- ☑️ **Testovací faktura synchronizována** ✅
- ☑️ **Testovací platba synchronizována** ✅

### **✅ Produkční provoz připraven když:**
- ☑️ **Auto sync zapnuto** pro faktury i platby
- ☑️ **Middleware mode nastaven** na NO
- ☑️ **Monitoring aktivní** (Activity Log)
- ☑️ **Pohoda běží stabilně** s mServer
- ☑️ **Backup strategie** připravena

---

## **10. 🎯 Výhody HostBill modulu**

### **✅ Po instalaci získáte:**
- ✅ **100% automatickou synchronizaci** všech faktur a plateb
- ✅ **Nativní HostBill integraci** bez externích závislostí
- ✅ **Real-time sync** - okamžitá synchronizace
- ✅ **Admin GUI** - snadná konfigurace a monitoring
- ✅ **Kompletní logování** - sledování všech operací
- ✅ **Error handling** - graceful degradation při problémech
- ✅ **Bulk sync** - hromadná synchronizace starých faktur

### **✅ Workflow po instalaci:**
```
Zákazník zaplatí → HostBill přijme platbu → Hook se spustí → 
→ XML se vygeneruje → mServer API → Pohoda faktura zaplacená
```

**Vše automaticky, bez manuální práce! 🎯**

---

## **11. 🔄 Přepínání mezi řešeními**

### **A) Použití HostBill modulu (DOPORUČENO):**
```env
# V systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=NO
```
- ✅ **HostBill modul** zpracovává Pohoda sync
- ✅ **Middleware** Pohoda sync přeskakuje
- ✅ **Lepší performance** - přímá komunikace

### **B) Použití Middleware:**
```env
# V systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=YES
```
- ✅ **Middleware** zpracovává Pohoda sync
- ✅ **HostBill modul** může být vypnutý
- ✅ **Backup řešení** pro debugging

---

## **12. 🎉 Dokončení instalace**

### **Po úspěšné instalaci:**

1. **Automatická synchronizace aktivní** ✅
2. **Každá nová faktura** se automaticky synchronizuje do Pohoda ✅
3. **Každá platba** automaticky označí fakturu jako zaplacenou v Pohoda ✅
4. **Admin monitoring** dostupný v HostBill ✅
5. **Error handling** zajišťuje stabilní provoz ✅

### **🚀 Výsledek:**
**HostBill má nyní plnou automatickou integraci s Pohoda - bez middleware, bez externích závislostí, jen přímé napojení na Pohoda mServer API! 🎯**

### **📞 Podpora:**
- **Logy**: HostBill Activity Log → filtr "Pohoda"
- **Monitoring**: Admin → Pohoda Integration → Dashboard
- **Debug**: Zapněte Debug Mode v konfiguraci
- **Test**: Admin → Pohoda Integration → Test Connection

**Instalace je kompletní a systém je připraven k produkčnímu použití! 🎉**
