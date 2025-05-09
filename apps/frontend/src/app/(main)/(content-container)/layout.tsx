import { FilterProvider } from "@/context/FilterContext";

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-normal xxs:justify-center">
      <div className="w-full max-w-screen-2xl px-2 sm:px-8 lg:px-16">
        <FilterProvider appId="730">{children}</FilterProvider>
      </div>
    </div>
  );
}
