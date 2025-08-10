@echo off
REM HostBill Modules Installation Script for Windows Server 2019
REM Automatická instalace SSH klienta a přenos modulů na Linux server

setlocal enabledelayedexpansion

set SERVER_IP=10.233.1.136
set USERNAME=root
set PASSWORD=Obchudek2017

echo.
echo 🚀 HostBill Modules Installation Script
echo =======================================
echo.

REM Krok 1: Kontrola OpenSSH Client
echo 1️⃣ Checking OpenSSH Client installation...

ssh -V >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ OpenSSH Client is already installed
) else (
    echo 📦 Installing OpenSSH Client...
    powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
    if !errorlevel! neq 0 (
        echo ❌ Failed to install OpenSSH Client
        pause
        exit /b 1
    )
    echo ✅ OpenSSH Client installed successfully
)

REM Krok 2: Kontrola modulů
echo.
echo 2️⃣ Checking HostBill modules...

set MODULES_FOUND=1
if not exist "hostbill-comgate-module" (
    echo ❌ hostbill-comgate-module not found
    set MODULES_FOUND=0
)
if not exist "hostbill-email-module" (
    echo ❌ hostbill-email-module not found
    set MODULES_FOUND=0
)
if not exist "hostbill-pohoda-module" (
    echo ❌ hostbill-pohoda-module not found
    set MODULES_FOUND=0
)

if %MODULES_FOUND% equ 0 (
    echo ❌ Some modules are missing. Please ensure all modules are in the current directory.
    pause
    exit /b 1
)

echo ✅ All modules found

REM Krok 3: Vytvoření archívu
echo.
echo 3️⃣ Creating modules archive...

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

set ARCHIVE_NAME=hostbill-modules-%timestamp%.tar.gz

tar -czf %ARCHIVE_NAME% hostbill-comgate-module hostbill-email-module hostbill-pohoda-module
if %errorlevel% neq 0 (
    echo ❌ Failed to create archive
    pause
    exit /b 1
)

echo ✅ Archive created: %ARCHIVE_NAME%

REM Krok 4: Přenos souborů
echo.
echo 4️⃣ Transferring files to Linux server...

echo 📤 Uploading modules archive...
scp %ARCHIVE_NAME% %USERNAME%@%SERVER_IP%:/tmp/
if %errorlevel% neq 0 (
    echo ❌ Failed to upload archive
    echo Manual command: scp %ARCHIVE_NAME% %USERNAME%@%SERVER_IP%:/tmp/
    pause
    exit /b 1
)

echo 📤 Uploading installation script...
scp install-modules-linux.sh %USERNAME%@%SERVER_IP%:/tmp/
if %errorlevel% neq 0 (
    echo ❌ Failed to upload installation script
    echo Manual command: scp install-modules-linux.sh %USERNAME%@%SERVER_IP%:/tmp/
    pause
    exit /b 1
)

echo ✅ Files transferred successfully

REM Krok 5: Spuštění instalace na serveru
echo.
echo 5️⃣ Running installation on Linux server...

ssh %USERNAME%@%SERVER_IP% "chmod +x /tmp/install-modules-linux.sh && /tmp/install-modules-linux.sh"
if %errorlevel% neq 0 (
    echo ❌ Remote installation failed
    echo Manual command: ssh %USERNAME%@%SERVER_IP% "chmod +x /tmp/install-modules-linux.sh && /tmp/install-modules-linux.sh"
    pause
    exit /b 1
)

echo.
echo 🎉 HostBill Modules Installation Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Login to HostBill Admin Panel
echo 2. Activate modules in Setup → Payment Gateways / Addon Modules
echo 3. Configure each module with your credentials
echo.
echo Module locations on server:
echo • Comgate: /home/hostbill/public_html/includes/modules/gateways/comgate
echo • Email:   /home/hostbill/public_html/includes/modules/addons/email
echo • Pohoda:  /home/hostbill/public_html/includes/modules/addons/pohoda
echo.

pause
