import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@aws-sdk/client-lambda", "@aws-sdk/client-s3", "@aws-sdk/client-cloudwatch"],
};

export default nextConfig;
