'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';
import Link from 'next/link';

export default function AdminPanel() {
  const [toast, setToast] = useState<{ msg: string; type: string; show: boolean }>({ msg: '', type: '', show: false });
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [tmdbId, setTmdbId] = useState('');
  const [mediaType, setMediaType] = useState('movie');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isKids, setIsKids] = useState(false);
  const [tvSeasons, setTvSeasons] = useState(1);
  const [liveTitle, setLiveTitle] = useState('');
  const [livePoster, setLivePoster] = useState('');
  const [isLiveFree, setIsLiveFree] = useState(false);
  const [playerCode, setPlayerCode] = useState('');
  
  // Episodes state
  const [episodes, setEpisodes] = useState<{ s: number; e: number; code: string }[]>([]);
  const [showBulkGen, setShowBulkGen] = useState(false);
  const [bulkGen, setBulkGen] = useState({ season: 1, count: 10, url: '' });

  // Preview State
  const [preview, setPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const showToastMsg = (msg: string, type = 'info') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoadingItems(true);
    const { data, error } = await supabase
      .from('custom_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToastMsg('Erro ao carregar do banco', 'error');
      setIsLoadingItems(false);
      return;
    }

    if (data) {
      // Fetch details parallel
      const enrichedItems = await Promise.all(
        data.map(async (item) => {
          if (item.media_type === 'live') {
            let parsed: any = {};
            try { parsed = JSON.parse(item.player_code); } catch(e) {}
            return { ...item, details: { title: parsed.title || 'Canal', name: parsed.title || 'Canal', poster_path: parsed.poster } };
          }
          try {
            const details = await tmdb.getDetails(item.media_type as 'movie' | 'tv', item.tmdb_id);
            return { ...item, details };
          } catch(e) {
            return { ...item, details: null };
          }
        })
      );
      setItems(enrichedItems);
    }
    setIsLoadingItems(false);
  };

  const fetchTMDBPreview = async () => {
    if (mediaType === 'live') return;
    if (!tmdbId) return;

    setIsPreviewLoading(true);
    setPreview(null);
    try {
      const details = await tmdb.getDetails(mediaType as 'movie' | 'tv', parseInt(tmdbId));
      if (!details) throw new Error("Não encontrado");
      const title = details.title || details.name || 'Sem título';
      const year = (details.release_date || details.first_air_date || '').split('-')[0];
      const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://via.placeholder.com/60x90';
      const genres = (details.genres || []).map((g: any) => g.name).join(', ') || '—';
      const rating = details.vote_average ? details.vote_average.toFixed(1) : '—';
      
      setPreview({ title, year, poster, genres, rating, success: true });
    } catch (e) {
      setPreview({ error: `ID ${tmdbId} não encontrado no TMDB.`, success: false });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleMediaChange = (e: any) => {
    setMediaType(e.target.value);
    setPreview(null);
  };

  const addEpisodeRow = (s = 1, e = 1, code = '') => {
    setEpisodes(prev => [...prev, { s, e, code }]);
  };

  const removeEpisodeRow = (index: number) => {
    setEpisodes(prev => prev.filter((_, i) => i !== index));
  };

  const updateEpisodeRow = (index: number, field: string, value: any) => {
    setEpisodes(prev => {
      const nw = [...prev];
      nw[index] = { ...nw[index], [field]: value };
      return nw;
    });
  };

  const generateBulkEpisodes = () => {
    if (!bulkGen.url) {
      alert('Insira uma URL base!');
      return;
    }
    const newEps: { s: number; e: number; code: string }[] = [];
    for (let i = 1; i <= bulkGen.count; i++) {
        const finalUrl = bulkGen.url.replace(/\[EP\]/g, i.toString());
        newEps.push({ s: bulkGen.season, e: i, code: finalUrl });
    }
    setEpisodes(prev => [...prev, ...newEps]);
    setShowBulkGen(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let finalPlayerCode = '';
    let finalTmdbId = parseInt(tmdbId);

    if (mediaType === 'live') {
      if (!liveTitle || !playerCode.trim()) {
        alert('ERRO: Preencha o "Nome do Canal" e o "Código do Player"!');
        setIsSaving(false);
        return;
      }
      
      let processedCode = playerCode;
      if (processedCode.includes('televisao.tv') && !processedCode.includes('/iframes/') && !processedCode.includes('.m3u8')) {
          const match = processedCode.match(/televisao\.tv\/([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
              processedCode = `https://televisao.tv/iframes/${match[1]}.html`;
          }
      }

      finalTmdbId = finalTmdbId || Math.floor(Date.now() / 1000);
      finalPlayerCode = JSON.stringify({
          type: 'live',
          title: liveTitle,
          poster: livePoster,
          code: processedCode,
          is_free: isLiveFree
      });
    } else if (mediaType === 'tv') {
        if (episodes.length > 0) {
            finalPlayerCode = JSON.stringify(episodes);
        } else {
            const rawCode = playerCode.trim();
            if (rawCode.startsWith('[') && rawCode.endsWith(']')) {
                finalPlayerCode = rawCode;
            } else {
                finalPlayerCode = JSON.stringify({ type: 'embed', seasons: tvSeasons, code: playerCode });
            }
        }
    } else {
        finalPlayerCode = playerCode;
    }

    const payload = {
        tmdb_id: finalTmdbId,
        media_type: mediaType,
        player_code: finalPlayerCode,
        is_featured: isFeatured,
        is_kids: isKids
    };

    const { error } = await supabase
        .from('custom_content')
        .upsert(payload, { onConflict: 'tmdb_id' });

    if (error) {
        showToastMsg('Erro ao salvar: ' + error.message, 'error');
    } else {
        showToastMsg('Conteúdo salvo com sucesso!', 'success');
        resetForm();
        loadItems();
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setTmdbId('');
    setMediaType('movie');
    setIsFeatured(false);
    setIsKids(false);
    setTvSeasons(1);
    setLiveTitle('');
    setLivePoster('');
    setIsLiveFree(false);
    setPlayerCode('');
    setEpisodes([]);
    setPreview(null);
    setEditId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editItem = (item: any) => {
    resetForm();
    setEditId(item.id);
    setTmdbId(item.tmdb_id.toString());
    setMediaType(item.media_type);
    setIsFeatured(item.is_featured);
    setIsKids(item.is_kids);
    
    if (item.media_type === 'tv') {
        try {
            const parsed = JSON.parse(item.player_code);
            if (Array.isArray(parsed)) {
                setEpisodes(parsed);
                setPlayerCode('');
            } else if (parsed && typeof parsed === 'object' && parsed.type === 'embed') {
                setPlayerCode(parsed.code || '');
                setTvSeasons(parsed.seasons || 1);
            } else {
                setPlayerCode(item.player_code);
            }
        } catch (e) {
            setPlayerCode(item.player_code);
        }
    } else if (item.media_type === 'live') {
        try {
            const parsed = JSON.parse(item.player_code);
            setPlayerCode(parsed.code || '');
            setLiveTitle(parsed.title || '');
            setLivePoster(parsed.poster || '');
            setIsLiveFree(parsed.is_free === true);
        } catch(e) {
            setPlayerCode(item.player_code);
        }
    } else {
        setPlayerCode(item.player_code);
    }

    if (item.media_type !== 'live') {
      setTimeout(() => {
        document.getElementById('tmdb-sync-btn')?.click();
      }, 500);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Deseja remover este conteúdo?")) return;
    const { error } = await supabase.from('custom_content').delete().eq('id', id);
    if (!error) {
       setItems(prev => prev.filter(i => i.id !== id));
       selectedIds.delete(id);
       setSelectedIds(new Set(selectedIds));
       showToastMsg('Conteúdo removido.', 'success');
    }
  };

  const toggleSelect = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const bulkUpdate = async (payload: any) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    
    await Promise.all(ids.map(id => supabase.from('custom_content').update(payload).eq('id', id)));
    
    setItems(prev => prev.map(item => ids.includes(item.id) ? { ...item, ...payload } : item));
    setSelectedIds(new Set());
    showToastMsg(`Atualizados ${ids.length} itens.`, 'success');
  };

  const bulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.size} item(s)?`)) return;
    const ids = Array.from(selectedIds);
    await supabase.from('custom_content').delete().in('id', ids);
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
    setSelectedIds(new Set());
    showToastMsg('Itens excluídos.', 'success');
  };

  const filteredItems = items.filter(item => {
    const title = (item.details?.title || item.details?.name || `ID: ${item.tmdb_id}`).toLowerCase();
    const matchesSearch = !searchQuery || title.includes(searchQuery.toLowerCase()) || item.tmdb_id.toString().includes(searchQuery);
    
    let matchesFilter = true;
    if (activeFilter === 'movie') matchesFilter = item.media_type === 'movie';
    else if (activeFilter === 'tv') matchesFilter = item.media_type === 'tv';
    else if (activeFilter === 'live') matchesFilter = item.media_type === 'live';
    else if (activeFilter === 'kids') matchesFilter = !!item.is_kids;
    else if (activeFilter === 'featured') matchesFilter = !!item.is_featured;

    return matchesSearch && matchesFilter;
  });

  const statsCount = {
    movies: items.filter(i => i.media_type === 'movie').length,
    series: items.filter(i => i.media_type === 'tv').length,
    kids: items.filter(i => i.is_kids).length
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style dangerouslySetInnerHTML={{__html: `
        .admin-toast {
            position: fixed; bottom: 2rem; right: 2rem; padding: 0.9rem 1.4rem; border-radius: 12px;
            font-size: 0.95rem; font-weight: 600; color: white; z-index: 9999;
            opacity: 0; transform: translateY(20px); transition: all 0.35s ease; pointer-events: none;
            backdrop-filter: blur(20px); box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        .admin-toast.show { opacity: 1; transform: translateY(0); }
        .admin-toast.success { background: rgba(0,180,80,0.85); border: 1px solid rgba(0,255,100,0.3); }
        .admin-toast.error   { background: rgba(239,35,60,0.85); border: 1px solid rgba(255,80,80,0.3); }
        .admin-toast.info    { background: rgba(50,50,70,0.9); border: 1px solid rgba(255,255,255,0.1); }
        .filter-chip {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc;
            padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.82rem; font-weight: 600;
            display: inline-flex; items: center; gap: 6px; transition: all 0.2s ease-in-out;
        }
        .filter-chip:hover { background: rgba(255,255,255,0.1); }
        .filter-chip.active { background: rgba(0,102,255,0.15); border-color: #0066FF; color: white; }
        .form-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 1rem; color: white; outline: none; }
        .form-input:focus { border-color: #0066FF; }
        .admin-card { background: rgba(20,20,25,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 2.5rem; margin-bottom: 2rem; }
      `}} />

      <div className={`admin-toast ${toast.show ? 'show' : ''} ${toast.type}`}>
        {toast.msg}
      </div>

      <div className="max-w-[1000px] mx-auto pt-10 pb-32 px-4 selection:bg-blue-500/30">
        <h1 className="text-4xl font-bold mb-8">Painel de Controle Starmoon</h1>

        {/* Formulário */}
        <div className="admin-card">
            <h3 className="text-xl font-bold mb-2">{editId ? 'Editando Conteúdo' : 'Adicionar / Editar Conteúdo'}</h3>
            <p className="text-zinc-500 mb-8 text-sm">Insira o ID do TMDB para puxar os dados e configurar o player.</p>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-400 mb-2">ID do TMDB</label>
                        <div className="flex gap-2">
                            <input type="number" value={tmdbId} onChange={e => setTmdbId(e.target.value)} className="form-input" placeholder="Ex: 66732" />
                            <button type="button" id="tmdb-sync-btn" onClick={fetchTMDBPreview} className="px-6 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                                <i className={`fa-solid fa-sync ${isPreviewLoading ? 'fa-spin' : ''}`}></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-400 mb-2">Tipo de Mídia</label>
                        <select value={mediaType} onChange={handleMediaChange} className="form-input appearance-none">
                            <option value="movie">Filme</option>
                            <option value="tv">Série</option>
                            <option value="live">TV Ao Vivo (Canal)</option>
                        </select>
                    </div>
                </div>

                {/* Preview */}
                {preview && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                        {preview.success ? (
                            <>
                                <img src={preview.poster} className="w-16 h-24 object-cover rounded-lg border border-white/10" alt="Poster" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg m-0">{preview.title}</h4>
                                    <p className="text-xs text-zinc-500 m-0">{preview.year} • ⭐ {preview.rating} • {preview.genres}</p>
                                </div>
                                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold border border-blue-500/50">✓ Encontrado</span>
                            </>
                        ) : (
                            <p className="text-red-500 m-0 w-full text-center"><i className="fa-solid fa-circle-xmark mr-2"></i>{preview.error}</p>
                        )}
                    </div>
                )}

                {/* Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40 cursor-pointer hover:bg-red-500/20 transition-colors">
                        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-5 h-5 accent-red-600" />
                        <span className="font-medium text-red-100">Exibir no Banner Principal (Hero)?</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/40 cursor-pointer hover:bg-sky-500/20 transition-colors">
                        <input type="checkbox" checked={isKids} onChange={e => setIsKids(e.target.checked)} className="w-5 h-5 accent-sky-500" />
                        <span className="font-medium text-sky-100"><i className="fa-solid fa-shapes text-sky-400 mr-2"></i>É Conteúdo Kids (Desenhos)?</span>
                    </label>
                </div>

                {/* Conditional Fields */}
                {mediaType === 'tv' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-zinc-400">Quantidade de Temporadas (Embed Único)</label>
                        <input type="number" value={tvSeasons} onChange={e => setTvSeasons(parseInt(e.target.value))} className="form-input" min="1" placeholder="Ex: 5" />
                    </div>
                )}

                {mediaType === 'live' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-400 mb-2">Nome do Canal</label>
                                <input type="text" value={liveTitle} onChange={e => setLiveTitle(e.target.value)} className="form-input" placeholder="Ex: Globo HD" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-zinc-400 mb-2">Link da Logo / Imagem</label>
                                <input type="url" value={livePoster} onChange={e => setLivePoster(e.target.value)} className="form-input" placeholder="https://..." />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/40 cursor-pointer">
                            <input type="checkbox" checked={isLiveFree} onChange={e => setIsLiveFree(e.target.checked)} className="w-5 h-5 accent-green-600" />
                            <span className="font-medium text-green-400"><i className="fa-solid fa-unlock mr-2"></i>Canal Gratuito (sem assinatura)</span>
                        </label>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-400">Código do Player (HTML/Iframe/URL)</label>
                    <textarea value={playerCode} onChange={e => setPlayerCode(e.target.value)} className="form-input h-32 resize-y" placeholder="Cole aqui o <iframe> ou o link do vídeo..."></textarea>
                </div>

                {mediaType === 'tv' && (
                    <div className="border border-white/10 rounded-2xl p-6 bg-white/5 space-y-6">
                        <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                            <h4 className="font-bold m-0"><i className="fa-solid fa-list-ol mr-2"></i>Gerenciar Episódios Detalhados</h4>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowBulkGen(!showBulkGen)} className="px-4 py-2 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg text-sm font-bold"><i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Gerar Temp.</button>
                                <button type="button" onClick={() => addEpisodeRow(1, 1, '')} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-bold"><i className="fa-solid fa-plus mr-2"></i>Add</button>
                            </div>
                        </div>

                        {showBulkGen && (
                            <div className="p-4 bg-sky-500/5 border border-sky-500/30 border-dashed rounded-xl space-y-4">
                                <h5 className="font-bold m-0">Gerador em Massa</h5>
                                <div className="flex gap-2 items-center">
                                    <input type="number" placeholder="Temp" value={bulkGen.season} onChange={e => setBulkGen(prev=>({...prev, season: parseInt(e.target.value)}))} className="form-input py-2 px-3 w-20" />
                                    <input type="number" placeholder="Qtd" value={bulkGen.count} onChange={e => setBulkGen(prev=>({...prev, count: parseInt(e.target.value)}))} className="form-input py-2 px-3 w-20" />
                                    <input type="text" placeholder="URL Base (user [EP] para numero)" value={bulkGen.url} onChange={e => setBulkGen(prev=>({...prev, url: e.target.value}))} className="form-input py-2 px-3 flex-1" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={generateBulkEpisodes} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-bold">Gerar Episódios</button>
                                </div>
                            </div>
                        )}

                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                            {episodes.map((ep, idx) => (
                                <div key={idx} className="flex gap-2 bg-black/30 p-2 rounded-lg border border-white/5 items-center">
                                    <input type="number" value={ep.s} onChange={e => updateEpisodeRow(idx, 's', parseInt(e.target.value))} className="form-input w-16 px-2 py-1 h-10" />
                                    <input type="number" value={ep.e} onChange={e => updateEpisodeRow(idx, 'e', parseInt(e.target.value))} className="form-input w-16 px-2 py-1 h-10" />
                                    <textarea value={ep.code} onChange={e => updateEpisodeRow(idx, 'code', e.target.value)} className="form-input flex-1 px-3 py-2 h-10 resize-none overflow-hidden hover:bg-white/10" placeholder="URL ou Iframe" />
                                    <button type="button" onClick={() => removeEpisodeRow(idx)} className="text-red-500 w-10 h-10 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><i className="fa-solid fa-trash"></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <button type="submit" disabled={isSaving} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>} 
                        {isSaving ? 'Salvando...' : 'Salvar Conteúdo'}
                    </button>
                    {editId && (
                        <button type="button" onClick={resetForm} className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-colors">
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                <i className="fa-solid fa-film text-2xl text-white/30 mb-2"></i>
                <h3 className="text-4xl font-bold">{statsCount.movies}</h3>
                <span className="text-zinc-400 font-medium">Filmes</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                <i className="fa-solid fa-tv text-2xl text-white/30 mb-2"></i>
                <h3 className="text-4xl font-bold">{statsCount.series}</h3>
                <span className="text-zinc-400 font-medium">Séries</span>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-sky-500/5">
                <i className="fa-solid fa-shapes text-2xl text-sky-400 mb-2"></i>
                <h3 className="text-4xl font-bold text-sky-400">{statsCount.kids}</h3>
                <span className="text-sky-400 font-medium">Infantis</span>
            </div>
        </div>

        {/* Lista e Filtros */}
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold">Conteúdos Cadastrados</h3>
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors mt-1">
                      <input type="checkbox" onChange={e => selectAll(e.target.checked)} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} className="w-4 h-4 rounded border-zinc-600 bg-zinc-800" />
                      Selecionar visíveis
                  </label>
               </div>
               <div className="relative w-full md:w-[350px]">
                   <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                   <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Pesquisar por Título ou ID..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-red-500 outline-none" />
               </div>
            </div>

            {/* Painel Bulk */}
            {selectedIds.size > 0 && (
                <div className="sticky top-[80px] z-50 bg-black/90 backdrop-blur-xl border border-sky-500/40 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center gap-4 mb-6">
                    <span className="font-bold text-sky-400 min-w-[120px]"><i className="fa-solid fa-check-square mr-2"></i>{selectedIds.size} selecionados</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                        <button onClick={() => bulkUpdate({is_kids: true})} className="px-3 py-1.5 bg-sky-500/20 text-sky-400 rounded-lg text-xs font-bold border border-sky-500/30 hover:bg-sky-500/30"><i className="fa-solid fa-shapes mr-1"></i> Add Kids</button>
                        <button onClick={() => bulkUpdate({is_kids: false})} className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs font-bold hover:bg-white/20"><i className="fa-solid fa-xmark mr-1"></i> Remove Kids</button>
                        <button onClick={() => bulkUpdate({is_featured: true})} className="px-3 py-1.5 bg-red-500/20 text-red-500 rounded-lg text-xs font-bold border border-red-500/30 hover:bg-red-500/30"><i className="fa-solid fa-star mr-1"></i> Add Destaque</button>
                        <button onClick={() => bulkUpdate({is_featured: false})} className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs font-bold hover:bg-white/20"><i className="fa-regular fa-star mr-1"></i> Remove Destaque</button>
                        <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 ml-auto"><i className="fa-solid fa-trash mr-1"></i> Excluir Vários</button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveFilter('all')} className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}><i className="fa-solid fa-border-all"></i> Todos</button>
                <button onClick={() => setActiveFilter('movie')} className={`filter-chip ${activeFilter === 'movie' ? 'active' : ''}`}><i className="fa-solid fa-film"></i> Filmes</button>
                <button onClick={() => setActiveFilter('tv')} className={`filter-chip ${activeFilter === 'tv' ? 'active' : ''}`}><i className="fa-solid fa-tv"></i> Séries</button>
                <button onClick={() => setActiveFilter('live')} className={`filter-chip ${activeFilter === 'live' ? 'active' : ''}`}><i className="fa-solid fa-tower-broadcast"></i> Ao Vivo</button>
                <button onClick={() => setActiveFilter('kids')} className={`filter-chip ${activeFilter === 'kids' ? 'active' : ''}`} style={activeFilter !== 'kids' ? {borderColor:'rgba(135,206,235,0.4)', color:'#87CEEB'} : {backgroundColor: 'rgba(135,206,235,0.2)'}}><i className="fa-solid fa-shapes"></i> Kids</button>
                <button onClick={() => setActiveFilter('featured')} className={`filter-chip ${activeFilter === 'featured' ? 'active' : ''}`} style={activeFilter !== 'featured' ? {borderColor:'rgba(0,102,255,0.4)', color:'#0066FF'} : {backgroundColor: 'rgba(0,102,255,0.2)'}}><i className="fa-solid fa-star"></i> Destaques</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                {isLoadingItems && <p className="text-zinc-500 col-span-full text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Carregando...</p>}
                {!isLoadingItems && filteredItems.length === 0 && <p className="text-zinc-500 col-span-full text-center py-10">Nenhum título encontrado.</p>}
                
                {filteredItems.map(item => {
                    const title = item.details?.title || item.details?.name || `ID: ${item.tmdb_id}`;
                    const year = (item.details?.release_date || item.details?.first_air_date || '').split('-')[0];
                    const poster = item.media_type === 'live' ? item.details?.poster_path : (item.details?.poster_path ? `https://image.tmdb.org/t/p/w500${item.details.poster_path}` : 'https://via.placeholder.com/200x300');
                    const isSelected = selectedIds.has(item.id);

                    return (
                        <div key={item.id} className={`relative flex gap-4 p-3 rounded-2xl bg-white/5 border transition-all ${isSelected ? 'border-sky-500 bg-sky-500/5' : (item.is_featured ? 'border-red-500/40 bg-red-500/5' : 'border-white/10')}`}>
                            <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e.target.checked)} className="absolute top-2 left-2 z-10 w-4 h-4 accent-sky-500 cursor-pointer" />
                            <img src={poster} alt="Poster" className="w-[70px] h-[100px] object-cover rounded-xl bg-black/50 shrink-0" />
                            <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                                <div>
                                    <h4 className="font-bold text-sm leading-tight truncate">{title}</h4>
                                    <div className="flex flex-wrap gap-1.5 items-center mt-2">
                                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 uppercase">{item.media_type}</span>
                                        {year && <span className="text-[10px] text-zinc-500">{year}</span>}
                                        {item.is_featured && <span className="text-red-500 text-xs">★</span>}
                                        {item.is_kids && <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">KIDS</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => editItem(item)} className="flex-1 bg-white/10 hover:bg-sky-500 hover:border-sky-500 text-white text-xs font-bold py-1.5 rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-1"><i className="fa-solid fa-pen"></i> Editar</button>
                                    <button onClick={() => deleteItem(item.id)} className="w-8 flex justify-center items-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><i className="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </>
  );
}
