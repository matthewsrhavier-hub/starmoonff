'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';
import { 
  Film, 
  Trash2, 
  ExternalLink, 
  PlusCircle, 
  Search, 
  Loader2, 
  MoreVertical, 
  Image as ImageIcon,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setMovies(data || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este filme?')) return;
    
    try {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) throw error;
      setMovies(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      alert('Erro ao excluir: ' + (error as any).message);
    }
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black flex items-center gap-3">
             <Film className="text-red-600" size={32} />
             Meus Filmes
           </h1>
           <p className="text-zinc-500 mt-1">Gerencie seu acervo de filmes no catálogo.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                 type="text" 
                 placeholder="Filtrar por título..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-red-600 w-full sm:w-64 text-sm"
              />
           </div>
           <Link href="/admin/content/add" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-red-600/10">
              <PlusCircle size={18} />
              Adicionar
           </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
           <Loader2 className="animate-spin text-red-600" size={48} />
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="p-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
           <p className="text-zinc-500 mb-6 font-medium">Nenhum filme encontrado no seu banco de dados.</p>
           <Link href="/admin/content/add" className="text-red-500 font-bold hover:underline">Vamos adicionar o primeiro?</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map(movie => (
            <div key={movie.id} className="bg-[#121212] rounded-[32px] border border-white/5 overflow-hidden group hover:border-white/10 transition-all hover:shadow-2xl flex flex-col h-full">
               <div className="aspect-video relative overflow-hidden bg-zinc-800">
                  {movie.backdrop_url || movie.poster_url ? (
                    <img src={tmdb.getImageUrl(movie.backdrop_url || movie.poster_url, 'w500')} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-20">
                     <button 
                        onClick={() => handleDelete(movie.id)}
                        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl transition-all active:scale-90"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-yellow-500">
                     <Star size={10} fill="currentColor" />
                     {movie.rating?.toFixed(1) || '0.0'}
                  </div>
               </div>
               
               <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-2 truncate" title={movie.title}>{movie.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed opacity-80 mb-6 italic">"{movie.overview || 'Sem descrição'}"</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{new Date(movie.release_date).getFullYear() || 'N/A'}</span>
                     <Link href={`/watch/movie/${movie.tmdb_id}`} target="_blank" className="p-2 text-zinc-500 hover:text-white transition-colors">
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
