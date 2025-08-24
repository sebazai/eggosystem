import { FilterProvider } from "@/context/FilterContext";

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-normal xxs:justify-center">
      <div className="w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <FilterProvider appId="730">{children}</FilterProvider>
      </div>
    </div>
  );
}
