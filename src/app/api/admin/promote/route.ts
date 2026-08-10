import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('email', email)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Usuário ${email} agora é Admin!`,
      data 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
