import useSWR from "swr";
import { FancyMultiSelect } from "./fancy-multi-select";
import { fetcher } from "@/lib/utils";
import type { Nullable } from "@eggosystem/types";
import type { MultiSelect } from "@/types/MultiSelectType";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

interface ItemFilterProps<T> {
  filterName: string;
  labelKey: keyof T;
  selectable?: MultiSelect[];
  openFilter: Nullable<string>;
  handleOpen: (filter: Nullable<string>) => void;
  selectedItems: number[];
  setSelectedItems: (items: number[]) => void;
}

// Function to update search params
const updateSearchParams = (
  searchParams: ReadonlyURLSearchParams,
  key: string,
  value: number[]
) => {
  const params = new URLSearchParams(searchParams.toString());

  params.delete(key);
  value.forEach((v) => params.append(key, v.toString()));

  window.history.pushState(null, "", `?${params.toString()}`);
};

export const ItemFilter = <T extends { id: number }>(
  props: ItemFilterProps<T>
) => {
  const searchParams = useSearchParams();
  const { data, isLoading } = useSWR<T[]>(`/api/${props.filterName}`, fetcher, {
    revalidateOnFocus: false
  });

  if (isLoading || !data) return <div>Loading...</div>;

  const selectedIdsToSelectables = props.selectedItems.map((id) => {
    const label =
      data.find((item) => item.id === id)?.[props.labelKey as keyof T] ??
      "Unknown item";
    return {
      value: id,
      label: String(label)
    };
  });

  const handleSelectedItems = (selectedItems: MultiSelect[]) => {
    const selectedValues = selectedItems.map((item) => item.value);
    updateSearchParams(searchParams, props.filterName, selectedValues);
    props.setSelectedItems(selectedValues);
  };

  return (
    <FancyMultiSelect
      filter={props.filterName}
      selectable={data.map((item) => {
        return {
          value: item.id,
          label: String(item[props.labelKey as keyof T])
        };
      })}
      onSelectChange={handleSelectedItems}
      currentSelection={selectedIdsToSelectables}
      placeholder={`Filter ${props.filterName}`}
      isOpen={props.openFilter === props.filterName}
      setOpen={() => props.handleOpen(props.filterName)}
    />
  );
};
