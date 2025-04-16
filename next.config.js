/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: "/api/:path*",
        headers: [
          // Allow requests from any origin (replace '*' with your specific domain in production for better security)
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          // Allow specific methods
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" }, 
          // Allow specific headers (you might need to adjust this based on your requests)
          { key: "Access-Control-Allow-Headers", value: "Content-Type" }, 
        ],
      },
    ];
  },
};

module.exports = nextConfig;
