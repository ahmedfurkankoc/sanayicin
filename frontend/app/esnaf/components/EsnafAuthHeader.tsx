import React from "react";

interface EsnafAuthHeaderProps {
  title: string;
}

export default function EsnafAuthHeader({ title }: EsnafAuthHeaderProps) {
  return (
    <div className="esnaf-login-header">
      <div className="esnaf-login-logo">
        <img src="/sanayicin-icon.png" alt="Sanayicin" />
        <span className="esnaf-login-logo-text">SANAYİCİN</span>
        <div className="esnaf-login-subtitle">{title}</div>
      </div>
    </div>
  );
} 