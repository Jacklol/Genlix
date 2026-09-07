import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Мираторг — каталог Genlix",
  description: "Мираторг — доступное качество для вашей витрины.",
};

export default function MiratorgPage() {
  permanentRedirect(
    "/catalog/meat?manufacturer=%D0%9C%D0%B8%D1%80%D0%B0%D1%82%D0%BE%D1%80%D0%B3",
  );
}
