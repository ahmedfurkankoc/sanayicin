"use client";

import { useMemo } from "react";
import Link from "next/link";

const serviceAreas = [
  {
    name: "Mekanik Hizmetler",
    image: "/images/sanayicin-services/mekanik-hizmetler.jpg"
  },
  {
    name: "Elektrik & Elektronik Hizmetleri",
    image: "/images/sanayicin-services/elektrik-elektronik.jpg"
  },
  {
    name: "Kaporta ve Boya",
    image: "/images/sanayicin-services/kaporta-ve-boya.jpg"
  },
  {
    name: "Detaylı Temizlik & Bakım",
    image: "/images/sanayicin-services/detayli-temizlik-ve-bakim.jpg"
  },
  {
    name: "Lastik ve Jant Hizmetleri",
    image: "/images/sanayicin-services/lastik-ve-jant-hizmetleri.jpg"
  },
  {
    name: "Klima ve Isıtma Sistemleri",
    image: "/images/sanayicin-services/klima-ve-isitma-sistemleri.jpg"
  },
  {
    name: "Cam, Anahtar ve Güvenlik Sistemleri",
    image: "/images/sanayicin-services/cam-anahtar-ve-guvenlik-sistemleri.jpg"
  },
  {
    name: "Multimedya ve Donanım",
    image: "/images/sanayicin-services/multimedya-ve-donanim.jpg"
  },
  {
    name: "Hafif Ticari ve Ticari Araç Hizmetleri",
    image: "/images/sanayicin-services/hafif-ticari-ve-ticari-arac-hizmetleri.jpg"
  },
  {
    name: "Yedek Parça ve Aksesuar",
    image: "/images/sanayicin-services/yedek-parca-ve-aksesuar.jpg"
  },
  {
    name: "Yol, Yardım, Çekici Hizmetleri",
    image: "/images/sanayicin-services/araba-cekici.jpg"
  },
  {
    name: "Kaplama ve Görsel Tasarım",
    image: "/images/sanayicin-services/kaplama-ve-gorsel.jpg"
  }
];

const ServicesSection = () => {
  // Performans için useMemo ile service area'ları memoize et
  const memoizedServiceAreas = useMemo(() => serviceAreas, []);

  return (
    <section className="servicesSection">
      <div className="container">
        <h2 className="sectionTitle">Hizmet Alanları</h2>
        <div className="servicesCardsWrapper servicesCardsWrapper-4col">
          {memoizedServiceAreas.map((serviceArea, index) => (
            <div key={index} className="serviceCard">
              <div className="serviceImgContainer">
                <img 
                  src={serviceArea.image} 
                  alt={serviceArea.name}
                  className="serviceImg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="serviceImgTextAvatar">
                          <span class="avatarText">${serviceArea.name.charAt(0)}</span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="serviceInfo">
                <h3 className="serviceName">{serviceArea.name}</h3>
                <div className="serviceExp"></div>
                <div className="serviceType">{serviceArea.name} · </div>
                <Link 
                  href={{ pathname: "/musteri/esnaflar", query: { q: serviceArea.name } }} 
                  className="serviceCardActionBtn"
                >
                  Esnaf Bul
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 