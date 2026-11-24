/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const nestPort = process.env.NEST_PORT || 3001;
    return [
      {
        source: "/api/v1/:path*",
        destination: `http://127.0.0.1:${nestPort}/api/v1/:path*`,
      },
      {
        source: "/graphql",
        destination: `http://127.0.0.1:${nestPort}/api/v1/graphql`,
      },
    ];
  },
};

export default nextConfig;
