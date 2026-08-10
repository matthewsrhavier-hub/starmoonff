import { NextResponse } from 'next/server';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Recebendo pagamento transparente:', body);

    const { 
      token, 
      issuer_id, 
      payment_method_id, 
      transaction_amount, 
      installments, 
      description, 
      payer,
      external_reference
    } = body;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const isLocalhost = siteUrl?.includes('localhost');

    const paymentBody: any = {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      description,
      payer,
      external_reference,
    };

    // Apenas envia notification_url se o site estiver em um domínio público vaildo (HTTPS)
    if (siteUrl && !isLocalhost) {
      paymentBody.notification_url = `${siteUrl}/api/webhooks/mercadopago`;
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `p-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago Payment Error:', result);
      return NextResponse.json({ 
        error: result.message || 'Erro ao processar pagamento',
        details: result.cause 
      }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Erro interno ao processar pagamento' }, { status: 500 });
  }
}
