import { formatDateForDatabase } from "./date-utils";

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

  it("should convert timezone offsets to UTC correctly", () => {
    // Test positive timezone offset (ahead of UTC)
    const result1 = formatDateForDatabase("2025-01-15T20:30:00+02:00");
    expect(result1).toBe("2025-01-15 18:30:00"); // 20:30 +02:00 = 18:30 UTC

    // Test negative timezone offset (behind UTC)
    const result2 = formatDateForDatabase("2025-01-15T05:30:00-05:00");
    expect(result2).toBe("2025-01-15 10:30:00"); // 05:30 -05:00 = 10:30 UTC

    // Test with different positive offset
    const result3 = formatDateForDatabase("2025-01-15T23:00:00+03:00");
    expect(result3).toBe("2025-01-15 20:00:00"); // 23:00 +03:00 = 20:00 UTC

    // Test with different negative offset
    const result4 = formatDateForDatabase("2025-01-15T00:00:00-08:00");
    expect(result4).toBe("2025-01-15 08:00:00"); // 00:00 -08:00 = 08:00 UTC
  });

  it("should handle UTC timezone (Z) correctly", () => {
    const result = formatDateForDatabase("2025-01-15T10:30:00Z");
    expect(result).toBe("2025-01-15 10:30:00");
  });

  it("should assume UTC when no timezone is provided", () => {
    // String without timezone info is assumed to be UTC
    const result = formatDateForDatabase("2025-01-15T10:30:00");
    expect(result).toBe("2025-01-15 10:30:00");
  });

  it("should handle Date objects created in different timezones", () => {
    // Create a Date object from UTC timestamp
    const utcDate = new Date("2025-01-15T10:30:00Z");
    const result1 = formatDateForDatabase(utcDate);
    expect(result1).toBe("2025-01-15 10:30:00");

    // Create a Date object from ISO string with timezone
    const dateWithTimezone = new Date("2025-01-15T20:30:00+02:00");
    const result2 = formatDateForDatabase(dateWithTimezone);
    expect(result2).toBe("2025-01-15 18:30:00"); // Converted to UTC
  });

  it("should handle timezone offsets that cross day boundaries", () => {
    // Positive offset that goes to next day
    const result1 = formatDateForDatabase("2025-01-15T22:00:00+03:00");
    expect(result1).toBe("2025-01-15 19:00:00"); // 22:00 +03:00 = 19:00 UTC (same day)

    // Positive offset that goes to previous day
    const result2 = formatDateForDatabase("2025-01-15T01:00:00+03:00");
    expect(result2).toBe("2025-01-14 22:00:00"); // 01:00 +03:00 = 22:00 UTC (previous day)

    // Negative offset that goes to next day
    const result3 = formatDateForDatabase("2025-01-15T23:00:00-05:00");
    expect(result3).toBe("2025-01-16 04:00:00"); // 23:00 -05:00 = 04:00 UTC (next day)
  });

  it("should handle various timezone formats", () => {
    // Test with milliseconds and timezone
    const result1 = formatDateForDatabase("2025-01-15T10:30:00.123+02:00");
    expect(result1).toBe("2025-01-15 08:30:00");

    // Test with timezone offset without colon (not standard but should handle)
    const result2 = formatDateForDatabase("2025-01-15T10:30:00+0200");
    expect(result2).toBe("2025-01-15 08:30:00");
  });

  it("should handle extreme timezone offsets", () => {
    // UTC+14 (one of the furthest ahead)
    const result1 = formatDateForDatabase("2025-01-15T14:00:00+14:00");
    expect(result1).toBe("2025-01-15 00:00:00");

    // UTC-12 (one of the furthest behind)
    const result2 = formatDateForDatabase("2025-01-15T00:00:00-12:00");
    expect(result2).toBe("2025-01-15 12:00:00");
  });
});
