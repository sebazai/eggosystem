import { FilterProvider } from "@/context/FilterContext";

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full min-w-0 justify-normal xxs:justify-center">
      <div className="w-full min-w-0 max-w-screen-2xl overflow-x-clip px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pb-6 sm:pb-8 lg:pb-12 xl:pb-16 2xl:pb-20">
        <FilterProvider appId="730">{children}</FilterProvider>
      </div>
    </div>
  );
}
