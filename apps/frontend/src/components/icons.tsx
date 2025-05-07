"use client";

import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/useIsMobile";

function Spinner() {
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-4 border-transparent border-t-primary" />
    </div>
  );
}

type TooltipIconProps = {
  text: string;
  icon?: React.ReactNode;
};

const TooltipIcon = ({ text, icon }: TooltipIconProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {icon ?? <InfoIcon className="min-w-4 min-h-4 w-4 h-4" />}
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="text-sm rounded shadow-lg z-[100]"
        >
          <span className="w-50 block">{text}</span>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {icon ?? <InfoIcon className="min-w-4 min-h-4 w-4 h-4" />}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="shadow-md border rounded-md px-3 py-2 text-sm"
        >
          <span className="w-100 block">{text}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TooltipIcon;

export { Spinner, TooltipIcon };
