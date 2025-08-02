// components/ui/sonner.tsx
'use client';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster 
      position="top-center" 
      richColors 
      closeButton 
      toastOptions={{
        style: {
          background: 'var(--yellow)',
          color: 'var(--black)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
      }}
      {...props} 
    />
  );
} 