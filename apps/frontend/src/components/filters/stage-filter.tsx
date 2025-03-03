import { FancyMultiSelect } from "./fancy-multi-select";
import type { Nullable } from "@eggosystem/types";
import type { MultiSelect } from "@/types/MultiSelectType";

interface StageFilterProps {
  selectable?: MultiSelect[];
  openFilter: Nullable<string>;
  handleOpen: (filter: Nullable<string>) => void;
  selectedStages: number[];
  setSelectedStageIds: (leagues: number[]) => void;
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

  return (
    <FancyMultiSelect
      filter={filterName}
      selectable={allStages.map((item) => ({
        value: item.id,
        label: item.name
      }))}
      onSelectChange={(stages) =>
        props.setSelectedStageIds(stages.map((item) => item.value))
      }
      currentSelection={selectedIdsToSelectables}
      placeholder="Filter stages"
      isOpen={props.openFilter === filterName}
      setOpen={() => props.handleOpen(filterName)}
    />
  );
};
