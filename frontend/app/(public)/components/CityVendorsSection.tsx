import React from "react";

export default function CityVendorsSection() {
  return (
    <section className="cityVendorsSection">
      <div className="container">
        <h2 className="sectionTitle">81 İlden Güvenilir Esnaflar Sizi Bekliyor</h2>
        <p className="sectionDescription">
          Türkiye’nin dört bir yanındaki ustalara tek tıkla ulaşın. Şehrinizi seçin, size en yakın ve en güvenilir esnafları kolayca bulun.
          Her ilde onaylı, puanlanmış ve gerçek kullanıcı yorumlarına sahip esnaflar ile güvenle hizmet alın.
        </p>
        <button className="citySelectBtn">Şehrini Seç</button>
        {/* İleride: Buraya şehir grid’i veya harita eklenebilir */}
      </div>
    </section>
  );
} 