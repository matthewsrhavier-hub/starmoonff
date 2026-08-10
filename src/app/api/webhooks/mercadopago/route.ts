import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('data.id');

    if (type === 'payment' && id) {
      // 1. Detalhes do pagamento no Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      });

      if (!response.ok) return NextResponse.json({ error: 'Erro MP' }, { status: 500 });
      const paymentData = await response.json();
      const status = paymentData.status; // 'approved'
      const externalRef = paymentData.external_reference; // 'manual_checkout:email:planId'

      if (status === 'approved' && externalRef) {
        const parts = externalRef.split(':');
        let userEmail = '';
        let planId = 'mensal';
        let targetUserId = '';

        // Determinar Email e Plano
        if (parts[0] === 'manual_checkout') {
          userEmail = parts[1];
          planId = parts[2] || 'mensal';
        } else {
          // Se for checkout logado, o parts[0] é o userId
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(parts[0]);
          userEmail = userData?.user?.email || '';
          planId = parts[1] || 'mensal';
          targetUserId = parts[0];
        }

        if (!userEmail) throw new Error('E-mail não encontrado no pagamento.');

        // 2. Verificar se o usuário existe no AUTH
        const { data: searchUser } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = searchUser.users.find(u => u.email === userEmail);

        if (!existingAuthUser) {
          // AUTO-CADASTRO: Criar conta se não existir
          const defaultPassword = userEmail.split('@')[0] + '123';
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { name: userEmail.split('@')[0] }
          });

          if (createError) throw createError;
          targetUserId = newUser.user.id;
          console.log(`[Webhook] Conta Criada: ${userEmail} com senha ${defaultPassword}`);
        } else {
          targetUserId = existingAuthUser.id;
        }

        // 3. Ativar Assinatura no banco public
        const days = planId === 'anual' ? 365 : planId === 'trimestral' ? 90 : 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: targetUserId,
            email: userEmail,
            subscription_status: 'pago',
            plan: planId,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          });

        if (updateError) throw updateError;
        console.log(`[Webhook] Ativação Realizada: ${userEmail} (${planId}) até ${expiresAt}`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Erro Webhook MP:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
