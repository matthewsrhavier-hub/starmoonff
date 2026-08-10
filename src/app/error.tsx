'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center px-4 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-headline text-white">Algo deu errado</h1>
        <p className="text-[var(--text-secondary)] mt-3">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="btn-primary mt-8"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
