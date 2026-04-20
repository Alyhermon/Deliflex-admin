import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "localhost",
      "res.cloudinary.com",
      "images.unsplash.com",
      "png.pngtree.com",
      "img.pikbest.com",
      "mir-s3-cdn-cf.behance.net",
      "encrypted-tbn0.gstatic.com",
      "graffica.ams3.digitaloceanspaces.com",
      "i.pinimg.com",
      "img.freepik.com",
      "is1-ssl.mzstatic.com",
      "en.spey.com.ru",
      "www.logoestilo.com"
    ], // 🔥 permite imágenes desde tu backend
  },
};

export default nextConfig;
