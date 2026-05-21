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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
      Sin datos todavía.
    </p>
  );
}

function BreakdownChart({ data }: { data: LabeledCount[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
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
  );
}

export function StatsCharts({ stats }: { stats: LinkStats }) {
  return (
    <div className="space-y-6">
      <ChartCard title="Clics por día">
        {stats.byDay.length === 0 ? (
          <EmptyState />
        ) : (
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
        )}
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Dispositivos">
          <BreakdownChart data={stats.byDevice} />
        </ChartCard>
        <ChartCard title="Navegadores">
          <BreakdownChart data={stats.byBrowser} />
        </ChartCard>
      </div>

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
