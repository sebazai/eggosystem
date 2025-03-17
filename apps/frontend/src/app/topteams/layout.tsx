export default function TopTeamsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-orange-400 font-headings">
        Top Teams
      </h1>
      {children}
    </div>
  );
}
