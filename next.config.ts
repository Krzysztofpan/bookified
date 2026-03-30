import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["pdfjs-dist"],
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "hkxgxoga94jusaxv.public.blob.vercel-storage.com",
      },
    ],
  },
}

export default nextConfig
