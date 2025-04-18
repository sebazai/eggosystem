import * as React from "react";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CopyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export function CopyInput({ value, className, ...props }: CopyInputProps) {
  const [_copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2s
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <Input
        readOnly
        value={value}
        className={cn("pr-10 text-sm", className)}
        {...props}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        className="absolute right-1 h-7 w-7"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
