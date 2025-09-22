import React from "react";
import PolicySidebar from "./PolicySidebar";

interface PolicyLayoutProps {
  title: string;
  updatedAt?: string;
  children: React.ReactNode;
}

function PolicyLayout({ title, updatedAt, children }: PolicyLayoutProps) {
  return (
    <section className="policy-page">
      <div className="container">
        <header className="policy-header">
          <h1 className="policy-title">{title}</h1>
          {updatedAt && (
            <div className="policy-updated">Güncelleme Tarihi: {updatedAt}</div>
          )}
        </header>
        <div className="policy-layout-grid">
          <aside className="policy-sidebar">
            <PolicySidebar />
          </aside>
          <article className="policy-content">
            {children}
          </article>
        </div>
      </div>
    </section>
  );
}

export default PolicyLayout;

