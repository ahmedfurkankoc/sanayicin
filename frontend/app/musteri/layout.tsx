import { Toaster } from "@/app/components/ui/sonner";

export default function CustomerLayout({
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