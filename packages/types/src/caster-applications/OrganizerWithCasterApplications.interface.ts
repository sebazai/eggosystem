export interface OrganizerWithCasterApplications {
  id: number;
  name: string;
  discord_guild_id: string | null;
  discord_caster_channel_id?: string | null;
}
