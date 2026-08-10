import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center px-4 max-w-md">
        <h1 className="text-[clamp(5rem,15vw,9rem)] font-bold disney-gradient-text leading-none">404</h1>
        <h2 className="text-headline text-white mt-4">
          Página não encontrada
        </h2>
        <p className="text-[var(--text-secondary)] mt-3">
          A página que você procura não existe ou foi movida.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
