"use client";

import useSWR from "swr";
import { FancyMultiSelect } from "./fancy-multi-select";
import { fetcher } from "@/lib/utils";
import type { Nullable } from "@eggosystem/types";
import type { MultiSelect } from "@/types/MultiSelectType";
import _ from "lodash";
import { useState } from "react";

interface ItemFilterProps<T> {
  filterName: string;
  labelKey: keyof T;
  selectableIds?: number[];
  openFilter: Nullable<string>;
  handleOpen: (filter: Nullable<string>) => void;
  handleSetSearchParams: (key: string, values: number[]) => void;
  selectedItems: number[];
  setFilterParams: (value: number[]) => void;
  sorter?: (a: T, b: T) => number;
}

export const ItemFilter = <T extends { id: number }>(
  props: ItemFilterProps<T>
) => {
  const [selectedItems, setSelectedItems] = useState<number[]>(
    props.selectedItems
  );

  const { data, isLoading } = useSWR<T[]>(`/api/${props.filterName}`, fetcher, {
    revalidateOnFocus: false
  });

  if (isLoading || !data)
    return (
      <div className="flex justify-center items-center h-10">
        <div className="w-6 h-6 border-4 border-t-4 border-gray-300 border-t-ring rounded-full animate-spin"></div>
      </div>
    );

  const selectedIdsToSelectables = selectedItems.map((id) => {
    const label =
      data.find((item) => item.id === id)?.[props.labelKey as keyof T] ??
      "Unknown item";
    return {
      value: id,
      label: String(label)
    };
  });

  const selectableIdsIntersection: T[] = _.intersectionWith(
    data,
    props.selectableIds ?? [],
    (a: T, b: number) => a.id === b
  );

  if (props.sorter) selectableIdsIntersection.sort(props.sorter);

  const handleSelectedItems = (value: MultiSelect<number>[]) => {
    const selectedValues = value.map((item) => item.value);
    props.handleSetSearchParams(props.filterName, selectedValues);
    setSelectedItems(selectedValues);
  };

  return (
    <FancyMultiSelect<number>
      filter={props.filterName}
      selectable={selectableIdsIntersection.map((item) => ({
        value: item.id,
        label: String(item[props.labelKey])
      }))}
      onSelectChange={handleSelectedItems}
      currentSelection={selectedIdsToSelectables}
      placeholder={`Filter ${props.filterName}`}
      isOpen={props.openFilter === props.filterName}
      setOpen={(value) => {
        if (value === null) {
          props.setFilterParams(selectedItems);
        }
        props.handleOpen(value);
      }}
    />
  );
};
