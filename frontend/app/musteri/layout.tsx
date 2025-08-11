import type { Metadata } from "next";
import { MusteriProvider } from "./context/MusteriContext";
import "../styles/musteri.css";
import ChatWidget from "@/app/components/ChatWidget";

export const metadata: Metadata = {
  title: "Sanayicin - Müşteri Paneli",
  description: "Sanayicin müşteri paneli - Hizmet alın, esnaf bulun",
};

export default function MusteriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MusteriProvider>
        {children}
      </MusteriProvider>
      <ChatWidget role="customer" />
    </>
  );
} 