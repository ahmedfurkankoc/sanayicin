import React from "react";
import Link from "next/link";
import { resolveMediaUrl } from "@/app/utils/api";

type VendorCardProps = {
  name: string;
  experience: string;
  type: string;
  city: string;
  img: string;
  // Yeni props
  slug?: string;
  rating?: number;
  reviewCount?: number;
  about?: string;
  serviceAreas?: Array<{ id: number; name: string }>;
  categories?: Array<{ id: number; name: string }>;
};

const VendorCard = ({ 
  name, 
  experience, 
  type, 
  city, 
  img, 
  slug,
  rating,
  reviewCount,
  about,
  serviceAreas,
  categories
}: VendorCardProps) => {
  // Eğer gerçek veri varsa, onu kullan
  const displayName = name;
  const displayType = serviceAreas && serviceAreas.length > 0 
    ? serviceAreas[0].name 
    : type;
  const displayLocation = city;
  // Avatar gösterimi - resim yoksa şirket adının ilk harfi
  const renderAvatar = () => {
    const firstLetter = displayName.charAt(0).toUpperCase();
    // img prop'u null, undefined veya boş string olabilir
    const hasImg = img && typeof img === 'string' && img.trim().length > 0;
    const resolvedImg = hasImg ? resolveMediaUrl(img) : null;
    // Resolved img default değilse ve geçerli bir URL ise göster
    const hasValidImage = resolvedImg && 
                          resolvedImg !== '/images/vendor-default.jpg' && 
                          !resolvedImg.includes('vendor-default') &&
                          hasImg;
    
    return (
      <div className="vendorAvatar">
        {hasValidImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolvedImg}
            alt={displayName}
            className="vendorAvatarImg"
            loading="lazy"
            onError={(e) => {
              // Resim yüklenemezse gizle ve baş harfi göster
              const imgElement = e.currentTarget;
              const avatarDiv = imgElement.parentElement;
              const textElement = avatarDiv?.querySelector('.avatarText') as HTMLElement | null;
              if (imgElement) {
                imgElement.style.display = 'none';
              }
              if (textElement) {
                textElement.classList.remove('hidden');
                textElement.style.display = 'flex';
              }
            }}
          />
        )}
        <span 
          className={`avatarText ${hasValidImage ? 'hidden' : ''}`}
          style={hasValidImage ? { display: 'none' } : {}}
        >
          {firstLetter}
        </span>
      </div>
    );
  };

  const renderTextAvatar = () => null;
  
  // Rating gösterimi - her zaman göster, rating yoksa 0 göster
  const renderRating = () => {
    const currentRating = rating || 0;
    const fullStars = Math.floor(currentRating);
    const hasHalfStar = currentRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="vendorRating">
        <div className="ratingStars">
          {'★'.repeat(fullStars)}
          {hasHalfStar && '☆'}
          {'☆'.repeat(emptyStars)}
        </div>
        <div className="ratingInfo">
          <span className="ratingNumber">{currentRating.toFixed(1)}</span>
        </div>
      </div>
    );
  };

  const cardContent = (
    <div className="vendorCard">
      {renderAvatar()}
      <div className="vendorInfo">
        <h3 className="vendorName">{displayName}</h3>
        <div className="vendorExp">
          {(() => {
            const text = (about && about.trim().length > 0) ? about.trim() : 'Hakkında bilgi yok';
            const maxLen = 90;
            return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
          })()}
        </div>
        <div className="vendorType">{displayType} · {displayLocation}</div>
        {renderRating()}
        <button className="vendorCardActionBtn">Esnaf Bul</button>
      </div>
    </div>
  );

  // Eğer slug varsa, link olarak sar
  if (slug) {
    return (
      <Link href={`/musteri/esnaf/${slug}`} className="vendor-card-link">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default VendorCard; 