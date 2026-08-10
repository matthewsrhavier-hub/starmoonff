'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Lock,
  CheckCircle2,
  User,
  Film,
  Play,
  Tv,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronDown,
  Monitor,
  Download,
  Smartphone,
  Baby,
  Clapperboard,
  Zap,
  Globe2,
  Headphones,
  Users,
  Infinity,
  Tablet,
  Gamepad2,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { LogoLink } from '@/components/layout/Logo';
import { getRankNumberImage } from '@/lib/rankNumbers';

const genres = [
  'Ação', 'Drama', 'Comédia', 'Terror', 'Ficção', 'Anime',
  'Romance', 'Documentário', 'Suspense', 'Fantasia', 'Crime', 'Infantil',
];

const faqs = [
  {
    q: 'O que é o Starmoon?',
    a: 'O Starmoon é um serviço de streaming com filmes, séries e animes. Assista quando e onde quiser, por um preço mensal acessível.',
  },
  {
    q: 'Quanto custa o Starmoon?',
    a: 'Os planos começam a partir de R$ 13,90. Você pode escolher mensal, trimestral ou anual conforme sua preferência.',
  },
  {
    q: 'Onde posso assistir?',
    a: 'No celular, tablet, notebook, Smart TV e outros dispositivos conectados à internet compatíveis com o Starmoon.',
  },
  {
    q: 'Posso baixar conteúdos para assistir offline?',
    a: 'Sim. Nos planos disponíveis você pode baixar títulos e assistir sem conexão, onde e quando quiser.',
  },
  {
    q: 'Quantas telas posso usar ao mesmo tempo?',
    a: 'Você pode assistir em até 4 telas simultâneas no mesmo plano, ideal para a família ou para trocar de dispositivo.',
  },
  {
    q: 'Como faço para cancelar?',
    a: 'Você pode cancelar online a qualquer momento. Não há taxas de cancelamento.',
  },
  {
    q: 'O Starmoon é adequado para crianças?',
    a: 'Sim. Você pode criar perfis infantis e controlar o que as crianças assistem.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartão de crédito e PIX, com ativação rápida da sua assinatura após a confirmação do pagamento.',
  },
];

