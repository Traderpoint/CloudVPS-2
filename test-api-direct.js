// Direct API test for middleware initialize-payment
// Using built-in fetch (Node.js 18+)

async function testAPI() {
  try {
    console.log('Testing API directly...');
    
    const response = await fetch('http://localhost:3000/api/middleware/initialize-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'TEST-123',
        invoiceId: '456',
        method: 'comgate',
        amount: 1000,
        currency: 'CZK',
        customerData: {
          email: 'test@example.com',
          name: 'Test Customer'
        }
      })
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
