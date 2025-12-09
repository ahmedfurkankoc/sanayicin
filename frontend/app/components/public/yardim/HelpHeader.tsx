'use client';

import { useRouter } from "next/navigation";

export default function HelpHeader() {
  const router = useRouter();

  return (
    <div className="u-flex u-align-center u-justify-between u-mb-16" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div className="help-title-section">
        <h1 className="sectionTitle help-title">Hangi konuda yardıma ihtiyacın var?</h1>
        <p className="help-title-subtitle">Sorularınızın cevaplarını bulmak için aşağıdaki kategorilerden birini seçin</p>
      </div>
      <button
        type="button"
        className="btn-dark"
        onClick={() => {
          router.push('/yardim/destek?tab=tickets');
        }}
      >
        Destek Taleplerim
      </button>
    </div>
  );
}

