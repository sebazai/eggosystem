import { cn } from "@/lib/utils";
import React from "react";
import { FormLabel } from "./form";

interface RequiredFormLabelProps extends React.ComponentPropsWithoutRef<
  typeof FormLabel
> {
  required?: boolean;
}

export function RequiredFormLabel({
  children,
  required,
  className,
  ...props
}: RequiredFormLabelProps) {
  return (
    <FormLabel
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500">*</span>}
    </FormLabel>
  );
}
