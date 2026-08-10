'use client';

import { 
  Settings, 
  ShieldAlert, 
  Globe, 
  Palette, 
  Bell, 
  Lock, 
  CloudRainIcon,
  Trash2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <div>
         <h1 className="text-3xl font-black flex items-center gap-3 font-outfit uppercase tracking-tighter">
           <Settings className="text-zinc-500" size={32} />
           Configurações Globais
         </h1>
         <p className="text-zinc-500 mt-1">Controle as preferências e políticas da plataforma Starmoon.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* General Config */}
         <div className="bg-[#121212] p-8 rounded-[40px] border border-white/5 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
               <Globe size={16} className="text-blue-500" />
               Informações do Site
            </h2>
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase ml-2">Nome da Plataforma</label>
                  <input type="text" defaultValue="Starmoon" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-medium" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase ml-2">Meta Descrição (SEO)</label>
                  <textarea defaultValue="Assista seus filmes e séries favoritos..." className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-red-600 transition-all font-medium h-32 resize-none" />
               </div>
            </div>
         </div>

         {/* Maintenance Mode */}
         <div className="bg-[#121212] p-8 rounded-[40px] border border-white/5 flex flex-col justify-between">
            <div className="space-y-6">
               <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-yellow-500" />
                  Modo de Segurança
               </h2>
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <p className="font-bold text-sm">Modo Manutenção</p>
                     <div className="w-12 h-6 bg-zinc-800 rounded-full relative cursor-pointer group">
                        <div className="w-4 h-4 bg-zinc-600 rounded-full absolute left-1 top-1 transition-all" />
                     </div>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed italic pr-12">Quando ativado, apenas administradores poderão acessar a plataforma principal.</p>
               </div>
            </div>

            <div className="pt-8 border-t border-white/5">
                <button className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-2">
                   <Trash2 size={14} />
                   Limpar Todos os Caches
                </button>
            </div>
         </div>

         {/* Visuals */}
         <div className="bg-[#121212] p-8 rounded-[40px] border border-white/5 space-y-6 col-span-1 md:col-span-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
               <Palette size={16} className="text-purple-500" />
               Estilo e Identidade
            </h2>
            <div className="flex flex-wrap gap-8">
               <div className="space-y-3">
                   <p className="text-xs font-bold text-zinc-600 uppercase">Cor Primária (Accent)</p>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 border-4 border-black/20" />
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 hover:scale-110 transition-transform cursor-pointer" />
                      <div className="w-12 h-12 rounded-2xl bg-purple-600 hover:scale-110 transition-transform cursor-pointer" />
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 hover:scale-110 transition-transform cursor-pointer" />
                   </div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-end gap-4">
         <button className="px-8 py-4 text-zinc-500 font-bold hover:text-white transition-colors uppercase tracking-widest text-xs">Descartar</button>
         <button 
          onClick={handleSave}
          className={cn(
            "px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95",
            success ? "bg-green-600 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20"
          )}
         >
            {isUpdating ? <RefreshCw className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : null}
            {success ? 'Configurações Salvas!' : 'Salvar Alterações'}
         </button>
      </div>
    </div>
  );
}
