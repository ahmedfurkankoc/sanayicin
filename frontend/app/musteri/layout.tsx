import { Toaster } from "@/app/components/ui/sonner";
import "@/app/styles/musteri.css";
import MusteriHeader from "./components/MusteriHeader";
import MusteriFooter from "./components/MusteriFooter";
import ChatWidget from "@/app/components/ChatWidget";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased musteri-layout">
        <MusteriHeader />
        <main className="musteri-main">
          {children}
        </main>
        <MusteriFooter />
        <ChatWidget role="customer" />
        <Toaster />
      </body>
    </html>
  );
} 