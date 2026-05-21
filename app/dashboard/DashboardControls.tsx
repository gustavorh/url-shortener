"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

// Search box + sort selector for the dashboard. Both drive the page via
// query params, so the listing itself stays a server component.
export function DashboardControls({
  query,
  sort,
  tag,
}: {
  query: string;
  sort: string;
  tag?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);

  const navigate = (nextQuery: string, nextSort: string) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextSort !== "recent") params.set("sort", nextSort);
    // Preserve the active tag filter across searches and sorts.
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(q, sort);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <form onSubmit={onSearch} className="flex-1 min-w-[220px] flex gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, destino o título…"
          className="input"
        />
        <button type="submit" className="btn-secondary shrink-0">
          Buscar
        </button>
      </form>
      <select
        value={sort}
        onChange={(e) => navigate(q, e.target.value)}
        className="input max-w-[180px]"
        aria-label="Ordenar enlaces"
      >
        <option value="recent">Más recientes</option>
        <option value="oldest">Más antiguos</option>
        <option value="clicks">Más clics</option>
      </select>
    </div>
  );
}
