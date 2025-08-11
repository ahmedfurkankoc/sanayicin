'use client';

import React from "react";
import "../styles/esnaf.css";
import { EsnafProvider } from "./context/EsnafContext";
import { Toaster } from "@/app/components/ui/sonner";

export default function EsnafLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EsnafProvider>
        <div className="esnaf-panel-layout">
          <main className="esnaf-panel-main-content">{children}</main>
        </div>
      </EsnafProvider>
      <Toaster />
    </>
  );
} 