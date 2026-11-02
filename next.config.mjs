/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "archiver", "@prisma/client", "bcryptjs"],
  allowedDevOrigins: ["*.preview.emergentagent.com", "*.emergentagent.com", "*.preview.emergentcf.cloud", "*.cluster-0.preview.emergentcf.cloud"],
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
