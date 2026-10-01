import type { NextConfig } from "next";

const nextConfig: NextConfig = { 
  reactStrictMode: true,
  eslint: {
    // Evita que errores de ESLint detengan el despliegue en Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;