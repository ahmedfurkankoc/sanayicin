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
    <div className="m-reviews">
      <div className="m-reviews-header">
        <h3 className="m-reviews-title">
          Değerlendirmeler
          <div className="m-reviews-stats">
            <span className="m-reviews-badge">
              {averageRating.toFixed(1)} ★
            </span>
            <span>({totalReviews} değerlendirme)</span>
          </div>
        </h3>

        {showReviewButton && (
          <button onClick={onReview} className="m-btn m-btn-phone">
            ★ Değerlendir
          </button>
        )}
      </div>

      {/* Değerlendirme Kartları */}
      <div className="m-reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="m-review-card">
            {/* Üst Kısım: Kullanıcı Bilgisi ve Puan */}
            <div className="m-review-top">
              <div className="m-review-user">
                {/* Avatar */}
                <div className="m-review-avatar">
                  {review.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.user.avatar} alt={review.user.name} />
                  ) : (
                    review.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* İsim ve Tarih */}
                <div>
                  <div className="m-review-name">
                    {review.user.name}
                  </div>
                  <div className="m-review-date">
                    {review.date ? formatDate(review.date.month, review.date.year) : new Date(review.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>

              {/* Puan */}
              <div className="m-review-rating">
                {review.rating} ★
              </div>
            </div>

            {/* Hizmet */}
            <div className="m-review-service">
              {review.service}
            </div>

            {/* Yorum */}
            <div className="m-review-comment">
              {review.comment}
            </div>

            {/* Tarih */}
            <div className="m-review-created">
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
        <div className="m-reviews-empty">
          <div className="m-reviews-empty-icon">★</div>
          <div className="m-reviews-empty-title">
            Henüz değerlendirme yapılmamış
          </div>
          <div className="m-reviews-empty-sub">
            İlk değerlendirmeyi siz yapın ve diğer kullanıcılara yardımcı olun.
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
