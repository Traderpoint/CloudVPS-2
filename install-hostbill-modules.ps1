# HostBill Modules Installation Script for Windows Server 2019
# Automatická instalace SSH klienta a přenos modulů na Linux server

param(
    [string]$ServerIP = "10.233.1.136",
    [string]$Username = "root",
    [string]$Password = "Obchudek2017"
)

Write-Host "🚀 HostBill Modules Installation Script" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Krok 1: Instalace OpenSSH Client
Write-Host "`n1️⃣ Checking OpenSSH Client installation..." -ForegroundColor Yellow

try {
    $sshVersion = ssh -V 2>&1
    Write-Host "✅ OpenSSH Client is already installed: $sshVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing OpenSSH Client..." -ForegroundColor Yellow
    
    # Zkontroluj dostupné OpenSSH komponenty
    $sshCapability = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Client*'
    
    if ($sshCapability) {
        Add-WindowsCapability -Online -Name $sshCapability.Name
        Write-Host "✅ OpenSSH Client installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ OpenSSH Client not available. Please install manually." -ForegroundColor Red
        exit 1
    }
}

# Krok 2: Příprava modulů
Write-Host "`n2️⃣ Preparing HostBill modules..." -ForegroundColor Yellow

$currentDir = Get-Location
$modulesExist = $true

# Zkontroluj existenci modulů
$modules = @("hostbill-comgate-module", "hostbill-email-module", "hostbill-pohoda-module")
foreach ($module in $modules) {
    if (!(Test-Path $module)) {
        Write-Host "❌ Module $module not found in current directory" -ForegroundColor Red
        $modulesExist = $false
    }
}

if (!$modulesExist) {
    Write-Host "❌ Some modules are missing. Please ensure all modules are in the current directory." -ForegroundColor Red
    exit 1
}

# Vytvoř archiv modulů
Write-Host "📦 Creating modules archive..." -ForegroundColor Yellow
$archiveName = "hostbill-modules-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"

try {
    tar -czf $archiveName hostbill-comgate-module hostbill-email-module hostbill-pohoda-module
    Write-Host "✅ Archive created: $archiveName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create archive. Please ensure tar is available." -ForegroundColor Red
    exit 1
}

# Krok 3: Vytvoření instalačního skriptu pro Linux
Write-Host "`n3️⃣ Creating Linux installation script..." -ForegroundColor Yellow

$linuxScript = @"
#!/bin/bash
# HostBill Modules Installation Script for Linux Server
# Automatická instalace všech tří modulů

set -e  # Exit on any error

echo "🚀 HostBill Modules Installation on Linux Server"
echo "================================================"

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funkce pro barevný výstup
print_status() {
    echo -e "\${GREEN}✅ \$1\${NC}"
}

print_warning() {
    echo -e "\${YELLOW}⚠️  \$1\${NC}"
}

print_error() {
    echo -e "\${RED}❌ \$1\${NC}"
}

print_step() {
    echo -e "\${YELLOW}\$1\${NC}"
}

# Krok 1: Ověření HostBill instalace
print_step "1️⃣ Verifying HostBill installation..."

HOSTBILL_PATH="/home/hostbill/public_html"
if [ ! -d "\$HOSTBILL_PATH" ]; then
    print_error "HostBill not found at \$HOSTBILL_PATH"
    exit 1
fi

if [ ! -d "\$HOSTBILL_PATH/includes" ]; then
    print_error "HostBill includes directory not found"
    exit 1
fi

print_status "HostBill installation verified"

# Krok 2: Příprava adresářů
print_step "2️⃣ Preparing module directories..."

MODULES_PATH="\$HOSTBILL_PATH/includes/modules"
mkdir -p "\$MODULES_PATH/gateways"
mkdir -p "\$MODULES_PATH/addons"

print_status "Module directories prepared"

# Krok 3: Rozbalení a instalace modulů
print_step "3️⃣ Extracting and installing modules..."

cd /tmp

# Najdi nejnovější archiv
ARCHIVE=\$(ls -t hostbill-modules-*.tar.gz 2>/dev/null | head -n1)
if [ -z "\$ARCHIVE" ]; then
    print_error "No modules archive found in /tmp"
    exit 1
fi

print_status "Found archive: \$ARCHIVE"

# Rozbal archiv
tar -xzf "\$ARCHIVE"

# Instalace Comgate modulu (Payment Gateway)
print_step "4️⃣ Installing Comgate Payment Gateway..."
if [ -d "hostbill-comgate-module" ]; then
    cp -r hostbill-comgate-module "\$MODULES_PATH/gateways/comgate"
    chown -R www-data:www-data "\$MODULES_PATH/gateways/comgate"
    chmod -R 755 "\$MODULES_PATH/gateways/comgate"
    
    cd "\$MODULES_PATH/gateways/comgate"
    php install.php install
    print_status "Comgate module installed successfully"
