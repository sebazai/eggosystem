"use client";

import useSWR from "swr";
import { FancySelect } from "./FancyMultiSelect";
import { expressFetcher } from "@/lib/utils";
import type { Nullable } from "@eggosystem/types";
import type { MultiSelect } from "@/types/MultiSelectType";
import _ from "lodash";
import { useState, useEffect } from "react";

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
  const [selectedItems, setSelectedItems] = useState<number[]>(
    props.selectedItems
  );

  useEffect(() => {
    if (
      props.openFilter !== props.filterName &&
      !_.isEqual(selectedItems, props.selectedItems)
    ) {
      setSelectedItems(props.selectedItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedItems, props.openFilter, props.filterName]);

  const { data, isLoading } = useSWR<T[]>(
    `/api/v1/${props.filterName}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  if (isLoading || !data)
    return (
      <div className="flex justify-center items-center h-10" role="status">
        <div className="w-6 h-6 border-4 border-t-4 border-gray-300 border-t-ring rounded-full animate-spin"></div>
      </div>
    );

  const selectableIdsIntersection =
    data?.filter((item) => (props.selectableIds ?? []).includes(item.id)) ?? [];
  const selectableIds = props.sorter
    ? selectableIdsIntersection.sort(props.sorter)
    : selectableIdsIntersection;

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
    setSelectedItems(selectedValues);
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
      disabled={!selectableIds || selectableIds.length === 0}
    />
  );
};
