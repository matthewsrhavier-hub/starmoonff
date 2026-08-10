'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { PwaRegister } from '@/components/PwaRegister';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <PwaRegister />
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