export default function PlansPage() {
  const router = useRouter();
  const { register, isAuthenticated, user } = useAuth();
  const plansRef = useRef<HTMLDivElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [catalogPosters, setCatalogPosters] = useState<{ id: number; src: string; title: string }[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingPix, setIsVerifyingPix] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [pixVerified, setPixVerified] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const plans = [
    {
      id: 'mensal',
      name: 'Mensal',
      price: '13,90',
      period: '/mês',
      hint: 'Flexível',
      save: null as string | null,
      features: ['Qualidade até 4K HDR', '4 telas simultâneas', 'Sem anúncios', 'Downloads offline'],
      popular: false,
    },
    {
      id: 'trimestral',
      name: 'Trimestral',
      price: '18,60',
      period: '/3 meses',
      hint: 'R$ 6,20/mês',
      save: 'Economize',
      features: ['Tudo do Mensal', 'Melhor custo-benefício', 'Suporte prioritário', 'Catálogo completo'],
      popular: false,
    },
    {
      id: 'anual',
      name: 'Anual',
      price: '25,00',
      period: '/ano',
      hint: 'R$ 2,08/mês',
      save: 'Melhor oferta',
      features: ['Tudo do Trimestral', 'Menor preço do ano', 'Acesso multi-dispositivo', 'Prioridade em lançamentos'],
      popular: true,
    },
  ];

  useEffect(() => {
    if (isAuthenticated && user) setEmail(user.email);
  }, [isAuthenticated, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const res = await fetch('/api/tmdb/posters', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) setCatalogPosters(data.posters || []);
      } catch (err) {
        console.error('[Plans] Falha ao carregar catálogo TMDB:', err);
        if (!cancelled) setCatalogPosters([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    if (value.length <= 19) setCardNumber(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
    if (value.length <= 5) setExpiry(value);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedPlan) return;

    if (!isAuthenticated) {
      if (password !== confirmPassword) {
        setErrorMessage('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (!isAuthenticated) {
        try {
          await register(email, password, cardName || email.split('@')[0]);
        } catch (err: any) {
          if (err.message?.includes('existe')) {
            setErrorMessage('Este email já possui conta. Faça login antes de assinar.');
            setIsProcessing(false);
            return;
          }
          throw err;
        }
      }

      const amount = Number(selectedPlan.price.replace(',', '.'));
      const paymentResponse = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: paymentMethod === 'pix' ? 'pix' : 'master',
          transaction_amount: amount,
          description: `Assinatura ${selectedPlan.name}`,
          email,
          planId: selectedPlan.id,
          external_reference: `manual_checkout:${email}:${selectedPlan.id}`,
          payer: {
            email,
            first_name: cardName.split(' ')[0] || 'Cliente',
            last_name: cardName.split(' ').slice(1).join(' ') || 'starmoon',
          },
          token: cardNumber.replace(/\s/g, ''),
          installments: 1,
        }),
      });

      const result = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(result.error || 'Erro no pagamento.');

      if (paymentMethod === 'pix') {
        setPaymentId(result.id);
        setPixQrCode(result.point_of_interaction.transaction_data.qr_code_base64);
        setPixCopyPaste(result.point_of_interaction.transaction_data.qr_code);
      } else {
        setPixVerified(true);
        setTimeout(() => router.push('/profile?status=success'), 2000);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPixPayment = async () => {
    if (!paymentId) return;
    setIsVerifyingPix(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/checkout/status?id=${paymentId}`);
      const result = await res.json();
      if (result.status === 'approved') {
        setPixVerified(true);
        setTimeout(() => router.push('/profile?status=success'), 2000);
      } else {
        setErrorMessage('Pagamento ainda não detectado. Tente novamente em instantes.');
      }
    } catch {
      setErrorMessage('Erro ao consultar status do PIX.');
    } finally {
      setIsVerifyingPix(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
        {/* Top bar */}
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-14 py-6">
          <LogoLink size="md" />
          <Link
            href="/login"
            className="bg-white hover:bg-neutral-200 text-black text-sm font-semibold px-5 py-2 rounded-full transition-colors"
          >
            Entrar
          </Link>
        </header>

        {/* Hero */}
        <section className="relative flex items-start justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-8 md:pt-32 md:pb-14 overflow-hidden min-h-[62svh] md:min-h-[78vh]">
          <img
            src="https://muvora.online/banner-agosto.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_center] md:object-[center_30%] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />

          <div className="relative z-10 max-w-3xl mx-auto text-center mt-4 sm:mt-6 md:mt-10">
            <h1 className="text-[1.85rem] sm:text-4xl md:text-6xl lg:text-[3.6rem] font-black tracking-tight leading-[1.1] mb-3 sm:mb-4">
              Filmes, séries e muito mais,
              <span className="block font-light text-white/90 mt-1">sem limites</span>
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-white/75 mb-1.5">
              A partir de R$ 13,90. Cancele quando quiser.
            </p>
            <p className="text-xs sm:text-sm md:text-base text-white/50 mb-5 sm:mb-6 max-w-lg mx-auto">
              Informe seu email para criar ou reiniciar sua assinatura.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                scrollToPlans();
              }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-xl mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 h-12 sm:h-14 px-5 rounded-full bg-white/5 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-white/60 focus:bg-white/10 transition-all backdrop-blur-md text-base"
              />
              <button
                type="submit"
                className="h-12 sm:h-14 px-7 sm:px-8 rounded-full bg-white hover:bg-neutral-200 text-black text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all active:scale-[0.98]"
              >
                Vamos lá
                <span className="text-xl leading-none">›</span>
              </button>
            </form>
          </div>
        </section>

        {/* Planos */}
        <section ref={plansRef} className="relative px-4 sm:px-6 md:px-14 pt-3 md:pt-4 pb-16 md:pb-20 overflow-hidden">
          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-7 md:mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-2">
                Planos Starmoon
              </p>
              <h2 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight mb-2">
                Escolha o seu plano
              </h2>
              <p className="text-white/45 text-sm md:text-base">
                Assista o quanto quiser. Sem compromisso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-stretch">
              {plans.map((plan, index) => {
                const rank = index + 1;
                const rankSrc = getRankNumberImage(rank);
                return (
                <div
                  key={plan.id}
                  className={cn(
                    'group relative flex flex-col rounded-2xl border bg-[#111] p-6 md:p-7 transition-all duration-300 overflow-hidden',
                    plan.popular
                      ? 'border-white/50 bg-[#161616] ring-1 ring-white/25'
                      : 'border-white/10 hover:border-white/25 hover:bg-[#151515]'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full z-10">
                      Mais popular
                    </div>
                  )}

                  <div className="relative z-10 flex items-start justify-between gap-3 mb-5 mt-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {rankSrc && (
                        <img
                          src={rankSrc}
                          alt=""
                          aria-hidden
                          className="h-8 md:h-9 w-auto object-contain select-none shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                      <h3 className="text-lg font-bold tracking-tight text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xs mt-1 text-white/40">{plan.hint}</p>
                      </div>
                    </div>
                    {plan.save && !plan.popular && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full shrink-0 bg-white/10 text-white/80 border border-white/15">
                        {plan.save}
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 mb-5">
                    <div className="flex items-end gap-1.5">
                      <span className="text-[2.35rem] leading-none font-black tracking-tight text-white">
                        R$ {plan.price}
                      </span>
                      <span className="text-sm pb-1 text-white/40">{plan.period}</span>
                    </div>
                  </div>

                  <div className="relative z-10 h-px mb-5 bg-white/10" />

                  <ul className="relative z-10 space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                        <CheckCircle2 size={15} className="shrink-0 text-white" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'relative z-10 w-full h-11 rounded-full font-bold text-sm transition-all active:scale-[0.98]',
                      plan.popular
                        ? 'bg-white text-black hover:bg-neutral-200'
                        : 'bg-white/10 text-white border border-white/15 hover:bg-white hover:text-black'
                    )}
                  >
                    Assinar {plan.name}
                  </button>
                </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-white/30 mt-7">
              Pagamento seguro · Ativação imediata · Cancele online a qualquer momento
            </p>
          </div>
        </section>

        {/* Catálogo visual */}
        <section className="border-t border-white/10 py-14 md:py-16 overflow-hidden">
          <div className="px-6 md:px-14 max-w-6xl mx-auto mb-8 md:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-2">
              Catálogo 2026
            </p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
              Lançamentos de 2026
            </h2>
            <p className="text-white/45 text-sm md:text-base max-w-2xl">
              Filmes e séries em alta no The Movie Database neste ano.
            </p>
          </div>
          <div className="relative">
            <div className="flex gap-2.5 md:gap-3 overflow-x-auto px-6 md:px-14 pb-2 scrollbar-none">
              {catalogLoading &&
                Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`sk-${i}`}
                    className="shrink-0 w-[110px] md:w-[150px] aspect-[2/3] rounded-xl bg-[#1a1a1a] animate-pulse"
                  />
                ))}
              {!catalogLoading &&
                catalogPosters.map((item) => (
                  <div
                    key={`${item.id}-${item.src}`}
                    className="relative shrink-0 w-[110px] md:w-[150px] aspect-[2/3] overflow-hidden rounded-xl bg-[#1a1a1a]"
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-500"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-xl" />
                  </div>
                ))}
              {!catalogLoading && catalogPosters.length === 0 && (
                <p className="text-sm text-white/40 px-1 py-8">
                  Não foi possível carregar os títulos de 2026 no momento.
                </p>
              )}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black to-transparent" />
          </div>

          <div className="px-6 md:px-14 max-w-6xl mx-auto mt-8 flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g}
                className="text-xs md:text-sm px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70"
              >
                {g}
              </span>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 md:mb-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-2">Comece agora</p>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                Em 3 passos você já está assistindo
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { step: 1, title: 'Escolha o plano', desc: 'Mensal, trimestral ou anual. Sem fidelidade e com cancelamento simples.' },
                { step: 2, title: 'Crie sua conta', desc: 'Informe email, senha e finalize o pagamento com cartão ou PIX.' },
                { step: 3, title: 'Aperte o play', desc: 'Acesse o catálogo completo e assista em qualquer dispositivo.' },
              ].map((item) => {
                const rankSrc = getRankNumberImage(item.step);
                return (
                <div key={item.step} className="border border-white/10 bg-[#111] rounded-2xl p-6 md:p-7">
                  {rankSrc && (
                    <img
                      src={rankSrc}
                      alt={`${item.step}`}
                      className="h-12 md:h-14 w-auto object-contain select-none mb-3"
                      loading="lazy"
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Motivos */}
        <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-2">Vantagens</p>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
                Mais motivos para assinar
              </h2>
              <p className="text-white/45 text-sm md:text-base max-w-2xl">
                Uma assinatura pensada para quem quer liberdade, qualidade e preço justo.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: Monitor, title: 'Aproveite na TV', desc: 'Smart TVs, PlayStation, Xbox, Chromecast, Apple TV e mais.' },
                { icon: Download, title: 'Baixe para offline', desc: 'Salve títulos favoritos e assista sem conexão.' },
                { icon: Smartphone, title: 'Assista onde quiser', desc: 'Celular, tablet, laptop e TV — no mesmo plano.' },
                { icon: Baby, title: 'Perfis para crianças', desc: 'Espaço feito para elas, sem pagar a mais.' },
                { icon: Clapperboard, title: 'Catálogo completo', desc: 'Filmes, séries e animes em um só lugar.' },
                { icon: Zap, title: 'Ativação rápida', desc: 'Comece a assistir logo após confirmar o pagamento.' },
                { icon: Headphones, title: 'Qualidade premium', desc: 'Imagem até 4K HDR e áudio envolvente.' },
                { icon: Infinity, title: 'Sem limites', desc: 'Assista o quanto quiser, quando quiser.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-[#111] border border-white/10 p-5 md:p-6 min-h-[180px] hover:border-white/25 hover:bg-[#161616] transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-5">
                    <item.icon size={18} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dispositivos */}
        <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-2">Multiplataforma</p>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                Uma conta. Todos os seus aparelhos.
              </h2>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8">
                Continue de onde parou na TV, no celular ou no notebook. Seu histórico e favoritos acompanham você.
              </p>
              <ul className="space-y-3">
                {[
                  'Até 4 telas ao mesmo tempo',
                  'Troque de dispositivo sem perder o progresso',
                  'Interface leve e fácil de usar',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-white/75">
                    <CheckCircle2 size={16} className="text-white shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Tv, label: 'Smart TV' },
                { icon: Smartphone, label: 'Celular' },
                { icon: Tablet, label: 'Tablet' },
                { icon: Monitor, label: 'Computador' },
                { icon: Gamepad2, label: 'Console' },
                { icon: Wifi, label: 'Streaming box' },
              ].map((d) => (
                <div
                  key={d.label}
                  className="rounded-2xl border border-white/10 bg-[#111] p-5 flex flex-col items-center justify-center gap-3 min-h-[110px] hover:border-white/25 transition-colors"
                >
                  <d.icon size={26} className="text-white" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Números / confiança */}
        <section className="px-6 md:px-14 py-14 md:py-16 border-t border-white/10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Film, value: 'Milhares', label: 'de títulos' },
              { icon: Users, value: '4 telas', label: 'simultâneas' },
              { icon: Globe2, value: '24/7', label: 'disponível' },
              { icon: ShieldCheck, value: '100%', label: 'pagamento seguro' },
            ].map((s) => (
              <div key={s.label} className="text-center border border-white/10 bg-[#111] rounded-2xl py-7 px-4">
                <s.icon size={20} className="mx-auto mb-3 text-white/70" />
                <p className="text-2xl md:text-3xl font-black tracking-tight">{s.value}</p>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-8 text-center">
              Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {faqs.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={item.q} className="rounded-xl overflow-hidden border border-white/10 bg-[#111]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-base md:text-lg font-medium hover:bg-white/5 transition-colors"
                    >
                      {item.q}
                      <ChevronDown size={22} className={cn('shrink-0 text-white/50 transition-transform', open && 'rotate-180 text-white')} />
                    </button>
                    {open && (
                      <div className="px-5 pb-5 text-sm md:text-base text-white/60 leading-relaxed border-t border-white/10 pt-4">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-6 md:px-14 py-16 md:py-20 border-t border-white/10">
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl border border-white/15 bg-[#111] px-6 py-12 md:px-12 md:py-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
                Pronto para começar no Starmoon?
              </h2>
              <p className="text-white/50 text-sm md:text-base mb-8 max-w-lg mx-auto">
                Escolha um plano, finalize em minutos e tenha acesso imediato ao catálogo.
              </p>
              <button
                type="button"
                onClick={scrollToPlans}
                className="h-12 px-8 rounded-full bg-white hover:bg-neutral-200 text-black text-sm font-bold transition-all"
              >
                Ver planos
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 px-6 md:px-14 py-10 text-white/35 text-sm">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-4">
            <p>© {new Date().getFullYear()} Starmoon</p>
            <div className="flex gap-6">
              <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
              <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
              <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Checkout
  return (
    <div className="min-h-screen bg-black text-zinc-300 flex justify-center pt-8 md:pt-12 p-4 pb-20 md:p-8 font-sans overflow-x-hidden relative">
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-10 py-5">
        <LogoLink size="sm" />
        <Link href="/login" className="text-sm font-semibold text-white hover:opacity-70 transition-opacity">
          Entrar
        </Link>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 relative z-10 items-start mt-16">
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          <header className="space-y-2 px-1">
            <button
              onClick={() => setSelectedPlan(null)}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] uppercase font-bold mb-4"
            >
              <ArrowLeft size={14} /> Mudar Plano
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Finalize sua assinatura
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-zinc-500 text-[10px] md:text-xs pt-1">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-white" /> Pagamento protegido</span>
              <span className="flex items-center gap-1.5"><Tv size={12} className="text-white" /> Multi-dispositivos</span>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
            {[
              { id: 'card', label: 'Cartão de Crédito', sub: 'Ativação Instantânea', Icon: CreditCard },
              { id: 'pix', label: 'PIX', sub: 'Conta ativa em segundos', Icon: QrCode },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => { setPaymentMethod(m.id); if (m.id === 'card') setPixQrCode(null); setErrorMessage(''); }}
                className={cn(
                  'relative p-4 md:p-5 rounded-2xl border transition-all duration-300 text-left',
                  paymentMethod === m.id
                    ? 'border-white bg-white/10'
                    : 'border-white/10 bg-[#111] hover:border-white/25'
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <m.Icon size={18} className={paymentMethod === m.id ? 'text-white' : 'text-zinc-500'} />
                  {paymentMethod === m.id && <CheckCircle2 size={16} className="text-white" />}
                </div>
                <p className="font-semibold text-xs md:text-sm text-white uppercase tracking-tight">{m.label}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-tighter">{m.sub}</p>
              </button>
            ))}
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 md:p-8 shadow-2xl min-h-0 sm:min-h-[420px] md:min-h-[480px] flex flex-col justify-center relative overflow-hidden">
            {errorMessage && (
              <div className="mb-6 p-4 bg-white/5 border border-white/20 rounded-xl flex items-center gap-3 text-white text-[10px] md:text-xs">
                <AlertCircle size={14} />
                {errorMessage}
              </div>
            )}

            {!pixQrCode || paymentMethod === 'card' ? (
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 border-b border-white/10 pb-5 mb-2">
                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4 text-left">
                      <User size={14} />
                      {isAuthenticated ? 'Dados da sua conta' : 'Crie seus dados de acesso'}
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isAuthenticated}
                          placeholder="seu@email.com"
                          className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm disabled:opacity-60"
                        />
                      </div>
                      {!isAuthenticated && (
                        <>
                          <div className="space-y-1.5 text-left">
                            <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Senha</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 pr-12 text-white outline-none focus:border-white/40 transition-all text-sm"
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Confirmar senha</label>
                            <input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Repita a senha"
                              className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Nome no cartão</label>
                        <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Como está no cartão" className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm" />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Número do cartão</label>
                        <input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="ACCT-000003" className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Validade</label>
                          <input type="text" value={expiry} onChange={handleExpiryChange} placeholder="MM/AA" className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm" />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">CVV</label>
                          <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} maxLength={4} placeholder="•••" className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-center text-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  disabled={isProcessing}
                  className="w-full py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 bg-white hover:bg-neutral-200 text-black text-sm uppercase tracking-widest"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : (paymentMethod === 'pix' ? `Pagar R$ ${selectedPlan.price} via PIX` : `Assinar por R$ ${selectedPlan.price}`)}
                </button>
              </form>
            ) : (
              <div className="max-w-md mx-auto space-y-6 py-4 text-center w-full">
                <div className="bg-white p-2 rounded-xl shadow-2xl inline-block relative">
                  <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-[180px] h-[180px] md:w-[200px] md:h-[200px]" />
                  {pixVerified && (
                    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-xl text-white">
                      <CheckCircle2 size={40} className="mb-2 text-white" />
                      <span className="font-bold text-xs uppercase tracking-widest">Conta Ativada!</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 px-4 text-center">
                  <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">Aguardando Pagamento</h3>
                  <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-tight">Detectamos seu pagamento automaticamente</p>
                </div>
                <div className="space-y-3 px-2">
                  <div className="flex gap-1 bg-black border border-white/10 rounded-xl overflow-hidden p-1">
                    <input readOnly type="text" value={pixCopyPaste} className="flex-1 bg-transparent px-3 text-[10px] text-zinc-400 outline-none truncate" />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixCopyPaste);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className={cn('px-3 md:px-4 py-2 rounded-lg font-bold text-[10px] uppercase transition-all', isCopied ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20')}
                    >
                      {isCopied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <button
                    onClick={verifyPixPayment}
                    disabled={isVerifyingPix || pixVerified}
                    className={cn(
                      'w-full py-4 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                      pixVerified ? 'bg-white text-black' : 'bg-white text-black hover:bg-neutral-200'
                    )}
                  >
                    {isVerifyingPix ? <><RefreshCw size={14} className="animate-spin" /> Verificando...</> : pixVerified ? <><CheckCircle2 size={14} /> Ativado com Sucesso</> : <><Search size={14} /> Já Paguei</>}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between opacity-50">
              <div className="text-[8px] uppercase tracking-[0.2em] font-bold">Checkout Seguro Starmoon</div>
              <div className="flex gap-3">
                <ShieldCheck size={16} className="text-zinc-500" />
                <Lock size={16} className="text-zinc-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 lg:sticky lg:top-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base md:text-lg font-bold text-white tracking-wider flex items-center gap-2 text-left">
                <Play size={18} fill="currentColor" />
                Resumo
              </h2>
              <span className="text-[9px] font-bold text-black bg-white px-2.5 py-1 rounded-full uppercase">
                {selectedPlan.name}
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-20 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-xl">
                  <Film size={28} className="text-black" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-white text-sm font-bold tracking-tight">Plano {selectedPlan.name}</h4>
                  <p className="text-zinc-500 text-[10px] uppercase mt-1">Acesso ilimitado</p>
                </div>
              </div>

              <div className="bg-black border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-end">
                  <div className="space-y-1 text-left">
                    <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Total a pagar</p>
                    <p className="text-3xl font-bold text-white tracking-tighter">R$ {selectedPlan.price}</p>
                  </div>
                  <p className="text-white/50 text-[10px] font-bold uppercase">{selectedPlan.period}</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedPlan.features.slice(0, 3).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-white/5 rounded-xl border border-white/5">
                    <CheckCircle2 size={14} className="text-white" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
