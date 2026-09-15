import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  experimental: {
    // Photo/file uploads go straight through a Server Action (uploadAttachmentAction);
    // Next.js's default 1MB body limit rejects any real phone photo before it
    // reaches our code, so raise it to something that comfortably fits one.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
