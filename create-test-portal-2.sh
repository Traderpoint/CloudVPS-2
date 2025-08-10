#!/bin/bash

# Script pro vytvoření Test Portal 2
echo "🚀 Creating Test Portal 2..."

# 1. Zkopíruj test-portal do test-portal-2
echo "📁 Copying test-portal to test-portal-2..."
cp -r test-portal test-portal-2

# 2. Změň port v package.json
echo "🔧 Updating package.json..."
sed -i 's/"dev": "next dev -p 3001"/"dev": "next dev -p 3002"/g' test-portal-2/package.json
sed -i 's/"start": "next start -p 3001"/"start": "next start -p 3002"/g' test-portal-2/package.json
sed -i 's/"name": "hostbill-test-portal"/"name": "hostbill-test-portal-2"/g' test-portal-2/package.json
sed -i 's/"version": "1.0.0"/"version": "2.0.0"/g' test-portal-2/package.json
sed -i 's/"homepage": "http:\/\/localhost:3001"/"homepage": "http:\/\/localhost:3002"/g' test-portal-2/package.json

# 3. Změň port v .env
echo "⚙️ Updating .env..."
sed -i 's/CUSTOM_PORT=3001/CUSTOM_PORT=3002/g' test-portal-2/.env
sed -i 's/TEST_PORTAL_VERSION=1.0.0/TEST_PORTAL_VERSION=2.0.0/g' test-portal-2/.env
sed -i 's/TEST_PORTAL_MODE=standalone/TEST_PORTAL_MODE=standalone-v2/g' test-portal-2/.env

# 4. Změň port v next.config.js
echo "🔧 Updating next.config.js..."
sed -i "s/CUSTOM_PORT: '3001'/CUSTOM_PORT: '3002'/g" test-portal-2/next.config.js
sed -i "s/TEST_PORTAL_MODE: 'standalone'/TEST_PORTAL_MODE: 'standalone-v2'/g" test-portal-2/next.config.js

# 5. Aktualizuj README.md
echo "📝 Updating README.md..."
sed -i 's/Test Portal - Standalone/Test Portal 2 - Enhanced Standalone/g' test-portal-2/README.md
sed -i 's/http:\/\/localhost:3001/http:\/\/localhost:3002/g' test-portal-2/README.md
sed -i 's/port 3001/port 3002/g' test-portal-2/README.md

# 6. Aktualizuj hlavní stránku
echo "🏠 Updating main page..."
sed -i 's/🧪 HostBill Test Portal/🧪 HostBill Test Portal 2/g' test-portal-2/pages/index.js
sed -i 's/Standalone Testing Environment/Enhanced Testing Environment/g' test-portal-2/pages/index.js

# 7. Instaluj dependencies
echo "📦 Installing dependencies..."
cd test-portal-2
npm install

echo "✅ Test Portal 2 created successfully!"
echo ""
echo "🚀 To start Test Portal 2:"
echo "   cd test-portal-2"
echo "   npm run dev"
echo ""
echo "🌐 Access URLs:"
echo "   Test Portal 1: http://localhost:3001"
echo "   Test Portal 2: http://localhost:3002"
echo "   CloudVPS:      http://localhost:3000"
echo "   Middleware:    http://localhost:3005"
