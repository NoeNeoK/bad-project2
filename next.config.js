/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
  output: "export",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
