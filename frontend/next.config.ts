import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

const tailwindcssDir = path.dirname(
  path.dirname(require.resolve("tailwindcss", { paths: [__dirname] })),
);

const nextConfig: NextConfig = {
  logging: { browserToTerminal: true },
  images: {
    remotePatterns: [
      ...(isDev
        ? [{ protocol: "http" as const, hostname: "localhost", port: "8090" }]
        : []),
    ],
  },
  turbopack: {
    resolveAlias: { tailwindcss: tailwindcssDir },
  },
};

export default nextConfig;
