'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { tmdb } from '@/services/tmdb';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Plus,
  Film,
  Tv,
  X,
  Play,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Content, ContentDetails } from '@/types/content';

export default function AddContentPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Content[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [embedUrl, setEmbedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Modo de Edição
  const editType = searchParams.get('edit');
  const editId = searchParams.get('id');

  useEffect(() => {
    if (editType && editId) {
      loadForEdit(editType, editId);
    }
  }, [editType, editId]);

  const loadForEdit = async (type: string, tmdbId: string) => {
    setIsSearching(true);
    try {
      const table = type === 'tv' ? 'series' : 'movies';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('tmdb_id', tmdbId)
        .maybeSingle();

      if (data) {
        setSelectedContent(data);
        setEmbedUrl(data.embed_url || '');
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading for edit:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      let directResults: Content[] = [];
      const trimmedQuery = query.trim();
      const isNumber = /^\d+$/.test(trimmedQuery);
      
      // Se for um número, tentar buscar diretamente pelo ID primeiro
      if (isNumber) {
        const idStr = parseInt(trimmedQuery, 10);
        try {
          // Tentar filme
          const movie = await tmdb.getDetails('movie', idStr);
          if (movie && movie.id) {
            directResults.push({ ...movie, media_type: 'movie' } as any);
          }
        } catch (e) { /* ignore se não for filme */ }
        
        try {
          // Tentar série
          const tv = await tmdb.getDetails('tv', idStr);
          if (tv && tv.id) {
            directResults.push({ ...tv, media_type: 'tv' } as any);
          }
        } catch (e) { /* ignore se não for série */ }
      }

      // Buscar por texto padrão
      const response = await tmdb.search(query);
      const filteredResults = (response.results || []).filter(
        r => r.media_type === 'movie' || r.media_type === 'tv'
      ) as Content[];
      
      // Combinar resultados (ID direto no topo)
      const combined = [...directResults, ...filteredResults];
      
      // Remover duplicados
      const unique = combined.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id && t.media_type === v.media_type) === i
      );

      setResults(unique);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (content: Content) => {
    try {
      const details = await tmdb.getDetails(content.media_type as any, content.id);
      setSelectedContent(details);
      setEmbedUrl(''); // Reset
      setSaveStatus('idle');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Fetch details error:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedContent) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Determinar o media_type corretamente
      const isTV = !!(selectedContent.first_air_date || selectedContent.name);
      const mediaType = isTV ? 'tv' : 'movie';
      const tmdbId = Number(selectedContent.tmdb_id || selectedContent.id);

      // Salvar na tabela custom_content com player_code (iframe ou URL)
      const payload = {
        tmdb_id: tmdbId,
        media_type: mediaType,
        // player_code é o campo principal — o iframe embed ou URL do player
        player_code: embedUrl || '',
        // Campos auxiliares opcionais (para fallback/listagem no admin)
        title: selectedContent.title || selectedContent.name,
      };

      console.log('[Admin] Salvando em custom_content:', payload);

      const response = await fetch('/api/content/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Erro de rede: ${response.status}`);
      }

      setSaveStatus('success');
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error: any) {
      console.error('Detailed Save Error:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      alert(`Erro ao salvar: ${error?.message || 'Erro desconhecido'}`);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 rounded-full border border-red-600/20 mb-3">
              <TrendingUp size={14} className="text-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">NOVO CONTEÚDO</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight mb-2">Expanda o Universo</h1>
           <p className="text-zinc-500 max-w-sm">Pesquise filmes ou séries e adicione-os instantaneamente ao catálogo da Starmoon.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Nome do filme ou série..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/5 group-hover:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-red-600 transition-all font-medium pr-12 shadow-2xl"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
            {isSearching ? <Loader2 size={24} className="animate-spin text-red-500" /> : <Search size={24} />}
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {results.map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleSelect(item)}
            className="group cursor-pointer space-y-3 p-2 bg-[#121212] rounded-3xl border border-white/5 hover:border-red-600/30 transition-all hover:shadow-2xl"
          >
            <div className="aspect-[2/3] relative rounded-2xl overflow-hidden bg-zinc-800 shadow-lg">
              {item.poster_path ? (
                <img 
                  src={tmdb.getImageUrl(item.poster_path, 'w342')} 
                  alt={item.title || item.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                   <ImageIcon size={48} strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                 <div className="w-full h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-sm">
                    <Plus size={20} />
                 </div>
              </div>
            </div>
            <div className="px-2 pb-2">
              <h3 className="font-bold text-sm truncate group-hover:text-red-500 transition-colors">{item.title || item.name}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.media_type === 'movie' ? 'Filme' : 'Série'}</p>
            </div>
          </div>
        ))}
        
        {!isSearching && results.length === 0 && query && (
          <div className="col-span-full py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10 text-center">
             <AlertCircle size={48} className="mx-auto text-zinc-700 mb-4" />
             <h3 className="text-xl font-bold mb-2">Nenhum resultado encontrado</h3>
             <p className="text-zinc-500 max-w-sm mx-auto">Tente buscar por um título diferente ou em outro idioma (ex: inglês).</p>
          </div>
        )}
      </div>

      {/* Modal / Form Overlay */}
      {isModalOpen && selectedContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
           
           <div className="bg-[#121212] w-full max-w-4xl rounded-[40px] border border-white/10 shadow-3xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
              {/* Top Banner (Backdrop) */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                 {selectedContent.backdrop_path ? (
                    <img src={tmdb.getImageUrl(selectedContent.backdrop_path, 'original')} className="w-full h-full object-cover opacity-30" alt="" />
                 ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600/20 to-blue-600/10" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
                 <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-xl"
                 >
                   <X size={24} />
                 </button>
              </div>

              {/* Form Content */}
              <div className="px-8 pb-12 -mt-24 relative sm:flex gap-10">
                 {/* Left Profile */}
                 <div className="w-40 sm:w-56 flex-shrink-0 mx-auto sm:mx-0">
                    <div className="rounded-[28px] overflow-hidden shadow-2xl border border-white/10 mb-6 bg-zinc-800 aspect-[2/3]">
                       <img src={tmdb.getImageUrl(selectedContent.poster_path, 'w500')} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white/5 p-3 rounded-xl border border-white/5">
                          <span>TMDB ID</span>
                          <span className="text-zinc-200">{selectedContent.id}</span>
                       </div>
                       <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white/5 p-3 rounded-xl border border-white/5">
                          <span>Status</span>
                          <span className="text-green-500">Completo</span>
                       </div>
                    </div>
                 </div>

                 {/* Right Data */}
                 <div className="flex-1 mt-8 sm:mt-16 space-y-10">
                    <div className="space-y-2">
                       <h2 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none">{selectedContent.title || selectedContent.name}</h2>
                       <div className="flex flex-wrap items-center gap-3">
                          <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest">{selectedContent.release_date?.split('-')[0] || selectedContent.first_air_date?.split('-')[0]}</span>
                          <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">ADMIN READY</span>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                             <Play size={14} className="text-red-500" />
                             Embed URL (Link do Vídeo)
                          </label>
                          <div className="relative group/input">
                            <input 
                              type="text" 
                              placeholder="URL do iframe, mp4 ou m3u8..."
                              value={embedUrl}
                              onChange={(e) => setEmbedUrl(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 group-hover/input:border-white/10 focus:border-red-600 rounded-2xl px-6 py-4 outline-none transition-all font-medium"
                            />
                             <a 
                               href={`https://superflixapi.cv/${selectedContent.title ? 'filme' : 'serie'}/${selectedContent.id}`} 
                               target="_blank" 
                               className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-500" 
                               title="Ver Link Superflix"
                             >
                                <ExternalLink size={18} />
                             </a>
                          </div>
                       </div>
                       
                       <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 italic opacity-70">"{selectedContent.overview}"</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4">
                       <button 
                        onClick={handleSave}
                        disabled={isSaving || (!selectedContent.title && false)} // Simplificado
                        className={cn(
                          "flex-1 h-16 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl",
                          saveStatus === 'success' ? "bg-green-600 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
                          isSaving && "opacity-70 cursor-not-allowed"
                        )}
                       >
                         {isSaving ? (
                            <Loader2 className="animate-spin" size={24} />
                         ) : saveStatus === 'success' ? (
                            <>
                              <CheckCircle2 size={24} />
                              ADICIONADO COM SUCESSO!
                            </>
                         ) : (
                            <>
                              <Save size={20} />
                              SALVAR NO CATÁLOGO
                            </>
                         )}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
