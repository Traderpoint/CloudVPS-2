/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  outputFileTracingRoot: __dirname,
  // Disable CSP for development to avoid Google OAuth issues
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return []; // No CSP headers in development
    }

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://accounts.google.com https://*.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: https://*.google.com https://*.gstatic.com; connect-src 'self' http://localhost:3005 https: https://accounts.google.com https://*.google.com; frame-src 'self' https://accounts.google.com https://*.google.com; object-src 'none';"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
