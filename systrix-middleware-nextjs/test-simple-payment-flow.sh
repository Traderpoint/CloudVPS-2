#!/bin/bash

# Simple payment flow test using curl
# Tests the core payment functionality

echo "🧪 Testing Simple Payment Flow with curl..."
echo "============================================"

BASE_URL="http://localhost:3005"
TIMESTAMP=$(date +%s)
TRANSACTION_ID="SIMPLE-TEST-${TIMESTAMP}"
INVOICE_ID="446"  # Test invoice

echo "📋 Test Parameters:"
echo "  Base URL: ${BASE_URL}"
echo "  Transaction ID: ${TRANSACTION_ID}"
echo "  Test Invoice ID: ${INVOICE_ID}"
echo ""

# Test 1: Check initial invoice status
echo "🔄 Test 1: Checking initial invoice status..."
echo "=============================================="

INITIAL_STATUS=$(curl -s -X GET "${BASE_URL}/api/invoices/${INVOICE_ID}/status")
echo "Initial Status Response:"
echo "${INITIAL_STATUS}"
echo ""

# Test 2: Simulate payment return (success)
echo "🔄 Test 2: Simulating successful payment..."
echo "==========================================="

PAYMENT_URL="${BASE_URL}/api/payments/return?status=success&invoiceId=${INVOICE_ID}&paymentMethod=comgate&transId=${TRANSACTION_ID}&amount=362&currency=CZK"

echo "Payment Return URL:"
echo "${PAYMENT_URL}"
echo ""

PAYMENT_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "${PAYMENT_URL}")
HTTP_STATUS=$(echo "${PAYMENT_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "${PAYMENT_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "HTTP Status: ${HTTP_STATUS}"
echo "Response contains payment-success: $(echo "${RESPONSE_BODY}" | grep -q "payment-success" && echo "YES" || echo "NO")"
echo ""

# Test 3: Wait and check final status
echo "⏳ Waiting 3 seconds for processing..."
sleep 3
echo ""

echo "🔄 Test 3: Checking final invoice status..."
echo "==========================================="

FINAL_STATUS=$(curl -s -X GET "${BASE_URL}/api/invoices/${INVOICE_ID}/status")
echo "Final Status Response:"
echo "${FINAL_STATUS}"

# Extract key values
IS_PAID=$(echo "${FINAL_STATUS}" | grep -o '"isPaid":[^,}]*' | sed 's/"isPaid":\([^,}]*\)/\1/')
STATUS=$(echo "${FINAL_STATUS}" | grep -o '"status":"[^"]*"' | sed 's/"status":"\([^"]*\)"/\1/')
AMOUNT=$(echo "${FINAL_STATUS}" | grep -o '"amount":"[^"]*"' | sed 's/"amount":"\([^"]*\)"/\1/')

echo ""
echo "📊 Extracted Values:"
echo "  Is Paid: ${IS_PAID}"
echo "  Status: ${STATUS}"
echo "  Amount: ${AMOUNT}"
echo ""

# Test 4: Test mark-paid API directly
echo "🔄 Test 4: Testing mark-paid API with existing invoice..."
echo "========================================================"

EXISTING_INVOICE="441"  # Known existing invoice

MARK_PAID_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/invoices/mark-paid" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "'${EXISTING_INVOICE}'",
    "useDirectStatusUpdate": true
  }')

MARK_HTTP_STATUS=$(echo "${MARK_PAID_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
MARK_RESPONSE_BODY=$(echo "${MARK_PAID_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Mark Paid HTTP Status: ${MARK_HTTP_STATUS}"
echo "Mark Paid Response:"
echo "${MARK_RESPONSE_BODY}"
echo ""

# Test 5: Test payment return with different statuses
echo "🔄 Test 5: Testing payment return with failed status..."
echo "======================================================"

FAILED_PAYMENT_URL="${BASE_URL}/api/payments/return?status=failed&invoiceId=${INVOICE_ID}&paymentMethod=comgate&transId=${TRANSACTION_ID}-FAILED"

FAILED_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "${FAILED_PAYMENT_URL}")
FAILED_HTTP_STATUS=$(echo "${FAILED_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
FAILED_RESPONSE_BODY=$(echo "${FAILED_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Failed Payment HTTP Status: ${FAILED_HTTP_STATUS}"
echo "Response contains payment-failed: $(echo "${FAILED_RESPONSE_BODY}" | grep -q "payment-failed" && echo "YES" || echo "NO")"
echo ""

# Summary
echo "📊 SUMMARY"
echo "=========="
echo "Test Invoice ID: ${INVOICE_ID}"
echo "Transaction ID: ${TRANSACTION_ID}"
echo "Final Invoice Status: ${STATUS}"
echo "Is Paid: ${IS_PAID}"
echo "Amount: ${AMOUNT}"
echo ""

# Determine overall result
if [ "${IS_PAID}" = "true" ] && [ "${STATUS}" = "Paid" ]; then
  echo "🎉 SIMPLE PAYMENT FLOW TEST PASSED!"
  echo "✅ Invoice successfully marked as PAID"
else
  echo "❌ SIMPLE PAYMENT FLOW TEST FAILED!"
  echo "❌ Invoice NOT properly marked as paid"
fi

echo ""
echo "🔗 Manual verification URLs:"
echo "  Invoice Status: ${BASE_URL}/api/invoices/${INVOICE_ID}/status"
echo "  Payment Success: ${BASE_URL}/api/payments/return?status=success&invoiceId=${INVOICE_ID}&transId=TEST"
echo "  Payment Failed: ${BASE_URL}/api/payments/return?status=failed&invoiceId=${INVOICE_ID}&transId=TEST"
echo "  Mark Paid API: ${BASE_URL}/api/invoices/mark-paid"
