import { FancyMultiSelect } from "./fancy-multi-select";
import clsx from "clsx";
import { MapsFilter } from "./maps-filter";

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

export const MultiFilters = (props: MultiFiltersProps) => {
  // How many props are passed to FancyMultiSelect?
  const columns = Math.round(Object.keys(props).length / 2);
  return (
    <div
      className={clsx(
        `mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`,
        {
          "xl:grid-cols-5": columns === 5,
          "xl:grid-cols-4": columns === 4,
          "xl:grid-cols-3": columns === 3,
          "xl:grid-cols-2": columns === 2
        }
      )}
    >
      {props.seasons && props.setSeasons && (
        <FancyMultiSelect placeholder="Select seasons" />
      )}
      {props.leagues && props.setLeagues && (
        <FancyMultiSelect placeholder="Select leagues" />
      )}
      {props.stages && props.setStages && (
        <FancyMultiSelect placeholder="Select stages" />
      )}
      {props.teams && props.setTeams && (
        <FancyMultiSelect placeholder="Select teams" />
      )}
      {props.maps && props.setMaps && <MapsFilter />}
    </div>
  );
};
