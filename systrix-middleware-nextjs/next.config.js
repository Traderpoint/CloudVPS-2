/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  outputFileTracingRoot: __dirname,
  env: {
    // HostBill API Configuration
    HOSTBILL_BASE_URL: process.env.HOSTBILL_BASE_URL,
    HOSTBILL_API_URL: process.env.HOSTBILL_API_URL,
    HOSTBILL_API_ID: process.env.HOSTBILL_API_ID,
    HOSTBILL_API_KEY: process.env.HOSTBILL_API_KEY,

    // Server Configuration
    PORT: process.env.PORT,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL,

    // Product Mapping
    PRODUCT_MAPPING_1: process.env.PRODUCT_MAPPING_1,
    PRODUCT_MAPPING_2: process.env.PRODUCT_MAPPING_2,
    PRODUCT_MAPPING_3: process.env.PRODUCT_MAPPING_3,
    PRODUCT_MAPPING_4: process.env.PRODUCT_MAPPING_4,

    // Payment Gateways
    HOSTBILL_GATEWAY_CARD: process.env.HOSTBILL_GATEWAY_CARD,
    HOSTBILL_GATEWAY_PAYPAL: process.env.HOSTBILL_GATEWAY_PAYPAL,
    HOSTBILL_GATEWAY_BANK: process.env.HOSTBILL_GATEWAY_BANK,
    HOSTBILL_GATEWAY_CRYPTO: process.env.HOSTBILL_GATEWAY_CRYPTO,
    HOSTBILL_GATEWAY_PAYU: process.env.HOSTBILL_GATEWAY_PAYU,

    // Comgate Configuration
    COMGATE_MERCHANT_ID: process.env.COMGATE_MERCHANT_ID,
    COMGATE_SECRET: process.env.COMGATE_SECRET,
    COMGATE_TEST_MODE: process.env.COMGATE_TEST_MODE,
    COMGATE_MOCK_MODE: process.env.COMGATE_MOCK_MODE,
    COMGATE_API_URL: process.env.COMGATE_API_URL,

    // PayU Configuration
    PAYU_MERCHANT_ID: process.env.PAYU_MERCHANT_ID,
    PAYU_SECRET_KEY: process.env.PAYU_SECRET_KEY,
    PAYU_TEST_MODE: process.env.PAYU_TEST_MODE,

    // URLs
    CLOUDVPS_URL: process.env.CLOUDVPS_URL,
    PARTNERS_PORTAL_URL: process.env.PARTNERS_PORTAL_URL,
    MIDDLEWARE_URL: process.env.MIDDLEWARE_URL,
    PAYMENT_RETURN_URL: process.env.PAYMENT_RETURN_URL,
    PAYMENT_CANCEL_URL: process.env.PAYMENT_CANCEL_URL,

    // Defaults
    DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY,
    DEFAULT_PAYMENT_METHOD: process.env.DEFAULT_PAYMENT_METHOD,
    DEFAULT_BILLING_CYCLE: process.env.DEFAULT_BILLING_CYCLE,

    // Public variables for client-side
    NEXT_PUBLIC_HOSTBILL_DOMAIN: process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN,
    NEXT_PUBLIC_HOSTBILL_URL: process.env.NEXT_PUBLIC_HOSTBILL_URL,
    NEXT_PUBLIC_MIDDLEWARE_URL: process.env.NEXT_PUBLIC_MIDDLEWARE_URL,
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/middleware/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
