'use client';

import React, { useRef, useEffect, useState } from "react";
import Icon from "@/app/components/ui/Icon";

const steps = [
  {
    title: "Hizmet Ara",
    desc: "İhtiyacın olan hizmeti veya ustayı kolayca ara. Kategorilerden veya arama çubuğundan hızlıca bul.",
    icon: (
      <span className="howitworks-icon-bg" style={{background: "#FFF7E6"}}>
        <Icon name="search-icon" size={24} color="#FFB300" />
      </span>
    )
  },
  {
    title: "Usta Seç & İletişime Geç",
    desc: "Sana en uygun ustayı seç, profilini incele ve hızlıca iletişime geç. Gerçek müşteri yorumlarını gör.",
    icon: (
      <span className="howitworks-icon-bg" style={{background: "#E6F9F0"}}>
        <Icon name="users-icon" size={24} color="#00B86B" />
      </span>
    )
  },
  {
    title: "Hizmet Al & Değerlendir",
    desc: "Hizmetini al, memnuniyetini değerlendir ve yorum yap. Platformumuzda güvenli deneyim yaşa.",
    icon: (
      <span className="howitworks-icon-bg" style={{background: "#E6F0FF"}}>
        <Icon name="check-circle" size={24} color="#0066FF" />
      </span>
    )
  }
];

const HowItWorks = () => {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [ratios, setRatios] = useState(Array(steps.length).fill(0));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 700);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            setRatios(prev => {
              const arr = [...prev];
              arr[i] = entry.intersectionRatio;
              return arr;
            });
          });
        },
        { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // En çok görünür olan adımın index'ini bul
  const maxActive = ratios.reduce((acc, val, idx) => val > ratios[acc] ? idx : acc, 0);

  return (
    <section className="howitworks-section">
      <h2 className="howitworks-title">Nasıl Çalışır?</h2>
      <div className="howitworks-zigzag-grid">
        {steps.map((step, i) => (
          <div className={`howitworks-zigzag-row${i % 2 === 1 ? ' reverse' : ''}`} key={step.title}>
            <div className="howitworks-zigzag-barcol">
              <div className={`howitworks-num-2col${i <= maxActive ? " active" : ""}`}>{i + 1}</div>
            </div>
            <div
              className="howitworks-card-2col"
              ref={el => { stepRefs.current[i] = el; }}
            >
              {step.icon}
              <div className="howitworks-card-content-2col">
                <div className="howitworks-card-title-2col">{step.title}</div>
                <div className="howitworks-card-desc-2col">{step.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks; 