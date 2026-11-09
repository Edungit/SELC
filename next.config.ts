import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "southeastlondoncare.co.uk",
        pathname: "/wp-content/uploads/**"
      }
    ]
  }
};

export default nextConfig;
