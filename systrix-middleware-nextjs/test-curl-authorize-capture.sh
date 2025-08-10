#!/bin/bash

# Test HostBill Authorize + Capture workflow using curl
# Tests the complete payment workflow to resolve:
# - Authorize Payment: Failed → Completed
# - Capture Payment: Pending → Completed
# - Provision: Pending → Ready

echo "🧪 Testing HostBill Authorize + Capture Workflow with curl..."
echo "============================================================="

BASE_URL="http://localhost:3005"
TIMESTAMP=$(date +%s)
TRANSACTION_ID="CURL-AUTH-CAPTURE-${TIMESTAMP}"

echo "📋 Test Parameters:"
echo "  Base URL: ${BASE_URL}"
echo "  Transaction ID: ${TRANSACTION_ID}"
echo "  Timestamp: ${TIMESTAMP}"
echo ""

# Test 1: Complete workflow (Authorize + Capture)
echo "🔄 Test 1: Complete Authorize + Capture workflow..."
echo "==================================================="

COMPLETE_WORKFLOW_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "405",
    "invoiceId": "447",
    "transactionId": "'${TRANSACTION_ID}'",
    "amount": 362,
    "currency": "CZK",
    "paymentMethod": "comgate",
    "notes": "Complete workflow test via curl"
  }')

