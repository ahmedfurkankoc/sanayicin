'use client';

import React from 'react';

interface Review {
  id: number;
  user: {
    name: string;
    avatar?: string | null;
  };
  rating: number;
  date: {
    month: number;
    year: number;
  };
  service: string;
  comment: string;
  created_at: string;
}

interface ReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  onReview: () => void;
  showReviewButton?: boolean;
}

const Reviews: React.FC<ReviewsProps> = ({ reviews, averageRating, totalReviews, onReview, showReviewButton = true }) => {
  const formatDate = (month: number, year: number) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${months[month - 1]} ${year}`;
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          margin: 0,
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          Değerlendirmeler
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#666',
            fontWeight: 'normal'
          }}>
            <span style={{
              background: '#ffd600',
              color: '#111',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: '600'
            }}>
              {averageRating.toFixed(1)} ★
            </span>
            <span>({totalReviews} değerlendirme)</span>
          </div>
        </h3>

        {showReviewButton && (
          <button
            onClick={onReview}
            style={{
              backgroundColor: '#fff8cc',
              color: '#111111',
              border: '1px solid #ffe066',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ★ Değerlendir
          </button>
        )}
      </div>

      {/* Değerlendirme Kartları */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Üst Kısım: Kullanıcı Bilgisi ve Puan */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#666',
                  fontWeight: '600'
                }}>
                  {review.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    review.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* İsim ve Tarih */}
                <div>
                  <div style={{ fontWeight: '600', color: '#333' }}>
                    {review.user.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatDate(review.date.month, review.date.year)}
                  </div>
                </div>
              </div>

              {/* Puan */}
              <div style={{
                background: '#fff8cc',
                color: '#111',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {review.rating} ★
              </div>
            </div>

            {/* Hizmet */}
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '12px',
              padding: '6px 12px',
              background: '#f8f9fa',
              borderRadius: '6px',
              display: 'inline-block'
            }}>
              {review.service}
            </div>

            {/* Yorum */}
            <div style={{
              fontSize: '15px',
              color: '#333',
              lineHeight: '1.6'
            }}>
              {review.comment}
            </div>

            {/* Tarih */}
            <div style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '16px'
            }}>
              {new Date(review.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#f8f9fa',
          borderRadius: '12px',
          color: '#666',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>★</div>
          <div style={{ fontSize: '16px', fontWeight: 500 }}>
            Henüz değerlendirme yapılmamış
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            İlk değerlendirmeyi siz yapın ve diğer kullanıcılara yardımcı olun.
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
