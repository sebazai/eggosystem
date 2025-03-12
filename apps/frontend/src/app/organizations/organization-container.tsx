import { SearchBar } from "@/components/search-bar";

export default function OrganizationContainer({
  searchQuery,
  setSearchQuery,
  children
}: {
  searchQuery: string;
  setSearchQuery: (newValue: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        id="sticky-header"
        className="sticky z-30 top-[var(--nav-height)] transition-[top] duration-300 ease-in-out sm:landscape:none xs:landscape:top-6 md:landscape:top-[var(--nav-height)]"
      >
        <SearchBar
          placeholder="Search organizations..."
          value={searchQuery}
          setValue={(newValue) => setSearchQuery(newValue)}
        />
      </div>
      <div>{children}</div>
    </div>
  );
}
