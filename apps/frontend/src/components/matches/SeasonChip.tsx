interface SeasonChipProps {
  label: string;
}

export function SeasonChip({ label }: SeasonChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-kanaliiga-light-brown/40 bg-kanaliiga-light-brown/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.08em] text-kanaliiga-light-brown">
      {label}
    </span>
  );
}
