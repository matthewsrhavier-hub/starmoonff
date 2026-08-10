import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return request.cookies.get('auth_token')?.value || null;
}

function getUserClient(token: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(url, anon, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getAuthUser(request: NextRequest) {
  const token = getToken(request);
  if (!token) return { token: null, userId: null, client: null as SupabaseClient | null };

  const client = getUserClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) {
    return { token: null, userId: null, client: null };
  }

  return { token, userId: data.user.id, client };
}

// 1. LISTAR PERFIS
export async function GET(request: NextRequest) {
  try {
    const { userId, client } = await getAuthUser(request);
    if (!userId || !client) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await client
      .from('user_profiles')
      .select('id, name, avatar_url, is_kids, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Erro ao listar perfis:', error);
    return NextResponse.json(
      { error: 'Erro ao listar perfis: ' + (error.message || 'desconhecido') },
      { status: 500 }
    );
  }
}

// 2. CRIAR PERFIL
export async function POST(request: NextRequest) {
  try {
    const { userId, client } = await getAuthUser(request);
    if (!userId || !client) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, is_kids, avatar_url } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const { count, error: countError } = await client
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Limite de 5 perfis atingido' }, { status: 400 });
    }

    const defaultAvatar =
      avatar_url ||
      'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABYSw2XUJOe-RXGqlMhzAK2kb3m8jiiuICaICOYRemQXvfBcEmoaG0XMebWDsKrQ4fhsAYwzopxK6Cm5l5w2F9iMzCVqZuapW7A.png?r=201';

    const { data, error: insertError } = await client
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          name: name.trim(),
          is_kids: !!is_kids,
          avatar_url: defaultAvatar,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao criar perfil: ' + (error.message || 'desconhecido') },
      { status: 500 }
    );
  }
}

// 3. ATUALIZAR PERFIL
export async function PUT(request: NextRequest) {
  try {
    const { userId, client } = await getAuthUser(request);
    if (!userId || !client) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, is_kids, avatar_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { data, error } = await client
      .from('user_profiles')
      .update({
        name: name?.trim(),
        is_kids: !!is_kids,
        avatar_url,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil: ' + (error.message || 'desconhecido') },
      { status: 500 }
    );
  }
}

// 4. DELETAR PERFIL
export async function DELETE(request: NextRequest) {
  try {
    const { userId, client } = await getAuthUser(request);
    if (!userId || !client) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await client
      .from('user_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar perfil: ' + (error.message || 'desconhecido') },
      { status: 500 }
    );
  }
}
