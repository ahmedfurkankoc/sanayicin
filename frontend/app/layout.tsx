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
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className="antialiased">
        <MusteriProvider>
          {children}
        </MusteriProvider>
      </body>
    </html>
  );
}
