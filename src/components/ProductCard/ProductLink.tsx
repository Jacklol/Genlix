"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { rememberCatalogPosition } from "@/lib/catalog/scroll-position";

function canPrefetch() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}

export function ProductLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const [prefetch, setPrefetch] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = () => clearTimeout(timer.current);
  const warm = () => { if (canPrefetch()) setPrefetch(true); };
  useEffect(() => () => clearTimeout(timer.current), []);

  return <Link href={href} className={className} prefetch={prefetch}
    onNavigate={rememberCatalogPosition}
    onMouseEnter={() => { cancel(); timer.current = setTimeout(warm, 120); }}
    onMouseLeave={cancel} onFocus={warm} onTouchStart={warm}>
    {children}
  </Link>;
}
