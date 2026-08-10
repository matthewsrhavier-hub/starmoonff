export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="loading-spinner mx-auto" />
        <p className="text-[var(--text-secondary)] mt-4 text-sm">Carregando...</p>
      </div>
    </div>
  );
}
