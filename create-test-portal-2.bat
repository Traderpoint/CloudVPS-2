@echo off
echo 🚀 Creating Test Portal 2...

REM 1. Zkopíruj test-portal do test-portal-2
echo 📁 Copying test-portal to test-portal-2...
xcopy test-portal test-portal-2 /E /I /Q

REM 2. Změň port v package.json
echo 🔧 Updating package.json...
powershell -Command "(Get-Content test-portal-2\package.json) -replace '\"dev\": \"next dev -p 3001\"', '\"dev\": \"next dev -p 3002\"' | Set-Content test-portal-2\package.json"
powershell -Command "(Get-Content test-portal-2\package.json) -replace '\"start\": \"next start -p 3001\"', '\"start\": \"next start -p 3002\"' | Set-Content test-portal-2\package.json"
powershell -Command "(Get-Content test-portal-2\package.json) -replace '\"name\": \"hostbill-test-portal\"', '\"name\": \"hostbill-test-portal-2\"' | Set-Content test-portal-2\package.json"
powershell -Command "(Get-Content test-portal-2\package.json) -replace '\"version\": \"1.0.0\"', '\"version\": \"2.0.0\"' | Set-Content test-portal-2\package.json"

REM 3. Změň port v .env
echo ⚙️ Updating .env...
powershell -Command "(Get-Content test-portal-2\.env) -replace 'CUSTOM_PORT=3001', 'CUSTOM_PORT=3002' | Set-Content test-portal-2\.env"
powershell -Command "(Get-Content test-portal-2\.env) -replace 'TEST_PORTAL_VERSION=1.0.0', 'TEST_PORTAL_VERSION=2.0.0' | Set-Content test-portal-2\.env"
powershell -Command "(Get-Content test-portal-2\.env) -replace 'TEST_PORTAL_MODE=standalone', 'TEST_PORTAL_MODE=standalone-v2' | Set-Content test-portal-2\.env"

REM 4. Změň port v next.config.js
echo 🔧 Updating next.config.js...
powershell -Command "(Get-Content test-portal-2\next.config.js) -replace 'CUSTOM_PORT: ''3001''', 'CUSTOM_PORT: ''3002''' | Set-Content test-portal-2\next.config.js"

REM 5. Aktualizuj hlavní stránku
echo 🏠 Updating main page...
powershell -Command "(Get-Content test-portal-2\pages\index.js) -replace '🧪 HostBill Test Portal', '🧪 HostBill Test Portal 2' | Set-Content test-portal-2\pages\index.js"
powershell -Command "(Get-Content test-portal-2\pages\index.js) -replace 'Standalone Testing Environment', 'Enhanced Testing Environment' | Set-Content test-portal-2\pages\index.js"

REM 6. Instaluj dependencies
echo 📦 Installing dependencies...
cd test-portal-2
call npm install
cd ..

echo ✅ Test Portal 2 created successfully!
echo.
echo 🚀 To start Test Portal 2:
echo    cd test-portal-2
echo    npm run dev
echo.
echo 🌐 Access URLs:
echo    Test Portal 1: http://localhost:3001
echo    Test Portal 2: http://localhost:3002
echo    CloudVPS:      http://localhost:3000
echo    Middleware:    http://localhost:3005

pause
