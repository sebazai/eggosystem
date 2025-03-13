function Spinner() {
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-4 border-transparent border-t-primary" />
    </div>
  );
}

export { Spinner };
