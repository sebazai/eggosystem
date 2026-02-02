"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateWorkingDays,
  DEFAULT_END_DATE,
  getDefaultStartDate,
  type WorkingDaysResult
} from "@/lib/working-days-calculator";

function getCheerMessage(workingDays: number): {
  message: string;
  emoji: string;
} {
  if (workingDays <= 0)
    return {
      message: "You did it! Time to celebrate.",
      emoji: "🎉"
    };
  if (workingDays <= 4)
    return {
      message: "So close! Just a few more days — you've got this!",
      emoji: "💪"
    };
  if (workingDays <= 14)
    return {
      message: "Final stretch! Two weeks or less — you're almost there.",
      emoji: "🌟"
    };
  if (workingDays <= 30)
    return {
      message: "Making great progress! One day at a time.",
      emoji: "✨"
    };
  if (workingDays <= 50)
    return {
      message: "You're on track. One week at a time — you can do this!",
      emoji: "🌈"
    };
  if (workingDays <= 60)
    return {
      message: "Under 60 working days left. You're doing great, Titta!",
      emoji: "☀️"
    };
  if (workingDays <= 75)
    return {
      message: "Roughly 3 months of work days to go. Steady progress!",
      emoji: "🌺"
    };
  if (workingDays <= 100)
    return {
      message: "About 4 months of work days — you've got a solid plan.",
      emoji: "🏝️"
    };
  return {
    message: "Plenty of time. You've got this, Titta!",
    emoji: "🌴"
  };
}

export default function TittaPage() {
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
  const result = useMemo<WorkingDaysResult | null>(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
    return calculateWorkingDays(startDate, endDate);
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Working days calculator
        </h1>
        <p className="text-muted-foreground mt-1">
          From start date to end date (default 31.8.2026). Excludes vacation
          9.2.–25.2., Fiji public holidays, 25 unmarked holidays (Mon–Fri), and
          2 travelling days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Period</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 max-w-md">
            <div className="grid gap-2">
              <Label htmlFor="titta-start">Start date</Label>
              <Input
                id="titta-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titta-end">End date</Label>
              <Input
                id="titta-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Default end date: 31.8.2026
          </p>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Result</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const { message, emoji } = getCheerMessage(result.workingDays);
              return (
                <div
                  className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
                  role="status"
                >
                  <span className="mr-2 text-xl" aria-hidden>
                    {emoji}
                  </span>
                  <span className="font-medium text-foreground">{message}</span>
                </div>
              );
            })()}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {result.workingDays}
              </span>
              <span className="text-muted-foreground">working days</span>
            </div>
            <div className="flex items-baseline gap-2 text-muted-foreground">
              <span className="text-xl font-semibold text-foreground">
                {result.completeWorkWeeks}
              </span>
              <span>complete work weeks</span>
            </div>
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Weekdays in range (Mon–Fri)
                </dt>
                <dd>{result.weekdaysInRange}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Excluded: vacation (9.2.–25.2.)
                </dt>
                <dd>-{result.vacationDaysExcluded}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Excluded: Fiji public holidays
                </dt>
                <dd>-{result.fijiHolidaysExcluded}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Excluded: 25 unmarked holidays
                </dt>
                <dd>-{result.unmarkedHolidays}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Excluded: 2 travelling days
                </dt>
                <dd>-{result.travellingDays}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
