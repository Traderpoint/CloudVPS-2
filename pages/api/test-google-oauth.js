// API endpoint pro testování Google OAuth konfigurace
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Zkontrolovat environment variables
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const result = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      google_oauth_config: {
        client_id_configured: !!clientId,
        client_id_format_valid: clientId ? clientId.includes('.apps.googleusercontent.com') : false,
        client_id_preview: clientId ? clientId.substring(0, 20) + '...' : null,
        client_secret_configured: !!clientSecret,
        client_secret_format_valid: clientSecret ? clientSecret.startsWith('GOCSPX-') : false,
        client_secret_preview: clientSecret ? clientSecret.substring(0, 10) + '...' : null
      },
      expected_urls: {
        authorized_origins: ['http://localhost:3000'],
        authorized_redirects: ['http://localhost:3000/register', 'http://localhost:3000/login']
      },
      validation: {
        ready_for_testing: !!(clientId && clientSecret && 
          clientId.includes('.apps.googleusercontent.com') && 
          clientSecret.startsWith('GOCSPX-')),
        issues: []
      }
    };

    // Přidat issues pokud existují
    if (!clientId) {
      result.validation.issues.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
    } else if (!clientId.includes('.apps.googleusercontent.com')) {
      result.validation.issues.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID format is invalid');
    }

    if (!clientSecret) {
      result.validation.issues.push('GOOGLE_CLIENT_SECRET is not set');
    } else if (!clientSecret.startsWith('GOCSPX-')) {
      result.validation.issues.push('GOOGLE_CLIENT_SECRET format is invalid');
    }

    // Nastavit status code podle výsledku
    const statusCode = result.validation.ready_for_testing ? 200 : 400;

    res.status(statusCode).json({
      success: result.validation.ready_for_testing,
      message: result.validation.ready_for_testing ? 
        'Google OAuth is properly configured' : 
        'Google OAuth configuration has issues',
      data: result
    });

  } catch (error) {
    console.error('Error testing Google OAuth config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
