export interface Organizer {
  id: number;
  name: string;
  faceit_id: string | null;
  discord_link: string | null;
  discord_guild_id: string | null;
  discord_caster_applications_channel_id: string | null;
  discord_caster_channel_id: string | null;
  discord_caster_role_id: string | null;
}
