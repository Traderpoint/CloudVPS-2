// Test script pro ověření environment variables
console.log('🧪 Testing Environment Variables for Google OAuth');
console.log('================================================');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envLines = envContent.split('\n');

    envLines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    console.log('✅ Environment variables loaded from .env.local');
} catch (error) {
    console.log('❌ Could not load .env.local:', error.message);
}

console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
    process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...' : 'NOT SET');

console.log('\n🔍 Validation:');

// Validate Client ID format
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
if (clientId) {
    if (clientId.includes('.apps.googleusercontent.com')) {
        console.log('✅ Client ID format is correct');
    } else {
        console.log('❌ Client ID format is incorrect - should end with .apps.googleusercontent.com');
    }
    
    if (clientId.length > 50) {
        console.log('✅ Client ID length is appropriate');
    } else {
        console.log('❌ Client ID seems too short');
    }
} else {
    console.log('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
}

// Validate Client Secret format
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (clientSecret) {
    if (clientSecret.startsWith('GOCSPX-')) {
        console.log('✅ Client Secret format is correct');
    } else {
        console.log('❌ Client Secret format is incorrect - should start with GOCSPX-');
    }
    
    if (clientSecret.length > 30) {
        console.log('✅ Client Secret length is appropriate');
    } else {
        console.log('❌ Client Secret seems too short');
    }
} else {
    console.log('❌ GOOGLE_CLIENT_SECRET is not set');
}

console.log('\n🌐 Next.js Environment:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

console.log('\n📝 Notes:');
console.log('- NEXT_PUBLIC_* variables are exposed to the browser');
console.log('- GOOGLE_CLIENT_SECRET should be kept server-side only');
console.log('- For localhost:3000, HTTP is acceptable for Google OAuth');
console.log('- For production, HTTPS is required');

console.log('\n🔗 Expected OAuth URLs:');
console.log('- Authorized JavaScript origins: http://localhost:3000');
console.log('- Authorized redirect URIs: http://localhost:3000/register');

console.log('\n✅ Test completed');
