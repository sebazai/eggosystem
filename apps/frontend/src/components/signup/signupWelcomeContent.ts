/** Steam app IDs used to pick signup welcome copy (see Games.app_id). */
export const CS2_STEAM_APP_ID = 730;
export const PUBG_STEAM_APP_ID = 578080;

export interface SignupWelcomeGameCopy {
  introParagraph: string;
  participationFeeIntro: string;
  defaultRulebookUrl: string;
}

const CS2_COPY: SignupWelcomeGameCopy = {
  introParagraph:
    "Hi and welcome to Kanaliiga, Finland's corporate CS2 tournament! Please read the instructions carefully and reserve yourself some time for filling the registration as accurately as possible. As a captain, you will be responsible for your team. Together we will make this tournament a great experience for everyone.",
  participationFeeIntro:
    "We cover organizing costs in CS2 tournaments by collecting participation fees from teams. The fee is per a participating team. Please pay your team's participation fee by purchasing it from",
  defaultRulebookUrl: "https://wiki.kanaliiga.fi/CS2/rulebook"
};

const PUBG_COPY: SignupWelcomeGameCopy = {
  introParagraph:
    "Hi and welcome to Kanaliiga, Finland's corporate PUBG tournament! Please read the instructions carefully and reserve yourself some time for filling the registration as accurately as possible. As a captain, you will be responsible for your squad. Together we will make this tournament a great experience for everyone.",
  participationFeeIntro:
    "We cover organizing costs in corporate esports tournaments by collecting participation fees from teams. The fee is per a participating team. Please pay your team's participation fee by purchasing it from",
  defaultRulebookUrl: "https://wiki.kanaliiga.fi/"
};

const DEFAULT_COPY: SignupWelcomeGameCopy = {
  introParagraph:
    "Hi and welcome to Kanaliiga! Please read the instructions carefully and reserve yourself some time for filling the registration as accurately as possible. As a captain, you will be responsible for your team. Together we will make this tournament a great experience for everyone.",
  participationFeeIntro:
    "We cover organizing costs in corporate esports tournaments by collecting participation fees from teams. The fee is per a participating team. Please pay your team's participation fee by purchasing it from",
  defaultRulebookUrl: "https://wiki.kanaliiga.fi/"
};

export function getSignupWelcomeCopy(appId: number): SignupWelcomeGameCopy {
  if (appId === PUBG_STEAM_APP_ID) {
    return PUBG_COPY;
  }
  if (appId === CS2_STEAM_APP_ID) {
    return CS2_COPY;
  }
  return DEFAULT_COPY;
}
