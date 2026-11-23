"use client";

import { AdminDataUnavailable } from "../AdminDataNotice";

export default function CatalogError() {
  return <AdminDataUnavailable title="Товары" message="Не удалось открыть каталог. Попробуйте ещё раз." />;
}
