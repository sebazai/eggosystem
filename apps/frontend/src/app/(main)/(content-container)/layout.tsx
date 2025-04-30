export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-grow justify-center w-full">
      <div className="w-full max-w-screen-2xl px-4 sm:px-8 lg:px-16">
        {children}
      </div>
    </div>
  );
}
