'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RateLimitErrorProps {
  retryAfter?: number; // Saniye cinsinden
  onRetry?: () => void;
}

export default function RateLimitError({ retryAfter, onRetry }: RateLimitErrorProps) {
  const router = useRouter();

  // Backend'den gelen süreyi kullanıcı dostu formata çevir
  const formatRetryTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} saniye`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} dakika`;
    } else {
      const hours = Math.ceil(seconds / 3600);
      return `${hours} saat`;
    }
  };

  const retryTimeText = retryAfter ? formatRetryTime(retryAfter) : 'bir süre';

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="rate-limit-error-page">
      <div className="rate-limit-error-container">
        <div className="rate-limit-error-content">
          <div className="rate-limit-error-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <h1 className="rate-limit-error-title">Çok Fazla İstek</h1>
          
          <p className="rate-limit-error-message">
            Çok fazla istek gönderdiniz. Lütfen bir süre bekleyip tekrar deneyin.
          </p>

          {retryAfter && retryAfter > 0 && (
            <div className="rate-limit-error-countdown">
              <p>
                <strong>{retryTimeText}</strong> sonra tekrar deneyebilirsiniz.
              </p>
            </div>
          )}

          <div className="rate-limit-error-actions">
            <button
              onClick={() => router.push('/')}
              className="rate-limit-error-button secondary"
            >
              Ana Sayfaya Dön
            </button>
            
            <Link
              href="/iletisim"
              className="rate-limit-error-button link"
            >
              Destek İletişim
            </Link>
          </div>

          <div className="rate-limit-error-info">
            <p>
              <strong>Neden bu hata oluştu?</strong>
            </p>
            <ul>
              <li>Kısa sürede çok fazla istek gönderildi</li>
              <li>Sistem güvenliği için rate limiting uygulanıyor</li>
              <li>Birkaç dakika bekleyip tekrar deneyebilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .rate-limit-error-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .rate-limit-error-container {
          max-width: 600px;
          width: 100%;
        }

        .rate-limit-error-content {
          background: white;
          border-radius: 16px;
          padding: 48px 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .rate-limit-error-icon {
          color: #ff6b6b;
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .rate-limit-error-title {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .rate-limit-error-message {
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .rate-limit-error-countdown {
          background: #fff5f5;
          border: 2px solid #fed7d7;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .rate-limit-error-countdown p {
          margin: 0;
          font-size: 20px;
          color: #c53030;
        }

        .rate-limit-error-countdown strong {
          font-size: 24px;
          font-weight: 700;
        }

        .rate-limit-error-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .rate-limit-error-button {
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          border: none;
        }

        .rate-limit-error-button.primary {
          background: #ffd600;
          color: #111111;
        }

        .rate-limit-error-button.primary:hover {
          background: #ffed4e;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 214, 0, 0.4);
        }

        .rate-limit-error-button.secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .rate-limit-error-button.secondary:hover {
          background: #cbd5e0;
        }

        .rate-limit-error-button.link {
          background: transparent;
          color: #4299e1;
          text-decoration: underline;
        }

        .rate-limit-error-button.link:hover {
          color: #2b6cb0;
        }

        .rate-limit-error-info {
          text-align: left;
          background: #f7fafc;
          border-radius: 8px;
          padding: 20px;
          margin-top: 24px;
        }

        .rate-limit-error-info p {
          margin: 0 0 12px 0;
          font-weight: 600;
          color: #2d3748;
        }

        .rate-limit-error-info ul {
          margin: 0;
          padding-left: 24px;
          color: #4a5568;
          line-height: 1.8;
        }

        .rate-limit-error-info li {
          margin-bottom: 8px;
        }

        @media (max-width: 640px) {
          .rate-limit-error-content {
            padding: 32px 20px;
          }

          .rate-limit-error-title {
            font-size: 24px;
          }

          .rate-limit-error-message {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

