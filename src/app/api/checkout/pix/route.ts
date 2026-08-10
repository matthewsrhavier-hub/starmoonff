import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, userId, planId, amount, description } = body;

    if (!userEmail || !amount) {
      return NextResponse.json({ error: 'Dados insuficientes para gerar PIX' }, { status: 400 });
    }

    const paymentPayload = {
      transaction_amount: Number(amount),
      description: description || 'Assinatura Superflix',
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
      },
      external_reference: `${userId}:${planId || 'premium'}`,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `pix-${userId}-${Date.now()}`
      },
      body: JSON.stringify(paymentPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro MP PIX:", data);
      return NextResponse.json({ 
        error: 'Erro ao gerar PIX', 
        details: data.message || data 
      }, { status: 500 });
    }

    return NextResponse.json({
      qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
      qrCode: data.point_of_interaction.transaction_data.qr_code,
      paymentId: data.id,
      status: data.status
    });

  } catch (error) {
    console.error('Erro na geração do PIX Mercado Pago:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
