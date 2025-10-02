/**
 * Interface for custom column metadata used in table components
 * Provides configuration for responsive behavior, tooltips, and sorting
 */
export interface CustomColumnMeta {
  /** CSS classes for responsive behavior (e.g., "table-cell", "hidden md:table-cell") */
  responsive?: string;
  /** Tooltip text to display on hover */
  tooltip?: string;
  /** Whether the column is sortable */
  sortable?: boolean;
}
