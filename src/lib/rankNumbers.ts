/** Números em imagem estilo Max/Disney+ para Top 10 e ranking de planos */
export const RANK_NUMBER_IMAGES: Record<number, string> = {
  1: 'https://images.cdn.prd.api.discomax.com/b36a/8f374198bb90.png?w=80&f=webp',
  2: 'https://images.cdn.prd.api.discomax.com/ee14/caee9581c2b6.png?w=120&f=webp',
  3: 'https://images.cdn.prd.api.discomax.com/d3a5/185fc7b2a26b.png?w=120&f=webp',
  4: 'https://images.cdn.prd.api.discomax.com/3d34/6c2553d2685c.png?w=120&f=webp',
  5: 'https://images.cdn.prd.api.discomax.com/0592/fd606a1b5619.png?w=120&f=webp',
  6: 'https://images.cdn.prd.api.discomax.com/27c0/3977c17b239e.png?w=120&f=webp',
  7: 'https://images.cdn.prd.api.discomax.com/42b3/3b2fdf2aba8b.png?w=120&f=webp',
  8: 'https://images.cdn.prd.api.discomax.com/acdc/e986776855a9.png?w=120&f=webp',
  9: 'https://images.cdn.prd.api.discomax.com/3372/6d3b27f3c801.png?w=120&f=webp',
  10: 'https://images.cdn.prd.api.discomax.com/adb4/98b5aca35073.png?w=120&f=webp',
};

export function getRankNumberImage(rank: number): string | null {
  return RANK_NUMBER_IMAGES[rank] || null;
}
