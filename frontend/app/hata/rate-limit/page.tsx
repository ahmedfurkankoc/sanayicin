'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RateLimitError from '@/app/components/errors/RateLimitError';

function RateLimitContent() {
  const searchParams = useSearchParams();
  const retryAfter = searchParams.get('retry') 
    ? parseInt(searchParams.get('retry') || '60', 10) 
    : undefined;

  return <RateLimitError retryAfter={retryAfter} />;
}

export default function RateLimitPage() {
  return (
    <Suspense fallback={<RateLimitError retryAfter={undefined} />}>
      <RateLimitContent />
    </Suspense>
  );
}

