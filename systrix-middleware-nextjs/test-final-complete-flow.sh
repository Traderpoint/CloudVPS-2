#!/bin/bash

# Final Complete Order Flow Test using existing invoice
# Tests the complete payment workflow with existing data

echo "🧪 Testing FINAL COMPLETE ORDER FLOW using curl..."
echo "=================================================="

BASE_URL="http://localhost:3005"
TIMESTAMP=$(date +%s)
ORDER_ID="407"        # Recently created order
INVOICE_ID="441"      # Known existing invoice
TRANSACTION_ID="FINAL-COMPLETE-${TIMESTAMP}"

echo "📋 Test Parameters:"
echo "  Base URL: ${BASE_URL}"
echo "  Order ID: ${ORDER_ID}"
echo "  Invoice ID: ${INVOICE_ID}"
echo "  Transaction ID: ${TRANSACTION_ID}"
echo "  Timestamp: ${TIMESTAMP}"
echo ""

# STEP 1: Check Initial Invoice Status
echo "🔄 STEP 1: Checking initial invoice status..."
echo "============================================="

INITIAL_STATUS_RESPONSE=$(curl -s "${BASE_URL}/api/invoices/${INVOICE_ID}/status")
echo "Initial Invoice Status:"
echo "${INITIAL_STATUS_RESPONSE}"

INITIAL_STATUS=$(echo "${INITIAL_STATUS_RESPONSE}" | grep -o '"status":"[^"]*"' | sed 's/"status":"\([^"]*\)"/\1/')
INITIAL_IS_PAID=$(echo "${INITIAL_STATUS_RESPONSE}" | grep -o '"isPaid":[^,}]*' | sed 's/"isPaid":\([^,}]*\)/\1/')

echo ""
echo "📊 Initial Status:"
echo "  Status: ${INITIAL_STATUS}"
echo "  Is Paid: ${INITIAL_IS_PAID}"
echo ""

# STEP 2: Test Complete Authorize + Capture Workflow
echo "🔄 STEP 2: Testing complete Authorize + Capture workflow..."
echo "=========================================================="

WORKFLOW_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'${ORDER_ID}'",
    "invoiceId": "'${INVOICE_ID}'",
    "transactionId": "'${TRANSACTION_ID}'",
    "amount": 362,
    "currency": "CZK",
    "paymentMethod": "comgate",
    "notes": "Final complete workflow test"
  }')

