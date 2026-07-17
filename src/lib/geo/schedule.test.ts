import { describe, it, expect } from "vitest";
import {
  normalizeRoadmap,
  weekStartDate,
  weekDueDate,
  isoDate,
  fmtWeekRange,
} from "./schedule";

const CREATED = "2026-07-17T09:30:00.000Z";

describe("week date derivation (due dates = plan creation + week offsets)", () => {
  it("week 1 starts on the plan creation date", () => {
    expect(isoDate(weekStartDate(CREATED, 1))).toBe("2026-07-17");
  });

  it("week 1 is due 7 days after creation", () => {
    expect(isoDate(weekDueDate(CREATED, 1))).toBe("2026-07-24");
  });

  it("week 8 is due 56 days after creation", () => {
    expect(isoDate(weekDueDate(CREATED, 8))).toBe("2026-09-11");
  });

  it("week N start == week N-1 due (contiguous weeks)", () => {
    expect(weekStartDate(CREATED, 5).getTime()).toBe(weekDueDate(CREATED, 4).getTime());
  });

  it("rolls over month and year boundaries", () => {
    expect(isoDate(weekDueDate("2026-12-29T00:00:00.000Z", 1))).toBe("2027-01-05");
  });

  it("accepts Date input too", () => {
    expect(isoDate(weekDueDate(new Date(CREATED), 2))).toBe("2026-07-31");
  });

  it("formats a readable week range", () => {
    expect(fmtWeekRange(CREATED, 1)).toBe("Jul 17 – Jul 24, 2026");
  });
});

describe("normalizeRoadmap (legacy array vs current {weeks, guidelines})", () => {
  const week = { week: 1, theme: "t", actions: [], kpi_checkpoint: "k" };

  it("wraps a legacy week array", () => {
    expect(normalizeRoadmap([week])).toEqual({ weeks: [week], guidelines: [] });
  });

  it("passes through the current doc shape", () => {
    const doc = { weeks: [week], guidelines: ["ship weekly"] };
    expect(normalizeRoadmap(doc)).toEqual(doc);
  });

  it("defaults missing guidelines to []", () => {
    expect(normalizeRoadmap({ weeks: [week] })).toEqual({ weeks: [week], guidelines: [] });
  });

  it("returns an empty doc for null/garbage", () => {
    expect(normalizeRoadmap(null)).toEqual({ weeks: [], guidelines: [] });
    expect(normalizeRoadmap("nope")).toEqual({ weeks: [], guidelines: [] });
    expect(normalizeRoadmap({ foo: 1 })).toEqual({ weeks: [], guidelines: [] });
  });
});
