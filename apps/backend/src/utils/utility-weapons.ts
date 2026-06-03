/** SQL fragment: true when `phl.weapon` is HE / molotov / incendiary / inferno damage. */
export const UTILITY_DAMAGE_WEAPON_SQL = `(
  LOWER(REPLACE(phl.weapon, 'weapon_', '')) IN (
    'hegrenade', 'he', 'molotov', 'incgrenade', 'inferno', 'incendiary',
    'firebomb', 'molotov_projectile'
  )
  OR LOWER(phl.weapon) LIKE '%he grenade%'
  OR LOWER(phl.weapon) LIKE '%high explosive%'
  OR LOWER(phl.weapon) LIKE '%molotov%'
  OR LOWER(phl.weapon) LIKE '%incendiary%'
  OR LOWER(phl.weapon) LIKE '%inferno%'
  OR LOWER(phl.weapon) LIKE '%firebomb%'
)`;
