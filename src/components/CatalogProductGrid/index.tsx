"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { productHref } from "@/lib/catalog/filter-engine";
import { restoreCatalogPosition } from "@/lib/catalog/scroll-position";
import styles from "./CatalogProductGrid.module.css";

const PAGE_SIZE = 24;

export function CatalogProductGrid({ products, returnTo, className }: {
  products: ProductCardData[];
  returnTo: string;
  className: string;
}) {
  const query = useSearchParams();
  const search = query.toString();
  useEffect(() => {
    const frame = requestAnimationFrame(restoreCatalogPosition);
    return () => cancelAnimationFrame(frame);
  }, [search]);
  const requested = Number(query.get("page"));
  const page = Math.max(1, Math.min(Math.ceil(products.length / PAGE_SIZE), Number.isSafeInteger(requested) ? requested : 1));
  const count = Math.min(page * PAGE_SIZE, products.length);
  const params = new URLSearchParams(returnTo.split("?")[1]);
  if (page > 1) params.set("page", String(page));
  const returnPath = `${returnTo.split("?")[0]}${params.size ? `?${params}` : ""}`;

  function showMore() {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page + 1));
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  return <>
    <div className={className}>
      {products.slice(0, count).map((product, index) => <ProductCard
        key={product.slug ?? product.title}
        {...product}
        eagerImage={index < 4}
        href={product.slug ? productHref(product.slug, returnPath) : undefined}
      />)}
    </div>
    {count < products.length ? <div className={styles.more}>
      <p role="status">Показано {count} из {products.length}</p>
      <button type="button" onClick={showMore}>Показать ещё {Math.min(PAGE_SIZE, products.length - count)}</button>
    </div> : null}
  </>;
}
