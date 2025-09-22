   import React from "react";
   import { iconMapping, iconSizes, iconColors } from "../../utils/iconMapping";

const advantages = [
  {
    iconKey: "shield-check",
    color: iconColors.success,
    title: "Güvenli Hizmet",
    desc: "Tüm ustalar doğrulanır, gerçek müşteri yorumları ile güvenle seçim yaparsınız."
  },
  {
    iconKey: "zap",
    color: iconColors.warning,
    title: "Hızlı Erişim",
    desc: "Dakikalar içinde en yakın ustaya ulaşın, zaman kaybetmeyin."
  },
  {
    iconKey: "star",
    color: iconColors.info,
    title: "Gerçek Yorumlar",
    desc: "Sadece gerçek müşterilerden gelen şeffaf değerlendirmeler."
  },
  {
    iconKey: "smartphone",
    color: iconColors.primary,
    title: "Kolay Kullanım",
    desc: "Kullanıcı dostu arayüz ile ihtiyacınıza anında çözüm."
  }
];

const PlatformAdvantages = () => (
  <section className="platform-advantages">
    <h2 className="advantages-title">Neden Sanayicin?</h2>
    <p className="advantages-desc">Güvenli, hızlı ve kolay hizmetin adresi. Platformumuzun sunduğu avantajlarla tanışın!</p>
    <div className="advantages-grid">
      {advantages.map((adv) => {
        const Icon = iconMapping[adv.iconKey as keyof typeof iconMapping];
        return (
          <div className="advantage-card" key={adv.title}>
            <div className="advantage-icon">
              {Icon ? <Icon size={iconSizes["2xl"]} color={adv.color} /> : null}
            </div>
            <div className="advantage-title">{adv.title}</div>
            <div className="advantage-desc">{adv.desc}</div>
          </div>
        );
      })}
    </div>
  </section>
);

export default PlatformAdvantages; 