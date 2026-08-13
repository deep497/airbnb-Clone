import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow fetching images from local Django dev server (127.0.0.1:8000)
    // dangerouslyAllowLocalIP is safe for local dev; disable in production
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },
};

// Dynamically add production API hostname to remotePatterns if set
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL);
    if (nextConfig.images && nextConfig.images.remotePatterns) {
      nextConfig.images.remotePatterns.push({
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/media/**",
      });
    }
  } catch (e) {
    console.error("Invalid NEXT_PUBLIC_API_URL in next.config.ts:", e);
  }
}

export default nextConfig;
