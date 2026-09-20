import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatJournalDate,
  isIsoDate,
  isLive,
  todayInStudioTimeZone,
} from "./journalDate";

// The journal's date is a calendar day the editor picked, and "today" is the
// day in the studio's own time zone (spec 013 FR-007a, FR-010). Both are easy
// to get subtly wrong in a way that shows a real reader the wrong date, so the
// cases below are the specific wrong answers, not just the happy path.

const originalTZ = process.env.TZ;

afterEach(() => {
  vi.useRealTimers();
  process.env.TZ = originalTZ;
});

describe("todayInStudioTimeZone", () => {
  it("returns a sortable YYYY-MM-DD", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-15T16:00:00Z"));

    expect(todayInStudioTimeZone()).toBe("2026-09-15");
  });

  it("is still yesterday in Toronto when it is already tomorrow in UTC", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 23:30 on the 15th in Toronto (EDT, UTC-4).
    vi.setSystemTime(new Date("2026-09-16T03:30:00Z"));

    expect(todayInStudioTimeZone()).toBe("2026-09-15");
  });

  it("follows daylight saving rather than a fixed offset", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // DST ends at 02:00 EDT on 1 November 2026. 04:30Z is 00:30 EDT on the
    // 1st; a hardcoded EST offset would call it 23:30 on 31 October.
    vi.setSystemTime(new Date("2026-11-01T04:30:00Z"));

    expect(todayInStudioTimeZone()).toBe("2026-11-01");
  });
});

describe("formatJournalDate", () => {
  it("formats the calendar date the editor chose", () => {
    expect(formatJournalDate("2026-09-15")).toBe("September 15, 2026");
  });

  // `new Date("2026-09-15")` is UTC midnight, which is still the 14th for
  // everyone west of Greenwich. These two zones sit either side of UTC so a
  // formatter that parses and localises is caught whichever way it drifts.
  it.each(["America/Los_Angeles", "Pacific/Auckland"])(
    "shows the same date for a reader in %s",
    (zone) => {
      process.env.TZ = zone;

      expect(formatJournalDate("2026-09-15")).toBe("September 15, 2026");
    },
  );

  it("refuses a value that is not a calendar date", () => {
    expect(() => formatJournalDate("15/09/2026")).toThrow(/YYYY-MM-DD/);
  });
});

describe("isLive", () => {
  it("is live on its own date and every date after", () => {
    expect(isLive("2026-09-15", "2026-09-15")).toBe(true);
    expect(isLive("2026-09-14", "2026-09-15")).toBe(true);
  });

  it("is scheduled while its date is still ahead", () => {
    expect(isLive("2026-09-16", "2026-09-15")).toBe(false);
  });
});

describe("isIsoDate", () => {
  it.each(["2026-09-15", "2024-02-29"])("accepts %s", (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each(["2026-9-15", "2026-09-15T00:00:00Z", "2026-02-30", "", "soon"])(
    "rejects %j",
    (value) => {
      expect(isIsoDate(value)).toBe(false);
    },
  );
});
