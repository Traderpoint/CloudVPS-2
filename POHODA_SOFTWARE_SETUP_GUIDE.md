# Pohoda Software - Kompletní setup návod

## 🎯 **Detailní návod na nastavení Pohoda SW pro HostBill integraci**

### ⏱️ **Celkový čas: ~15 minut**

---

## **1. 🏢 Příprava Pohoda systému (5 minut)**

### **A) Spuštění a příprava (2 minuty):**
1. **Spusťte Pohoda** software
2. **Přihlaste se** s administrátorským účtem
3. **Otevřete správnou databázi** pro aktuální rok
4. **Ověřte licenci**: Pohoda → Nápověda → O aplikaci

### **B) Kontrola verze (1 minuta):**
- **Minimální verze**: Pohoda 2018 nebo novější
- **Doporučená verze**: Pohoda 2022+ pro nejlepší XML API podporu
- **Ověření**: Pohoda → Nápověda → O aplikaci → Verze

### **C) Backup databáze (2 minuty):**
```
⚠️ DŮLEŽITÉ: Před konfigurací API vytvořte zálohu!
```
1. **Pohoda** → **Soubor** → **Záloha dat**
2. **Vyberte umístění** zálohy
3. **Klikněte**: **Zálohovat**
4. **Počkejte** na dokončení

---

## **2. ⚙️ Aktivace mServer (5 minut)**

### **A) Přístup k nastavení mServer (1 minuta):**
1. **Pohoda** → **Nástroje** → **Možnosti**
2. **Najděte záložku**: **mServer**
3. **Pokud záložka chybí**: Vaše verze Pohoda nepodporuje mServer

### **B) Základní konfigurace mServer (2 minuty):**
1. **Zaškrtněte**: ☑️ **"Povolit mServer"**
2. **Port**: `444` (výchozí - NEMĚŇTE!)
3. **Protokol**: `HTTP` (ne HTTPS pro lokální komunikaci)
4. **IP adresa**: `127.0.0.1` (localhost)
5. **Zaškrtněte**: ☑️ **"Povolit XML API"**

### **C) Pokročilá nastavení (1 minuta):**
1. **Timeout**: `30` sekund (výchozí)
2. **Max. připojení**: `10` (výchozí)
3. **Zaškrtněte**: ☑️ **"Logovat požadavky"** (pro debugging)
4. **Klikněte**: **OK**

### **D) Ověření aktivace (1 minuta):**
1. **Pohoda** → **Nápověda** → **O aplikaci**
2. **Zkontrolujte**: "mServer běží na portu 444"
3. **Test v prohlížeči**: 
   - Otevřete: `http://127.0.0.1:444`
   - **Měla by se zobrazit**: Pohoda mServer úvodní stránka
   - **Pokud ne**: Restartujte Pohoda

---

## **3. 👤 Vytvoření API uživatele (3 minut)**

### **A) Vytvoření nového uživatele (1 minuta):**
1. **Pohoda** → **Soubor** → **Uživatelé**
2. **Klikněte**: **Nový** (ikona plus)
3. **Vyplňte základní údaje**:
   - **Uživatelské jméno**: `hostbill_api`
   - **Celé jméno**: `HostBill API Integration`
   - **Popis**: `API uživatel pro HostBill integraci`

### **B) Nastavení hesla (30 sekund):**
1. **Heslo**: Vytvořte silné heslo
   - **Doporučení**: `HostBill2024!` nebo podobné
   - **Požadavky**: Min. 8 znaků, velká/malá písmena, čísla
2. **Potvrdit heslo**: Stejné heslo
3. **Zaškrtněte**: ☑️ **"Heslo nevyprší"**

### **C) Nastavení oprávnění (1.5 minuty):**
1. **Záložka**: **Oprávnění**
2. **Zaškrtněte VŠECHNA tato oprávnění**:

#### **Faktury:**
- ☑️ **Faktury** → **Čtení**
- ☑️ **Faktury** → **Zápis**
- ☑️ **Faktury** → **Mazání**
- ☑️ **Faktury** → **Tisk**

