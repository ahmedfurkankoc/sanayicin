import type { Metadata } from "next";
import HelpClient from "./HelpClient";

export const metadata: Metadata = {
  title: "Yardım ve Destek",
  description: "Sanayicin yardım ve destek merkezi. Sık sorulan sorular, kullanım rehberleri ve teknik destek için yardım sayfası.",
  keywords: [
    "yardım", "destek", "sss", "sık sorulan sorular", "kullanım rehberi",
    "teknik destek", "müşteri desteği", "yardım merkezi"
  ],
  openGraph: {
    title: "Yardım ve Destek - Sanayicin | SSS ve Destek Merkezi",
    description: "Sanayicin yardım ve destek merkezi. Sık sorulan sorular, kullanım rehberleri ve teknik destek için yardım sayfası.",
    url: "https://sanayicin.com/yardim",
    type: "website",
  },
  alternates: {
    canonical: "https://sanayicin.com/yardim",
  },
};

export default function HelpPage() {
  return <HelpClient />;
}


