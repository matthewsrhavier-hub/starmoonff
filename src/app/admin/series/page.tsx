'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';
import { 
  Tv, 
  Trash2, 
  ExternalLink, 
  PlusCircle, 
  Search, 
  Loader2, 
  MoreVertical, 
  Image as ImageIcon,
  Star,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setSeries(data || []);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta série?')) return;
    
    try {
      const { error } = await supabase.from('series').delete().eq('id', id);
      if (error) throw error;
      setSeries(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert('Erro ao excluir: ' + (error as any).message);
    }
  };

  const filteredSeries = series.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black flex items-center gap-3">
             <Tv className="text-purple-600" size={32} />
             Minhas Séries
           </h1>
           <p className="text-zinc-500 mt-1">Gerencie seu catálogo de séries e programas de TV.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                 type="text" 
                 placeholder="Buscar por título..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-purple-600 w-full sm:w-64 text-sm"
              />
           </div>
           <Link href="/admin/content/add" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-purple-600/10">
              <PlusCircle size={18} />
              Adicionar
           </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
           <Loader2 className="animate-spin text-purple-600" size={48} />
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="p-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
           <p className="text-zinc-500 mb-6 font-medium">Nenhuma série encontrada no seu banco de dados.</p>
           <Link href="/admin/content/add" className="text-purple-500 font-bold hover:underline">Vamos adicionar a primeira?</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map(item => (
            <div key={item.id} className="bg-[#121212] rounded-[32px] border border-white/5 overflow-hidden group hover:border-white/10 transition-all hover:shadow-2xl flex flex-col h-full">
               <div className="aspect-video relative overflow-hidden bg-zinc-800">
                  {item.backdrop_url || item.poster_url ? (
                    <img src={tmdb.getImageUrl(item.backdrop_url || item.poster_url, 'w500')} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-20">
                     <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl transition-all active:scale-90"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white border border-white/10">
                     <Layers size={10} strokeWidth={3} className="text-purple-500" />
                     SÉRIE TV
                  </div>
               </div>
               
               <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 truncate" title={item.title}>{item.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed opacity-80 mb-6 italic">"{item.overview || 'Sem descrição cadastrada.'}"</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                     <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-0.5 rounded-md">
                        <Star size={10} fill="currentColor" />
                        {item.rating?.toFixed(1) || '0.0'}
                     </div>
                     <Link href={`/watch/tv/${item.tmdb_id}`} target="_blank" className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <ExternalLink size={18} />
                     </Link>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
