import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (item-images, chat-images) 에서 받아오는 이미지 허용.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
