import { FancyMultiSelect } from "./fancy-multi-select";
import type { Nullable } from "@eggosystem/types";
import _ from "lodash";

interface StageFilterProps {
  selectableStages?: number[];
  openFilter: Nullable<string>;
  handleOpen: (filter: Nullable<string>) => void;
  handleSetSearchParams: (key: string, values: number[]) => void;
  selectedStages: number[];
  setSelectedStageIds: (stages: number[]) => void;
}

const allStages = [
  {
    id: 1,
    name: "Regular"
  },
  {
    id: 2,
    name: "Playoffs"
  }
];

export const StageFilter = (props: StageFilterProps) => {
  const filterName = "stages";

  const selectedIdsToSelectables = props.selectedStages.map((id) => ({
    value: id,
    label: allStages.find((stage) => stage.id === id)?.name ?? "Unknown"
  }));

  const selectableStages = _.intersectionWith(
    allStages,
    props.selectableStages ?? [],
    (a, b) => a.id === b
  );

  return (
    <FancyMultiSelect
      filter={filterName}
      selectable={selectableStages.map((stage) => ({
        value: stage.id,
        label: stage.name
      }))}
      onSelectChange={(stages) => {
        const newStages = stages.map((item) => item.value);
        props.setSelectedStageIds(newStages);
        props.handleSetSearchParams(filterName, newStages);
      }}
      currentSelection={selectedIdsToSelectables}
      placeholder="Filter stages"
      isOpen={props.openFilter === filterName}
      setOpen={() => props.handleOpen(filterName)}
    />
  );
};
