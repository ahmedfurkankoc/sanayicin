import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/styles.css";
import { MusteriProvider } from "./musteri/context/MusteriContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sanayicin - Size En Yakın Ustayı Hemen Bulun",
  description: "Size en yakın ve güvenilir ustalara kolayca ulaşın, vakit kaybetmeyin.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <MusteriProvider>
          {children}
        </MusteriProvider>
      </body>
    </html>
  );
}
