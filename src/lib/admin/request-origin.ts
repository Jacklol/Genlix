/** Match the public host, including deployments behind the Next.js proxy. */
export function isSameOriginRequest(request: Request) {
  const source = request.headers.get("origin");
  if (!source) return false;
  try {
    const origin = new URL(source);
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim()
      ?? request.headers.get("host") ?? new URL(request.url).host;
    return ["https:", "http:"].includes(origin.protocol) && origin.origin === source && origin.host === host;
  } catch { return false; }
}
