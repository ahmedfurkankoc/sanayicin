'use client';

import React, { useState } from 'react';
import OTPInput from './OTPInput';
import { iconMapping } from '@/app/utils/iconMapping';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  phoneNumber?: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
}

export default function OTPModal({
  isOpen,
  onClose,
  onVerify,
  onResend,
  phoneNumber,
  title = 'SMS Doğrulama',
  subtitle = 'Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin',
  loading = false,
  error,
}: OTPModalProps) {
  const [otpError, setOtpError] = useState<string>('');
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleComplete = async (code: string) => {
    setOtpError('');
    setVerifying(true);
    try {
      await onVerify(code);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Doğrulama kodu hatalı. Lütfen tekrar deneyin.';
      setOtpError(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setOtpError('');
    try {
      await onResend();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Kod gönderilemedi. Lütfen tekrar deneyin.';
      setOtpError(errorMsg);
    }
  };

  return (
    <div className="otp-modal-overlay" onClick={onClose}>
      <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="otp-modal-header">
          <h2 className="otp-modal-title">{title}</h2>
          <p className="otp-modal-subtitle">{subtitle}</p>
        </div>

        <div className="otp-modal-body">
          {phoneNumber && (
            <div className="otp-phone-display">
              Kod <strong>{phoneNumber.slice(-4)}</strong> sonlu telefon numaranıza gönderildi
            </div>
          )}

          <OTPInput
            onComplete={handleComplete}
            onResend={handleResend}
            error={otpError || error}
            disabled={verifying || loading}
            resendCooldown={60}
          />

          {verifying && (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
              Doğrulanıyor...
            </div>
          )}
        </div>

        <div className="otp-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="musteri-btn musteri-btn-outline"
            disabled={verifying || loading}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

