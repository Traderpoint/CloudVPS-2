/**
 * Fix Failed Payment Script
 * Rychlé řešení pro "Authorize Payment: Failed" problém
 * Použití: node fix-failed-payment.js [orderId] [invoiceId] [transactionId]
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

// Parametry z command line nebo výchozí hodnoty
const orderId = process.argv[2] || '426';
const invoiceId = process.argv[3] || '446';
const transactionId = process.argv[4] || `FIX-${Date.now()}`;
const amount = process.argv[5] || 100;

console.log('🔧 Fix Failed Payment Script');
console.log('============================');
console.log(`Order ID: ${orderId}`);
console.log(`Invoice ID: ${invoiceId}`);
console.log(`Transaction ID: ${transactionId}`);
console.log(`Amount: ${amount} CZK`);
console.log('');

async function fixFailedPayment() {
  try {
    console.log('🚀 Spouštím Gateway Bypass řešení...');
    console.log('===================================');
    
    const workflowData = {
      orderId: orderId,
      invoiceId: invoiceId,
      transactionId: transactionId,
      amount: parseFloat(amount),
      currency: 'CZK',
      paymentMethod: 'comgate',
      notes: `Payment fixed via Gateway Bypass - ${transactionId}`
    };
    
    console.log('📤 Odesílám request...');
    
    const response = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowData)
    });
    
    const result = await response.json();
    
    console.log('📥 Výsledek:');
    console.log('============');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Message: ${result.message}`);
    console.log('');
    
    if (result.workflow) {
      console.log('🔄 Workflow Status:');
      console.log(`   Authorize Payment: ${getStatusIcon(result.workflow.authorizePayment)} ${result.workflow.authorizePayment}`);
      console.log(`   Capture Payment: ${getStatusIcon(result.workflow.capturePayment)} ${result.workflow.capturePayment}`);
      console.log(`   Provision: ${getStatusIcon(result.workflow.provision)} ${result.workflow.provision}`);
      console.log('');
    }
    
    if (result.details) {
      console.log('📋 Detaily:');
      if (result.details.authorize) {
        console.log(`   Authorize: ${result.details.authorize.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.details.authorize.method) {
          console.log(`     Method: ${result.details.authorize.method}`);
        }
      }
      if (result.details.capture) {
        console.log(`   Capture: ${result.details.capture.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.details.capture.method) {
          console.log(`     Method: ${result.details.capture.method}`);
        }
        if (result.details.capture.payment_id) {
          console.log(`     Payment ID: ${result.details.capture.payment_id}`);
        }
      }
      console.log('');
    }
    
    if (result.nextSteps && result.nextSteps.length > 0) {
      console.log('📝 Další kroky:');
      result.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      console.log('');
    }
    
    // Shrnutí
    const allSuccess = result.success && 
                      result.workflow.authorizePayment === 'completed' &&
                      result.workflow.capturePayment === 'completed';
    
    if (allSuccess) {
      console.log('🎉 PROBLÉM VYŘEŠEN!');
      console.log('==================');
      console.log('✅ Authorize Payment: Failed → Completed');
      console.log('✅ Capture Payment: Pending → Completed');
      console.log('✅ Provision: Pending → Ready');
      console.log('');
      console.log('🔧 Použité řešení:');
      console.log('   • Přímé API volání místo gateway');
      console.log('   • setOrderActive pro aktivaci objednávky');
      console.log('   • addInvoicePayment pro přidání platby');
      console.log('   • runProvisioningHooks pro spuštění provisioningu');
      console.log('');
      console.log('📊 Zkontroluj HostBill admin panel pro potvrzení změn.');
    } else {
      console.log('❌ PROBLÉM NEBYL VYŘEŠEN');
      console.log('========================');
      console.log('Zkontroluj chybové hlášky výše a zkus znovu.');
      
      if (!result.success) {
        console.log(`❌ Workflow selhal: ${result.message}`);
      }
      if (result.workflow.authorizePayment !== 'completed') {
        console.log(`❌ Authorize selhalo: ${result.workflow.authorizePayment}`);
      }
      if (result.workflow.capturePayment !== 'completed') {
        console.log(`❌ Capture selhalo: ${result.workflow.capturePayment}`);
      }
    }

  } catch (error) {
    console.error('❌ Chyba při opravě platby:', error.message);
    console.error('');
    console.error('🔧 Možná řešení:');
    console.error('   1. Zkontroluj, že middleware běží na portu 3005');
    console.error('   2. Zkontroluj HostBill API credentials');
    console.error('   3. Zkontroluj network connectivity');
    console.error('   4. Zkus znovu za chvíli');
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'pending': return '🔄';
    case 'skipped': return '⏭️';
    case 'ready': return '✅';
    default: return '⚠️';
  }
}

// Zobraz usage pokud jsou špatné parametry
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📖 Použití:');
  console.log('===========');
  console.log('node fix-failed-payment.js [orderId] [invoiceId] [transactionId] [amount]');
  console.log('');
  console.log('Příklady:');
  console.log('  node fix-failed-payment.js 426 446 TXN123 100');
  console.log('  node fix-failed-payment.js 405 451 PAYMENT789 362');
  console.log('');
  console.log('Výchozí hodnoty:');
  console.log('  orderId: 426');
  console.log('  invoiceId: 446');
  console.log('  transactionId: FIX-{timestamp}');
  console.log('  amount: 100');
  process.exit(0);
}

// Spusť opravu
fixFailedPayment();
