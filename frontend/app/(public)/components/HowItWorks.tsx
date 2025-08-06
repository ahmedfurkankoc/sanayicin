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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 640);
      setIsTablet(width <= 1024 && width > 640);
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

  return (
    <section style={{
      padding: isMobile ? '60px 0' : '80px 0',
      backgroundColor: '#f9f9f9',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '40px' : '60px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '24px' : isTablet ? '28px' : '36px',
            fontWeight: '700',
            color: '#111111',
            margin: '0 0 16px 0',
            lineHeight: '1.2'
          }}>
            Nasıl Çalışır?
          </h2>
          <p style={{
            fontSize: isMobile ? '14px' : '18px',
            color: '#666',
            margin: '0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}>
            Aracınızın bakım ve onarım ihtiyaçlarını karşılamak için sadece 3 adım
          </p>
        </div>

        {/* Steps */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '24px' : '40px',
          position: 'relative'
        }}>
          {/* Connection Line - Desktop Only */}
          {!isMobile && (
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: '#e0e0e0',
              zIndex: 1
            }} />
          )}

          {steps.map((step, i) => (
            <div
              key={step.title}
              ref={el => { stepRefs.current[i] = el; }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: isMobile ? '16px' : '32px',
                position: 'relative',
                opacity: visibleSteps.includes(i) ? 1 : 0,
                transform: visibleSteps.includes(i) ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease ${i * 0.2}s`
              }}
            >
              {/* Step Number */}
              <div style={{
                width: isMobile ? '60px' : '100px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{
                  width: isMobile ? '40px' : '60px',
                  height: isMobile ? '40px' : '60px',
                  borderRadius: '50%',
                  backgroundColor: visibleSteps.includes(i) ? step.color : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '18px' : '24px',
                  fontWeight: '700',
                  color: visibleSteps.includes(i) ? 'white' : '#999',
                  transition: 'all 0.3s ease',
                  boxShadow: visibleSteps.includes(i) ? `0 4px 12px ${step.color}40` : 'none'
                }}>
                  {i + 1}
                </div>
              </div>

              {/* Step Content */}
              <div style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '20px' : '32px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                transform: visibleSteps.includes(i) ? 'scale(1.02)' : 'scale(1)',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '12px' : '20px',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  {/* Icon */}
                  <div style={{
                    width: isMobile ? '48px' : '60px',
                    height: isMobile ? '48px' : '60px',
                    borderRadius: isMobile ? '8px' : '12px',
                    backgroundColor: step.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    alignSelf: isMobile ? 'flex-start' : 'center'
                  }}>
                    <Icon 
                      name={step.icon} 
                      size={isMobile ? 20 : 28} 
                      color={step.color}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: '600',
                      color: '#111111',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3'
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '14px' : '16px',
                      color: '#666',
                      margin: '0',
                      lineHeight: '1.6'
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '40px' : '60px',
          padding: isMobile ? '24px' : '40px',
          backgroundColor: 'white',
          borderRadius: isMobile ? '12px' : '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <h3 style={{
            fontSize: isMobile ? '18px' : '24px',
            fontWeight: '600',
            color: '#111111',
            margin: '0 0 12px 0'
          }}>
            Hemen Başlayın
          </h3>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#666',
            margin: '0 0 20px 0',
            lineHeight: '1.6'
          }}>
            Aracınızın bakım ihtiyaçları için güvenilir ustalarımızla tanışın
          </p>
          <button style={{
            backgroundColor: '#ffd600',
            color: '#111111',
            border: 'none',
            padding: isMobile ? '12px 24px' : '16px 32px',
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255, 214, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffed4e';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffd600';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            Usta Ara
          </button>
        </div>
      </div>

      {/* Background Elements */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'radial-gradient(circle at 20% 80%, rgba(255, 214, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 214, 0, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
    </section>
  );
};

export default HowItWorks; 