HTTP_STATUS=$(echo "${COMPLETE_WORKFLOW_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "${COMPLETE_WORKFLOW_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Complete Workflow HTTP Status: ${HTTP_STATUS}"
echo "Complete Workflow Response:"
echo "${RESPONSE_BODY}"

# Extract workflow status
OVERALL_SUCCESS=$(echo "${RESPONSE_BODY}" | grep -o '"success":[^,}]*' | sed 's/"success":\([^,}]*\)/\1/')
AUTHORIZE_STATUS=$(echo "${RESPONSE_BODY}" | grep -o '"authorizePayment":"[^"]*"' | sed 's/"authorizePayment":"\([^"]*\)"/\1/')
CAPTURE_STATUS=$(echo "${RESPONSE_BODY}" | grep -o '"capturePayment":"[^"]*"' | sed 's/"capturePayment":"\([^"]*\)"/\1/')
PROVISION_STATUS=$(echo "${RESPONSE_BODY}" | grep -o '"provision":"[^"]*"' | sed 's/"provision":"\([^"]*\)"/\1/')

echo ""
echo "📊 Workflow Status:"
echo "  Overall Success: ${OVERALL_SUCCESS}"
echo "  Authorize Payment: ${AUTHORIZE_STATUS}"
echo "  Capture Payment: ${CAPTURE_STATUS}"
echo "  Provision: ${PROVISION_STATUS}"
echo ""

# Test 2: Authorize only
echo "🔄 Test 2: Authorize only workflow..."
echo "===================================="

AUTHORIZE_ONLY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "405",
    "invoiceId": "449",
    "transactionId": "'${TRANSACTION_ID}'-AUTH-ONLY",
    "skipCapture": true
  }')

AUTH_HTTP_STATUS=$(echo "${AUTHORIZE_ONLY_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
AUTH_RESPONSE_BODY=$(echo "${AUTHORIZE_ONLY_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Authorize Only HTTP Status: ${AUTH_HTTP_STATUS}"
echo "Authorize Only Response:"
echo "${AUTH_RESPONSE_BODY}"
echo ""

# Test 3: Capture only
echo "🔄 Test 3: Capture only workflow..."
echo "=================================="

CAPTURE_ONLY_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "441",
    "transactionId": "'${TRANSACTION_ID}'-CAPTURE-ONLY",
    "amount": 362,
    "paymentMethod": "comgate",
    "skipAuthorize": true
  }')

CAPTURE_HTTP_STATUS=$(echo "${CAPTURE_ONLY_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
CAPTURE_RESPONSE_BODY=$(echo "${CAPTURE_ONLY_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Capture Only HTTP Status: ${CAPTURE_HTTP_STATUS}"
echo "Capture Only Response:"
echo "${CAPTURE_RESPONSE_BODY}"
echo ""

# Test 4: Check invoice status after workflow
echo "🔄 Test 4: Checking invoice status after workflow..."
echo "===================================================="

INVOICE_STATUS_RESPONSE=$(curl -s "${BASE_URL}/api/invoices/447/status")
echo "Invoice 447 Status:"
echo "${INVOICE_STATUS_RESPONSE}"

# Extract key values
IS_PAID=$(echo "${INVOICE_STATUS_RESPONSE}" | grep -o '"isPaid":[^,}]*' | sed 's/"isPaid":\([^,}]*\)/\1/')
STATUS=$(echo "${INVOICE_STATUS_RESPONSE}" | grep -o '"status":"[^"]*"' | sed 's/"status":"\([^"]*\)"/\1/')
DATE_PAID=$(echo "${INVOICE_STATUS_RESPONSE}" | grep -o '"datePaid":"[^"]*"' | sed 's/"datePaid":"\([^"]*\)"/\1/')

echo ""
echo "📊 Invoice Status Summary:"
echo "  Is Paid: ${IS_PAID}"
echo "  Status: ${STATUS}"
echo "  Date Paid: ${DATE_PAID}"
echo ""

# Test 5: Error handling
echo "🔄 Test 5: Testing error handling..."
echo "===================================="

ERROR_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/payments/authorize-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "405",
    "transactionId": "ERROR-TEST"
  }')

ERROR_HTTP_STATUS=$(echo "${ERROR_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
ERROR_RESPONSE_BODY=$(echo "${ERROR_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Error Handling HTTP Status: ${ERROR_HTTP_STATUS}"
echo "Error Handling Response:"
echo "${ERROR_RESPONSE_BODY}"
echo ""

# Test 6: Test payment return with new workflow
echo "🔄 Test 6: Testing payment return with new workflow..."
echo "====================================================="

PAYMENT_RETURN_URL="${BASE_URL}/api/payments/return?status=success&orderId=405&invoiceId=447&paymentMethod=comgate&transId=${TRANSACTION_ID}-RETURN-TEST&amount=362&currency=CZK"

echo "Payment Return URL:"
echo "${PAYMENT_RETURN_URL}"
echo ""

PAYMENT_RETURN_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET "${PAYMENT_RETURN_URL}")
RETURN_HTTP_STATUS=$(echo "${PAYMENT_RETURN_RESPONSE}" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RETURN_RESPONSE_BODY=$(echo "${PAYMENT_RETURN_RESPONSE}" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Payment Return HTTP Status: ${RETURN_HTTP_STATUS}"
echo "Response contains payment-success: $(echo "${RETURN_RESPONSE_BODY}" | grep -q "payment-success" && echo "YES" || echo "NO")"
echo ""

# Summary
echo "📊 SUMMARY"
echo "=========="
echo "Transaction ID: ${TRANSACTION_ID}"
echo "Complete Workflow Success: ${OVERALL_SUCCESS}"
echo "Authorize Payment: ${AUTHORIZE_STATUS}"
echo "Capture Payment: ${CAPTURE_STATUS}"
echo "Provision Status: ${PROVISION_STATUS}"
echo "Invoice 447 Status: ${STATUS}"
echo "Invoice 447 Is Paid: ${IS_PAID}"
echo ""

# Determine overall result
if [ "${OVERALL_SUCCESS}" = "true" ] && [ "${IS_PAID}" = "true" ] && [ "${STATUS}" = "Paid" ]; then
  echo "🎉 AUTHORIZE + CAPTURE WORKFLOW TEST PASSED!"
  echo "✅ HostBill workflow completed successfully:"
  echo "   • Authorize Payment: ${AUTHORIZE_STATUS}"
  echo "   • Capture Payment: ${CAPTURE_STATUS}"
  echo "   • Provision: ${PROVISION_STATUS}"
  echo "   • Invoice marked as PAID"
  echo ""
  echo "🔧 This resolves the HostBill workflow issues:"
  echo "   ❌ Authorize Payment: Failed → ✅ Completed"
  echo "   ❌ Capture Payment: Pending → ✅ Completed"
  echo "   ❌ Provision: Pending → ✅ Ready"
else
  echo "❌ AUTHORIZE + CAPTURE WORKFLOW TEST FAILED!"
  echo "❌ Workflow did not complete successfully"
  echo "   Overall Success: ${OVERALL_SUCCESS}"
  echo "   Invoice Paid: ${IS_PAID}"
  echo "   Invoice Status: ${STATUS}"
fi

echo ""
echo "🔗 Manual verification URLs:"
echo "  Authorize + Capture API: ${BASE_URL}/api/payments/authorize-capture"
echo "  Invoice 447 Status: ${BASE_URL}/api/invoices/447/status"
echo "  Payment Return: ${BASE_URL}/api/payments/return"
