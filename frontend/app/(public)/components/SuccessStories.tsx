"use client";

import React, { useState, useEffect } from "react";
import { iconMapping } from "../../utils/iconMapping";

const SuccessStories = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const stories = [
    {
      id: 1,
      avatar: "👨‍🔧",
      name: "Mehmet Usta - Oto Servis",
      quote: "Araçların motor arızalarından klima problemlerine kadar her türlü işi yapıyorum. Sanayicin ile günde 5-6 araç geliyor, eskiden 2-3 araçtı.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 2,
      avatar: "👩‍💼",
      name: "Ayşe Hanım - Müşteri",
      quote: "Aracımın kaportası kaza sonrası çok kötü durumdaydı. Sanayicin'de bulduğum ustayla çok memnun kaldım, işi mükemmel yaptı. Fiyat da çok uygun.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 3,
      avatar: "👨‍🔧",
      name: "Ahmet Usta - Elektrik & Elektronik",
      quote: "Araçların elektrik sistemlerini tamir ediyorum. Far, sinyal, radyo gibi elektronik aksamlar. Sanayicin ile müşteri sayım 3 katına çıktı.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 4,
      avatar: "👨‍💼",
      name: "Mustafa Bey - Müşteri",
      quote: "Aracımın lastikleri eskimişti, jantlarım da çizikliydi. Sanayicin'de bulduğum ustayla hem lastik değişimi hem jant tamiri yaptırdım. Çok memnun kaldım.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 5,
      avatar: "👩‍💼",
      name: "Fatma Hanım - Müşteri",
      quote: "Aracımın kliması çalışmıyordu, yaz aylarında çok zorlanıyordum. Sanayicin'de bulduğum ustayla klima tamiri yaptırdım. Artık serin serin gidiyorum.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 6,
      avatar: "👨‍🔧",
      name: "Hasan Usta - Genel Tamir",
      quote: "Araçların genel bakım ve tamir işlerini yapıyorum. Motor yağı değişimi, filtre değişimi gibi işler. Platform ile işim çok arttı.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 7,
      avatar: "👨‍💼",
      name: "İbrahim Bey - Müşteri",
      quote: "Aracımın frenleri tutmuyordu, çok tehlikeliydi. Sanayicin'de bulduğum ustayla fren sistemi tamiri yaptırdım. Artık güvenle sürüyorum.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 8,
      avatar: "👨‍🔧",
      name: "Hikmet Usta - Araç Elektroniği",
      quote: "Araçların elektronik sistemlerini tamir ediyorum. ECU, sensörler, kablolar. Karmaşık işler ama çok karlı, platform sayesinde uzman olduğum alanda çalışıyorum.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      id: 9,
      avatar: "👨‍💼",
      name: "Osman Bey - Müşteri",
      quote: "Aracımın motoru çok ses yapıyordu, performansı da düşmüştü. Sanayicin'de bulduğum ustayla motor tamiri yaptırdım. Artık araç yeni gibi çalışıyor.",
      rating: "⭐⭐⭐⭐⭐"
    }
  ];

  const totalSlides = Math.ceil(stories.length / 3);

  // Auto slide functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // 5 saniyede bir değişsin

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false); // Manuel kontrol edildiğinde auto play'i durdur
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false); // Manuel kontrol edildiğinde auto play'i durdur
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false); // Manuel kontrol edildiğinde auto play'i durdur
  };

  // Mevcut slide'daki hikayeleri al
  const getCurrentStories = () => {
    const startIndex = currentSlide * 3;
    return stories.slice(startIndex, startIndex + 3);
  };

  // Mobilde sadece 1 hikaye göster
  const getMobileStories = () => {
    return [stories[currentSlide]];
  };

  return (
    <section className="success-stories-section">
      <div className="container">
        <h2 className="sectionTitle">Başarı Hikayeleri</h2>
        
        <div className="stories-slider-container">
          {/* Desktop: 3'erli gösterim */}
          <div className="stories-grid desktop-stories">
            {getCurrentStories().map((story) => (
              <div key={`desktop-${story.id}`} className="story-card">
                <div className="story-avatar">{story.avatar}</div>
                <div className="story-content">
                  <h3>{story.name}</h3>
                  <p>"{story.quote}"</p>
                  <div className="story-rating">{story.rating}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: 1'erli gösterim */}
          <div className="stories-grid mobile-stories">
            {getMobileStories().map((story) => (
              <div key={`mobile-${story.id}`} className="story-card">
                <div className="story-avatar">{story.avatar}</div>
                <div className="story-content">
                  <h3>{story.name}</h3>
                  <p>"{story.quote}"</p>
                  <div className="story-rating">{story.rating}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button 
            className="slider-btn slider-btn-prev"
            onClick={prevSlide}
            aria-label="Önceki hikayeler"
          >
            {React.createElement(iconMapping['chevron-left'], { size: 24 })}
          </button>
          
          <button 
            className="slider-btn slider-btn-next"
            onClick={nextSlide}
            aria-label="Sonraki hikayeler"
          >
            {React.createElement(iconMapping['chevron-right'], { size: 24 })}
          </button>

          {/* Dots Indicator */}
          <div className="slider-dots">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`${index + 1}. sayfa`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
