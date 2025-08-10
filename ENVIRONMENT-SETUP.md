# 🔧 Environment Configuration Guide

This document describes all required environment variables for both CloudVPS and Systrix Middleware NextJS for Docker deployment.

## 📋 Overview

Both systems require specific environment variables to function properly in Docker containers. This guide ensures all necessary keys are configured.

## 🌐 CloudVPS Environment Variables

### Required for Docker Deployment

Create `.env` file in CloudVPS root directory:

```env
# CloudVPS Production Environment Configuration

# Server Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cloudvps-nextauth-secret-key-2024

# Google OAuth Configuration (REQUIRED)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# HostBill API Configuration
HOSTBILL_BASE_URL=https://vps.kabel1it.cz
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=341697c41aeb1c842f0d
HOSTBILL_API_SECRET=341697c41aeb1c842f0d

# Middleware Configuration
MIDDLEWARE_URL=http://localhost:3005
NEXT_PUBLIC_MIDDLEWARE_URL=http://localhost:3005
MIDDLEWARE_API_SECRET=your_secret_key_here

# Public Configuration (visible to frontend)
NEXT_PUBLIC_HOSTBILL_DOMAIN=vps.kabel1it.cz
NEXT_PUBLIC_HOSTBILL_URL=https://vps.kabel1it.cz
NEXT_PUBLIC_AFFILIATE_DEBUG=true

# Google Maps API Configuration (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBOti4mM-6x9WDnZIjIeyb21L_Hw_KC_1o

# Product Configuration (CloudVPS internal IDs)
PRODUCT_VPS_BASIC=1
PRODUCT_VPS_PRO=2
PRODUCT_VPS_PREMIUM=3
PRODUCT_VPS_ENTERPRISE=4

# HostBill Addon IDs
HOSTBILL_ADDON_CPANEL=5
HOSTBILL_ADDON_SSL_CERT=6
HOSTBILL_ADDON_BACKUP=7
HOSTBILL_ADDON_MONITORING=8
HOSTBILL_ADDON_FIREWALL=9
HOSTBILL_ADDON_EXTRA_IP=10
HOSTBILL_ADDON_PLESK=11
HOSTBILL_ADDON_CLOUDFLARE=12

# Default Settings
DEFAULT_AFFILIATE_ID=2
ADMIN_EMAIL=admin@systrix.cz

# Payment Testing Configuration
PAYMENT_TEST_MODE=true
PAYMENT_TEST_AMOUNT=1
PAYMENT_TEST_CURRENCY=CZK
PAYMENT_SIMULATE_SUCCESS=true
PAYMENT_REDIRECT_DELAY=2000

# Payment URLs
PAYMENT_TEST_SUCCESS_URL=http://localhost:3000/order-confirmation
PAYMENT_TEST_CANCEL_URL=http://localhost:3000/payment
PAYMENT_TEST_NOTIFY_URL=http://localhost:3000/api/payments/notify
```

## 🔧 Middleware Environment Variables

### Required for Docker Deployment

Create `.env` file in `systrix-middleware-nextjs` directory:

```env
# Systrix Middleware NextJS Configuration

# Server Configuration
PORT=3005
NODE_ENV=production
HOSTNAME=0.0.0.0

# HostBill API Configuration
HOSTBILL_BASE_URL=https://vps.kabel1it.cz
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=341697c41aeb1c842f0d

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3006
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/middleware.log

# Payment processing URLs
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel

# Comgate Payment Gateway Configuration
COMGATE_API_URL=https://payments.comgate.cz/v2.0
COMGATE_MERCHANT_ID=498008
COMGATE_SECRET=WCJmtaUl94nEKQGMSj1JaYnOLcJORoVI
COMGATE_TEST_MODE=true
COMGATE_MOCK_MODE=false

# PayU Payment Gateway Configuration
PAYU_MERCHANT_ID=your_payu_merchant_id
PAYU_SECRET_KEY=your_payu_secret_key
PAYU_TEST_MODE=true

# Dashboard Configuration
DASHBOARD_ENABLED=true
DASHBOARD_PATH=/dashboard

# CloudVPS Integration
CLOUDVPS_URL=http://localhost:3000
PARTNERS_PORTAL_URL=http://localhost:3006
MIDDLEWARE_URL=http://localhost:3005

# Product Mapping (Cloud VPS ID -> HostBill ID)
PRODUCT_MAPPING_1=5
PRODUCT_MAPPING_2=10
PRODUCT_MAPPING_3=11
PRODUCT_MAPPING_4=12

# Payment Gateway Configuration (HostBill Gateway IDs)
HOSTBILL_GATEWAY_CARD=1
HOSTBILL_GATEWAY_PAYPAL=2
HOSTBILL_GATEWAY_BANK=3
HOSTBILL_GATEWAY_CRYPTO=4
HOSTBILL_GATEWAY_PAYU=5

# Default Settings
DEFAULT_CURRENCY=CZK
DEFAULT_PAYMENT_METHOD=banktransfer
DEFAULT_BILLING_CYCLE=monthly
DEFAULT_AFFILIATE_ID=2

# Next.js Public Configuration (for client-side)
NEXT_PUBLIC_HOSTBILL_DOMAIN=vps.kabel1it.cz
NEXT_PUBLIC_HOSTBILL_URL=https://vps.kabel1it.cz
NEXT_PUBLIC_MIDDLEWARE_URL=http://localhost:3005

# Testing Configuration
TEST_MODE=true
TEST_INVOICE_ID=218
TEST_ORDER_AMOUNT=604
TEST_CURRENCY=CZK
```

## 🔑 Critical Environment Variables

### CloudVPS - Must Configure:
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `HOSTBILL_API_ID` - HostBill API ID
- `HOSTBILL_API_KEY` - HostBill API Key

### Middleware - Must Configure:
- `HOSTBILL_API_ID` - HostBill API ID
- `HOSTBILL_API_KEY` - HostBill API Key
- `COMGATE_MERCHANT_ID` - Comgate Merchant ID
- `COMGATE_SECRET` - Comgate Secret Key

## 🚀 Docker Deployment Steps

### 1. CloudVPS Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# Especially Google OAuth and HostBill API credentials

# Build and run
chmod +x build-docker.sh
./build-docker.sh
docker-compose up -d
```

### 2. Middleware Setup
```bash
cd systrix-middleware-nextjs

# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# Especially HostBill API and payment gateway credentials

# Build and run
chmod +x build-docker.sh
./build-docker.sh
docker-compose up -d
```

## 🔗 Service Dependencies

### CloudVPS depends on:
- Google OAuth (accounts.google.com)
- HostBill API (vps.kabel1it.cz)
- Middleware (localhost:3005)

### Middleware depends on:
- HostBill API (vps.kabel1it.cz)
- Comgate API (payments.comgate.cz)
- PayU API (optional)

## ✅ Verification

### Test CloudVPS:
```bash
node test-cloudvps-docker.js
```

### Test Middleware:
```bash
cd systrix-middleware-nextjs
node test-docker-functionality.js
```

## 📝 Notes

- All environment files are configured with working test credentials
- Google OAuth requires domain configuration in Google Cloud Console
- Payment gateways require valid merchant accounts
- Both systems can run independently in Docker containers
- Middleware must be accessible from CloudVPS for full functionality