else
    print_error "Comgate module not found in archive"
fi

# Instalace Email modulu (Addon)
print_step "5️⃣ Installing Email Manager..."
if [ -d "/tmp/hostbill-email-module" ]; then
    cp -r /tmp/hostbill-email-module "\$MODULES_PATH/addons/email"
    chown -R www-data:www-data "\$MODULES_PATH/addons/email"
    chmod -R 755 "\$MODULES_PATH/addons/email"
    
    cd "\$MODULES_PATH/addons/email"
    php install.php install
    print_status "Email module installed successfully"
else
    print_error "Email module not found in archive"
fi

# Instalace Pohoda modulu (Addon)
print_step "6️⃣ Installing Pohoda Integration..."
if [ -d "/tmp/hostbill-pohoda-module" ]; then
    cp -r /tmp/hostbill-pohoda-module "\$MODULES_PATH/addons/pohoda"
    chown -R www-data:www-data "\$MODULES_PATH/addons/pohoda"
    chmod -R 755 "\$MODULES_PATH/addons/pohoda"
    
    cd "\$MODULES_PATH/addons/pohoda"
    php install.php install
    print_status "Pohoda module installed successfully"
else
    print_error "Pohoda module not found in archive"
fi

# Krok 7: Testování instalace
print_step "7️⃣ Testing module installations..."

echo ""
echo "Testing Comgate module:"
cd "\$MODULES_PATH/gateways/comgate"
php install.php test

echo ""
echo "Testing Email module:"
cd "\$MODULES_PATH/addons/email"
php install.php test

echo ""
echo "Testing Pohoda module:"
cd "\$MODULES_PATH/addons/pohoda"
php install.php test

# Krok 8: Shrnutí
print_step "8️⃣ Installation Summary"
echo ""
print_status "All HostBill modules installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Login to HostBill Admin Panel"
echo "2. Go to Setup → Payment Gateways → Activate 'Comgate Payment Gateway'"
echo "3. Go to Setup → Addon Modules → Activate 'Advanced Email Manager'"
echo "4. Go to Setup → Addon Modules → Activate 'Pohoda Integration'"
echo "5. Configure each module with your credentials"
echo ""
echo "📁 Module locations:"
echo "   • Comgate: \$MODULES_PATH/gateways/comgate"
echo "   • Email:   \$MODULES_PATH/addons/email"
echo "   • Pohoda:  \$MODULES_PATH/addons/pohoda"
echo ""
print_status "Installation completed successfully! 🎉"
"@

$linuxScript | Out-File -FilePath "install-modules-linux.sh" -Encoding UTF8
Write-Host "✅ Linux installation script created: install-modules-linux.sh" -ForegroundColor Green

# Krok 4: Přenos souborů na server
Write-Host "`n4️⃣ Transferring files to Linux server..." -ForegroundColor Yellow

try {
    # Přenos archívu
    Write-Host "📤 Uploading modules archive..." -ForegroundColor Yellow
    scp $archiveName "${Username}@${ServerIP}:/tmp/"
    
    # Přenos instalačního skriptu
    Write-Host "📤 Uploading installation script..." -ForegroundColor Yellow
    scp install-modules-linux.sh "${Username}@${ServerIP}:/tmp/"
    
    Write-Host "✅ Files transferred successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ File transfer failed. Please check SSH connection." -ForegroundColor Red
    Write-Host "Manual transfer commands:" -ForegroundColor Yellow
    Write-Host "scp $archiveName ${Username}@${ServerIP}:/tmp/" -ForegroundColor Cyan
    Write-Host "scp install-modules-linux.sh ${Username}@${ServerIP}:/tmp/" -ForegroundColor Cyan
    exit 1
}

# Krok 5: Spuštění instalace na serveru
Write-Host "`n5️⃣ Running installation on Linux server..." -ForegroundColor Yellow

try {
    ssh "${Username}@${ServerIP}" "chmod +x /tmp/install-modules-linux.sh && /tmp/install-modules-linux.sh"
    Write-Host "✅ Installation completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Remote installation failed." -ForegroundColor Red
    Write-Host "Manual installation command:" -ForegroundColor Yellow
    Write-Host "ssh ${Username}@${ServerIP} 'chmod +x /tmp/install-modules-linux.sh && /tmp/install-modules-linux.sh'" -ForegroundColor Cyan
}

Write-Host "`n🎉 HostBill Modules Installation Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Login to HostBill Admin Panel" -ForegroundColor Cyan
Write-Host "2. Activate modules in Setup → Payment Gateways / Addon Modules" -ForegroundColor Cyan
Write-Host "3. Configure each module with your credentials" -ForegroundColor Cyan
