export const convertCSGORankToCS2 = (csgo_rank: number) => {
  if (csgo_rank < 7) return { rank: 1000 + 166 * csgo_rank };
  if (csgo_rank < 11) return { rank: 2000 + 999 * (csgo_rank - 6) };
  if (csgo_rank < 14) return { rank: 6000 + 1000 * (csgo_rank - 10) };
  if (csgo_rank < 17) return { rank: 9000 + 1250 * (csgo_rank - 13) };
  if (csgo_rank === 17) return { rank: 13450 };
  return { rank: 15000 };
};
