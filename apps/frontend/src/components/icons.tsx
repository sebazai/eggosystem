import { AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./ui/tooltip";

function Spinner() {
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-4 border-transparent border-t-primary" />
    </div>
  );
}

const WarningTooltipIcon = ({ text }: { text: string }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-yellow-500 cursor-default">
            <AlertTriangle className="w-5 h-5" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="shadow-md border rounded-md px-3 py-2 text-sm"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { Spinner, WarningTooltipIcon };
