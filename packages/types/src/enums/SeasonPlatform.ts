export enum SeasonPlatform {
  Kanaliiga = "kanaliiga",
  FACEIT = "faceit",
  Esportal = "esportal",
  PopFlash = "popflash"
}

export const isSeasonPlatform = (value: unknown): value is SeasonPlatform => {
  return Object.values(SeasonPlatform).includes(value as SeasonPlatform);
};
