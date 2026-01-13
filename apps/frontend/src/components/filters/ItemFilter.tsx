"use client";

import useSWR from "swr";
import { FancySelect } from "./FancyMultiSelect";
import { expressFetcher } from "@/lib/utils";
import type { Nullable } from "@eggosystem/types";
import type { MultiSelect } from "@/types/MultiSelectType";
import _ from "lodash";
import { useMemo } from "react";

interface ItemFilterProps<T> {
  filterName: string;
  labelKey: keyof T;
  selectableIds?: number[];
  isValidating: boolean;
  openFilter: Nullable<string>;
  handleOpen: (filter: Nullable<string>) => void;
  handleSetSearchParams: (key: string, values: number[]) => void;
  selectedItems: number[];
  sorter?: (a: T, b: T) => number;
}

export const ItemFilter = <T extends { id: number }>(
  props: ItemFilterProps<T>
) => {
  // Use controlled component pattern - derive state from props
  const selectedItems = props.selectedItems;

  const { data, isLoading } = useSWR<T[]>(
    `/api/v1/${props.filterName}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  // Compute selectableIds using useMemo instead of useState + useEffect
  const selectableIds = useMemo(() => {
    const selectableIdsIntersection: T[] =
      data?.filter((item) => (props.selectableIds ?? []).includes(item.id)) ??
      [];
    if (props.sorter) selectableIdsIntersection.sort(props.sorter);
    return selectableIdsIntersection;
  }, [data, props.selectableIds, props.sorter]);

  if (isLoading || !data)
    return (
      <div className="flex justify-center items-center h-10">
        <div
          className="w-6 h-6 border-4 border-t-4 border-gray-300 border-t-ring rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        ></div>
      </div>
    );

  const selectedIdsToSelectables = selectedItems.map((id) => {
    const label =
      data.find((item) => item.id === id)?.[props.labelKey as keyof T] ??
      "Unknown item";
    const isInvalid = !props.selectableIds?.includes(id);
    return {
      value: id,
      label: String(label),
      isInvalid
    };
  });

  const handleSelectedItems = (value: MultiSelect<number>[]) => {
    const selectedValues = value.map((item) => item.value);
    if (props.openFilter !== props.filterName) {
      props.handleSetSearchParams(props.filterName, selectedValues);
    }
    // State is controlled by parent via props
  };

  const handleOpenFilter = (filter: Nullable<string>) => {
    if (filter === null) {
      props.handleSetSearchParams(props.filterName, selectedItems);
    }
    props.handleOpen(filter);
  };

  return (
    <FancySelect<number>
      isMulti={true}
      filter={props.filterName}
      selectable={selectableIds.map((item) => ({
        value: item.id,
        label: String(item[props.labelKey])
      }))}
      isValidating={props.isValidating}
      onSelectChange={handleSelectedItems}
      currentSelection={selectedIdsToSelectables}
      placeholder={`Filter ${props.filterName}`}
      isOpen={props.openFilter === props.filterName}
      setOpen={handleOpenFilter}
    />
  );
};
