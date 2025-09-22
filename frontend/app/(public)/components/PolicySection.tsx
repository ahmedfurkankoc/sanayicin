import React from "react";

interface PolicySectionProps {
  heading: string;
  children: React.ReactNode;
}

function PolicySection({ heading, children }: PolicySectionProps) {
  return (
    <div className="policy-section">
      <h2 className="policy-section-title">{heading}</h2>
      <div className="policy-section-body">
        {children}
      </div>
    </div>
  );
}

export default PolicySection;

