"use client";

import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";

interface StatDisplayProps {
    /** Label for the stat */
    label: string;
    /** The numeric or string value to display */
    value: number | string;
    /** Optional description shown in tooltip */
    description?: string;
    /** Comparison value and label for showing delta */
    comparison?: {
        value: number;
        label: string; // "team avg", "league avg", "opponent"
    };
    /** Show a progress bar */
    showProgressBar?: boolean;
    /** Maximum value for progress bar (default: 100) */
    maxValue?: number;
    /** How to format the value */
    format?: "percentage" | "decimal" | "integer";
    /** Whether higher values are better (affects delta color) */
    colorScale?: "positive" | "negative";
    /** Additional CSS classes */
    className?: string;
    /** Size variant */
    size?: "sm" | "md" | "lg";
}

function getProgressBarColor(percentage: number): string {
    if (percentage >= 70) return "bg-green-500/50";
    if (percentage >= 40) return "bg-yellow-500/50";
    return "bg-red-500/50";
}

export function StatDisplay({
    label,
    value,
    description,
    comparison,
    showProgressBar = false,
    maxValue = 100,
    format = "decimal",
    colorScale = "positive",
    className,
    size = "md"
}: StatDisplayProps) {
    const numericValue =
        typeof value === "number" ? value : parseFloat(value) || 0;
    const delta = comparison ? numericValue - comparison.value : null;

    const getDeltaColor = () => {
        if (delta === null || delta === 0) return "text-muted-foreground";
        const isPositive = colorScale === "positive" ? delta > 0 : delta < 0;
        return isPositive ? "text-green-500" : "text-red-500";
    };

    const formatValue = (val: number) => {
        if (isNaN(val)) return "N/A";
        switch (format) {
            case "percentage":
                return `${val.toFixed(1)}%`;
            case "integer":
                return Math.round(val).toString();
            default:
                return val.toFixed(2);
        }
    };

    const formatDelta = (val: number) => {
        const prefix = val > 0 ? "+" : "";
        switch (format) {
            case "percentage":
                return `${prefix}${val.toFixed(1)}%`;
            case "integer":
                return `${prefix}${Math.round(val)}`;
            default:
                return `${prefix}${val.toFixed(2)}`;
        }
    };

    const progressPercentage = Math.min(100, (numericValue / maxValue) * 100);

    const sizeClasses = {
        sm: { label: "text-xs", value: "text-sm font-medium", bar: "h-1.5" },
        md: { label: "text-sm", value: "text-base font-bold", bar: "h-2" },
        lg: { label: "text-base", value: "text-xl font-bold", bar: "h-2.5" }
    };

    return (
        <div className={cn("space-y-1", className)}>
            {/* Label row with value */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <span className={cn("text-muted-foreground", sizeClasses[size].label)}>
                        {label}
                    </span>
                    {description && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] text-sm">
                                {description}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
                <span className={sizeClasses[size].value}>
                    {typeof value === "string" ? value : formatValue(numericValue)}
                </span>
            </div>

            {/* Progress bar */}
            {showProgressBar && (
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "flex-1 bg-gray-800 rounded-full overflow-hidden",
                            sizeClasses[size].bar
                        )}
                    >
                        <div
                            className={cn("h-full", getProgressBarColor(progressPercentage))}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    {delta !== null && (
                        <span className={cn("text-xs whitespace-nowrap", getDeltaColor())}>
                            {formatDelta(delta)} vs {comparison?.label}
                        </span>
                    )}
                </div>
            )}

            {/* Delta only (no progress bar) */}
            {!showProgressBar && delta !== null && (
                <span className={cn("text-xs", getDeltaColor())}>
                    {formatDelta(delta)} vs {comparison?.label}
                </span>
            )}
        </div>
    );
}

// Compact inline variant for tables
interface InlineStatProps {
    value: number | string;
    comparison?: number;
    format?: "percentage" | "decimal" | "integer";
    colorScale?: "positive" | "negative";
}

export function InlineStat({
    value,
    comparison,
    format = "decimal",
    colorScale = "positive"
}: InlineStatProps) {
    const numericValue =
        typeof value === "number" ? value : parseFloat(value) || 0;
    const delta = comparison !== undefined ? numericValue - comparison : null;

    const getDeltaColor = () => {
        if (delta === null || delta === 0) return "";
        const isPositive = colorScale === "positive" ? delta > 0 : delta < 0;
        return isPositive ? "text-green-500" : "text-red-500";
    };

    const formatValue = (val: number) => {
        if (isNaN(val)) return "N/A";
        switch (format) {
            case "percentage":
                return `${val.toFixed(1)}%`;
            case "integer":
                return Math.round(val).toString();
            default:
                return val.toFixed(2);
        }
    };

    return (
        <span className={cn("font-medium", getDeltaColor())}>
            {typeof value === "string" ? value : formatValue(numericValue)}
        </span>
    );
}
