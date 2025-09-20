import React from "react";
import Link from "next/link";

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
    if (img && img !== '/images/vendor-default.jpg') {
      return (
        <img 
          src={img} 
          alt={displayName} 
          className="vendorImg" 
          loading="lazy"
          onError={(e) => {
            // Resim yüklenemezse avatar'a geç
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return null;
  };

  const renderTextAvatar = () => {
    const firstLetter = displayName.charAt(0).toUpperCase();
    return (
      <div className="vendorImgTextAvatar hidden">
        <span className="avatarText">{firstLetter}</span>
      </div>
    );
  };
  
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
      <div className="vendorImgContainer">
        {renderAvatar()}
        {renderTextAvatar()}
      </div>
      <div className="vendorInfo">
        <h3 className="vendorName">{displayName}</h3>
        <div className="vendorExp">{experience}</div>
        <div className="vendorType">{displayType} · {displayLocation}</div>
        {renderRating()}
        <button className="vendorCardActionBtn">Esnaf Bul</button>
      </div>
    </div>
  );

  // Eğer slug varsa, link olarak sar
  if (slug) {
    return (
      <Link href={`/esnaf/${slug}`} className="vendor-card-link">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default VendorCard; 