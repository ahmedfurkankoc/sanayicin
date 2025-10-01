import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import PolicyLayout from "../components/PolicyLayout";
import PolicySection from "../components/PolicySection";

function KullaniciSozlesmesiPage() {
  return (
    <>
      <PolicyLayout title="Kullanıcı Sözleşmesi">
        <PolicySection heading="1. Taraflar ve Konu">
          <p>Bu sözleşme, Sanayicin platformunu kullanan kullanıcı ile Sanayicin arasında akdedilmiştir.</p>
        </PolicySection>
        <PolicySection heading="2. Hesap ve Yükümlülükler">
          <p>Kullanıcı, hesabının güvenliğinden sorumludur ve doğru bilgi vermeyi kabul eder.</p>
        </PolicySection>
        <PolicySection heading="3. Yasaklı Kullanımlar">
          <p>Hukuka aykırı, yanıltıcı, zararlı içerik paylaşımı ve sistemlere izinsiz erişim yasaktır.</p>
        </PolicySection>
        <PolicySection heading="4. Sorumluluk Sınırları">
          <p>Platform, üçüncü taraf hizmetlerinin kesintilerinden doğan dolaylı zararlardan sorumlu değildir.</p>
        </PolicySection>
        <PolicySection heading="5. Yürürlük ve Değişiklikler">
          <p>Sanayicin, sözleşme hükümlerini güncelleyebilir; güncellemeler yayınlandığı tarihte yürürlüğe girer.</p>
        </PolicySection>
      </PolicyLayout>
    </>
  );
}

export default KullaniciSozlesmesiPage;

