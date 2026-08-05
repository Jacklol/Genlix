import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const bebasNeue = localFont({
  src: "./fonts/BebasNeue.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-bebas-neue",
  display: "swap",
});

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
    <html lang="ru" className={`${montserrat.variable} ${bebasNeue.variable}`}>
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
