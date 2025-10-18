interface WeaponIconProps {
  weaponName: string | undefined;
  className?: string;
}

// Map weapon names from demo parser to icon filenames
const WEAPON_MAP: Record<string, string> = {
  // Technical format (weapon_*)
  weapon_ak47: "ak47",
  weapon_m4a1: "m4a1",
  weapon_m4a1_silencer: "m4a1",
  weapon_aug: "aug",
  weapon_sg556: "sg553",
  weapon_famas: "famas",
  weapon_galilar: "galilar",
  weapon_scar20: "scar20",
  weapon_g3sg1: "g3sg1",
  weapon_awp: "awp",
  weapon_ssg08: "ssg08",
  weapon_mp9: "mp9",
  weapon_mac10: "mac10",
  weapon_mp7: "mp7",
  weapon_ump45: "ump45",
  weapon_p90: "p90",
  weapon_bizon: "bizon",
  weapon_mp5sd: "mp5sd",
  weapon_nova: "nova",
  weapon_xm1014: "xm1014",
  weapon_sawedoff: "sawed-off",
  weapon_mag7: "mag7",
  weapon_m249: "m249",
  weapon_negev: "negev",
  weapon_glock: "glock",
  weapon_hkp2000: "p2000",
  weapon_usp_silencer: "usps",
  weapon_elite: "dual-elite",
  weapon_p250: "p250",
  weapon_tec9: "tec9",
  weapon_fiveseven: "five-seven",
  weapon_cz75a: "cz75a",
  weapon_deagle: "deagle",
  weapon_revolver: "revolver",
  weapon_knife: "knife",
  weapon_knife_t: "knife",
  weapon_taser: "zeus",
  weapon_c4: "bomb",
  weapon_hegrenade: "he-grenade",
  weapon_flashbang: "flashbang",
  weapon_smokegrenade: "smoke-grenade",
  weapon_molotov: "molotov",
  weapon_incgrenade: "incendiary-grenade",
  weapon_decoy: "decoy",

  // Human-readable format (from demoparser2)
  "ak-47": "ak47",
  "m4a1-s": "m4a1",
  m4a4: "m4a4",
  aug: "aug",
  sg553: "sg553",
  "sg 553": "sg553",
  famas: "famas",
  "galil ar": "galilar",
  "scar-20": "scar20",
  g3sg1: "g3sg1",
  awp: "awp",
  "ssg 08": "ssg08",
  mp9: "mp9",
  mac10: "mac10",
  "mac-10": "mac10",
  mp7: "mp7",
  ump45: "ump45",
  "ump-45": "ump45",
  p90: "p90",
  "pp-bizon": "bizon",
  "mp5-sd": "mp5sd",
  nova: "nova",
  xm1014: "xm1014",
  "sawed-off": "sawed-off",
  "mag-7": "mag7",
  m249: "m249",
  negev: "negev",
  glock: "glock",
  "glock-18": "glock",
  p2000: "p2000",
  "usp-s": "usps",
  "dual berettas": "dual-elite",
  p250: "p250",
  "tec-9": "tec9",
  "five-seven": "five-seven",
  "cz75-auto": "cz75a",
  "desert eagle": "deagle",
  revolver: "revolver",
  "r8 revolver": "revolver",
  knife: "knife",
  knife_t: "knife",
  "on knife": "knife",
  "to knife": "knife",

  // Knife variants/skins (all map to the standard knife icon)
  bayonet: "knife",
  "classic knife": "knife",
  "flip knife": "knife",
  "gut knife": "knife",
  karambit: "knife",
  "m9 bayonet": "knife",
  "huntsman knife": "knife",
  "falchion knife": "knife",
  "bowie knife": "knife",
  "butterfly knife": "knife",
  "shadow daggers": "knife",
  "paracord knife": "knife",
  "survival knife": "knife",
  "ursus knife": "knife",
  "navaja knife": "knife",
  "nomad knife": "knife",
  "stiletto knife": "knife",
  "talon knife": "knife",
  "skeleton knife": "knife",

  "zeus x27": "zeus",
  "c4 explosive": "bomb",
  "high explosive grenade": "he-grenade",
  "he grenade": "he-grenade",
  hegrenade: "he-grenade",
  flashbang: "flashbang",
  "smoke grenade": "smoke-grenade",
  smokegrenade: "smoke-grenade",
  molotov: "molotov",
  "incendiary grenade": "incendiary-grenade",
  incgrenade: "incendiary-grenade",
  decoy: "decoy",
  "decoy grenade": "decoy"
};

function WeaponIcon({ weaponName, className = "" }: WeaponIconProps) {
  // Handle undefined or non-string weapon names
  if (!weaponName || typeof weaponName !== "string") {
    return null;
  }

  // Normalize weapon name (remove weapon_ prefix if present)
  const normalizedName = weaponName.toLowerCase().trim();

  // Try to find weapon in map
  const iconName = WEAPON_MAP[normalizedName];

  // If no icon found, return text fallback
  if (!iconName) {
    const displayName = normalizedName.replace("weapon_", "").toUpperCase();
    return <span className={className}>{displayName}</span>;
  }

  // Return image icon
  const iconPath = `/weapons/${iconName}-icon.svg`;

  return (
    <img
      src={iconPath}
      alt={iconName}
      className={className}
      style={{
        width: "20px",
        height: "20px",
        objectFit: "contain"
      }}
      onError={(e) => {
        // Fallback to text if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        if (target.parentElement) {
          target.parentElement.textContent = normalizedName
            .replace("weapon_", "")
            .toUpperCase();
        }
      }}
    />
  );
}

export default WeaponIcon;
