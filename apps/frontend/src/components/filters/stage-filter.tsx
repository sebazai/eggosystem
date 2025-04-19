import type { MultiSelect } from "@/types/MultiSelectType";
import { FancySelect } from "./fancy-multi-select";
import type { Nullable } from "@eggosystem/types";
import _ from "lodash";
import { useState } from "react";

interface StageFilterProps {
  selectableStages?: number[];
  isValidating: boolean;
  openFilter: Nullable<string>;
  handleOpen: (filter: Nullable<string>) => void;
  handleSetSearchParams: (key: string, values: number[]) => void;
  selectedStages: number[];
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
  const [selectedItems, setSelectedItems] = useState<number[]>(
    props.selectedStages
  );

  const selectedIdsToSelectables = selectedItems.map((id) => ({
    value: id,
    label: allStages.find((stage) => stage.id === id)?.name ?? "Unknown"
  }));

  const selectableStages = _.intersectionWith(
    allStages,
    props.selectableStages ?? [],
    (a, b) => a.id === b
  );

  const handleSelectedItems = (value: MultiSelect<number>[]) => {
    const selectedValues = value.map((item) => item.value);
    if (props.openFilter !== "stages") {
      props.handleSetSearchParams("stages", selectedValues);
    }
    setSelectedItems(selectedValues);
  };

  const handleOpenFilter = (filter: Nullable<string>) => {
    if (filter === null) {
      props.handleSetSearchParams("stages", selectedItems);
    }
    props.handleOpen(filter);
  };

  return (
    <FancySelect<number>
      isMulti={true}
      filter={filterName}
      selectable={selectableStages.map((stage) => ({
        value: stage.id,
        label: stage.name
      }))}
      isValidating={props.isValidating}
      onSelectChange={handleSelectedItems}
      currentSelection={selectedIdsToSelectables}
      placeholder="Filter stages"
      isOpen={props.openFilter === filterName}
      setOpen={handleOpenFilter}
    />
  );
};
