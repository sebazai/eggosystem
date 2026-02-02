"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateWorkingDays,
  getDefaultStartDate,
  type WorkingDaysResult
} from "@/lib/working-days-calculator";

export default function TittaPage() {
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const result = useMemo<WorkingDaysResult | null>(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
    return calculateWorkingDays(startDate);
  }, [startDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Working days calculator
        </h1>
        <p className="text-muted-foreground mt-1">
          From start date to 31.8.2026. Excludes vacation 9.2.–25.2., Fiji
          public holidays, 25 unmarked holidays (Mon–Fri), and 2 travelling
          days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Period</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-xs">
            <Label htmlFor="titta-start">Start date</Label>
            <Input
              id="titta-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            End date: 31.8.2026 (fixed)
          </p>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Result</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {result.workingDays}
              </span>
              <span className="text-muted-foreground">working days</span>
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
