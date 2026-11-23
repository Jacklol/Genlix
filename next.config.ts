import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname: string | undefined;
const remotePatterns: Array<{
  hostname: string;
  pathname: string;
  port?: string;
  protocol: "https";
}> = [];

if (supabaseUrl) {
  try {
    supabaseHostname = new URL(supabaseUrl).hostname;
  } catch {
    // Invalid environment values are reported by the CMS configuration itself.
  }
}

if (supabaseHostname) {
  remotePatterns.push({
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/cms-media/**",
    protocol: "https",
  });
}

for (const configuredHost of (process.env.CMS_ALLOWED_MEDIA_HOSTS ?? "").split(",")) {
  const source = configuredHost.trim().toLowerCase();

  if (!source) {
    continue;
  }

  try {
    const parsed = new URL(`https://${source}`);

    if (
      parsed.host.toLowerCase() !== source ||
      parsed.hostname.includes("*") ||
      parsed.pathname !== "/"
    ) {
      continue;
    }

    remotePatterns.push({
      hostname: parsed.hostname,
      pathname: "/**",
      ...(parsed.port ? { port: parsed.port } : {}),
      protocol: "https",
    });
  } catch {
    // The CMS validator reports malformed host configuration at runtime.
  }
}

const nextConfig: NextConfig = {
  ...(process.env.GENLIX_STANDALONE === "1" ? { output: "standalone" } : {}),
  outputFileTracingIncludes: {
    "/api/genlix-admin/products/excel": ["./assets/templates/*.xlsx"],
  },
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns,
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        // Supplier filenames contain the original photo's content hash.
        source: "/assets/catalog/meat/supplier-2026-11-23/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/assets/catalog/meat/primebeef/hero.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=600" }],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
