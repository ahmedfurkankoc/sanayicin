import React from "react";

interface BannerProps {
  title: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  breadcrumb?: React.ReactNode;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number; // 0.0 - 1.0
}

const Banner = ({
  title,
  description,
  backgroundColor = "var(--yellow)", // Default arka plan rengi
  textColor = "var(--black)", // Default yazı rengi
  className = "",
  breadcrumb,
  backgroundImageUrl,
  backgroundOverlayOpacity = 0.5,
}: BannerProps) => {
  const overlay = `rgba(0,0,0,${backgroundOverlayOpacity})`;
  return (
    <section
      className={`hero-section ${className}`}
      style={
        backgroundImageUrl
          ? {
              backgroundColor,
              color: textColor,
              backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {
              backgroundColor,
              color: textColor,
            }
      }
    >
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">{title}</h1>
          {description && <p className="hero-description">{description}</p>}
          {breadcrumb && (
            <div className="hero-breadcrumb">
              {breadcrumb}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Banner;
