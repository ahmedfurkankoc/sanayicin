    import React from "react";

const advantages = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" fill="#E6F9F0"/>
        <path d="M17 25l5 5 9-11" stroke="#00B86B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Güvenli Hizmet",
    desc: "Tüm ustalar doğrulanır, gerçek müşteri yorumları ile güvenle seçim yaparsınız."
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#FFF7E6"/><path d="M24 14v12l8 4" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    title: "Hızlı Erişim",
    desc: "Dakikalar içinde en yakın ustaya ulaşın, zaman kaybetmeyin."
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" fill="#E6F0FF"/>
        <rect x="14" y="16" width="20" height="14" rx="5" stroke="#0066FF" strokeWidth="2.5"/>
        <path d="M24 30v2" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M20 22l3 3 5-5" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Gerçek Yorumlar",
    desc: "Sadece gerçek müşterilerden gelen şeffaf değerlendirmeler."
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#F6E6FF"/><path d="M24 14v20" stroke="#B300FF" strokeWidth="2.5" strokeLinecap="round"/><path d="M14 24h20" stroke="#B300FF" strokeWidth="2.5" strokeLinecap="round"/></svg>
    ),
    title: "Kolay Kullanım",
    desc: "Kullanıcı dostu arayüz ile ihtiyacınıza anında çözüm."
  }
];

const PlatformAdvantages = () => (
  <section className="platform-advantages">
    <h2 className="advantages-title">Neden Sanayicin?</h2>
    <p className="advantages-desc">Güvenli, hızlı ve kolay hizmetin adresi. Platformumuzun sunduğu avantajlarla tanışın!</p>
    <div className="advantages-grid">
      {advantages.map((adv) => (
        <div className="advantage-card" key={adv.title}>
          <div className="advantage-icon">{adv.icon}</div>
          <div className="advantage-title">{adv.title}</div>
          <div className="advantage-desc">{adv.desc}</div>
        </div>
      ))}
    </div>
  </section>
);

export default PlatformAdvantages; 