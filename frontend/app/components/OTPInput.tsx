'use client';

import React, { useRef, useEffect, useState } from 'react';
import { iconMapping } from '@/app/utils/iconMapping';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend?: () => void;
  resendCooldown?: number; // seconds
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 6,
  onComplete,
  onResend,
  resendCooldown = 60,
  error,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    // Sadece rakam kabul et
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 1) return; // Tek karakter

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Otomatik sonraki input'a geç
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    // Tüm alanlar doluysa callback çağır
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === length) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Backspace: önceki input'a geç ve temizle
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
    // Arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Son doldurulan input'a focus
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    setActiveIndex(nextIndex);

    // Tüm alanlar doluysa callback çağır
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === length) {
      onComplete(newOtp.join(''));
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
    inputRefs.current[index]?.select();
  };

  const handleResend = () => {
    if (cooldown > 0 || disabled) return;
    setCooldown(resendCooldown);
    setOtp(Array(length).fill(''));
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
    onResend?.();
  };

  return (
    <div className="otp-input-container">
      <div className="otp-input-wrapper">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={`otp-input-digit ${activeIndex === index ? 'active' : ''} ${error ? 'error' : ''}`}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <div className="otp-input-error">
          {React.createElement(iconMapping['alert-circle'], { size: 16 })}
          <span>{error}</span>
        </div>
      )}

      {onResend && (
        <div className="otp-input-resend">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || disabled}
            className="otp-resend-btn"
          >
            {cooldown > 0 ? `Tekrar gönder (${cooldown}s)` : 'Kodu tekrar gönder'}
          </button>
        </div>
      )}
    </div>
  );
}

