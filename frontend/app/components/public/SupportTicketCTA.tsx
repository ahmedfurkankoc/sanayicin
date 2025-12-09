"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Icon from "@/app/components/ui/Icon";

export default function SupportTicketCTA() {
  const router = useRouter();

  return (
    <div className="u-mt-50">
      <div className="help-cta">
        <div className="help-cta-icon">
          <Icon name="alert" size={34} color="var(--black)"/>
        </div>
        <div className="help-cta-content">
          <h3>Yardım istediğin konuyu destek makalelerimiz arasında bulamadın mı?</h3>
          <p>O zaman destek talebi oluşturabilir ve taleplerini <b>Destek Taleplerim</b> bölümünden takip edebilirsin.</p>
        </div>
        <button
          type="button"
          className="help-cta-btn"
          onClick={() => {
            router.push('/yardim/destek?tab=new');
          }}
        >
          Destek Talebi Oluştur
        </button>
      </div>
    </div>
  );
}
