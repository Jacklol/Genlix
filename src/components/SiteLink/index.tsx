"use client";

import Link from "next/link";
import { useSyncExternalStore, type ComponentPropsWithoutRef } from "react";

type SiteLinkProps = ComponentPropsWithoutRef<"a"> & {
  href: string;
  prefetch?: false;
};

function getConnection() {
  return (navigator as Navigator & {
    connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
  }).connection;
}

function canPrefetch() {
  const connection = getConnection();
  return !connection?.saveData && !["2g", "slow-2g"].includes(connection?.effectiveType ?? "");
}

function subscribeToConnection(onChange: () => void) {
  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);
  return () => connection?.removeEventListener?.("change", onChange);
}

function skipServerPrefetch() {
  return false;
}

export function SiteLink({ href, prefetch, ...props }: SiteLinkProps) {
  const allowed = useSyncExternalStore(subscribeToConnection, canPrefetch, skipServerPrefetch);

  if (!href.startsWith("/") || href.startsWith("//")) {
    return <a href={href} {...props} />;
  }

  return <Link href={href} prefetch={allowed && prefetch !== false ? "auto" : false} {...props} />;
}
