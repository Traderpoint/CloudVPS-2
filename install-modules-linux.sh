#!/bin/bash
# HostBill Modules Installation Script for Linux Server
# Automatická instalace všech tří modulů: Comgate, Email, Pohoda

set -e  # Exit on any error

echo "🚀 HostBill Modules Installation on Linux Server"
echo "================================================"

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkce pro barevný výstup
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${YELLOW}$1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Funkce pro kontrolu chyb
check_error() {
    if [ $? -ne 0 ]; then
        print_error "$1"
        exit 1
    fi
}

# Krok 1: Ověření HostBill instalace
print_step "1️⃣ Verifying HostBill installation..."

HOSTBILL_PATH="/home/hostbill/public_html"
if [ ! -d "$HOSTBILL_PATH" ]; then
    print_error "HostBill not found at $HOSTBILL_PATH"
    print_info "Please verify HostBill installation path"
    exit 1
fi

if [ ! -d "$HOSTBILL_PATH/includes" ]; then
    print_error "HostBill includes directory not found"
    exit 1
fi

print_status "HostBill installation verified at $HOSTBILL_PATH"

# Krok 2: Příprava adresářů
print_step "2️⃣ Preparing module directories..."

MODULES_PATH="$HOSTBILL_PATH/includes/modules"
mkdir -p "$MODULES_PATH/gateways"
mkdir -p "$MODULES_PATH/addons"

print_status "Module directories prepared"

# Krok 3: Rozbalení modulů
print_step "3️⃣ Extracting modules from archive..."

cd /tmp

# Najdi nejnovější archiv
ARCHIVE=$(ls -t hostbill-modules-*.tar.gz 2>/dev/null | head -n1)
if [ -z "$ARCHIVE" ]; then
    print_error "No modules archive found in /tmp"
    print_info "Please upload the modules archive first"
    exit 1
fi

print_status "Found archive: $ARCHIVE"

# Rozbal archiv
tar -xzf "$ARCHIVE"
check_error "Failed to extract archive"

print_status "Archive extracted successfully"

# Krok 4: Instalace Comgate modulu (Payment Gateway)
print_step "4️⃣ Installing Comgate Payment Gateway..."

if [ -d "hostbill-comgate-module" ]; then
    # Zkopíruj modul
    cp -r hostbill-comgate-module "$MODULES_PATH/gateways/comgate"
    check_error "Failed to copy Comgate module"
    
    # Nastav oprávnění
    chown -R www-data:www-data "$MODULES_PATH/gateways/comgate"
    chmod -R 755 "$MODULES_PATH/gateways/comgate"
    find "$MODULES_PATH/gateways/comgate" -type f -name "*.php" -exec chmod 644 {} \;
    
    # Spusť instalaci
    cd "$MODULES_PATH/gateways/comgate"
    print_info "Running Comgate module installer..."
    php install.php install
    check_error "Comgate module installation failed"
    
    print_status "Comgate Payment Gateway installed successfully"
else
    print_error "Comgate module not found in archive"
    exit 1
fi

# Krok 5: Instalace Email modulu (Addon)
print_step "5️⃣ Installing Advanced Email Manager..."

if [ -d "/tmp/hostbill-email-module" ]; then
    # Zkopíruj modul
    cp -r /tmp/hostbill-email-module "$MODULES_PATH/addons/email"
    check_error "Failed to copy Email module"
    
    # Nastav oprávnění
    chown -R www-data:www-data "$MODULES_PATH/addons/email"
    chmod -R 755 "$MODULES_PATH/addons/email"
    find "$MODULES_PATH/addons/email" -type f -name "*.php" -exec chmod 644 {} \;
    
    # Spusť instalaci
    cd "$MODULES_PATH/addons/email"
    print_info "Running Email module installer..."
    php install.php install
    check_error "Email module installation failed"
    
    print_status "Advanced Email Manager installed successfully"
else
    print_error "Email module not found in archive"
    exit 1
fi

