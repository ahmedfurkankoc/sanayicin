import React from 'react';

const VendorCardSkeleton: React.FC = () => {
  return (
    <div className="vendor-card-skeleton">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
        <div className="skeleton-location"></div>
        <div className="skeleton-rating">
          <div className="skeleton-stars"></div>
          <div className="skeleton-rating-number"></div>
        </div>
      </div>
    </div>
  );
};

export default VendorCardSkeleton;
