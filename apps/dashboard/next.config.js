/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'app.balcao.ai',
        'localhost:3000',
      ],
    },
  },
};
module.exports = nextConfig;