#### **Adresář (zákazníci):**
- ☑️ **Adresář** → **Čtení**
- ☑️ **Adresář** → **Zápis** (pro nové zákazníky)

#### **XML a API:**
- ☑️ **XML Import/Export**
- ☑️ **mServer přístup**
- ☑️ **Vzdálený přístup**

#### **Ostatní (volitelné):**
- ☑️ **Skladové zásoby** → **Čtení** (pro produkty)
- ☑️ **Ceníky** → **Čtení**

3. **Klikněte**: **OK**

---

## **4. 📋 Zjištění databázových údajů (2 minut)**

### **A) Název databáze (1 minuta):**
1. **Pohoda** → **Soubor** → **Informace o databázi**
2. **Zkopírujte název**: Obvykle ve formátu `StwPh_ICO_YYYY.mdb`

#### **Příklady názvů:**
- `StwPh_12345678_2024.mdb` (ICO: 12345678, rok: 2024)
- `StwPh_87654321_2024.mdb` (ICO: 87654321, rok: 2024)
- `StwPh_11223344_2023.mdb` (ICO: 11223344, rok: 2023)

### **B) Alternativní způsob zjištění (1 minuta):**
1. **Windows Explorer** → Přejděte do složky s Pohoda daty
2. **Výchozí cesta**: `C:\Users\[username]\Documents\Pohoda\Data\`
3. **Hledejte soubor**: `StwPh_*.mdb`
4. **Zkopírujte celý název** včetně přípony

### **C) Ověření přístupu:**
1. **Zkuste otevřít databázi** v Pohoda
2. **Ověřte**: Faktury se načítají správně
3. **Poznamenejte si**: Přesný název souboru

---

## **5. 🧪 Test mServer API (2 minut)**

### **A) Test základního připojení (1 minuta):**
1. **Otevřete prohlížeč**
2. **Přejděte na**: `http://127.0.0.1:444`
3. **Očekávaný výsledek**: Pohoda mServer úvodní stránka
4. **Pokud chyba**: Restartujte Pohoda a zkuste znovu

### **B) Test XML endpointu (1 minuta):**
1. **URL**: `http://127.0.0.1:444/xml`
2. **Očekávaný výsledek**: Chyba autentifikace (to je OK!)
3. **Pokud "Connection refused"**: mServer není aktivní

### **C) Test s credentials (volitelné):**
```bash
# Pokud máte curl dostupný
curl -X POST http://127.0.0.1:444/xml \
  -H "Content-Type: application/xml" \
  -H "Authorization: Basic $(echo -n 'hostbill_api:HostBill2024!' | base64)" \
  -H "STW-Instance: StwPh_12345678_2024.mdb" \
  -d '<?xml version="1.0"?><test/>'
```

---

## **6. 🔧 Pokročilá konfigurace (volitelné)**

### **A) Firewall nastavení:**
- **Port 444** musí být dostupný pro HostBill server
- **Lokální komunikace**: Obvykle není problém
- **Vzdálený přístup**: Otevřete port 444 v firewall

### **B) Síťová konfigurace:**
- **Stejný server**: `127.0.0.1:444` (doporučeno)
- **Jiný server**: `IP_POHODA_SERVERU:444`
- **VPN/Tunel**: Ověřte dostupnost portu

### **C) Pohoda služba (Windows Service):**
1. **Services.msc** → Najděte "Pohoda mServer"
2. **Startup Type**: **Automatic**
3. **Status**: **Running**
4. **Recovery**: Restart service on failure

---

## **7. 📊 Monitoring a údržba**

### **A) Pohoda logy:**
1. **Pohoda** → **Nástroje** → **Protokol událostí**
2. **Filtr**: "XML" nebo "mServer"
3. **Hledejte**: Úspěšné/neúspěšné XML importy

### **B) mServer statistiky:**
1. **Pohoda** → **Nástroje** → **Možnosti** → **mServer**
2. **Záložka**: **Statistiky**
3. **Sledujte**: Počet požadavků, chyby, výkon

