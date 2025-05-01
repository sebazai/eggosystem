import { cn } from "@/lib/utils";

interface SponsorContainerProps {
  header: string;
  secondary?: boolean;
  classNames?: string;
  children: React.ReactNode;
}

export const SponsorContainer = ({
  children,
  header,
  secondary,
  classNames
}: SponsorContainerProps) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center", classNames)}
    >
      <span
        className={cn(
          "text-xl sm:text-3xl font-bold uppercase text-kanaliiga-orange mb-4 sm:mb-6",
          secondary && "text-kanaliiga-light-brown",
          secondary && "text-lg sm:text-2xl font-semibold"
        )}
      >
        {header}
      </span>
      <div
        className={cn(
          "flex gap-10 sm:gap-20 items-center justify-center flex-wrap p-5 sm:p-15 bg-white/70 rounded-lg",
          secondary && "sm:p-5"
        )}
      >
        {children}
      </div>
    </div>
  );
};
