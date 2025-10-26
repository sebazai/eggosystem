export type MultiSelect<T> = {
  value: T;
  label: string;
  searchTerms?: string[];
  isInvalid?: boolean;
};
