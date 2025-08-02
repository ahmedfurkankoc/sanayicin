import type { Metadata } from "next";
import "../styles/styles.css";
import { Toaster } from "@/app/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    template: "%s | Sanayicin",
    default: "Sanayicin",
  },
  description: "Sanayicin, sanayiye ihtiyacınız olan her yerde! Size en yakın ustayı hemen bulun.",
  keywords: [
    "sanayi", "usta", "hizmet", "otomotiv", "tamir", "oto tamir", "servis", "esnaf", "araba tamiri", "oto bakım", "car repair", "mechanic", "auto service", "auto repair"
  ],
  metadataBase: new URL('https://sanayicin.com'),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Sanayicin",
    description: "Sanayicin, sanayiye ihtiyacınız olan her yerde! Size en yakın ustayı hemen bulun.",
    url: "https://sanayicin.com",
    siteName: "Sanayicin",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sanayicin Open Graph Görseli",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    charset: "utf-8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
 