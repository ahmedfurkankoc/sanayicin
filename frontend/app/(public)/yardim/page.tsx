import type { Metadata } from "next";
import Icon from "@/app/components/ui/Icon";
import SupportTicketCTA from "@/app/components/public/SupportTicketCTA";
import HelpHeader from "@/app/components/public/yardim/HelpHeader";
import HelpFAQ from "@/app/components/public/yardim/HelpFAQ";

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
  return (
    <>
      <section className="help-section">
        <div className="container">
          <HelpHeader />
          <div className="help-grid u-mb-24">
            <a className="help-card help-card--wide" href="/yardim/kullanici" aria-label="Kullanıcı yardımı">
              <img className="help-card-img" src="/icons/users.svg" alt="Kullanıcı yardım görseli" />
              <div className="help-card-body">
                <span className="help-card-title">Kullanıcı</span>
                <span className="help-card-desc">Hesap, arama, teklif alma, rezervasyon gibi konular</span>
              </div>
            </a>
            <a className="help-card help-card--wide" href="/yardim/esnaf" aria-label="Esnaf yardımı">
              <img className="help-card-img" src="/icons/car-repair.svg" alt="Esnaf yardım görseli" />
              <div className="help-card-body">
                <span className="help-card-title">Esnaf</span>
                <span className="help-card-desc">Esnaf paneli, profil, mesajlar, talepler ve yorumlar</span>
              </div>
            </a>
          </div>

          <HelpFAQ />

          <section className="advantages-section help-advantages-section">
            <div className="container">
              <h2 className="section-title">Neden Sanayicin?</h2>
              <div className="advantages-grid">
                <div className="advantage-card">
                  <div className="advantage-icon">
                    <Icon name="star" size={32} />
                  </div>
                  <h3>Güvenilir Oto Sanayi Ustaları</h3>
                  <p>Tüm oto sanayi ustalarımız özenle seçilir ve değerlendirilir</p>
                </div>
                <div className="advantage-card">
                  <div className="advantage-icon">
                    <Icon name="trending-down" size={32} />
                  </div>
                  <h3>Uygun Fiyatlar</h3>
                  <p>Rekabetçi fiyatlarla kaliteli araç bakım hizmeti alın</p>
                </div>
                <div className="advantage-card">
                  <div className="advantage-icon">
                    <Icon name="zap" size={32} />
                  </div>
                  <h3>Hızlı Hizmet</h3>
                  <p>En kısa sürede size en yakın oto sanayi ustasına ulaşın</p>
                </div>
                <div className="advantage-card">
                  <div className="advantage-icon">
                    <Icon name="shield-check" size={32} />
                  </div>
                  <h3>Güvenli Ödeme</h3>
                  <p>Araç bakımı tamamlandıktan sonra güvenle ödeme yapın</p>
                </div>
              </div>
            </div>
          </section>

          <SupportTicketCTA />
        </div>
      </section>
    </>
  );
}


