# 🚀 HostBill Modules - Automatická Instalace

Kompletní automatizované řešení pro instalaci tří HostBill modulů na Linux server.

## 📦 Vytvořené soubory

### **🔧 Automatizační skripty:**
- `install-hostbill-modules.ps1` - **Hlavní PowerShell skript** (doporučeno)
- `install-hostbill-modules.bat` - Batch verze pro Windows
- `install-modules-linux.sh` - Bash skript pro Linux server
- `test-ssh-connection.ps1` - Test SSH připojení

### **📁 Připravené archívy:**
- `hostbill-modules-ready.tar.gz` - Archív všech tří modulů

### **📖 Dokumentace:**
- `HOSTBILL_MODULES_INSTALLATION_GUIDE.md` - Kompletní návod
- `README_INSTALLATION.md` - Tento soubor

---

## ⚡ Rychlý start (1 příkaz)

```powershell
# Spusťte v PowerShell jako Administrator
.\install-hostbill-modules.ps1
```

**Tento příkaz automaticky:**
1. ✅ Nainstaluje OpenSSH Client
2. ✅ Vytvoří archív modulů
3. ✅ Přenese soubory na server (10.233.1.136)
4. ✅ Spustí instalaci na serveru
5. ✅ Otestuje všechny moduly

---

## 🎯 Cílové moduly

### **1. Comgate Payment Gateway**
- **Typ:** Payment Gateway
- **Umístění:** `/includes/modules/gateways/comgate/`
- **Funkce:** Zpracování plateb přes Comgate

### **2. Advanced Email Manager**
- **Typ:** Addon Module
- **Umístění:** `/includes/modules/addons/email/`
- **Funkce:** SMTP emaily, šablony, queue systém

### **3. Pohoda Integration**
- **Typ:** Addon Module
- **Umístění:** `/includes/modules/addons/pohoda/`
- **Funkce:** Synchronizace s účetním systémem Pohoda

---

## 🔍 Test před instalací

```powershell
# Test SSH připojení
.\test-ssh-connection.ps1
```

**Test ověří:**
- 🌐 Síťové připojení (ping)
- 🔌 SSH port 22
- 🔧 SSH klient
- 🔐 SSH autentifikace
- 📁 HostBill adresář

---

## 📋 Systémové požadavky

### **Windows Server 2019:**
- PowerShell 5.1+
- Oprávnění Administrator
- Síťové připojení k serveru

### **Linux Server:**
- HostBill nainstalován v `/home/hostbill/public_html/`
- PHP CLI
- MySQL/MariaDB
- Apache/Nginx s www-data uživatelem

---

## 🎛️ Po instalaci

### **Aktivace v HostBill Admin:**
1. **Comgate:** Setup → Payment Gateways → Activate
2. **Email:** Setup → Addon Modules → Activate
3. **Pohoda:** Setup → Addon Modules → Activate

### **Konfigurace:**
- **Comgate:** Merchant ID, Secret Key, Test Mode
- **Email:** SMTP nastavení, From Email
- **Pohoda:** mServer URL, Database, Credentials

---

## 🔧 Řešení problémů

### **SSH chyby:**
```powershell
# Verbose SSH test
ssh -v root@10.233.1.136
```

### **Oprávnění:**
```bash
# Na Linux serveru
chown -R www-data:www-data /home/hostbill/public_html/includes/modules
```

### **PHP chyby:**
```bash
# Kontrola error logu
tail -f /var/log/apache2/error.log
```

---

## 📊 Struktura projektu

```
Cloud VPS/
├── hostbill-comgate-module/     # Comgate modul
├── hostbill-email-module/       # Email modul
├── hostbill-pohoda-module/      # Pohoda modul
├── install-hostbill-modules.ps1 # Hlavní instalační skript
├── install-hostbill-modules.bat # Batch verze
├── install-modules-linux.sh     # Linux instalační skript
├── test-ssh-connection.ps1      # Test SSH připojení
├── hostbill-modules-ready.tar.gz # Připravený archív
└── HOSTBILL_MODULES_INSTALLATION_GUIDE.md # Kompletní návod
```

---

## 🎉 Výsledek

Po úspěšné instalaci budete mít:

- ✅ **Comgate Payment Gateway** - Funkční platební brána
- ✅ **Advanced Email Manager** - Automatické SMTP emaily
- ✅ **Pohoda Integration** - Synchronizace s účetnictvím

**Všechny moduly jsou plně funkční a připravené k použití!**

---

## 📞 Podpora

- **Dokumentace:** `HOSTBILL_MODULES_INSTALLATION_GUIDE.md`
- **Test skripty:** V každém modulu `test-module.php`
- **Log soubory:** `/var/log/` a HostBill logs

**Instalace je nyní plně automatizovaná a zabere méně než 5 minut!** 🚀
