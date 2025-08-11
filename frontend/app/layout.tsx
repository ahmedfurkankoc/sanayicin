import type { Metadata } from "next";
import "./styles/styles.css";
import { MusteriProvider } from "./musteri/context/MusteriContext";

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
      <body className="antialiased">
        <MusteriProvider>
          {children}
        </MusteriProvider>
      </body>
    </html>
  );
}
