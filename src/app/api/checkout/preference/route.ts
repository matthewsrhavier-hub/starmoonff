import { NextRequest, NextResponse } from 'next/server';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { planId, planName, amount, userEmail, userId } = await request.json();

    if (!MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Mercado Pago Token não configurado' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isPublic = siteUrl.includes('https://');

    const preferenceBody: any = {
      items: [
        {
          id: String(planId),
          title: `Assinatura Superflix - Plano ${planName}`,
          description: `Acesso total à plataforma Superflix - Plano ${planName}`,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'BRL',
          category_id: 'entertainment'
        }
      ],
      payer: {
        email: userEmail,
      },
      external_reference: `${userId}:${planId}`,
      back_urls: {
        success: `${siteUrl}/profile?payment=success`,
        failure: `${siteUrl}/plans?payment=failure`,
        pending: `${siteUrl}/profile?payment=pending`,
      },
      auto_return: 'all',
      payment_methods: {
        installments: 12,
        excluded_payment_types: [
          { id: "ticket" }
        ]
      }
    };

    if (siteUrl && isPublic) {
      preferenceBody.notification_url = `${siteUrl}/api/webhooks/mercadopago`;
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    });

    const preference = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago Preference Error:', preference);
      return NextResponse.json({ 
        error: preference.message || 'Erro ao criar preferência de pagamento',
        details: preference.cause 
      }, { status: response.status });
    }

    // Retornamos o init_point (link de redirecionamento oficial)
    return NextResponse.json({ 
      init_point: preference.init_point, 
      id: preference.id 
    });

  } catch (error: any) {
    console.error('Error creating preference:', error);
    return NextResponse.json({ error: 'Erro interno ao processar checkout' }, { status: 500 });
  }
}
