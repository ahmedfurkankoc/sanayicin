import React from "react";

interface BannerProps {
  title: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  breadcrumb?: React.ReactNode;
}

const Banner = ({
  title,
  description,
  backgroundColor = "var(--yellow)", // Default arka plan rengi
  textColor = "var(--black)", // Default yazı rengi
  className = "",
  breadcrumb,
}: BannerProps) => {
  return (
    <section
      className={`hero-section ${className}`}
      style={{
        backgroundColor,
        color: textColor,
      }}
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
