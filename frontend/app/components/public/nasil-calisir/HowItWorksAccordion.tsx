'use client';

import { useState } from "react";
import { iconMapping } from "@/app/utils/iconMapping";

export default function HowItWorksAccordion() {
  const [activeStep, setActiveStep] = useState<number | null>(0);

  const steps = [
    {
      n: 1,
      icon: "user",
      title: "Kayıt Ol",
      details: [
        "Hızlı ve kolay kayıt süreci ile başlayın.",
        "E-posta veya telefon numaranızla ücretsiz hesap oluşturun.",
        "Kayıt sonrası e-posta doğrulaması ile hesabınızı aktifleştirin."
      ]
    },
    {
      n: 2,
      icon: "edit",
      title: "Profilini Özelleştir",
      details: [
        "Kişisel bilgilerini ve tercihlerini ekle.",
        "Profil fotoğrafı ve iletişim bilgilerini güncelle.",
        "Araç bilgilerini kaydederek hızlı talep oluştur."
      ]
    },
    {
      n: 3,
      icon: "search",
      title: "Hizmet Ara ve Talep Oluştur",
      details: [
        "İhtiyacını belirle ve hızlıca talep oluştur.",
        "Hizmet türünü seç, konumunu belirt ve detayları ekle.",
        "Fotoğraf veya video ekleyerek daha detaylı bilgi ver."
      ]
    },
    {
      n: 4,
      icon: "help",
      title: "Destek Al",
      details: [
        "7/24 müşteri desteği ile yardım al.",
        "Canlı sohbet veya destek talebi oluşturarak iletişime geç.",
        "Sık sorulan sorular ve çözüm rehberlerinden faydalan."
      ]
    }
  ];

  return (
    <div className="nasil-calisir-accordion-steps">
      <div className="nasil-calisir-accordion-line" />
      {steps.map((step, idx) => {
        const isActive = activeStep !== null && activeStep === idx;
        const StepIcon = iconMapping[step.icon as keyof typeof iconMapping] as any;
        return (
          <div 
            key={idx} 
            className={`nasil-calisir-step-item ${isActive ? 'active' : ''}`}
          >
            <div className="nasil-calisir-step-wrapper">
              <div className={`nasil-calisir-step-badge ${isActive ? 'active' : ''}`}>
                {StepIcon ? (
                  <StepIcon size={24} color={isActive ? "#111" : "#9ca3af"} />
                ) : (
                  <span>{step.n}</span>
                )}
              </div>
              <div className="nasil-calisir-step-content">
                <button
                  onClick={() => setActiveStep(isActive ? null : idx)}
                  className="nasil-calisir-step-button"
                >
                  <h3 className="nasil-calisir-step-title">
                    {step.title}
                  </h3>
                  <span className="nasil-calisir-step-arrow">
                    ▼
                  </span>
                </button>
                <div className="nasil-calisir-step-details">
                  <div className="nasil-calisir-step-details-inner">
                    <ul className="nasil-calisir-step-details-list">
                      {step.details.map((detail, dIdx) => (
                        <li 
                          key={dIdx} 
                          className="nasil-calisir-step-detail-item"
                        >
                          <span className="nasil-calisir-step-detail-check">
                            ✓
                          </span>
                          <span className="nasil-calisir-step-detail-text">
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

