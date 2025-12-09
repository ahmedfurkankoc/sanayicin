import type { Metadata } from "next";
import Banner from "@/app/components/public/Banner";
import HowItWorksAccordion from "@/app/components/public/nasil-calisir/HowItWorksAccordion";
import FAQSection from "@/app/components/public/nasil-calisir/FAQSection";

export const metadata: Metadata = {
  title: "Sanayicin Nasıl Çalışır?",
  description: "Sanayicin platformunu nasıl kullanacağınızı öğrenin. Müşteri ve esnaf olarak platformu nasıl kullanacağınız, nasıl usta bulacağınız ve nasıl hizmet vereceğiniz hakkında detaylı bilgi.",
  keywords: [
    "nasıl çalışır", "kullanım rehberi", "sanayicin nasıl kullanılır", "platform kullanımı",
    "müşteri rehberi", "esnaf rehberi", "usta bulma", "hizmet verme"
  ],
  openGraph: {
    title: "Nasıl Çalışır? - Sanayicin Kullanım Rehberi",
    description: "Sanayicin platformunu nasıl kullanacağınızı öğrenin. Müşteri ve esnaf olarak platformu nasıl kullanacağınız hakkında detaylı bilgi.",
    url: "https://sanayicin.com/nasil-calisir",
    type: "website",
    images: [
      {
        url: "/images/banner/nasil-calisir.jpg",
        width: 1200,
        height: 630,
        alt: "Sanayicin Nasıl Çalışır",
      },
    ],
  },
  alternates: {
    canonical: "https://sanayicin.com/nasil-calisir",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="nasil-calisir-page">
      <Banner
        title="Nasıl Çalışır?"
        description="Sanayicin'de müşteri ve esnaflar için süreçler basit, hızlı ve şeffaftır."
        backgroundColor="var(--black)"
        textColor="var(--white)"
        backgroundImageUrl="/images/banner/nasil-calisir.jpg"
      />

      <section className="nasil-calisir-cards-section">
        <div className="container nasil-calisir-cards-container">
          <div className="nasil-calisir-cards-grid">
            {[
              { n: 1, t: "İhtiyacını Tanımla", d: "Kısa bilgileri gir, konumunu ekle ve talebini oluştur.", img: "/images/nasil-calisir/1.png" },
              { n: 2, t: "Teklifleri Al", d: "Onaylı esnaflardan kişiselleştirilmiş teklifleri gör.", img: "/images/nasil-calisir/2.png" },
              { n: 3, t: "Karşılaştır ve Seç", d: "Fiyat, yorum ve yakınlıkla en uygun seçimi yap.", img: "/images/nasil-calisir/3.png" },
              { n: 4, t: "Randevu ve Destek", d: "Randevunuzu tamamlayın, süreç boyunca destek alın.", img: "/images/nasil-calisir/4.png" },
            ].map((c, i) => (
              <div key={i} className="nasil-calisir-card-wrapper">
                <div className="nasil-calisir-card-badge">{c.n}</div>
                <div className="nasil-calisir-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.t} className="nasil-calisir-card-img" />
                  <div className="nasil-calisir-card-content">
                    <h3 className="nasil-calisir-card-title">{c.t}</h3>
                    <p className="nasil-calisir-card-desc">{c.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="nasil-calisir-accordion-section">
        <div className="container">
          <div className="nasil-calisir-accordion-grid">
            <div>
              <div className="nasil-calisir-accordion-header">
                <p className="nasil-calisir-accordion-label">
                  Nasıl Çalışır
                </p>
                <h2 className="nasil-calisir-accordion-title">
                  Sanayicin Nasıl Çalışır
                </h2>
                <p className="nasil-calisir-accordion-subtitle">
                  Platformumuzu kullanarak hızlı ve kolay bir şekilde ihtiyacınız olan hizmeti bulun.
                </p>
              </div>
              <HowItWorksAccordion />
            </div>
            <div className="nasil-calisir-visual-column">
              <div className="nasil-calisir-visual-wrapper">
                <div className="nasil-calisir-visual-overlay" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/nasil-calisir/sanayicin-musteri-panel.png"
                  alt="Sanayicin Müşteri Paneli"
                  className="nasil-calisir-visual-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nasil-calisir-video-section">
        <div className="container nasil-calisir-video-grid">
          <div>
            <h2 className="nasil-calisir-video-title">Kısa bir tur</h2>
            <p className="nasil-calisir-video-desc">Platformda bir talep oluşturmanın ve teklif almanın ne kadar kolay olduğunu görün. Bu video, süreçteki temel adımları 60 saniyeden kısa sürede gösterir.</p>
          </div>
          <div className="nasil-calisir-video-wrapper">
            <video src="/nasil-calisir.mp4" controls className="nasil-calisir-video" autoPlay muted playsInline loop/>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  );
}