'use client';

/** Header fixo com título Perfil. */
export function ProfileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none md:left-[var(--sidebar-width)]">
      <div className="h-14 md:h-[4.5rem] px-5 sm:px-6 w-full max-w-[420px] mx-auto lg:max-w-[1100px] lg:px-8 flex items-center">
        <h1 className="text-[1.35rem] md:text-[1.75rem] font-bold tracking-tight text-white pointer-events-auto">
          Perfil
        </h1>
      </div>
    </header>
  );
}
