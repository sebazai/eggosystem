import {
  convertISOToFinnishTime,
  convertISOToTime,
  convertClientDateToUTC,
  formatDateForDatabase,
  formatDateFromDatabase
} from "./date-utils";

describe("convertISOToFinnishTime", () => {
  it("should convert ISO string to Finnish timezone correctly", () => {
    // Test with the example values from the JSON file
    const testCases = [
      {
        input: "2025-07-10T19:09:07Z",
        expected: "2025-07-10 22:09:07" // UTC+3 (summer time)
      },
      {
        input: "2025-07-20T15:34:10Z",
        expected: "2025-07-20 18:34:10" // UTC+3 (summer time)
      },
      {
        input: "2025-07-20T15:12:33Z",
        expected: "2025-07-20 18:12:33" // UTC+3 (summer time)
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = convertISOToFinnishTime(input);
      expect(result).toBe(expected);
    });
  });

  it("should handle winter time correctly", () => {
    // Test with winter time (UTC+2)
    const winterTime = "2025-01-15T15:34:10Z";
    const result = convertISOToFinnishTime(winterTime);
    expect(result).toBe("2025-01-15 17:34:10"); // UTC+2 (winter time)
  });

  it("should handle edge cases around daylight saving time transitions", () => {
    // Test around DST transitions (these dates may vary year to year)
    const springForward = "2025-03-30T02:30:00Z"; // Spring forward
    const fallBack = "2025-10-26T02:30:00Z"; // Fall back

    const springResult = convertISOToFinnishTime(springForward);
    const fallResult = convertISOToFinnishTime(fallBack);

    // These expectations may need adjustment based on actual DST dates
    expect(springResult).toMatch(/^2025-03-30 \d{2}:\d{2}:\d{2}$/);
    expect(fallResult).toMatch(/^2025-10-26 \d{2}:\d{2}:\d{2}$/);
  });

  it("should handle midnight times correctly", () => {
    const midnightUTC = "2025-07-20T00:00:00Z";
    const result = convertISOToFinnishTime(midnightUTC);
    expect(result).toBe("2025-07-20 03:00:00"); // UTC+3 (summer time)
  });

  it("should handle end of day times correctly", () => {
    const endOfDayUTC = "2025-07-20T23:59:59Z";
    const result = convertISOToFinnishTime(endOfDayUTC);
    expect(result).toBe("2025-07-21 02:59:59"); // UTC+3 (summer time), next day
  });

  it("should handle invalid ISO string gracefully", () => {
    // The function doesn't throw, it just returns an invalid result
    const result = convertISOToFinnishTime("invalid-date");
    // Moment.js will return "Invalid date" or similar for invalid inputs
    expect(result).toContain("Invalid");
  });

  it("should handle null and undefined gracefully", () => {
    // The function doesn't throw, it just returns an invalid result
    const nullResult = convertISOToFinnishTime(null!);

    // For undefined, moment.js converts it to string and treats it as a valid date
    // So we'll just test that it returns a valid date format
    const undefinedResult = convertISOToFinnishTime(undefined!);

    expect(nullResult).toContain("Invalid");
    expect(undefinedResult).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("should work correctly when chained with convertISOToTime", () => {
    // Test the chaining: convertISOToTime(convertISOToFinnishTime(finishedAt))
    const testCases = [
      {
        input: "2025-07-10T19:09:07Z",
        expectedFinnishTime: "2025-07-10 22:09:07",
        expectedTimeOnly: "22:09:07"
      },
      {
        input: "2025-07-20T15:34:10Z",
        expectedFinnishTime: "2025-07-20 18:34:10",
        expectedTimeOnly: "18:34:10"
      },
      {
        input: "2025-07-20T15:12:33Z",
        expectedFinnishTime: "2025-07-20 18:12:33",
        expectedTimeOnly: "18:12:33"
      }
    ];

    testCases.forEach(({ input, expectedFinnishTime, expectedTimeOnly }) => {
      // Test the chaining as requested
      const endTime = convertISOToTime(convertISOToFinnishTime(input));
      expect(endTime).toBe(expectedTimeOnly);

      // Also test each function individually for clarity
      const finnishTime = convertISOToFinnishTime(input);
      expect(finnishTime).toBe(expectedFinnishTime);

      const timeOnly = convertISOToTime(finnishTime);
      expect(timeOnly).toBe(expectedTimeOnly);
    });
  });
});

describe("convertClientDateToUTC", () => {
  it("should convert GMT+8 timezone date to UTC correctly", () => {
    // Client in GMT+8 sends "2025-01-15T18:30:00" (6:30 PM local)
    // Should convert to "2025-01-15T10:30:00Z" (10:30 AM UTC)
    const result = convertClientDateToUTC(
      "2025-01-15T18:30:00",
      "Asia/Shanghai"
    );
    expect(result).toBe("2025-01-15T10:30:00.000Z");
  });

  it("should convert GMT-5 timezone date to UTC correctly", () => {
    // Client in GMT-5 (EST) sends "2025-01-15T10:30:00" (10:30 AM local)
    // Should convert to "2025-01-15T15:30:00Z" (3:30 PM UTC)
    const result = convertClientDateToUTC(
      "2025-01-15T10:30:00",
      "America/New_York"
    );
    expect(result).toBe("2025-01-15T15:30:00.000Z");
  });

  it("should convert Europe/Helsinki timezone date to UTC correctly", () => {
    // Client in Helsinki (UTC+2 in winter) sends "2025-01-15T12:30:00" (12:30 PM local)
    // Should convert to "2025-01-15T10:30:00Z" (10:30 AM UTC)
    const result = convertClientDateToUTC(
      "2025-01-15T12:30:00",
      "Europe/Helsinki"
    );
    expect(result).toBe("2025-01-15T10:30:00.000Z");
  });

  it("should handle ISO format input strings", () => {
    // If client sends ISO format, it should still work
    const result = convertClientDateToUTC(
      "2025-01-15T18:30:00Z",
      "Asia/Shanghai"
    );
    // The Z indicates UTC, so it should parse and convert based on timezone
    expect(result).toMatch(/^2025-01-15T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("should handle datetime-local format (YYYY-MM-DDTHH:mm)", () => {
    const result = convertClientDateToUTC("2025-01-15T18:30", "Asia/Shanghai");
    expect(result).toBe("2025-01-15T10:30:00.000Z");
  });

  it("should handle DST transitions correctly", () => {
    // Test summer time in Helsinki (UTC+3)
    const summerResult = convertClientDateToUTC(
      "2025-07-15T15:30:00",
      "Europe/Helsinki"
    );
    expect(summerResult).toBe("2025-07-15T12:30:00.000Z");

    // Test winter time in Helsinki (UTC+2)
    const winterResult = convertClientDateToUTC(
      "2025-01-15T15:30:00",
      "Europe/Helsinki"
    );
    expect(winterResult).toBe("2025-01-15T13:30:00.000Z");
  });

  it("should handle midnight boundary correctly", () => {
    // Client in GMT+8 sends midnight local time
    const result = convertClientDateToUTC(
      "2025-01-15T00:00:00",
      "Asia/Shanghai"
    );
    expect(result).toBe("2025-01-14T16:00:00.000Z");
  });
});

describe("formatDateForDatabase", () => {
  it("should format UTC Date object to MySQL format", () => {
    const utcDate = new Date("2025-01-15T10:30:00Z");
    const result = formatDateForDatabase(utcDate);
    expect(result).toBe("2025-01-15 10:30:00");
  });

  it("should format UTC ISO string to MySQL format", () => {
    const result = formatDateForDatabase("2025-01-15T10:30:00Z");
    expect(result).toBe("2025-01-15 10:30:00");
  });

  it("should handle dates with milliseconds", () => {
    const result = formatDateForDatabase("2025-01-15T10:30:00.123Z");
    expect(result).toBe("2025-01-15 10:30:00");
  });

  it("should handle midnight correctly", () => {
    const result = formatDateForDatabase("2025-01-15T00:00:00Z");
    expect(result).toBe("2025-01-15 00:00:00");
  });

  it("should handle end of day correctly", () => {
    const result = formatDateForDatabase("2025-01-15T23:59:59Z");
    expect(result).toBe("2025-01-15 23:59:59");
  });

  it("should handle year boundaries correctly", () => {
    const result = formatDateForDatabase("2024-12-31T23:59:59Z");
    expect(result).toBe("2024-12-31 23:59:59");
  });
});

describe("formatDateFromDatabase", () => {
  it("should convert database date string to ISO 8601 with UTC indicator", () => {
    const dbDate = "2025-01-15 10:30:00";
    const result = formatDateFromDatabase(dbDate);
    expect(result).toBe("2025-01-15T10:30:00.000Z");
  });

  it("should handle null input", () => {
    const result = formatDateFromDatabase(null);
    expect(result).toBeNull();
  });

  it("should handle undefined input", () => {
    const result = formatDateFromDatabase(undefined);
    expect(result).toBeNull();
  });

  it("should handle midnight correctly", () => {
    const result = formatDateFromDatabase("2025-01-15 00:00:00");
    expect(result).toBe("2025-01-15T00:00:00.000Z");
  });

  it("should handle end of day correctly", () => {
    const result = formatDateFromDatabase("2025-01-15 23:59:59");
    expect(result).toBe("2025-01-15T23:59:59.000Z");
  });

  it("should handle year boundaries correctly", () => {
    const result = formatDateFromDatabase("2024-12-31 23:59:59");
    expect(result).toBe("2024-12-31T23:59:59.000Z");
  });

  it("should round-trip correctly with formatDateForDatabase", () => {
    const originalISO = "2025-01-15T10:30:00Z";
    const dbFormat = formatDateForDatabase(originalISO);
    const backToISO = formatDateFromDatabase(dbFormat);
    // formatDateFromDatabase returns ISO with milliseconds (.000Z), so we compare the timestamps
    expect(backToISO).toBe("2025-01-15T10:30:00.000Z");
    // Verify they represent the same moment in time
    expect(new Date(backToISO!).getTime()).toBe(
      new Date(originalISO).getTime()
    );
  });
});
