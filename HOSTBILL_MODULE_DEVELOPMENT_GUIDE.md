# 📚 **HOSTBILL MODULE DEVELOPMENT GUIDE**

## 🎯 **Kompletní průvodce vytvářením modulů pro HostBill**

*Založeno na úspěšném řešení problému "Unauthorized access" a oficiální HostBill dokumentaci*

---

## 📋 **OBSAH**

1. [Úvod a klíčová zjištění](#úvod-a-klíčová-zjištění)
2. [Správná struktura modulů](#správná-struktura-modulů)
3. [Payment Gateway moduly](#payment-gateway-moduly)
4. [Addon moduly](#addon-moduly)
5. [Implementované moduly](#implementované-moduly)
6. [Admin rozhraní](#admin-rozhraní)
7. [Řešení problémů](#řešení-problémů)
8. [Praktické příklady](#praktické-příklady)

---

## 🔍 **ÚVOD A KLÍČOVÁ ZJIŠTĚNÍ**

### ❌ **Časté chyby při vývoji HostBill modulů:**

1. **Nesprávná struktura souborů** - moduly musí být ve složkách, ne jako jednotlivé soubory
2. **Chybějící parent třídy** - moduly musí dědit z `PaymentModule` nebo `OtherModule`
3. **Špatné funkce** - používání funkcí místo OOP metod
4. **IonCube problémy** - falešné IonCube hlavičky způsobují chyby
5. **Chybějící autentifikace** - nesprávná HostBill security kontrola

### ✅ **Správné řešení:**

- **OOP přístup** s dědičností z HostBill parent tříd
- **Čistý PHP kód** bez IonCube hlaviček (pro custom moduly)
- **Správná složková struktura** podle HostBill standardů
- **Kompletní autentifikace** v admin rozhraní

---

## 🏗️ **SPRÁVNÁ STRUKTURA MODULŮ**

### 📁 **Payment Gateway moduly:**
```
/includes/modules/Payment/nazev_modulu/
├── class.nazev_modulu.php    # Hlavní modul (povinný)
├── admin.php                 # Admin rozhraní (volitelné)
├── callback.php              # Callback handler (volitelné)
└── return.php                # Return handler (volitelné)
```

### 📁 **Addon moduly:**
```
/includes/modules/Other/nazev_modulu/
├── class.nazev_modulu.php    # Hlavní modul (povinný)
├── admin.php                 # Admin rozhraní (volitelné)
└── hooks.php                 # Event hooks (volitelné)
```

### 🔧 **Pojmenování souborů:**
- **Hlavní modul:** `class.nazev_modulu.php`
- **Třída:** `NazevModulu` (PascalCase)
- **Složka:** `nazev_modulu` (lowercase s podtržítky)

---

## 💳 **PAYMENT GATEWAY MODULY**

### 🎯 **Základní struktura:**

```php
<?php

class NazevModulu extends PaymentModule {
    
    protected $modname = 'Název Modulu';
    protected $description = 'Popis modulu';
    protected $supportedCurrencies = array('CZK', 'EUR', 'USD');
    
    protected $configuration = array(
        'api_key' => array(
            'value' => '',
            'type' => 'input',
            'description' => 'API klíč'
        ),
        'test_mode' => array(
            'value' => '1',
            'type' => 'check',
            'description' => 'Testovací režim'
        )
    );
    
    public function drawForm() {
        // Vygenerování platebního formuláře
        return '<form>...</form>';
    }
    
    public function callback() {
        // Zpracování callback od payment gateway
        return true; // nebo false
    }
}
```

### 🔧 **Povinné metody:**
- `drawForm()` - Vygenerování platebního formuláře pro klienta
- `callback()` - Zpracování callback notifikací od payment gateway

### 🔧 **Volitelné metody:**
- `testConnection()` - Test připojení k API
- `refund()` - Zpracování refundací

---

## 🔌 **ADDON MODULY**

### ⚠️ **DŮLEŽITÉ:** HostBill nemá třídu `AddonModule`!

Addon moduly musí být implementovány jako **samostatné třídy** s **globálními funkcemi** pro HostBill integrace.

### 🎯 **Správná struktura:**

```php
<?php

// Prevent direct access
if (!defined('HOSTBILL')) {
    die('Unauthorized access');
}

class NazevModulu {

    public $configuration = array(
        'api_url' => array(
            'value' => '',
            'type' => 'input',
            'description' => 'API URL'
        ),
        'enabled' => array(
            'value' => '1',
            'type' => 'check',
            'description' => 'Povolit modul'
        )
    );

    public function activate() {
        // Aktivace modulu
        return array(
            'status' => 'success',
            'description' => 'Modul aktivován'
        );
    }

    public function deactivate() {
        // Deaktivace modulu
        return array(
            'status' => 'success',
            'description' => 'Modul deaktivován'
        );
    }
}

// Povinné globální funkce pro HostBill
function nazev_config() {
    $module = new NazevModulu();
    return $module->configuration;
}

function nazev_activate() {
    $module = new NazevModulu();
    return $module->activate();
}

function nazev_deactivate() {
    $module = new NazevModulu();
    return $module->deactivate();
}

function nazev_output($vars) {
    return 'Module is active.';
}
```

### 🔧 **Povinné globální funkce:**
- `nazev_config()` - Konfigurace modulu
- `nazev_activate()` - Aktivace modulu
- `nazev_deactivate()` - Deaktivace modulu
- `nazev_output($vars)` - Výstup modulu (volitelné)



---

## 🚀 **IMPLEMENTOVANÉ MODULY**

### 📋 **Přehled všech vytvořených modulů:**

#### **💳 Payment Gateway Moduly:**

##### **1. 🔧 Comgate (Basic)**
```
Složka: /includes/modules/Payment/comgate/
Soubor: class.comgate.php
Třída: class Comgate extends PaymentModule
```

**Funkce:**
- ✅ **Základní Comgate API** - standardní platební funkcionalita
- ✅ **Podporované měny:** CZK, EUR, USD
- ✅ **Platební metody:** karty, bankovní převody, PayPal
- ✅ **Test mode** - pro vývoj a testování
- ✅ **Auto redirect** - automatické přesměrování na platební bránu
- ✅ **Callback handling** - zpracování PAID/CANCELLED/PENDING stavů

**Konfigurace:**
- Merchant ID
- Secret Key
- Test Mode
- Payment Methods
- Language
- Auto Redirect

##### **2. 🚀 Comgate Advanced**
```
Složka: /includes/modules/Payment/comgate_advanced/
Soubor: class.comgate_advanced.php
Třída: class comgate_advanced extends PaymentModule
```

**Funkce:**
- ✅ **Plná Comgate API compliance** - podle oficiální dokumentace
- ✅ **Rozšířené měny:** CZK, EUR, USD, GBP, PLN, HUF, RON, BGN
- ✅ **Moderní platební metody:** Apple Pay, Google Pay, Twisto
- ✅ **Pokročilé funkce:** preauth, recurring payments, EET reporting
- ✅ **Bezpečnost:** webhook signature validation
- ✅ **Responzivní rozhraní** - optimalizované pro mobily

**Konfigurace:**
- Merchant ID + 15 pokročilých parametrů
- Plná kontrola nad API funkcemi
- Podpora všech moderních platebních metod

#### **🔧 Other Moduly:**

##### **3. 📊 Pohoda Integration**
```
Složka: /includes/modules/Other/pohoda_integration/
Soubor: class.pohoda_integration.php
Třída: class pohoda_integration extends OtherModule
```

**Funkce:**
- ✅ **mServer integrace** - propojení s Pohoda účetním systémem
- ✅ **Auto sync** - automatická synchronizace faktur a zákazníků
- ✅ **Test connection** - ověření připojení k mServer
- ✅ **Manual sync** - ruční synchronizace
- ✅ **Cron support** - automatické zpracování
- ✅ **Debug logging** - pro troubleshooting

**Konfigurace:**
- mServer URL, username, password
- Data file name
- Auto sync settings
- Debug mode

##### **4. 📧 Advanced Email Manager**
```
Složka: /includes/modules/Other/email_manager/
Soubor: class.email_manager.php
Třída: class email_manager extends OtherModule
```

**Funkce:**
- ✅ **SMTP konfigurace** - vlastní SMTP server
- ✅ **Email queue** - frontové zpracování emailů
- ✅ **Email verification** - ověření email adres
- ✅ **Template management** - správa šablon
- ✅ **Cron support** - automatické zpracování fronty
- ✅ **Debug logging** - detailní logování

**Konfigurace:**
- SMTP host, port, security, auth
- Queue settings
- Email verification
- Debug mode

### 🎯 **Klíčové konvence názvů:**

| **Typ modulu** | **Název složky** | **Název souboru** | **Název třídy** |
|---|---|---|---|
| **Payment (jednoslovné)** | `comgate` | `class.comgate.php` | `class Comgate` |
| **Payment (víceslovné)** | `comgate_advanced` | `class.comgate_advanced.php` | `class comgate_advanced` |
| **Other (vždy)** | `pohoda_integration` | `class.pohoda_integration.php` | `class pohoda_integration` |
| **Other (vždy)** | `email_manager` | `class.email_manager.php` | `class email_manager` |

### 📋 **Pravidla pro názvy tříd:**

#### **Payment Moduly:**
- **Jednoslovné názvy:** `Comgate`, `PayPal`, `Stripe` (CamelCase)
- **Víceslovné názvy:** `comgate_advanced`, `paypal_pro` (snake_case)

#### **Other Moduly:**
- **Vždy snake_case:** `pohoda_integration`, `email_manager`

**⚠️ DŮLEŽITÉ:** Název třídy musí přesně odpovídat názvu složky!

---

## 🎛️ **ADMIN ROZHRANÍ**

### 🔐 **Správná autentifikace:**

```php
<?php
// HostBill security check
if (!defined('HOSTBILL')) {
    die('Unauthorized access');
}

// Check if we're in admin area
if (!defined('ADMIN_AREA')) {
    define('ADMIN_AREA', true);
}

// Check admin authentication
if (!isset($_SESSION['adminid']) || empty($_SESSION['adminid'])) {
    die('Unauthorized access');
}
?>
```

### 🎨 **HTML struktura:**

```php
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">
            <i class="fa fa-icon"></i> Název Modulu
        </h3>
    </div>
    <div class="panel-body">
        <!-- Obsah admin rozhraní -->
    </div>
</div>
```

### 📝 **Zpracování akcí:**

```php
<?php
if (isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'test_connection':
            echo '<div class="alert alert-success">Test úspěšný!</div>';
            break;
        case 'sync_data':
            echo '<div class="alert alert-info">Data synchronizována!</div>';
            break;
    }
}
?>
```

---

## 🛠️ **ŘEŠENÍ PROBLÉMŮ**

### 📋 **Přehled typů modulů:**

| **Typ modulu** | **Struktura** | **Umístění** | **Sekce v admin** | **Implementace** |
|---|---|---|---|---|
| **Payment Gateway** | `class Nazev extends PaymentModule` | `/includes/modules/Payment/` | Payment Modules | OOP s dědičností |
| **Other Module** | `class Nazev extends OtherModule` | `/includes/modules/Other/` | Addon Modules | **OOP s dědičností** |

### ❌ **"Unauthorized access" chyba:**

**Příčiny:**
1. Chybějící `if (!defined('HOSTBILL'))` kontrola
2. Nesprávná admin autentifikace
3. Chybějící `ADMIN_AREA` konstanta
4. Falešné IonCube hlavičky

**Řešení:**
```php
// Správná autentifikace
if (!defined('HOSTBILL')) {
    die('Unauthorized access');
}
if (!defined('ADMIN_AREA')) {
    define('ADMIN_AREA', true);
}
if (!isset($_SESSION['adminid']) || empty($_SESSION['adminid'])) {
    die('Unauthorized access');
}
```

### ❌ **"Class nazev_modulu does not exist" chyba:**

**Příčina:** HostBill očekává název třídy podle názvu složky

**Řešení:** Ujistit se, že:
1. **Název třídy = název složky** přesně
2. Soubor se jmenuje `class.nazev_modulu.php`
3. Třída správně dědí z příslušné parent třídy
4. **Dodržet konvence názvů** podle typu modulu

**Konvence názvů pro Payment moduly:**
```php
// ✅ SPRÁVNĚ - Jednoslovné názvy (CamelCase)
// Složka: comgate → Třída: Comgate
class Comgate extends PaymentModule { ... }

// ✅ SPRÁVNĚ - Víceslovné názvy (snake_case)
// Složka: comgate_advanced → Třída: comgate_advanced
class comgate_advanced extends PaymentModule { ... }
```

**Konvence názvů pro Other moduly:**
```php
// ✅ SPRÁVNĚ - Vždy snake_case
// Složka: pohoda_integration → Třída: pohoda_integration
class pohoda_integration extends OtherModule { ... }

// ✅ SPRÁVNĚ - Vždy snake_case
// Složka: email_manager → Třída: email_manager
class email_manager extends OtherModule { ... }
```

**❌ Časté chyby:**
```php
// ❌ ŠPATNĚ - CamelCase pro Other modul
class PohodaIntegration extends OtherModule { ... }

// ❌ ŠPATNĚ - snake_case pro jednoslovný Payment modul
class comgate extends PaymentModule { ... }

// ❌ ŠPATNĚ - CamelCase pro víceslovný Payment modul
class ComgateAdvanced extends PaymentModule { ... }
```

### ❌ **"Class Plugins not found" chyba:**

**Příčina:** Plugin modul nemůže najít parent třídu `Plugins`

**Řešení:** Ujistit se, že:
1. Modul je ve správné složce `/includes/modules/Other/nazev/`
2. Soubor se jmenuje `class.nazev.php`
3. Třída dědí z `Plugins`: `class NazevModulu extends Plugins`

### ✅ **FINÁLNÍ ŘEŠENÍ - OtherModule třída (OVĚŘENO!):**

**Správné řešení:** Moduly v `/Other` dědí z třídy **`OtherModule`** (podle WHMCS Tools a HostBill dokumentace)!

```php
<?php
// Prevent direct access
if (!defined('HOSTBILL')) {
    die('Unauthorized access');
}

/**
 * HostBill Other Module
 * Dědí z OtherModule třídy podle oficiální dokumentace
 */
class NazevModulu extends OtherModule {

    /**
     * @var string Default module name to be displayed in adminarea
     */
    protected $modname = 'Název Modulu';

    /**
     * @var string Default module description
     */
    protected $description = 'Popis modulu';

    /**
     * @var string Module version
     */
    protected $version = '1.0.0';

    /**
     * Module info array - definuje vlastnosti modulu
     */
    protected $info = array(
        'haveadmin'    => true,  // is module accessible from adminarea
        'haveuser'     => false, // is module accessible from client area
        'havelang'     => false, // does module support multilanguage
        'havetpl'      => false, // does module have template
        'havecron'     => false, // does module support cron calls
        'haveapi'      => false, // is module accessible via api
        'needauth'     => false, // does module needs authorisation
        'isobserver'   => false, // is module an observer
        'clients_menu' => false, // listing in adminarea->clients menu
        'support_menu' => false, // listing in adminarea->support menu
        'payment_menu' => false, // listing in adminarea->payments menu
        'orders_menu'  => false, // listing in adminarea->orders menu
        'extras_menu'  => true,  // listing in extras menu
        'mainpage'     => true,  // listing in admin/client home
        'header_js'    => false, // does module have getHeaderJS function
    );

    /**
     * Configuration array - types allowed: check, input, select
     */
    protected $configuration = array(
        'api_url' => array(
            'value' => '',
            'type' => 'input',
            'description' => 'URL API serveru'
        ),
        'enabled' => array(
            'value' => '1',
            'type' => 'check',
            'description' => 'Povolit modul'
        )
    );

    /**
     * Module installation - POVINNÁ metoda
     */
    public function install() {
        // Inicializace modulu, vytvoření tabulek, atd.
        return true;
    }
}
```

**Klíčové body:**
- ✅ **Dědičnost z OtherModule** - `extends OtherModule` (ověřeno z WHMCS Tools)
- ✅ **Název třídy = název složky** - `class pohoda_integration` pro složku `pohoda_integration`
- ✅ **Protected properties** `$modname`, `$description`, `$version`, `$info`, `$configuration`
- ✅ **Public metoda** `install()` - POVINNÁ pro instalaci
- ✅ **$info array** - definuje vlastnosti a umístění modulu v admin rozhraní
- ✅ **Snake_case** pro název třídy (ne CamelCase)

### ❌ **"Corrupt file" chyba:**

**Příčina:** Falešné IonCube hlavičky

**Řešení:** Použít čistý PHP kód bez IonCube hlaviček

### ❌ **Modul se nezobrazuje v admin:**

**Příčiny:**
1. Špatná složková struktura
2. Nesprávné pojmenování souborů
3. Chybějící parent třída
4. Špatná oprávnění souborů

**Řešení:**
```bash
# Správná struktura
/includes/modules/Payment/nazev/class.nazev.php
# Správná oprávnění
chown apache:apache soubor.php
chmod 644 soubor.php
```

---

## 💡 **PRAKTICKÉ PŘÍKLADY**

### 🔧 **Comgate Payment Gateway:**
- Dědí z `PaymentModule`
- Implementuje `drawForm()` a `callback()`
- Podporuje CZK, EUR, USD
- Test mode konfigurace

### 💼 **Pohoda Integration:**
- Dědí z `AddonModule`
- Synchronizace faktur a zákazníků
- mServer API integrace
- XML export funkcionalita

### 📧 **Advanced Email Manager:**
- Dědí z `AddonModule`
- SMTP konfigurace
- Email queue management
- Template management

---

## 🎯 **CHECKLIST PRO NOVÝ MODUL**

### ✅ **Před vytvořením:**
- [ ] Určit typ modulu (Payment/Addon)
- [ ] Vybrat správnou parent třídu
- [ ] Naplánovat konfigurační parametry
- [ ] Definovat povinné metody

### ✅ **Při vytváření:**
- [ ] Správná složková struktura
- [ ] Správné pojmenování souborů
- [ ] OOP přístup s dědičností
- [ ] Kompletní konfigurace array

### ✅ **Po vytvoření:**
- [ ] Nastavit správná oprávnění
- [ ] Otestovat aktivaci/deaktivaci
- [ ] Ověřit admin rozhraní
- [ ] Otestovat funkcionalitu

### ✅ **Před nasazením:**
- [ ] Kompletní testování
- [ ] Dokumentace
- [ ] Backup původních souborů
- [ ] Monitoring logů

---

## 🚀 **ZÁVĚR**

Správný vývoj HostBill modulů vyžaduje:

1. **Pochopení HostBill architektury**
2. **Dodržování OOP principů**
3. **Správnou strukturu souborů**
4. **Kompletní autentifikaci**
5. **Důkladné testování**

**Klíčové ponaučení:** HostBill akceptuje čistý PHP kód pro custom moduly, ale vyžaduje specifickou strukturu a dědičnost z parent tříd.

---

## 📊 **KONFIGURACE PARAMETRŮ**

### 🔧 **Typy konfiguračních polí:**

```php
protected $configuration = array(
    // Textové pole
    'api_key' => array(
        'value' => '',
        'type' => 'input',
        'description' => 'API klíč'
    ),

    // Checkbox
    'enabled' => array(
        'value' => '1',
        'type' => 'check',
        'description' => 'Povolit modul'
    ),

    // Dropdown select
    'currency' => array(
        'value' => 'CZK',
        'type' => 'select',
        'options' => 'CZK,EUR,USD',
        'description' => 'Měna'
    ),

    // Password pole
    'secret' => array(
        'value' => '',
        'type' => 'password',
        'description' => 'Tajný klíč'
    )
);
```

---

## 🔄 **LIFECYCLE MODULŮ**

### 📋 **Payment Gateway lifecycle:**
1. **Instalace** - Zkopírování souborů do správné složky
2. **Detekce** - HostBill automaticky detekuje nový modul
3. **Aktivace** - Admin aktivuje modul v Payment Gateways
4. **Konfigurace** - Nastavení parametrů modulu
5. **Použití** - Modul je dostupný pro platby
6. **Deaktivace** - Vypnutí modulu

### 📋 **Addon Module lifecycle:**
1. **Instalace** - Zkopírování souborů do správné složky
2. **Detekce** - HostBill automaticky detekuje nový modul
3. **Aktivace** - Spuštění `activate()` metody
4. **Konfigurace** - Nastavení parametrů modulu
5. **Použití** - Modul běží na pozadí
6. **Deaktivace** - Spuštění `deactivate()` metody

---

## 🔍 **DEBUGGING A LOGOVÁNÍ**

### 📝 **HostBill logging:**

```php
// V payment gateway modulu
$this->logActivity(array(
    'result' => 'Payment successful',
    'output' => array(
        'transaction_id' => $transaction_id,
        'amount' => $amount
    )
));

// V addon modulu
$this->logActivity('Custom log message');
```

### 📁 **Log soubory:**
- **Payment Gateway:** `/admin/logs/gateway_nazev.log`
- **Addon Module:** `/admin/logs/addon_nazev.log`
- **Custom logs:** Vlastní log soubory v module složce

---

## 🛡️ **BEZPEČNOST**

### 🔐 **Bezpečnostní kontroly:**

```php
// Validace vstupních dat
$amount = (float)$_POST['amount'];
if ($amount <= 0) {
    throw new Exception('Invalid amount');
}

// Escapování HTML
$safe_output = htmlspecialchars($user_input, ENT_QUOTES, 'UTF-8');

// SQL injection prevence (použít HostBill DB metody)
$result = $this->db->prepare("SELECT * FROM table WHERE id = ?", array($id));
```

### 🔒 **API klíče a hesla:**
- Nikdy nelogovat API klíče nebo hesla
- Používat HTTPS pro API komunikaci
- Validovat callback signatures

---

## 🎨 **UI/UX GUIDELINES**

### 🎯 **Bootstrap komponenty:**

```html
<!-- Panely -->
<div class="panel panel-default">
    <div class="panel-heading">Nadpis</div>
    <div class="panel-body">Obsah</div>
</div>

<!-- Alerty -->
<div class="alert alert-success">Úspěch</div>
<div class="alert alert-danger">Chyba</div>
<div class="alert alert-warning">Varování</div>
<div class="alert alert-info">Informace</div>

<!-- Tlačítka -->
<button class="btn btn-primary">Primární</button>
<button class="btn btn-success">Úspěch</button>
<button class="btn btn-danger">Nebezpečí</button>

<!-- Ikony (Font Awesome) -->
<i class="fa fa-check"></i>
<i class="fa fa-times"></i>
<i class="fa fa-spinner fa-spin"></i>
```

---

## 📚 **UŽITEČNÉ ZDROJE**

### 🔗 **Oficiální dokumentace:**
- **HostBill Dev Kit:** `http://dev.hostbillapp.com/`
- **GitHub Samples:** `https://github.com/tallship/oop_devkit`
- **API Reference:** HostBill admin → Developer Tools

### 🔗 **Komunita:**
- **HostBill Forum:** Oficiální fórum pro vývojáře
- **Discord/Slack:** Komunitní kanály
- **Stack Overflow:** Tag `hostbill`

---

*Dokumentace vytvořena na základě úspěšného řešení problému "Unauthorized access" a oficiální HostBill dokumentace.*

*Verze: 1.0 | Datum: 2025-08-09 | Autor: CloudVPS Team*
