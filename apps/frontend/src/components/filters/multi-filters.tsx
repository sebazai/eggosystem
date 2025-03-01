import { FancyMultiSelect } from "./fancy-multi-select";
import clsx from "clsx";
import { useState } from "react";

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
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const handleOpen = (filter: string | null) => {
    if (filter === null) {
      setOpenFilter(null);
      return;
    }
    setOpenFilter((prev: string | null) => (prev === filter ? null : filter));
  };

  // How many props are passed to FancyMultiSelect?
  const columns = Math.round(Object.keys(props).length / 2);
  return (
    <div
      className={clsx(
        `mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4`,
        {
          "xl:grid-cols-5": columns === 5,
          "xl:grid-cols-4": columns === 4,
          "xl:grid-cols-3": columns === 3,
          "xl:grid-cols-2": columns === 2
        }
      )}
    >
      {props.seasons && props.setSeasons && (
        <FancyMultiSelect
          filter="seasons"
          placeholder="Filter seasons"
          isOpen={openFilter === "seasons"}
          setOpen={() => handleOpen("seasons")}
        />
      )}
      {props.leagues && props.setLeagues && (
        <FancyMultiSelect
          filter="leagues"
          placeholder="Filter leagues"
          isOpen={openFilter === "leagues"}
          setOpen={() => handleOpen("leagues")}
        />
      )}
      {props.stages && props.setStages && (
        <FancyMultiSelect
          filter="stages"
          placeholder="Filter stages"
          isOpen={openFilter === "stages"}
          setOpen={() => handleOpen("stages")}
        />
      )}
      {props.teams && props.setTeams && (
        <FancyMultiSelect
          filter="teams"
          placeholder="Filter teams"
          isOpen={openFilter === "teams"}
          setOpen={() => handleOpen("teams")}
        />
      )}
      {props.maps && props.setMaps && (
        <FancyMultiSelect
          filter="maps"
          placeholder="Filter maps"
          isOpen={openFilter === "maps"}
          setOpen={() => handleOpen("maps")}
        />
      )}
    </div>
  );
};
