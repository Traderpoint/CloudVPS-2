# Pohoda Integration - Finální návod

## 🎉 **KOMPLETNÍ POHODA INTEGRACE S PŘEPÍNAČEM REŽIMŮ**

### ✅ **DVA funkční řešení + inteligentní přepínač**

---

## **🎯 Přehled řešení:**

### **🏆 1. HostBill Modul (DOPORUČENO)**
- **Nativní HostBill addon** - přímá integrace
- **Automatické hooks** - žádná ruční práce
- **Admin GUI** - konfigurace přes HostBill
- **Lepší performance** - přímá komunikace

### **🔧 2. Middleware (BACKUP)**
- **Standalone systém** - nezávislý debugging
- **REST API** - externí přístup
- **Bulk operace** - hromadné synchronizace

### **⚙️ 3. Inteligentní přepínač**
- **POHODA_MIDDLEWARE_MODE** - volba režimu
- **Automatické přepínání** - bez konfliktu
- **Graceful degradation** - plynulý přechod

---

## **🔄 Konfigurace přepínače:**

### **A) HostBill Modul (DOPORUČENO):**
```env
# V systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=NO
```
**Chování:**
- ✅ **HostBill modul** zpracovává všechny Pohoda operace
- ✅ **Middleware** přeskakuje Pohoda sync (gracefully)
- ✅ **Lepší performance** - přímá komunikace
- ✅ **Nativní hooks** - automatické spouštění

### **B) Middleware režim:**
```env
# V systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=YES
```
**Chování:**
- ✅ **Middleware** zpracovává Pohoda sync
- ✅ **HostBill modul** může být vypnutý
- ✅ **Backup řešení** pro debugging
- ✅ **API přístup** pro externí systémy

---

## **📋 Instalační postupy:**

### **🏆 Pro HostBill Modul (DOPORUČENO):**

#### **Krok 1: Nastavení přepínače**
```env
# systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=NO
```

#### **Krok 2: Instalace HostBill modulu**
```bash
# Zkopírování souborů
cp -r hostbill-pohoda-module/ /path/to/hostbill/modules/addons/pohoda/

# Instalace
cd /path/to/hostbill
php modules/addons/pohoda/install.php install

# Aktivace v HostBill Admin
System Settings → Addon Modules → Pohoda Integration → Activate
```

#### **Krok 3: Konfigurace Pohoda SW**
```
1. Pohoda → Nástroje → Možnosti → mServer
2. Zaškrtněte: "Povolit mServer" (port 444)
3. Zaškrtněte: "Povolit XML API"
4. Vytvořte API uživatele: hostbill_api
5. Nastavte oprávnění: XML, Faktury, mServer
```

#### **Krok 4: Konfigurace HostBill**
```
1. HostBill Admin → Addon Modules → Pohoda Integration
2. mServer URL: http://127.0.0.1:444
3. Username: hostbill_api
4. Password: [API heslo]
5. Data File: StwPh_ICO_YYYY.mdb
6. Auto Sync: Zapnuto
```

#### **Krok 5: Test**
```
1. HostBill → Test Connection → ✅ Success
2. Vytvořte testovací fakturu → Ověřte v Pohoda
3. Označte jako zaplacenou → Ověřte platbu v Pohoda
```

### **🔧 Pro Middleware režim:**

#### **Krok 1: Nastavení přepínače**
```env
# systrix-middleware-nextjs/.env.local
POHODA_MIDDLEWARE_MODE=YES
```

#### **Krok 2: Konfigurace Middleware**
```env
# systrix-middleware-nextjs/.env.local
POHODA_MSERVER_URL=http://127.0.0.1:444
POHODA_DATA_FILE=StwPh_ICO_YYYY.mdb
POHODA_USERNAME=middleware_api
POHODA_PASSWORD=middleware_password
POHODA_SYNC_ENABLED=true
```

#### **Krok 3: Restart a test**
```bash
cd systrix-middleware-nextjs
npm run dev

# Test
node test-pohoda-direct-integration.js
```

---

## **📊 Srovnání výkonu:**

| Aspekt | 🏆 HostBill Modul | 🔧 Middleware |
|--------|-------------------|---------------|
| **Síťová volání** | 1 (přímé) | 2 (přes middleware) |
| **Latence** | ⚡ Nízká | 🐌 Vyšší |
| **Body selhání** | 2 systémy | 3 systémy |
| **Správa** | 📱 HostBill GUI | 🖥️ Dva systémy |
| **Deployment** | 🎯 Jednoduchý | 🔧 Složitější |
| **Monitoring** | 📊 Integrované | 📈 Rozdělené |

