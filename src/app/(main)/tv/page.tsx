'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchEmbedTVChannels, getEmbedPlayerUrl, clearEmbedTVCache } from '@/services/embedtv';
import { cn } from '@/lib/utils';
import { Search, Heart, X, Tv, Play, ShieldCheck, Maximize } from 'lucide-react';
import {
  initTVService,
  getFavoriteIds,
  toggleFavorite as toggleFavoriteService,
  addToHistory,
  loadLocalFavorites,
  loadLocalHistory,
} from '@/services/tvProgress';
import { useAuth } from '@/context/AuthContext';
import type { Channel } from '@/types/tv';

type TabType = 'channels' | 'favorites' | 'recent';

export default function TVPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <TVContent />
    </Suspense>
  );
}

function TVContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [, forceUpdate] = useState({});

  const selectChannel = (channel: Channel | null) => {
    setIsPlayerReady(false);
    if (channel) addToHistory(channel);
    setSelectedChannel(channel);
  };

  useEffect(() => {
    initTVService();
    loadLocalFavorites();
    loadLocalHistory();
    setFavorites(getFavoriteIds());
    loadChannels();
  }, []);

  const handleToggleFavorite = async (channel: Channel) => {
    await toggleFavoriteService(channel);
    setFavorites(getFavoriteIds());
    forceUpdate({});
  };

  // PROTEÇÃO CONTRA INSPEÇÃO (F12, CTRL+U, CLIQUE DIREITO)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueia F12, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+S
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83))
      ) {
        e.preventDefault();
        alert('Ops! Esta funcionalidade não é permitida :( ');
        window.location.href = 'about:blank';
        return false;
      }
    };

    // Detectar DevTools Aberto (Método do debugger infinito)
    const detectDevTools = () => {
      const start = Date.now();
      debugger;
      const end = Date.now();
      if (end - start > 100) {
        document.body.innerHTML = `
          <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000; color:#fff; font-family:sans-serif; text-align:center; padding:20px;">
            <h1 style="color:#ff0000; font-size:60px;">OPS!</h1>
            <p style="font-size:20px; font-weight:bold;">Você está tentando fazer algo que não é permitido :(</p>
            <p style="color:#666; margin-top:20px;">O sistema de segurança detectou uma tentativa de inspeção.</p>
            <button onclick="window.location.reload()" style="margin-top:30px; padding:15px 40px; background:#22c55e; color:#fff; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">Voltar ao Início</button>
          </div>
        `;
        window.location.reload();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    const interval = setInterval(detectDevTools, 1000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const loadChannels = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (forceRefresh) clearEmbedTVCache();
      const data = await fetchEmbedTVChannels();
      setChannels(data.channels);
      setCategories(['Todos', ...data.categories]);

      if (initialId) {
        const found = data.channels.find(ch => ch.id === initialId);
        if (found) {
          selectChannel(found);
          return;
        }
      }

      const bbbChannel = data.channels.find(ch => 
        ch.name.toLowerCase().includes('bbb') || 
        ch.name.toLowerCase().includes('big brother')
      );
      
      if (bbbChannel) {
        selectChannel(bbbChannel);
      } else if (data.channels.length > 0 && !selectedChannel) {
        selectChannel(data.channels[0]);
      }
    } catch (err) {
      setError('Erro ao carregar canais');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (activeTab === 'favorites') {
      const favIds = getFavoriteIds();
      result = result.filter(ch => favIds.includes(ch.id));
    }
    if (searchQuery) {
      result = result.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeCategory !== 'Todos' && activeTab === 'channels') {
      result = result.filter(ch => ch.category === activeCategory);
    }
    return result;
  }, [channels, searchQuery, activeCategory, activeTab, favorites]);

  return (
    <div className="min-h-screen streaming-shell">
      <div className={cn(
        "flex flex-col md:flex-row md:h-screen md:pt-[72px] overflow-x-hidden",
        !user && "justify-center items-center"
      )}>
        
        {/* CABEÇALHO FIXO MOBILE (PLAYER + FILTROS) */}
        {(
          <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-black border-b border-white/5 shadow-2xl">
            {/* Player */}
            <div className="w-full aspect-video bg-black">
              {user ? (
                selectedChannel ? (
                  <TVPlayerInline
                    channel={selectedChannel}
                    isPlayerReady={isPlayerReady}
                    onClose={() => selectChannel(null)}
                    onPlayerReady={() => setIsPlayerReady(true)}
                    autoPlay={true}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-800 animate-pulse bg-zinc-950">
                    <Tv size={48} strokeWidth={1} />
                    <p className="mt-2 font-black uppercase text-[10px] tracking-widest">Selecione um canal</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-zinc-950">
                   <p className="text-white font-black text-[10px] uppercase tracking-tighter mb-3">Acesso VIP Necessário</p>
                   <Link href="/login" className="px-6 py-2 bg-white text-[#040714] rounded-full text-[9px] font-bold uppercase tracking-widest">Logar</Link>
                </div>
              )}
            </div>

            {/* Filtros Mobile (Sem Espaço) */}
            <div className="p-3 space-y-3 bg-[var(--bg-secondary)]">
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar canal..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white font-bold text-[10px]" 
                  />
               </div>
               <div className="flex bg-white/5 rounded-xl p-1">
                  <button onClick={() => setActiveTab('channels')} className={cn('flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all', activeTab === 'channels' ? 'bg-white text-[#040714]' : 'text-zinc-500')}>Canais</button>
                  <button onClick={() => setActiveTab('favorites')} className={cn('flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all', activeTab === 'favorites' ? 'bg-white text-[#040714]' : 'text-zinc-500')}>Favoritos</button>
               </div>
            </div>
          </div>
        )}

        {/* PLAYER PC */}
        <div className="hidden md:flex flex-1 bg-black relative flex-col items-center justify-start border-r border-white/5 h-full overflow-hidden">
          {user ? (
            <div className="w-full h-full">
              {selectedChannel ? (
                <TVPlayerInline
                  channel={selectedChannel}
                  isPlayerReady={isPlayerReady}
                  onClose={() => selectChannel(null)}
                  onPlayerReady={() => setIsPlayerReady(true)}
                  autoPlay={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-700 animate-pulse">
                   <Tv size={80} strokeWidth={1} />
                   <p className="mt-4 font-black uppercase text-sm tracking-widest">Selecione um canal para começar</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center gap-8 animate-in fade-in duration-700 h-full">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                  <Tv size={48} className="text-[var(--accent-teal)]" />
               </div>
               <div className="space-y-3">
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Acesso VIP Necessário</h2>
                  <p className="text-zinc-400 text-base max-w-md mx-auto font-medium leading-relaxed">
                    Assista a milhares de canais ao vivo, esportes e eventos exclusivos.
                  </p>
               </div>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <a href="/login" className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl hover:bg-zinc-200 active:scale-95 text-center">Fazer Login</a>
                  <a href="/plans" className="px-12 py-5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-full transition-all active:scale-95 text-center">Assinar Agora</a>
               </div>
            </div>
          )}
        </div>

        {/* LISTA DE CANAIS (PC + MOBILE SCROLL) */}
        {(
          <div className="flex-none w-full md:w-[400px] lg:w-[450px] bg-[var(--bg-secondary)] flex flex-col h-full border-l border-white/5 overflow-hidden">
            {/* Espaçador Mobile para compensar o header fixo (16:9 player + filters ~115px) */}
            <div className="md:hidden h-[calc(56.25vw+115px)]" />
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
               {isLoading ? (
                  <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
               ) : (
                  <div className="grid grid-cols-2 gap-3 pb-24 md:pb-4">
                    {filteredChannels.map(channel => (
                      <button 
                        key={channel.id}
                        onClick={() => { selectChannel(channel); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={cn(
                          "group/row flex flex-col items-center gap-3 p-3 rounded-2xl transition-all border border-transparent aspect-square justify-center",
                          selectedChannel?.id === channel.id ? "bg-white/10 border-white/20" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="w-full aspect-square bg-black rounded-xl p-4 flex items-center justify-center border border-white/5 overflow-hidden">
                          {channel.logo ? (
                             <img src={channel.logo} alt="" className={cn("max-w-full max-h-full object-contain filter brightness-0 invert", selectedChannel?.id === channel.id ? "opacity-100" : "opacity-40 group-hover/row:opacity-100")} />
                          ) : <Tv size={24} className="text-zinc-700" />}
                        </div>
                        <p className={cn("text-[11px] md:text-[13px] font-bold uppercase tracking-tighter truncate w-full text-center", selectedChannel?.id === channel.id ? "text-white" : "text-zinc-100")}>
                          {channel.name}
                        </p>
                      </button>
                    ))}
                  </div>
               )}
            </div>

            {/* Barra de Filtros PC (Bottom) */}
            <div className="hidden md:flex flex-col p-4 space-y-4 border-t border-white/5 bg-[var(--bg-primary)]/80 backdrop-blur-md">
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white font-bold text-[10px]" />
                </div>
                <div className="flex bg-white/5 rounded-2xl p-1">
                  <button onClick={() => setActiveTab('channels')} className={cn('flex-1 py-2 text-[9px] font-bold rounded-xl transition-all', activeTab === 'channels' ? 'bg-white text-[#040714]' : 'text-zinc-500')}>Canais</button>
                  <button onClick={() => setActiveTab('favorites')} className={cn('flex-1 py-2 text-[9px] font-bold rounded-xl transition-all', activeTab === 'favorites' ? 'bg-white text-[#040714]' : 'text-zinc-500')}>Favoritos</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TVPlayerInline({ channel, isPlayerReady, onClose, onPlayerReady, autoPlay = true }: { channel: Channel; isPlayerReady: boolean; onClose: () => void; onPlayerReady: () => void; autoPlay?: boolean; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(autoPlay);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden group/player">
      {hasStarted && (
        <>
          <iframe
            src={`${getEmbedPlayerUrl(channel.id)}&autoplay=1&mute=0`}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
            onLoad={() => setTimeout(onPlayerReady, 1000)}
          />
          {/* CAMADA DE PROTEÇÃO CONTRA CLIQUES (SHIELD) */}
          <div className="absolute inset-0 z-50 cursor-default bg-transparent" onClick={(e) => e.preventDefault()} />
        </>
      )}
      {hasStarted && !isPlayerReady && (
        <div className="absolute inset-0 z-[25] flex items-center justify-center bg-black">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
