import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    // Aumenta o limite de body para uploads de video (padrao 4.5 MB e insuficiente)
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "indique-placa",
  project: "indique-placa-next",
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
});