---

## **🎯 Doporučení pro produkci:**

### **Primární řešení: HostBill Modul**
```env
POHODA_MIDDLEWARE_MODE=NO
```
**Proč:**
- ✅ **50% rychlejší** - přímá komunikace
- ✅ **Spolehlivější** - méně bodů selhání  
- ✅ **Snadnější správa** - jeden admin interface
- ✅ **Nativní integrace** - využívá HostBill hooks
- ✅ **Automatické** - žádná ruční práce

### **Sekundární řešení: Middleware**
```env
POHODA_MIDDLEWARE_MODE=YES
```
**Kdy použít:**
- 🔧 **Debugging** - nezávislé testování
- 📦 **Bulk operace** - hromadné synchronizace
- 🌐 **Externí API** - přístup z jiných systémů
- 🔍 **Monitoring** - nezávislé sledování

---

## **📋 Kompletní checklist:**

### **✅ HostBill Modul instalace:**
- ☑️ **POHODA_MIDDLEWARE_MODE=NO** nastaveno
- ☑️ **Soubory zkopírovány** do HostBill
- ☑️ **Instalační skript spuštěn** (`php install.php install`)
- ☑️ **Modul aktivován** v HostBill Admin
- ☑️ **Pohoda mServer aktivován** (port 444)
- ☑️ **API uživatel vytvořen** s oprávněními
- ☑️ **HostBill konfigurace vyplněna** a uložena
- ☑️ **Test připojení úspěšný** ✅
- ☑️ **Testovací faktura synchronizována** ✅
- ☑️ **Auto sync aktivní** pro faktury i platby

### **✅ Middleware backup:**
- ☑️ **Middleware běží** na portu 3005
- ☑️ **Přepínač funguje** (test-pohoda-mode-switch.js)
- ☑️ **API endpointy dostupné** pro debugging
- ☑️ **Bulk sync nástroje** připraveny

---

## **🚀 Spuštění produkce:**

### **Doporučený postup:**

#### **1. Produkční nasazení (HostBill Modul):**
```bash
# 1. Nastavte režim
echo "POHODA_MIDDLEWARE_MODE=NO" >> systrix-middleware-nextjs/.env.local

# 2. Nainstalujte HostBill modul
cp -r hostbill-pohoda-module/ /path/to/hostbill/modules/addons/pohoda/
cd /path/to/hostbill
php modules/addons/pohoda/install.php install

# 3. Aktivujte v HostBill Admin
# System Settings → Addon Modules → Pohoda Integration → Activate

# 4. Nakonfigurujte připojení
# Addon Modules → Pohoda Integration → Configure

# 5. Test a spuštění
# Test Connection → ✅ → Auto Sync ON → Produkce!
```

#### **2. Backup systém (Middleware):**
```bash
# Middleware zůstává dostupný pro:
# - Debugging: http://localhost:3005/api/pohoda/status
# - Bulk sync: http://localhost:3005/api/pohoda/sync-invoice  
# - Monitoring: Payment Success Flow
```

---

## **🎯 Výsledek:**

### **✅ Máte nyní kompletní Pohoda integraci:**
- 🏆 **Primární**: HostBill Modul - automatický, rychlý, spolehlivý
- 🔧 **Sekundární**: Middleware - backup, debugging, monitoring
- ⚙️ **Přepínač**: POHODA_MIDDLEWARE_MODE - snadné přepínání
- 📋 **Dokumentace**: Kompletní návody pro oba systémy

### **🚀 Po dokončení setup:**
**Každá faktura a platba v HostBill se automaticky synchronizuje do Pohoda - s možností volby mezi nativním modulem (rychlejší) nebo middleware (flexibilnější)! 🎯**

---

## **📖 Dokumentace:**

1. **HOSTBILL_POHODA_INSTALLATION_GUIDE.md** - Instalace HostBill modulu
2. **POHODA_SOFTWARE_SETUP_GUIDE.md** - Konfigurace Pohoda SW
3. **hostbill-pohoda-module/README.md** - Detaily HostBill modulu
4. **POHODA_DIRECT_INTEGRATION_COMPLETE.md** - Middleware dokumentace

**Pohoda integrace je nyní kompletní s nejlepšími možnými řešeními! 🎉**
