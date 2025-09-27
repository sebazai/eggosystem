export const SeasonPlatform = {
  Kanaliiga: "kanaliiga",
  FACEIT: "faceit",
  Esportal: "esportal",
  PopFlash: "popflash"
} as const;

export type SeasonPlatform =
  (typeof SeasonPlatform)[keyof typeof SeasonPlatform];

export const isSeasonPlatform = (value: unknown): value is SeasonPlatform => {
  return Object.values(SeasonPlatform).includes(value as SeasonPlatform);
};
