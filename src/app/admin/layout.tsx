'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Film,
  Tv,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  BarChart3,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { LogoLink } from '@/components/layout/Logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Restrição de admin desativada temporariamente para permitir acesso
  useEffect(() => {
    // Acesso livre liberado
  }, []);

  // Exibe a tela admin direto sem travar no loading de role
  const mockUser = user || { name: 'Admin', email: 'admin@filmzone.com', isAdmin: true };

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { label: 'Filmes', icon: <Film size={20} />, href: '/admin/movies' },
    { label: 'Séries', icon: <Tv size={20} />, href: '/admin/series' },
    { label: 'Usuários', icon: <Users size={20} />, href: '/admin/users' },
    { label: 'Configurações', icon: <Settings size={20} />, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 bg-[#121212] border-r border-white/5 transition-all duration-300 transform",
          isSidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-20 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between gap-2">
            <div className={cn('flex items-center gap-2 min-w-0', !isSidebarOpen && 'md:hidden')}>
              <LogoLink size="md" showShadow={false} />
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider shrink-0">
                Admin
              </span>
            </div>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 mt-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                    isActive 
                      ? "bg-red-600/10 text-red-500" 
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <div className={cn("transition-transform group-active:scale-90", isActive && "text-red-500")}>
                    {item.icon}
                  </div>
                  {isSidebarOpen && <span>{item.label}</span>}
                  {isActive && isSidebarOpen && <ChevronRight size={14} className="ml-auto opacity-50" />}
                </Link>
              );
            })}
          </nav>

          {/* User Info Bottom */}
          <div className="p-4 border-t border-white/5 space-y-4">
               {isSidebarOpen && (
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                      {mockUser.name?.[0] || mockUser.email?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold truncate">{mockUser.name || 'Admin'}</p>
                       <p className="text-xs text-zinc-500 truncate capitalize">{mockUser.isAdmin ? 'Administrador' : 'Membro'}</p>
                    </div>
                 </div>
               )}
               <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-all text-sm font-medium"
               >
                 <LogOut size={20} />
                 {isSidebarOpen && <span>Sair do Painel</span>}
               </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 focus-within:border-red-500/50 transition-all w-80">
                 <Search size={18} className="text-zinc-500" />
                 <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="bg-transparent border-none outline-none text-sm w-full"
                 />
              </div>
           </div>

           <div className="flex items-center gap-4">
              <Link href="/admin/content/add" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95">
                 <PlusCircle size={18} />
                 <span className="hidden sm:inline">Botão Rápido</span>
              </Link>
           </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           {children}
        </div>
      </main>
    </div>
  );
}
