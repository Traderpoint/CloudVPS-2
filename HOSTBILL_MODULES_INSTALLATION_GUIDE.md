# 🚀 HostBill Modules Installation Guide

Kompletní návod pro instalaci tří HostBill modulů na Linux server přes SSH z Windows Server 2019.

## 📋 Přehled modulů

- **🔐 Comgate Payment Gateway** - Platební brána pro Comgate
- **📧 Advanced Email Manager** - Pokročilá správa emailů s SMTP
- **💼 Pohoda Integration** - Integrace s účetním systémem Pohoda

## 🎯 Cílový server

- **IP adresa:** 10.233.1.136
- **Uživatel:** root
- **Heslo:** Obchudek2017
- **HostBill cesta:** /home/hostbill/public_html

---

## 🛠️ Metoda 1: Automatická instalace (Doporučeno)

### **Krok 1: Test připojení**

```powershell
# Spusťte v PowerShell jako Administrator
.\test-ssh-connection.ps1
```

### **Krok 2: Automatická instalace**

```powershell
# PowerShell skript (doporučeno)
.\install-hostbill-modules.ps1

# NEBO Batch soubor
.\install-hostbill-modules.bat
```

**Skript automaticky:**
- ✅ Nainstaluje OpenSSH Client (pokud není)
- ✅ Vytvoří archiv modulů
- ✅ Přenese soubory na server
- ✅ Spustí instalaci na serveru
- ✅ Otestuje všechny moduly

---

## 🔧 Metoda 2: Manuální instalace

### **Krok 1: Instalace OpenSSH Client**

```powershell
# V PowerShell jako Administrator
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### **Krok 2: Vytvoření archívu modulů**

```powershell
# Vytvoření tar.gz archívu
tar -czf hostbill-modules.tar.gz hostbill-comgate-module hostbill-email-module hostbill-pohoda-module
```

### **Krok 3: Přenos na server**

```powershell
# Přenos archívu
scp hostbill-modules.tar.gz root@10.233.1.136:/tmp/

# Přenos instalačního skriptu
scp install-modules-linux.sh root@10.233.1.136:/tmp/
```

### **Krok 4: SSH připojení a instalace**

```bash
# Připojení na server
ssh root@10.233.1.136

# Spuštění instalace
chmod +x /tmp/install-modules-linux.sh
/tmp/install-modules-linux.sh
```

---

## 📁 Struktura po instalaci

```
/home/hostbill/public_html/includes/modules/
├── gateways/
│   └── comgate/              # Comgate Payment Gateway
│       ├── comgate.php
│       ├── install.php
│       ├── callback.php
│       └── ...
└── addons/
    ├── email/                # Advanced Email Manager
    │   ├── email.php
    │   ├── install.php
    │   ├── email-client.php
    │   └── ...
    └── pohoda/               # Pohoda Integration
        ├── pohoda.php
        ├── install.php
        ├── pohoda-client.php
        └── ...
```

---

## 🎛️ Aktivace modulů v HostBill

### **1. Comgate Payment Gateway**
1. **Admin Panel** → **Setup** → **Payment Gateways**
2. Najděte **"Comgate Payment Gateway"**
3. Klikněte **Activate**
4. Nakonfigurujte:
   - **Merchant ID** (z Comgate portálu)
   - **Secret Key** (z Comgate portálu)
   - **Test Mode** = "Yes" pro testování

### **2. Advanced Email Manager**
1. **Admin Panel** → **Setup** → **Addon Modules**
2. Najděte **"Advanced Email Manager"**
3. Klikněte **Activate**
4. Nakonfigurujte:
   - **SMTP Host** (např. smtp.gmail.com)
   - **SMTP Port** (587 pro TLS)
   - **Username/Password**
   - **From Email** a **From Name**

### **3. Pohoda Integration**
1. **Admin Panel** → **Setup** → **Addon Modules**
2. Najděte **"Pohoda Integration"**
3. Klikněte **Activate**
4. Nakonfigurujte:
   - **mServer URL**
   - **Database Name**
   - **Username/Password**
   - **Auto Sync** možnosti

---

## 🔍 Testování instalace

### **Test na serveru:**
```bash
# Test Comgate modulu
cd /home/hostbill/public_html/includes/modules/gateways/comgate
php install.php test

# Test Email modulu
cd /home/hostbill/public_html/includes/modules/addons/email
php install.php test

# Test Pohoda modulu
cd /home/hostbill/public_html/includes/modules/addons/pohoda
php install.php test
```

### **Test v HostBill Admin:**
1. Zkontrolujte, že moduly jsou viditelné v seznamu
2. Aktivujte každý modul
3. Otestujte základní funkčnost

---

## 📧 SMTP Konfigurace (Email modul)

### **Gmail:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
Security: TLS
Username: your-email@gmail.com
Password: App-specific password
```

### **Outlook:**
```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587
Security: TLS
Username: your-email@outlook.com
Password: Vaše heslo
```

---

## 💰 Comgate Konfigurace

### **Testovací prostředí:**
1. **Test Mode:** Yes
2. **Merchant ID:** TEST_MERCHANT
3. **Secret Key:** TEST_SECRET

### **Produkční prostředí:**
1. **Test Mode:** No
2. **Merchant ID:** Váš skutečný Merchant ID
3. **Secret Key:** Váš skutečný Secret Key

---

## 📊 Pohoda Konfigurace

### **Základní nastavení:**
1. **mServer URL:** http://your-pohoda-server:8080
2. **Database:** Název Pohoda databáze
3. **Username:** Pohoda uživatel
4. **Password:** Pohoda heslo

### **Automatická synchronizace:**
- **Invoices:** Automatický export faktur
- **Clients:** Synchronizace klientů
- **Products:** Synchronizace produktů

---

## 🔧 Řešení problémů

### **SSH připojení:**
```bash
# Verbose mode pro debugging
ssh -v root@10.233.1.136
```

### **Oprávnění souborů:**
```bash
# Oprava oprávnění
chown -R www-data:www-data /home/hostbill/public_html/includes/modules
chmod -R 755 /home/hostbill/public_html/includes/modules
```

### **PHP chyby:**
```bash
# Kontrola error logu
tail -f /var/log/apache2/error.log
# nebo
tail -f /var/log/nginx/error.log
```

### **Databázové chyby:**
```bash
# Kontrola MySQL/MariaDB
systemctl status mysql
# nebo
systemctl status mariadb
```

---

## 📝 Log soubory

- **Apache/Nginx:** `/var/log/apache2/error.log` nebo `/var/log/nginx/error.log`
- **PHP:** `/var/log/php_errors.log`
- **HostBill:** `/home/hostbill/public_html/logs/`
- **Module logs:** V adresářích jednotlivých modulů

---

## 🎉 Dokončení

Po úspěšné instalaci a aktivaci všech modulů:

1. ✅ **Comgate** - Platby budou zpracovávány přes Comgate
2. ✅ **Email** - Automatické odesílání emailů s SMTP
3. ✅ **Pohoda** - Synchronizace s účetním systémem

**Všechny moduly jsou plně funkční a připravené k použití!**

---

## 📞 Podpora

Pro technickou podporu kontaktujte:
- **Dokumentace modulů:** V adresářích modulů (README.md)
- **Test skripty:** Každý modul má test-module.php
- **Log soubory:** Pro debugging a řešení problémů
