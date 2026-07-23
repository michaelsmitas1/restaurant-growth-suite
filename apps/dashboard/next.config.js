/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'remy.app.br',
        'localhost:3000',
      ],
    },
  },
};
module.exports = nextConfig;
