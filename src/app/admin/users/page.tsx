'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Trash2, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Loader2, 
  Mail,
  Calendar,
  CreditCard,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (id: number, current: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ is_admin: !current }).eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: !current } : u));
    } catch (error) {
      alert('Erro ao atualizar permissão');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black flex items-center gap-3">
             <Users className="text-blue-500" size={32} />
             Gestão de Usuários
           </h1>
           <p className="text-zinc-500 mt-1">Visualize e controle as permissões de acesso da plataforma.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                 type="text" 
                 placeholder="Buscar por e-mail ou nome..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-600 w-full sm:w-80 text-sm"
              />
           </div>
        </div>
      </div>

      <div className="bg-[#121212] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Usuário</th>
                  <th className="px-8 py-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Plano</th>
                  <th className="px-8 py-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Cadastro</th>
                  <th className="px-8 py-6 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center">
                      <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                   </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center text-zinc-500">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            user.is_admin ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                          )}>
                             {user.name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                             <p className="font-bold text-sm flex items-center gap-2">
                                {user.name || 'Sem nome'}
                                {user.is_admin && (
                                  <span title="Administrador" className="inline-flex">
                                    <ShieldCheck size={14} className="text-red-500" />
                                  </span>
                                )}
                             </p>
                             <p className="text-xs text-zinc-550 flex items-center gap-1.5 mt-0.5">
                                <Mail size={12} className="opacity-50" />
                                {user.email}
                             </p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={cn(
                         "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter",
                         user.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                       )}>
                          {user.status || 'Ativo'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                          <CreditCard size={14} className="text-zinc-600" />
                          <span className="capitalize">{user.plan || 'Free'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Calendar size={14} className="opacity-50" />
                          {new Date(user.created_at).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                          user.is_admin 
                            ? "bg-zinc-800 text-zinc-400 hover:text-red-500" 
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                       >
                          {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
