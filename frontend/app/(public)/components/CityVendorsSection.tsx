import React from "react";
import { Car, Wrench, MapPin, Star } from "lucide-react";

export default function CityVendorsSection() {
  return (
    <section className="cityVendorsSection">
      <div className="container">
        <h2 className="sectionTitle">81 İlden Güvenilir Esnaflar Sizi Bekliyor</h2>
        <p className="sectionDescription">
          Türkiye'nin dört bir yanındaki ustalara tek tıkla ulaşın. Şehrinizi seçin, size en yakın ve en güvenilir esnafları kolayca bulun.
          Her ilde onaylı, puanlanmış ve gerçek kullanıcı yorumlarına sahip esnaflar ile güvenle hizmet alın.
        </p>
    
        {/* Oto Sanayi İkonları */}
        <div className="cityVendorsIcons">
          <div className="icon-item">
            <Car size={32} />
            <span>Araç Tamiri</span>
          </div>
          <div className="icon-item">
            <Wrench size={32} />
            <span>Usta Hizmeti</span>
          </div>
          <div className="icon-item">
            <MapPin size={32} />
            <span>81 İl</span>
          </div>
          <div className="icon-item">
            <Star size={32} />
            <span>Güvenilir</span>
          </div>
        </div>
        
        <button className="citySelectBtn">Şehrini Seç</button>
      </div>
    </section>
  );
} 