### **C) Pravidelná údržba:**
- **Týdně**: Zkontrolujte Pohoda logy
- **Měsíčně**: Ověřte synchronizaci faktur
- **Při problémech**: Zapněte debug mode

---

## **8. 🔍 Troubleshooting**

### **Pohoda neběží:**
```
❌ Symptom: "Connection refused" na port 444
✅ Řešení: 
   1. Spusťte Pohoda software
   2. Otevřete správnou databázi
   3. Ověřte mServer: Nástroje → Možnosti → mServer
```

### **mServer neaktivní:**
```
❌ Symptom: Pohoda běží, ale port 444 nedostupný
✅ Řešení:
   1. Nástroje → Možnosti → mServer
   2. Zaškrtněte "Povolit mServer"
   3. Port: 444
   4. Zaškrtněte "Povolit XML API"
   5. OK → Restart Pohoda
```

### **Nesprávná oprávnění:**
```
❌ Symptom: "Access denied" nebo "Permission error"
✅ Řešení:
   1. Soubor → Uživatelé → hostbill_api
   2. Oprávnění → Zaškrtněte všechna potřebná
   3. Zvláště: XML Import/Export, mServer přístup
```

### **Databáze nenalezena:**
```
❌ Symptom: "Database not found" nebo "File not found"
✅ Řešení:
   1. Soubor → Informace o databázi
   2. Zkopírujte PŘESNÝ název (StwPh_ICO_YYYY.mdb)
   3. Aktualizujte v HostBill konfiguraci
```

---

## **9. 📋 Checklist Pohoda konfigurace**

