import { FancyMultiSelect } from "./fancy-multi-select";

interface MultiFiltersProps {
  seasons?: number[];
  setSeasons?: (seasons: number[]) => void;
  leagues?: number[];
  setLeagues?: (leagues: number[]) => void;
  stages?: number[];
  setStages?: (stages: number[]) => void;
  teams?: number[];
  setTeams?: (teams: number[]) => void;
  maps?: number[];
  setMaps?: (maps: number[]) => void;
}

export const MultiFilters = ({
  seasons,
  setSeasons,
  leagues,
  setLeagues,
  stages,
  setStages,
  teams,
  setTeams,
  maps,
  setMaps
}: MultiFiltersProps) => {
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <FancyMultiSelect placeholder="Select seasons" />
      <FancyMultiSelect placeholder="Select leagues" />
      <FancyMultiSelect placeholder="Select stage" />
      <FancyMultiSelect placeholder="Select teams" />
      <FancyMultiSelect placeholder="Select maps" />
    </div>
  );
};
