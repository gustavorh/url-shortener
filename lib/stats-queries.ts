import { fn, col } from "sequelize";
import { Click, Url } from "@/models";

export interface DailyCount {
  date: string;
  count: number;
}

export interface LabeledCount {
  label: string;
  count: number;
}

export interface HourlyCount {
  hour: number;
  count: number;
}

export interface LinkStats {
  total: number;
  byDay: DailyCount[];
  byHour: HourlyCount[];
  topReferrers: LabeledCount[];
  byDevice: LabeledCount[];
  byBrowser: LabeledCount[];
  byCountry: LabeledCount[];
  byTarget: LabeledCount[];
}

/** Clicks bucketed by hour of day (0-23), all 24 buckets present. */
export async function getClicksByHour(
  urlId: string
): Promise<HourlyCount[]> {
  const rows = (await Click.findAll({
    attributes: [
      [fn("HOUR", col("timestamp")), "hour"],
      [fn("COUNT", col("id")), "count"],
    ],
    where: { urlId },
    group: [fn("HOUR", col("timestamp"))],
    raw: true,
  })) as unknown as { hour: number; count: number }[];

  const counts = new Map(
    rows.map((row) => [Number(row.hour), Number(row.count)])
  );
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: counts.get(hour) ?? 0,
  }));
}

type GroupableColumn =
  | "referrer"
  | "referrerDomain"
  | "deviceType"
  | "browser"
  | "country"
  | "targetUrl";

/** Total clicks for a single link. */
export async function getTotalClicks(urlId: string): Promise<number> {
  return Click.count({ where: { urlId } });
}

/** Clicks per calendar day for a link, oldest first. */
export async function getClicksByDay(urlId: string): Promise<DailyCount[]> {
  const rows = (await Click.findAll({
    attributes: [
      [fn("DATE", col("timestamp")), "date"],
      [fn("COUNT", col("id")), "count"],
    ],
    where: { urlId },
    group: [fn("DATE", col("timestamp"))],
    order: [[fn("DATE", col("timestamp")), "ASC"]],
    raw: true,
  })) as unknown as { date: string | Date; count: number }[];

  return rows.map((row) => ({
    date: String(row.date).slice(0, 10),
    count: Number(row.count),
  }));
}

/** Top values of a column for a link, ordered by frequency. */
async function getGroupedCounts(
  urlId: string,
  column: GroupableColumn,
  limit: number
): Promise<LabeledCount[]> {
  const rows = (await Click.findAll({
    attributes: [column, [fn("COUNT", col("id")), "count"]],
    where: { urlId },
    group: [column],
    order: [[fn("COUNT", col("id")), "DESC"]],
    limit,
    raw: true,
  })) as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const raw = row[column];
    const label =
      raw === null || raw === undefined || raw === ""
        ? "Desconocido"
        : String(raw);
    return { label, count: Number(row.count) };
  });
}

/** Full analytics bundle for a single link. */
export async function getLinkStats(urlId: string): Promise<LinkStats> {
  const [
    total,
    byDay,
    byHour,
    topReferrers,
    byDevice,
    byBrowser,
    byCountry,
    byTarget,
  ] = await Promise.all([
    getTotalClicks(urlId),
    getClicksByDay(urlId),
    getClicksByHour(urlId),
    getGroupedCounts(urlId, "referrerDomain", 8),
    getGroupedCounts(urlId, "deviceType", 8),
    getGroupedCounts(urlId, "browser", 8),
    getGroupedCounts(urlId, "country", 8),
    getGroupedCounts(urlId, "targetUrl", 8),
  ]);
  return {
    total,
    byDay,
    byHour,
    topReferrers,
    byDevice,
    byBrowser,
    byCountry,
    byTarget,
  };
}

export interface RecentClick {
  timestamp: string;
  country: string | null;
  deviceType: string | null;
  browser: string | null;
  referrer: string | null;
}

/** The most recent clicks for a link, newest first. */
export async function getRecentClicks(
  urlId: string,
  limit = 15
): Promise<RecentClick[]> {
  const rows = (await Click.findAll({
    where: { urlId },
    order: [["timestamp", "DESC"]],
    limit,
    attributes: ["timestamp", "country", "deviceType", "browser", "referrer"],
    raw: true,
  })) as unknown as Array<{
    timestamp: string | Date;
    country: string | null;
    deviceType: string | null;
    browser: string | null;
    referrer: string | null;
  }>;

  return rows.map((row) => ({
    timestamp: new Date(row.timestamp).toISOString(),
    country: row.country ?? null,
    deviceType: row.deviceType ?? null,
    browser: row.browser ?? null,
    referrer: row.referrer ?? null,
  }));
}

export interface UserTotals {
  links: number;
  clicks: number;
}

/** Total active links and total clicks across all of a user's links. */
export async function getUserTotals(userId: string): Promise<UserTotals> {
  const links = await Url.count({ where: { userId, deletedAt: null } });
  const clicks = await Click.count({
    include: [
      {
        model: Url,
        as: "url",
        attributes: [],
        where: { userId, deletedAt: null },
        required: true,
      },
    ],
  });
  return { links, clicks };
}

/** Click counts keyed by urlId, for a set of links (dashboard listing). */
export async function getClickCounts(
  urlIds: string[]
): Promise<Map<string, number>> {
  if (urlIds.length === 0) return new Map();

  const rows = (await Click.findAll({
    attributes: ["urlId", [fn("COUNT", col("id")), "count"]],
    where: { urlId: urlIds },
    group: ["urlId"],
    raw: true,
  })) as unknown as { urlId: string; count: number }[];

  return new Map(rows.map((row) => [row.urlId, Number(row.count)]));
}