### **✅ Pohoda SW připravena když:**
- ☑️ **Pohoda software spuštěn** a funkční
- ☑️ **Správná databáze otevřena** pro aktuální rok
- ☑️ **mServer aktivován** (Nástroje → Možnosti → mServer)
- ☑️ **Port 444 dostupný** (test: http://127.0.0.1:444)
- ☑️ **XML API povoleno** v mServer nastavení
- ☑️ **API uživatel vytvořen** (hostbill_api)
- ☑️ **Oprávnění nastavena** (XML, faktury, mServer)
- ☑️ **Název databáze zjištěn** (StwPh_ICO_YYYY.mdb)
- ☑️ **Backup vytvořen** před konfigurací
- ☑️ **Test připojení úspěšný** z HostBill

### **✅ Produkční provoz připraven když:**
- ☑️ **Pohoda běží stabilně** bez chyb
- ☑️ **mServer automaticky startuje** s Pohoda
- ☑️ **Firewall nakonfigurován** (port 444)
- ☑️ **Monitoring aktivní** (protokol událostí)
- ☑️ **Zálohovací strategie** připravena

---

## **10. 🎯 Optimalizace výkonu**

### **A) Pohoda nastavení:**
1. **Nástroje** → **Možnosti** → **Obecné**
2. **Zaškrtněte**: ☑️ "Rychlé načítání"
3. **Zaškrtněte**: ☑️ "Optimalizace databáze"

### **B) mServer optimalizace:**
1. **mServer** → **Pokročilé**
2. **Max. připojení**: `20` (pro více současných požadavků)
3. **Timeout**: `60` sekund (pro pomalé operace)
4. **Cache**: ☑️ "Povolit cache" (rychlejší odpovědi)

### **C) Systémová optimalizace:**
- **RAM**: Min. 4GB pro Pohoda + mServer
- **CPU**: Dual-core nebo lepší
- **Disk**: SSD doporučeno pro rychlé databázové operace
- **Síť**: Gigabit LAN pro rychlou komunikaci

---

## **11. 🛡️ Bezpečnostní doporučení**

### **A) API uživatel:**
- ✅ **Silné heslo** (min. 12 znaků)
- ✅ **Minimální oprávnění** (jen potřebná)
- ✅ **Pravidelná změna hesla** (každé 3 měsíce)
- ✅ **Monitoring přístupů** (protokol událostí)

### **B) mServer bezpečnost:**
- ✅ **Lokální přístup pouze** (127.0.0.1)
- ✅ **Firewall pravidla** (port 444 jen pro HostBill)
- ✅ **HTTPS** pro vzdálený přístup (pokud potřeba)
- ✅ **VPN** pro přístup přes internet

### **C) Databáze bezpečnost:**
- ✅ **Pravidelné zálohy** (denně)
- ✅ **Antivirus výjimka** pro Pohoda složku
- ✅ **Disk encryption** (BitLocker/podobné)
- ✅ **Přístupová práva** (jen potřební uživatelé)

---

## **12. 📊 Monitoring a údržba**

### **A) Denní kontroly:**
- ✅ **Pohoda běží** bez chyb
- ✅ **mServer aktivní** (port 444 dostupný)
- ✅ **Nové faktury** se synchronizují
- ✅ **Platby** se označují správně

### **B) Týdenní kontroly:**
- ✅ **Protokol událostí** - žádné chyby
- ✅ **Databáze velikost** - růst v normě
- ✅ **Výkon systému** - bez zpomalení
- ✅ **Zálohy** - automatické a funkční

### **C) Měsíční údržba:**
- ✅ **Kompaktace databáze** (Nástroje → Údržba)
- ✅ **Čištění logů** (starší než 3 měsíce)
- ✅ **Update Pohoda** (pokud dostupný)
- ✅ **Test disaster recovery** (obnova ze zálohy)

---

## **13. 🚨 Disaster Recovery**

### **A) Záložní plán:**
1. **Denní automatické zálohy** Pohoda databáze
2. **Týdenní full backup** celého systému
3. **Měsíční test obnovy** ze zálohy
4. **Dokumentace postupů** pro rychlou obnovu

### **B) Postupy při výpadku:**

#### **Pohoda nereaguje:**
1. **Restartujte Pohoda** software
2. **Zkontrolujte databázi** (možná korupce)
3. **Obnovte ze zálohy** (pokud potřeba)
4. **Znovu aktivujte mServer**

#### **mServer nefunguje:**
1. **Nástroje** → **Možnosti** → **mServer**
2. **Vypněte a zapněte** mServer
3. **Zkontrolujte port 444** (možný konflikt)
4. **Restartujte Pohoda** jako poslední možnost

#### **Databáze poškozena:**
1. **STOP** všechny operace
2. **Obnovte ze zálohy** okamžitě
3. **Ověřte integritu** dat
4. **Znovu spusťte synchronizaci**

---

## **14. 🎉 Dokončení setup**

### **✅ Pohoda SW je připravena když:**
- ✅ **Software běží stabilně** bez chyb
- ✅ **mServer aktivní** na portu 444
- ✅ **XML API funkční** (test připojení OK)
- ✅ **API uživatel vytvořen** s oprávněními
- ✅ **Databáze přístupná** a funkční
- ✅ **Backup strategie** implementována
- ✅ **Monitoring nastaveno** (logy, statistiky)

### **🔗 Připojení k HostBill:**
Po dokončení Pohoda setup pokračujte:
1. **HostBill instalací** podle `HOSTBILL_POHODA_INSTALLATION_GUIDE.md`
2. **Konfigurací credentials** v HostBill admin
3. **Testem připojení** a synchronizace
4. **Aktivací auto sync** pro produkční provoz

### **🚀 Výsledek:**
**Pohoda SW je nyní připravena pro automatickou integraci s HostBill! Každá faktura a platba se bude automaticky synchronizovat bez manuální práce! 🎯**

---

## **📞 Podpora a kontakt**

### **Při problémech:**
1. **Zkontrolujte logy**: Pohoda → Nástroje → Protokol událostí
2. **Zapněte debug**: HostBill → Pohoda Integration → Debug Mode
3. **Test připojení**: HostBill → Pohoda Integration → Test Connection
4. **Dokumentace**: Stormware.cz → Pohoda → mServer dokumentace

**Pohoda SW setup je kompletní a připraven pro HostBill integraci! 🎉**
