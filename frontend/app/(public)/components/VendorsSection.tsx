"use client";

import { useMemo } from "react";
import VendorCard from "./VendorCard";

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
  }
];

const VendorsSection = () => {
  // Performans için useMemo ile service area'ları memoize et
  const memoizedServiceAreas = useMemo(() => serviceAreas, []);

  return (
    <section className="vendorsSection">
      <div className="container">
        <h2 className="sectionTitle">Hizmet Alanları</h2>
        <div className="vendorCardsWrapper vendorCardsWrapper-4col">
          {memoizedServiceAreas.map((serviceArea, index) => (
            <VendorCard 
              key={index} 
              name={serviceArea.name} 
              experience="" 
              type={serviceArea.name} 
              city="" 
              img={serviceArea.image} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VendorsSection; 