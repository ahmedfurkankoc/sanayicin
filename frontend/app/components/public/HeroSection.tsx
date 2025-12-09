import React from "react";

interface HeroSectionProps {
  title: string;
  description?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, description }) => {
  return (
    <section className="heroPageSection">
      <div className="container">
        <h1 className="heroPageTitle">{title}</h1>
        {description && <p className="heroPageDescription">{description}</p>}
      </div>
    </section>
  );
};

export default HeroSection; 