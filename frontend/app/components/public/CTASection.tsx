import React from "react";

type CTASectionProps = {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  variant?: "vendor" | "user";
  imageSrc?: string;
  imageAlt?: string;
  reverse?: boolean;
};

const CTASection = ({ title, description, buttonText, buttonHref, variant = "user", imageSrc, imageAlt, reverse = false }: CTASectionProps) => (
    <section className={`cta-section-split cta-${variant}${reverse ? " cta-reverse" : ""}`}>  
      <div className="cta-image-side">
        {imageSrc && (
          <img src={imageSrc} alt={imageAlt || title} className="cta-image-split" />
        )}
      </div>
      <div className="cta-content-side">
        <h2 className="cta-title-split">{title}</h2>
        <p className="cta-desc-split">{description}</p>
        <a href={buttonHref} className={`cta-btn-split`}>{buttonText}</a>
      </div>
    </section>
);

export default CTASection; 