"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { LinkStats, LabeledCount } from "@/lib/stats-queries";

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5"
    >
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {title}
      </h3>
      {description && <p className="sr-only">{description}</p>}
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
      Sin datos todavía.
    </p>
  );
}

// Builds a textual summary so a screen reader can announce the chart's
// contents without needing to interpret the SVG.
function summarizeBreakdown(label: string, data: LabeledCount[]): string {
  if (data.length === 0) return `${label}: sin datos.`;
  const top = data.slice(0, 5).map((d) => `${d.label} (${d.count})`);
  const more =
    data.length > top.length ? ` y ${data.length - top.length} más` : "";
  return `${label}. ${top.join(", ")}${more}.`;
}

function BreakdownChart({
  label,
  data,
}: {
  label: string;
  data: LabeledCount[];
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <div role="img" aria-label={summarizeBreakdown(label, data)}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} fontSize={12} />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            fontSize={12}
            tickFormatter={(value: string) =>
              value.length > 14 ? `${value.slice(0, 14)}…` : value
            }
          />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatsCharts({ stats }: { stats: LinkStats }) {
  const daySummary =
    stats.byDay.length === 0
      ? "Clics por día: sin datos."
      : `Clics por día: ${stats.byDay
          .slice(-7)
          .map((d) => `${d.date} (${d.count})`)
          .join(", ")}.`;
  const hourSummary =
    stats.total === 0
      ? "Clics por hora: sin datos."
      : `Clics por hora del día: ${stats.byHour
          .filter((h) => h.count > 0)
          .map((h) => `${h.hour}h (${h.count})`)
          .join(", ")}.`;

  return (
    <div className="space-y-6">
      <ChartCard title="Clics por día">
        {stats.byDay.length === 0 ? (
          <EmptyState />
        ) : (
          <div role="img" aria-label={daySummary}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.byDay} margin={{ left: 0, right: 12 }}>
                <defs>
                  <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Clics"
                  stroke="#2563eb"
                  fill="url(#clicksFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Clics por hora del día">
        {stats.total === 0 ? (
          <EmptyState />
        ) : (
          <div role="img" aria-label={hourSummary}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byHour} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={12} interval={1} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Clics"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Dispositivos">
          <BreakdownChart label="Dispositivos" data={stats.byDevice} />
        </ChartCard>
        <ChartCard title="Navegadores">
          <BreakdownChart label="Navegadores" data={stats.byBrowser} />
        </ChartCard>
        <ChartCard title="Sistemas operativos">
          <BreakdownChart label="Sistemas operativos" data={stats.byOs} />
        </ChartCard>
      </div>

      <ChartCard title="Países">
        <BreakdownChart label="Países" data={stats.byCountry} />
      </ChartCard>

      {stats.byTarget.length > 1 && (
        <ChartCard title="Destinos servidos (A/B · dispositivo)">
          <BreakdownChart label="Destinos servidos" data={stats.byTarget} />
        </ChartCard>
      )}

      <ChartCard title="Principales orígenes (referrers)">
        {stats.topReferrers.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {stats.topReferrers.map((ref) => (
              <li
                key={ref.label}
                className="flex justify-between py-2 text-sm"
              >
                <span className="text-gray-700 dark:text-gray-300 truncate mr-4">
                  {ref.label}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {ref.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
