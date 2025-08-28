'use client';

import React, { useState, useEffect } from "react";
import "../../styles/esnaf.css";
import EsnafPanelLayout from "../components/EsnafPanelLayout";
import { useEsnaf } from "../context/EsnafContext";
import Icon from "@/app/components/ui/Icon";
import { api } from "@/app/utils/api";
import { toast } from "sonner";

interface Review {
  id: number;
  user: {
    name: string;
    avatar?: string | null;
  };
  rating: number;
  comment: string;
  service: string;
  created_at: string;
  date?: {
    month: number;
    year: number;
  };
}

export default function EsnafYorumlarPage() {
  const { user } = useEsnaf();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.getVendorReviews(user?.slug);
        setReviews(response.data);
        
        // Ortalama puanı ve toplam değerlendirme sayısını hesapla
        const total = response.data.length;
        const average = total > 0 
          ? response.data.reduce((acc: number, curr: Review) => acc + curr.rating, 0) / total 
          : 0;
        
        setTotalReviews(total);
        setAverageRating(average);
      } catch (error) {
        console.error('Değerlendirmeler yüklenirken hata:', error);
        toast.error('Değerlendirmeler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (user?.slug) {
      fetchReviews();
    }
  }, [user?.slug]);

  const filteredReviews = reviews.filter(review => {
    const matchesRating = selectedRating === 'all' || review.rating === selectedRating;
    const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <EsnafPanelLayout activePage="yorumlar" title="Yorumlarım">
        <div className="esnaf-reviews-loading">
          Yükleniyor...
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="yorumlar" title="Yorumlarım">
      {/* Header */}
      <div className="esnaf-reviews-header">
        <div className="esnaf-reviews-header-inner">
          <div>
            <h1 className="esnaf-page-title">Yorumlarım</h1>
            <p className="esnaf-reviews-stats">
              Toplam {totalReviews} değerlendirme • Ortalama {averageRating.toFixed(1)} ★
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="esnaf-reviews-filters">
        <div className="esnaf-reviews-filters-inner">
          {/* Search */}
          <div className="esnaf-reviews-search-container">
            <input
              type="text"
              placeholder="Yorum veya müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="esnaf-reviews-search-input"
            />
            <div className="esnaf-reviews-search-icon">
              <Icon name="search" size={16} />
            </div>
          </div>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="esnaf-reviews-rating-filter"
          >
            <option value="all">Tüm Puanlar</option>
            <option value="5">5 Yıldız</option>
            <option value="4">4 Yıldız</option>
            <option value="3">3 Yıldız</option>
            <option value="2">2 Yıldız</option>
            <option value="1">1 Yıldız</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="esnaf-reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="esnaf-reviews-empty">
            <div className="esnaf-reviews-empty-icon">
              <Icon name="star" size={48} />
            </div>
            <h3 className="esnaf-reviews-empty-title">Değerlendirme Bulunamadı</h3>
            <p className="esnaf-reviews-empty-text">Arama kriterlerinize uygun değerlendirme bulunmuyor.</p>
          </div>
        ) : (
          <div className="esnaf-reviews-cards">
            {filteredReviews.map((review) => (
              <div key={review.id} className="esnaf-review-card">
                <div className="esnaf-review-header">
                  <div className="esnaf-review-user-info">
                    <div className="esnaf-review-avatar">
                      {review.user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.user.avatar}
                          alt={review.user.name}
                          className="esnaf-review-avatar-img"
                        />
                      ) : (
                        <span className="esnaf-review-avatar-initial">
                          {review.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="esnaf-review-user-name">{review.user.name}</h3>
                      <p className="esnaf-review-date">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="esnaf-review-rating">
                    <span className="esnaf-review-rating-stars">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i} className="esnaf-review-star">★</span>
                      ))}
                    </span>
                    <span className="esnaf-review-rating-number">{review.rating}/5</span>
                  </div>
                </div>

                <div className="esnaf-review-service">
                  {review.service}
                </div>

                <p className="esnaf-review-comment">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </EsnafPanelLayout>
  );
}