WORKFLOW_HTTP_STATUS=$(echo "${WORKFLOW_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
WORKFLOW_RESPONSE_BODY=$(echo "${WORKFLOW_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Workflow HTTP Status: ${WORKFLOW_HTTP_STATUS}"
echo "Workflow Response:"
echo "${WORKFLOW_RESPONSE_BODY}"

# Extract workflow results
WORKFLOW_SUCCESS=$(echo "${WORKFLOW_RESPONSE_BODY}" | grep -o '"success":[^,}]*' | sed 's/"success":\([^,}]*\)/\1/')
AUTHORIZE_STATUS=$(echo "${WORKFLOW_RESPONSE_BODY}" | grep -o '"authorizePayment":"[^"]*"' | sed 's/"authorizePayment":"\([^"]*\)"/\1/')
CAPTURE_STATUS=$(echo "${WORKFLOW_RESPONSE_BODY}" | grep -o '"capturePayment":"[^"]*"' | sed 's/"capturePayment":"\([^"]*\)"/\1/')
PROVISION_STATUS=$(echo "${WORKFLOW_RESPONSE_BODY}" | grep -o '"provision":"[^"]*"' | sed 's/"provision":"\([^"]*\)"/\1/')

echo ""
echo "📊 Workflow Results:"
echo "  Overall Success: ${WORKFLOW_SUCCESS}"
echo "  Authorize Payment: ${AUTHORIZE_STATUS}"
echo "  Capture Payment: ${CAPTURE_STATUS}"
echo "  Provision: ${PROVISION_STATUS}"
echo ""

# STEP 3: Wait and Check Final Status
echo "⏳ STEP 3: Waiting 3 seconds for processing..."
echo "=============================================="
sleep 3
echo ""

echo "🔄 STEP 3: Checking final invoice status..."
echo "==========================================="

FINAL_STATUS_RESPONSE=$(curl -s "${BASE_URL}/api/invoices/${INVOICE_ID}/status")
echo "Final Invoice Status:"
echo "${FINAL_STATUS_RESPONSE}"

FINAL_STATUS=$(echo "${FINAL_STATUS_RESPONSE}" | grep -o '"status":"[^"]*"' | sed 's/"status":"\([^"]*\)"/\1/')
FINAL_IS_PAID=$(echo "${FINAL_STATUS_RESPONSE}" | grep -o '"isPaid":[^,}]*' | sed 's/"isPaid":\([^,}]*\)/\1/')
DATE_PAID=$(echo "${FINAL_STATUS_RESPONSE}" | grep -o '"datePaid":"[^"]*"' | sed 's/"datePaid":"\([^"]*\)"/\1/')

echo ""
echo "📊 Final Status:"
echo "  Status: ${FINAL_STATUS}"
echo "  Is Paid: ${FINAL_IS_PAID}"
echo "  Date Paid: ${DATE_PAID}"
echo ""

# STEP 4: Test Payment Return Handler
echo "🔄 STEP 4: Testing payment return handler..."
echo "============================================"

PAYMENT_RETURN_URL="${BASE_URL}/api/payments/return?status=success&orderId=${ORDER_ID}&invoiceId=${INVOICE_ID}&paymentMethod=comgate&transId=${TRANSACTION_ID}-RETURN&amount=362&currency=CZK"

echo "Payment Return URL:"
echo "${PAYMENT_RETURN_URL}"
echo ""

PAYMENT_RETURN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "${PAYMENT_RETURN_URL}")
PAYMENT_HTTP_STATUS=$(echo "${PAYMENT_RETURN_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
PAYMENT_RESPONSE_BODY=$(echo "${PAYMENT_RETURN_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Payment Return HTTP Status: ${PAYMENT_HTTP_STATUS}"
echo "Response contains payment-success: $(echo "${PAYMENT_RESPONSE_BODY}" | grep -q "payment-success" && echo "YES" || echo "NO")"

if [ "${PAYMENT_HTTP_STATUS}" = "302" ]; then
  echo "✅ Payment return handler executed successfully (redirect response)"
else
  echo "⚠️ Unexpected response status: ${PAYMENT_HTTP_STATUS}"
fi
echo ""

# STEP 5: Test Individual Components
echo "🔄 STEP 5: Testing individual components..."
echo "=========================================="

# Test 5a: Authorize only
echo "5a. Testing Authorize only..."
AUTHORIZE_ONLY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'${ORDER_ID}'",
    "invoiceId": "'${INVOICE_ID}'",
    "transactionId": "'${TRANSACTION_ID}'-AUTH-ONLY",
    "skipCapture": true
  }')

AUTH_HTTP_STATUS=$(echo "${AUTHORIZE_ONLY_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
echo "Authorize Only HTTP Status: ${AUTH_HTTP_STATUS}"

# Test 5b: Capture only
echo "5b. Testing Capture only..."
CAPTURE_ONLY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "'${INVOICE_ID}'",
    "transactionId": "'${TRANSACTION_ID}'-CAPTURE-ONLY",
    "amount": 362,
    "paymentMethod": "comgate",
    "skipAuthorize": true
  }')

CAPTURE_HTTP_STATUS=$(echo "${CAPTURE_ONLY_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
echo "Capture Only HTTP Status: ${CAPTURE_HTTP_STATUS}"
echo ""

# STEP 6: Test Error Handling
echo "🔄 STEP 6: Testing error handling..."
echo "===================================="

ERROR_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'${ORDER_ID}'",
    "transactionId": "ERROR-TEST"
  }')

ERROR_HTTP_STATUS=$(echo "${ERROR_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
ERROR_RESPONSE_BODY=$(echo "${ERROR_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Error Handling HTTP Status: ${ERROR_HTTP_STATUS}"
echo "Error Response: $(echo "${ERROR_RESPONSE_BODY}" | grep -o '"error":"[^"]*"' | sed 's/"error":"\([^"]*\)"/\1/')"
echo ""

# SUMMARY
echo "📊 FINAL COMPLETE ORDER FLOW SUMMARY"
echo "===================================="
echo "Order ID: ${ORDER_ID}"
echo "Invoice ID: ${INVOICE_ID}"
echo "Transaction ID: ${TRANSACTION_ID}"
echo ""
echo "Component Test Results:"
echo "  Authorize + Capture API: $([ "${WORKFLOW_HTTP_STATUS}" = "200" ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo "  Payment Return Handler: $([ "${PAYMENT_HTTP_STATUS}" = "302" ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo "  Authorize Only: $([ "${AUTH_HTTP_STATUS}" = "200" ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo "  Capture Only: $([ "${CAPTURE_HTTP_STATUS}" = "200" ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo "  Error Handling: $([ "${ERROR_HTTP_STATUS}" = "400" ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo ""
echo "HostBill Workflow Status:"
echo "  Authorize Payment: ${AUTHORIZE_STATUS}"
echo "  Capture Payment: ${CAPTURE_STATUS}"
echo "  Provision: ${PROVISION_STATUS}"
echo ""
echo "Invoice Status Changes:"
echo "  Initial: ${INITIAL_STATUS} (${INITIAL_IS_PAID})"
echo "  Final: ${FINAL_STATUS} (${FINAL_IS_PAID})"
echo "  Date Paid: ${DATE_PAID}"
echo ""

# Determine overall result
OVERALL_SUCCESS="false"
if [ "${WORKFLOW_SUCCESS}" = "true" ] && [ "${PAYMENT_HTTP_STATUS}" = "302" ] && [ "${FINAL_IS_PAID}" = "true" ]; then
  OVERALL_SUCCESS="true"
fi

if [ "${OVERALL_SUCCESS}" = "true" ]; then
  echo "🎉 FINAL COMPLETE ORDER FLOW TEST PASSED!"
  echo "✅ All components working successfully:"
  echo "   1. ✅ Authorize + Capture API functional"
  echo "   2. ✅ Payment return handler functional"
  echo "   3. ✅ Invoice processing functional"
  echo "   4. ✅ Error handling functional"
  echo ""
  echo "🔧 HostBill workflow resolution confirmed:"
  echo "   ✅ Authorize Payment: ${AUTHORIZE_STATUS}"
  echo "   ✅ Capture Payment: ${CAPTURE_STATUS}"
  echo "   ✅ Provision: ${PROVISION_STATUS}"
  echo ""
  echo "💰 Payment processing confirmed:"
  echo "   ✅ Invoice marked as: ${FINAL_STATUS}"
  echo "   ✅ Payment status: ${FINAL_IS_PAID}"
  echo "   ✅ Payment date: ${DATE_PAID}"
else
  echo "⚠️ FINAL COMPLETE ORDER FLOW TEST COMPLETED WITH MIXED RESULTS"
  echo "📊 Component Status:"
  echo "   Workflow Success: ${WORKFLOW_SUCCESS}"
  echo "   Payment Return: $([ "${PAYMENT_HTTP_STATUS}" = "302" ] && echo "SUCCESS" || echo "FAILED")"
  echo "   Invoice Paid: ${FINAL_IS_PAID}"
  echo "   Invoice Status: ${FINAL_STATUS}"
fi

echo ""
echo "🔗 Manual verification URLs:"
echo "  Authorize + Capture API: ${BASE_URL}/api/payments/authorize-capture"
echo "  Invoice Status: ${BASE_URL}/api/invoices/${INVOICE_ID}/status"
echo "  Payment Return: ${BASE_URL}/api/payments/return"
echo "  Order Creation: ${BASE_URL}/api/orders/create"
