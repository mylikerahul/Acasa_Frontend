/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      // local backend (dev)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },

      // production backend
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        pathname: '/uploads/**',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ]
  },
}

export default nextConfig
