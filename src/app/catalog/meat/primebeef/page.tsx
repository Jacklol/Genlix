import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Primebeef — каталог Genlix",
  description: "Primebeef — мясо для профессионалов и гурманов.",
};

export default function PrimebeefPage() {
  permanentRedirect("/catalog/meat/beef?manufacturer=Primebeef");
}
