import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const EmailVerifiedIcon = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-sm text-green-500">
          <BadgeCheck className="w-4 h-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">Email verified</TooltipContent>
    </Tooltip>
  );
};