# Krok 6: Instalace Pohoda modulu (Addon)
print_step "6️⃣ Installing Pohoda Integration..."

if [ -d "/tmp/hostbill-pohoda-module" ]; then
    # Zkopíruj modul
    cp -r /tmp/hostbill-pohoda-module "$MODULES_PATH/addons/pohoda"
    check_error "Failed to copy Pohoda module"
    
    # Nastav oprávnění
    chown -R www-data:www-data "$MODULES_PATH/addons/pohoda"
    chmod -R 755 "$MODULES_PATH/addons/pohoda"
    find "$MODULES_PATH/addons/pohoda" -type f -name "*.php" -exec chmod 644 {} \;
    
    # Spusť instalaci
    cd "$MODULES_PATH/addons/pohoda"
    print_info "Running Pohoda module installer..."
    php install.php install
    check_error "Pohoda module installation failed"
    
    print_status "Pohoda Integration installed successfully"
else
    print_error "Pohoda module not found in archive"
    exit 1
fi

# Krok 7: Testování instalace
print_step "7️⃣ Testing module installations..."

echo ""
print_info "Testing Comgate Payment Gateway..."
cd "$MODULES_PATH/gateways/comgate"
php install.php test

echo ""
print_info "Testing Advanced Email Manager..."
cd "$MODULES_PATH/addons/email"
php install.php test

echo ""
print_info "Testing Pohoda Integration..."
cd "$MODULES_PATH/addons/pohoda"
php install.php test

# Krok 8: Nastavení cron jobů (pokud je potřeba)
print_step "8️⃣ Setting up cron jobs..."

# Email queue processing
CRON_EMAIL="*/5 * * * * php $MODULES_PATH/addons/email/cron.php >/dev/null 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_EMAIL") | crontab -

# Pohoda synchronization
CRON_POHODA="0 */6 * * * php $MODULES_PATH/addons/pohoda/cron.php >/dev/null 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_POHODA") | crontab -

print_status "Cron jobs configured"

# Krok 9: Vyčištění
print_step "9️⃣ Cleaning up temporary files..."

cd /tmp
rm -rf hostbill-*-module
rm -f hostbill-modules-*.tar.gz

print_status "Temporary files cleaned"

# Krok 10: Shrnutí
print_step "🎉 Installation Summary"
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
echo "   • Comgate: $MODULES_PATH/gateways/comgate"
echo "   • Email:   $MODULES_PATH/addons/email"
echo "   • Pohoda:  $MODULES_PATH/addons/pohoda"
echo ""
echo "🔧 Configuration URLs:"
echo "   • HostBill Admin: http://your-domain/admin/"
echo "   • Payment Gateways: Admin → Setup → Payment Gateways"
echo "   • Addon Modules: Admin → Setup → Addon Modules"
echo ""
echo "📧 Email Module Configuration:"
echo "   • SMTP Settings: Required for email functionality"
echo "   • Email Templates: Customizable in module settings"
echo "   • Queue Processing: Automated via cron job (every 5 minutes)"
echo ""
echo "💰 Comgate Configuration:"
echo "   • Merchant ID: From Comgate portal"
echo "   • Secret Key: From Comgate portal"
echo "   • Test Mode: Enable for testing"
echo ""
echo "📊 Pohoda Configuration:"
echo "   • mServer URL: Your Pohoda server address"
echo "   • Database: Pohoda database name"
echo "   • Credentials: Pohoda user credentials"
echo "   • Auto Sync: Automated via cron job (every 6 hours)"
echo ""
print_status "Installation completed successfully! 🎉"

# Zobrazení log souborů pro debugging
echo ""
print_info "Log files for troubleshooting:"
echo "   • Apache/Nginx Error Log: /var/log/apache2/error.log or /var/log/nginx/error.log"
echo "   • PHP Error Log: /var/log/php_errors.log"
echo "   • HostBill Log: $HOSTBILL_PATH/logs/"
echo ""
print_info "For support, check module documentation in each module directory."
