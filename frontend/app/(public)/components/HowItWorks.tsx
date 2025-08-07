'use client';

import React, { useRef, useEffect, useState } from "react";
import Icon from "@/app/components/ui/Icon";

const steps = [
  {
    title: "Hizmet Ara",
    desc: "İhtiyacınız olan oto sanayi hizmetini kolayca bulun. Kategorilerden veya arama çubuğundan hızlıca aracınız için uygun ustayı bulun.",
    icon: "search",
    color: "#ffd600",
    bgColor: "#fff7e6"
  },
  {
    title: "Usta Seç & İletişime Geç",
    desc: "Size en uygun oto sanayi ustasını seçin, profilini inceleyin ve hızlıca iletişime geçin. Gerçek müşteri yorumlarını görün.",
    icon: "users",
    color: "#ffd600",
    bgColor: "#fff7e6"
  },
  {
    title: "Hizmet Al & Değerlendir",
    desc: "Aracınızın bakımını yaptırın, memnuniyetinizi değerlendirin ve yorum yapın. Platformumuzda güvenli deneyim yaşayın.",
    icon: "check-circle",
    color: "#ffd600",
    bgColor: "#fff7e6"
  }
];

const HowItWorks = () => {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkResponsive = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    
    const observers: IntersectionObserver[] = [];
    
    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;
      
      const observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setVisibleSteps(prev => {
                if (!prev.includes(i)) {
                  return [...prev, i].sort((a, b) => a - b);
                }
                return prev;
              });
            }
          });
        },
        { 
          threshold: 0.3,
          rootMargin: '-50px 0px -50px 0px'
        }
      );
      
      observer.observe(ref);
      observers.push(observer);
    });
    
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Scroll-based active step detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = stepRefs.current.findIndex(ref => ref === entry.target);
            if (index !== -1) {
              setActiveStep(index);
            }
          }
        });
      },
      { 
        threshold: isMobile ? 0.4 : 0.6,
        rootMargin: isMobile ? '-20% 0px -20% 0px' : '-30% 0px -30% 0px'
      }
    );
    
    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <section className="howitworks-section">
      <div className="container">
        {/* Header */}
        <div className="howitworks-title">
          <h2 className="sectionTitle">Nasıl Çalışır?</h2>
          <p>Aracınızın bakım ve onarım ihtiyaçlarını karşılamak için sadece 3 adım</p>
        </div>

        {/* Unified Layout - 2 Column Grid for both Desktop and Mobile */}
        <div className="howitworks-2col-grid">
          {/* Cards Column with Numbers */}
          <div className="howitworks-cards-2col">
            {steps.map((step, i) => (
              <div
                key={step.title}
                ref={el => { stepRefs.current[i] = el; }}
                className={`howitworks-card-2col ${activeStep === i ? 'active' : ''}`}
                style={{
                  opacity: visibleSteps.includes(i) ? 1 : 0,
                  transform: visibleSteps.includes(i) ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s ease ${i * 0.2}s`
                }}
              >
                <div className="howitworks-card-number">
                  <div className={`howitworks-num-2col ${activeStep === i ? 'active' : ''}`}>
                    <span>{i + 1}</span>
                  </div>
                </div>
                <div className="howitworks-card-content-2col">
                  <div className="howitworks-icon-bg" style={{ backgroundColor: step.bgColor }}>
                    <Icon name={step.icon} size={28} color={step.color} />
                  </div>
                  <div className="howitworks-card-text">
                    <h3 className="howitworks-card-title-2col">{step.title}</h3>
                    <p className="howitworks-card-desc-2col">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 