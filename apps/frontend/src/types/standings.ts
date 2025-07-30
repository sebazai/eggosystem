export interface TeamStanding {
  team_name: string;
  games_played: number;
  maps_won: number;
  maps_won_ot: number;
  maps_lost: number;
  maps_lost_ot: number;
  points: number;
  rounds_won: number;
  rounds_lost: number;
  rounds_diff: number;
}

export interface StandingsResponse {
  data: TeamStanding[];
  status: number;
}

export interface League {
  id: string;
  name: string;
}

export const LEAGUES: League[] = [
  { id: "fe4cb0c3-9934-484c-84d1-662acdb025d4", name: "Masters A" },
  { id: "7752ba66-1554-4d11-8e31-1968f52865d4", name: "Masters B" },
  { id: "ae92b1c5-50e4-46c0-a03f-4bcfa9adcf58", name: "Challengers A" },
  { id: "00b4917c-3155-42fc-aa7b-39fa0181afb4", name: "Challengers B" },
  { id: "08ce5e85-3947-479a-a60c-a19f421cd745", name: "Prospects A" },
  { id: "89a6face-301e-41ca-abd3-22bee4f91fff", name: "Prospects B" },
  { id: "a6796be3-941b-4ed0-86c8-22bf53774858", name: "Div4 A" },
  { id: "421850a7-8c87-43e5-b944-d8b58b118dc7", name: "Div4 B" },
  { id: "95fd2ef9-bbae-4359-beca-f3c8ff0e7cfb", name: "Div5 A" },
  { id: "81b43819-8e29-49b6-ae5d-aee2f598abd6", name: "Div5 B" },
  { id: "d8c44ae0-471d-4dfc-954e-220541221dd9", name: "Div6 A" },
  { id: "aec6c7cc-4a9d-436e-b612-531e0d973b11", name: "Div6 B" },
  { id: "6f2329a0-b125-4408-9ac4-4cc411ab2234", name: "Div7 A" },
  { id: "e25c6a1e-1aff-46c2-bcec-5aacb4f32ba3", name: "Div7 B" },
  { id: "3153daf1-b4a4-4bc5-85ee-cbbaed9fecee", name: "Div8 A" },
  { id: "afa68c7e-d320-476f-990b-1f011f190b61", name: "Div8 B" },
  { id: "82bdb385-4947-447a-9ae0-c941e20dd47f", name: "Div9 A" },
  { id: "9083499c-1129-473d-ac10-7334e87d8c2b", name: "Div9 B" },
  { id: "a93a3f63-de2e-4bd7-9cbd-71795ef4f272", name: "Div10" },
  { id: "5f261f15-f498-47fd-8823-5306f8c2372d", name: "Div11" }
];
