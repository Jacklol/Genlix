import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genlix — премиальные поставки для HoReCa и Retail",
  description: "Импорт и комплексная дистрибуция мяса и премиальных напитков для ресторанов и ритейла.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
