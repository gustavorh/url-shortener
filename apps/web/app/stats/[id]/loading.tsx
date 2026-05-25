// Skeleton shown while the stats server component fetches data.
export default function StatsLoading() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-12 mt-14 md:mt-0">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    </div>
  );
}
