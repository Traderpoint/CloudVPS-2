#!/bin/bash

echo "🧪 Testing Payment Amount with CURL"
echo "=================================="

# Test 1: Měsíční cena (1 měsíc, Linux)
echo ""
echo "📋 Test 1: 1 měsíc + Linux (měsíční cena)"
echo "Expected: 299 CZK"
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 299,
    "currency": "CZK",
    "billingPeriod": "1",
    "billingCycle": "m",
    "selectedOS": "linux",
    "selectedApps": ["wordpress"],
    "cartSettings": {
      "selectedPeriod": "1",
      "selectedOS": "linux",
      "periodDiscount": 0,
      "osModifier": 0
    }
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 2: 12 měsíců + Linux (roční cena se slevou)
echo ""
echo "📋 Test 2: 12 měsíců + Linux (roční cena)"
echo "Expected: 2,390 CZK (299 × 12 × 0.8 = 20% sleva)"
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-002",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 2390,
    "currency": "CZK",
    "billingPeriod": "12",
    "billingCycle": "a",
    "selectedOS": "linux",
    "selectedApps": ["wordpress"],
    "cartSettings": {
      "selectedPeriod": "12",
      "selectedOS": "linux",
      "periodDiscount": 20,
      "osModifier": 0
    }
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 3: 24 měsíců + Windows (nejvyšší cena)
echo ""
echo "📋 Test 3: 24 měsíců + Windows (celková cena)"
echo "Expected: 13,423 CZK ((299+500) × 24 × 0.7 = 30% sleva)"
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-003",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 13423,
    "currency": "CZK",
    "billingPeriod": "24",
    "billingCycle": "b",
    "selectedOS": "windows",
    "selectedApps": ["wordpress", "mysql", "nginx"],
    "cartSettings": {
      "selectedPeriod": "24",
      "selectedOS": "windows",
      "periodDiscount": 30,
      "osModifier": 500
    }
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 4: Problémový test - měsíční cena s 24 měsíčním billing period
echo ""
echo "📋 Test 4: PROBLÉM - Měsíční cena (299) s 24 měsíčním billing period"
echo "Expected: Middleware by měl detekovat nesoulad a opravit"
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-004-PROBLEM",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 299,
    "currency": "CZK",
    "billingPeriod": "24",
    "billingCycle": "b",
    "selectedOS": "windows",
    "selectedApps": ["wordpress", "mysql"],
    "cartSettings": {
      "selectedPeriod": "24",
      "selectedOS": "windows",
      "periodDiscount": 30,
      "osModifier": 500
    }
  }' | jq '.'

echo ""
echo "========================================"
echo "🔍 CURL Test Results Summary:"
echo "Test 1: 1 měsíc + Linux = 299 CZK"
echo "Test 2: 12 měsíců + Linux = 2,390 CZK"
echo "Test 3: 24 měsíců + Windows = 13,423 CZK"
echo "Test 4: PROBLÉM - 299 CZK s 24 měsíčním billing"
echo ""
echo "Zkontroluj middleware logs pro detaily!"
echo "Middleware by měl logovat billing period údaje."
