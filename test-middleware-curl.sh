#!/bin/bash

echo "🧪 Testing middleware with curl - quantities test"
echo "================================================"

# Middleware URL
MIDDLEWARE_URL="http://localhost:3005"

# Test data with quantities
curl -X POST "${MIDDLEWARE_URL}/api/orders/create" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "complete",
    "customer": {
      "firstName": "Test",
      "lastName": "Customer", 
      "email": "test@example.com",
      "phone": "+420123456789",
      "address": "Test Address 123",
      "city": "Prague",
      "postalCode": "12000",
      "country": "CZ",
      "company": ""
    },
    "items": [
      {
        "productId": 1,
        "name": "VPS Start",
        "price": 249,
        "quantity": 3,
        "cycle": "m",
        "configOptions": {
          "cpu": "2 jádra",
          "ram": "4 GB", 
          "storage": "50 GB",
          "os": "linux",
          "bandwidth": "1TB"
        }
      },
      {
        "productId": 2,
        "name": "VPS Profi",
        "price": 499,
        "quantity": 2,
        "cycle": "m",
        "configOptions": {
          "cpu": "4 jádra",
          "ram": "8 GB",
          "storage": "100 GB", 
          "os": "linux",
          "bandwidth": "1TB"
        }
      }
    ],
    "paymentMethod": "banktransfer",
    "total": 1745,
    "currency": "CZK"
  }' | jq '.'

echo ""
echo "✅ Expected result:"
echo "  - 3x VPS Start (product_id: 5)"
echo "  - 2x VPS Profi (product_id: 10)"
echo "  - Total: 5 services in HostBill"
