'use client';

import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Pricing1Props {
  onSubscribe: (plan: any) => void;
  loading: string | null;
}

const plans = [
  {
    id: "mensal",
    name: "Mensal",
    price: "13,90",
    period: "/mês",
    savings: null,
    features: [
      "Use 3 telas simultaneamente",
      "Mais de 60.000 conteúdos",
      "Qualidade HD/FHD/4k",
      "Guia de Programação [EPG]",
      "Assista no Smartphone/Tablet",
      "Assista na Smart TV ou TV Box"
    ],
    buttonColor: "bg-white/10 border border-white/15 text-white hover:bg-white/15",
    isPremium: false,
    badge: null
  },
  {
    id: "semestral",
    name: "Semestral",
    price: "49,90",
    period: "/semestre",
    savings: "40% DE DESCONTO",
    features: [
      "Tudo do plano Mensal",
      "Economia enorme a longo prazo",
      "Acesso Total a Lançamentos",
      "Catálogo Completo Filmes & Séries",
      "Canais de Esportes e Mais"
    ],
    buttonColor: "bg-white text-[#040714] hover:bg-zinc-200 border-transparent shadow-lg shadow-black/30",
    isPremium: true,
    badge: "MAIS POPULAR"
  },
  {
    id: "anual",
    name: "Anual",
    price: "89,90",
    period: "/ano",
    savings: "46% DE DESCONTO",
    features: [
      "A maior economia (R$ 7,49/mês)",
      "Pague 1x e assista por 12 meses",
      "Use 3 telas simultaneamente",
      "Qualidade 4K Ultra HD",
      "Suporte Prioritário 24h"
    ],
    buttonColor: "bg-white/10 border border-white/15 text-white hover:bg-white/15",
    isPremium: false,
    badge: null
  }
];

export function Pricing1({ onSubscribe, loading }: Pricing1Props) {
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <p className="text-overline text-[var(--accent-teal)]">Premium</p>
          <h1 className="text-display text-white animate-in fade-in slide-in-from-top-4 duration-700">
             Escolha o seu plano
          </h1>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-top-4 delay-100 duration-700">
            Milhares de filmes, séries e canais ao vivo em um só lugar. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={cn(
                "relative group transition-all duration-500",
                plan.isPremium ? "md:scale-105 z-10" : "z-0",
                "animate-in fade-in slide-in-from-bottom-8",
                index === 0 ? "delay-200" : index === 1 ? "delay-300" : "delay-400"
              )}
            >
              <div className={cn(
                "relative p-8 rounded-3xl border backdrop-blur-3xl overflow-hidden transition-all duration-500 flex flex-col min-h-[580px]",
                plan.isPremium
                  ? "bg-gradient-to-b from-white/10 to-[var(--bg-secondary)]/90 border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
                  : "bg-[var(--bg-secondary)]/60 border-white/10 hover:border-white/20 shadow-xl"
              )}>
                {plan.badge && (
                  <div className="absolute top-6 right-6 px-4 py-1.5 bg-white text-[#040714] text-[10px] font-bold uppercase tracking-widest rounded-full z-20">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-[var(--text-tertiary)]">R$</span>
                    <span className="text-5xl font-bold text-white tracking-tight">{plan.price.split(',')[0]}</span>
                    <span className="text-2xl font-bold text-white/50">,{plan.price.split(',')[1]}</span>
                    <span className="text-sm font-medium text-[var(--text-tertiary)] ml-1">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <div className="mt-3 inline-block px-3 py-1 bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/20 text-[var(--accent-teal)] text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {plan.savings}
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/5 w-full mb-8" />

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <div className="w-5 h-5 rounded-full bg-[var(--accent-teal)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--accent-teal)]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={cn(
                    "w-full h-14 rounded-full font-bold text-xs uppercase tracking-[0.15em] transition-all duration-300 relative overflow-hidden group/btn flex items-center justify-center gap-3",
                    plan.buttonColor
                  )}
                >
                  {loading === plan.id ? (
                    <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                  ) : (
                    <>
                      Assinar agora
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
