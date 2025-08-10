console.log('🔧 Starting test server...');

const express = require('express');
const app = express();
const PORT = 3008;

app.use(express.json());

app.get('/', (req, res) => {
  console.log('📝 Root route accessed');
  res.json({ 
    message: 'Systrix Middleware NextJS Test Server', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  console.log('📝 Health route accessed');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'test-server'
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('✅ TEST SERVER STARTED!');
  console.log('═'.repeat(40));
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health`);
  console.log('═'.repeat(40));
  console.log('');
});
