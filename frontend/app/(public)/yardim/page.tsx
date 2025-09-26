"use client";

// Navbar/Footer layout'ta render ediliyor
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  return (
    <>

        <section className="help-section">
          <div className="container">
            {/* Konu seçimi + üstte Destek Taleplerim butonu */}
            <div className="u-flex u-align-center u-justify-between u-mb-16" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h1 className="sectionTitle help-title" style={{ margin: 0 }}>Hangi konuda yardıma ihtiyacın var?</h1>
              <button
                type="button"
                className="btn-dark"
                onClick={() => {
                  router.push('/yardim/destek?tab=tickets');
                }}
              >
                Destek Taleplerim
              </button>
            </div>
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
            {/* SSS kaldırıldı: Detay SSS içerikleri /yardim/kullanici ve /yardim/esnaf sayfalarında */}

            {/* CTA */}
            <div className="u-mt-28">
              <div className="help-cta">
                <h3>Yardım istediğin konuyu destek makalelerimiz arasında bulamadın mı?</h3>
                <p>O zaman destek talebi oluşturabilir ve taleplerini <b>Destek Taleplerim</b> bölümünden takip edebilirsin.</p>
                <button
                  type="button"
                  className="help-cta-btn"
                  onClick={() => {
                    router.push('/yardim/destek?tab=new');
                  }}
                >
                  Destek Talebi Oluştur
                </button>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}


