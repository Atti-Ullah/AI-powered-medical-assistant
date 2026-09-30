/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the dev-only indicator clear of the sidebar's Logout button
  devIndicators: { position: 'bottom-right' },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The Chatbase iframe uses the microphone for voice input; nothing else is granted
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self "https://www.chatbase.co")' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
  // Use the new serverExternalPackages option instead of the deprecated one
  serverExternalPackages: ['mongoose'],
  webpack: (config) => {
    // This is to handle the native dependencies
    config.externals.push({
      'mongodb-client-encryption': 'mongodb-client-encryption',
    });
    return config;
  },
};
module.exports = nextConfig;
